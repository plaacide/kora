import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { renderPdfPage } from "@/lib/viewer/render";
import { docKind } from "@/lib/doc-types";
import { officeToPdf, officeConversionAvailable } from "@/lib/viewer/office";
import { resolveVersionAccess } from "@/lib/viewer/access";
import {
  readDerived,
  writeDerived,
  readDerivedJson,
  writeDerivedJson,
  pdfKey,
  pageKey,
  metaKey,
} from "@/lib/viewer/derived";

/**
 * Échelles de rendu autorisées. Liste fermée volontairement : l'échelle entre
 * dans la clé de cache, et une valeur libre laisserait n'importe qui remplir
 * le stockage avec des variantes d'une même page.
 */
const SCALE_FULL = 1.6;
const SCALE_THUMB = 0.22;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Sert UNE page de document, filigranée, à un utilisateur autorisé.
 *
 * Chemin d'accès unique aux documents : le bucket n'a aucune policy de lecture
 * client. Le contrôle des droits vit dans `resolveVersionAccess` (partagé avec
 * la route tableur) ; ce n'est qu'ensuite qu'on lit le fichier avec la clé
 * privilégiée.
 *
 * Les tableurs ne passent PAS par ici : ils se lisent en grille
 * (/api/sheet/[versionId]), une page rendue étant illisible pour un modèle
 * financier.
 */
export async function GET(
  request: Request,
  ctx: { params: Promise<{ versionId: string; page: string }> },
) {
  const { versionId, page } = await ctx.params;
  const pageNo = Number.parseInt(page, 10) || 1;

  // `?s=thumb` : vignette de la bande latérale. Même contrôle d'accès, même
  // filigrane — une vignette lisible reste une fuite si elle échappe aux
  // règles.
  const thumb = new URL(request.url).searchParams.get("s") === "thumb";
  const SCALE = thumb ? SCALE_THUMB : SCALE_FULL;

  const result = await resolveVersionAccess(versionId);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }
  const { doc, storageKey, mimeType, level, userId, userEmail } = result.access;

  const kind = docKind(doc.name, mimeType);

  if (kind === "other") {
    // Archive, vidéo, etc. : aucun aperçu filigrané possible.
    return NextResponse.json(
      { error: "unsupported_format", kind: "other" },
      { status: 415 },
    );
  }

  if (kind === "sheet") {
    return NextResponse.json(
      { error: "is_a_sheet", kind: "sheet" },
      { status: 415 },
    );
  }

  // Seul le niveau 'watermark' impose le filigrane ; 'view' et au-dessus
  // donnent une page propre (cf. niveaux du prototype).
  const stamp = new Date().toISOString().slice(0, 10);
  const watermarked = level === "watermark";
  const watermark = watermarked ? `${userEmail} · ${stamp}` : "";

  const admin = createAdminClient();

  // Page déjà rendue ? Uniquement hors filigrane : une page filigranée porte
  // l'e-mail du lecteur et la date, la mutualiser reviendrait à servir à
  // quelqu'un le filigrane d'un autre.
  //
  // Le nombre de pages doit venir avec, sinon le lecteur verrait un document
  // d'une seule page : sans métadonnée, on retombe sur le rendu complet.
  const cachedPageKey = pageKey(versionId, pageNo, SCALE);
  if (!watermarked) {
    const [hit, meta] = await Promise.all([
      readDerived(admin, cachedPageKey),
      readDerivedJson<{ pageCount: number }>(admin, metaKey(versionId)),
    ]);
    if (hit && meta?.pageCount) {
      await auditPage(admin, userId, doc, pageNo, level, thumb);
      return pngResponse(hit, meta.pageCount, level, true);
    }
  }

  // Le PDF converti est-il déjà en cache ? Une version est immuable, la
  // conversion aussi : c'est ce qui évitait 13 conversions pour 13 pages.
  let pdfBytes: Uint8Array<ArrayBufferLike> | null =
    kind === "office" ? await readDerived(admin, pdfKey(versionId)) : null;

  if (!pdfBytes) {
    const { data: file, error: dlError } = await admin.storage
      .from("documents")
      .download(storageKey);

    if (dlError || !file) {
      return NextResponse.json({ error: "lecture impossible" }, { status: 500 });
    }

    const raw = new Uint8Array(await file.arrayBuffer());

    // PDF : rendu direct. Bureautique : conversion LibreOffice en PDF d'abord,
    // filigranée ensuite comme n'importe quelle autre — le fichier source ne
    // sort jamais de notre infra.
    if (kind === "office") {
      if (!(await officeConversionAvailable())) {
        // LibreOffice absent ici (ex. dev sans install, ou serverless) : on le
        // dit honnêtement, sans planter.
        return NextResponse.json(
          { error: "office_not_ready", kind: "office" },
          { status: 415 },
        );
      }
      try {
        const converted = await officeToPdf(raw, doc.name);
        if (!converted) throw new Error("conversion indisponible");
        pdfBytes = converted;
        await writeDerived(
          admin,
          pdfKey(versionId),
          converted,
          "application/pdf",
        );
      } catch (err) {
        // Journaliser : sans ça, un échec en production ne laisse aucune trace
        // et le diagnostic passe par une reproduction manuelle dans le
        // conteneur.
        console.error("[viewer] conversion bureautique échouée", doc.name, err);
        return NextResponse.json(
          { error: "office_conversion_failed", kind: "office" },
          { status: 502 },
        );
      }
    } else {
      pdfBytes = raw;
    }
  }

  let png: Buffer;
  let pageCount: number;
  try {
    const rendered = await renderPdfPage(pdfBytes, pageNo, watermark, SCALE);
    png = rendered.png;
    pageCount = rendered.pageCount;
  } catch (err) {
    console.error("[viewer] rendu échoué", doc.name, "page", pageNo, err);
    return NextResponse.json({ error: "rendu impossible" }, { status: 500 });
  }

  if (!watermarked) {
    // Le nombre de pages accompagne l'image : il est indispensable pour servir
    // les visites suivantes depuis le cache.
    await Promise.all([
      writeDerived(admin, cachedPageKey, new Uint8Array(png), "image/png"),
      writeDerivedJson(admin, metaKey(versionId), { pageCount }),
    ]);
  }

  await auditPage(admin, userId, doc, pageNo, level, thumb);
  return pngResponse(new Uint8Array(png), pageCount, level, false);
}

