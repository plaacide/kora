import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { renderPdfPage } from "@/lib/viewer/render";
import { docKind } from "@/lib/doc-types";
import { officeToPdf, officeConversionAvailable } from "@/lib/viewer/office";
import { resolveVersionAccess } from "@/lib/viewer/access";

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
  _request: Request,
  ctx: { params: Promise<{ versionId: string; page: string }> },
) {
  const { versionId, page } = await ctx.params;
  const pageNo = Number.parseInt(page, 10) || 1;

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
  const watermark = level === "watermark" ? `${userEmail} · ${stamp}` : "";

  const admin = createAdminClient();
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
  let pdfBytes: Uint8Array<ArrayBufferLike> = raw;
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
    } catch (err) {
      // Journaliser : sans ça, un échec en production ne laisse aucune trace et
      // le diagnostic passe par une reproduction manuelle dans le conteneur.
      console.error("[viewer] conversion bureautique échouée", doc.name, err);
      return NextResponse.json(
        { error: "office_conversion_failed", kind: "office" },
        { status: 502 },
      );
    }
  }

  let png: Buffer;
  let pageCount: number;
  try {
    const rendered = await renderPdfPage(pdfBytes, pageNo, watermark);
    png = rendered.png;
    pageCount = rendered.pageCount;
  } catch (err) {
    console.error("[viewer] rendu échoué", doc.name, "page", pageNo, err);
    return NextResponse.json({ error: "rendu impossible" }, { status: 500 });
  }

  // Chaque page ouverte est journalisée (audit chaîné).
  await admin.rpc("write_audit_as", {
    p_actor: userId,
    p_org: doc.deals.org_id,
    p_action: "document.page_viewed",
    p_target_type: "document",
    p_target_id: doc.id,
    p_metadata: { page: pageNo, name: doc.name, level },
    p_deal: doc.deal_id,
  });

  return new NextResponse(new Uint8Array(png), {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      // Jamais mis en cache : le filigrane est propre à ce lecteur et à cette date.
      "Cache-Control": "private, no-store, max-age=0",
      "X-Page-Count": String(pageCount),
      "X-Access-Level": level,
      "Content-Disposition": "inline",
    },
  });
}