/**
 * Chaque page servie est journalisée (audit chaîné), cache ou non.
 *
 * Les vignettes ont leur propre action : une bande de 13 vignettes n'est pas
 * 13 pages lues, et l'écrire ainsi rendrait le journal trompeur pour qui
 * l'auditera. Elles restent tracées — c'est bien du contenu servi.
 */
function auditPage(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  doc: { id: string; name: string; deal_id: string; deals: { org_id: string } },
  pageNo: number,
  level: string,
  thumb: boolean,
) {
  return admin.rpc("write_audit_as", {
    p_actor: userId,
    p_org: doc.deals.org_id,
    p_action: thumb ? "document.thumbnail_viewed" : "document.page_viewed",
    p_target_type: "document",
    p_target_id: doc.id,
    p_metadata: { page: pageNo, name: doc.name, level },
    p_deal: doc.deal_id,
  });
}

function pngResponse(
  png: Uint8Array<ArrayBufferLike>,
  pageCount: number,
  level: string,
  cached: boolean,
): NextResponse {
  // `new Uint8Array(...)` : recopie sur un ArrayBuffer simple, seul type que
  // NextResponse accepte comme corps.
  return new NextResponse(new Uint8Array(png), {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      // Jamais mis en cache par le NAVIGATEUR : le filigrane est propre à ce
      // lecteur et à cette date, et les droits peuvent expirer entre deux
      // consultations. Le cache serveur, lui, est réservé aux pages sans
      // filigrane.
      "Cache-Control": "private, no-store, max-age=0",
      "X-Page-Count": String(pageCount),
      "X-Access-Level": level,
      "X-Cache": cached ? "hit" : "miss",
      "Content-Disposition": "inline",
    },
  });
}
