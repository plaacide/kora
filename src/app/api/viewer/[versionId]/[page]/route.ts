import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { renderPdfPage } from "@/lib/viewer/render";
import { docKind } from "@/lib/doc-types";
import { officeToPdf, workerConfigured } from "@/lib/viewer/office";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Sert UNE page de document, filigranée, à un utilisateur autorisé.
 *
 * Chemin d'accès unique aux documents : le bucket n'a aucune policy de lecture
 * client. Ici on vérifie la session, puis les droits via une requête soumise à
 * la RLS (donc si l'utilisateur n'a pas accès au deal, il ne voit rien),
 * et seulement ensuite on lit le fichier avec la clé privilégiée.
 */
export async function GET(
  _request: Request,
  ctx: { params: Promise<{ versionId: string; page: string }> },
) {
  const { versionId, page } = await ctx.params;
  const pageNo = Number.parseInt(page, 10) || 1;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "non authentifié" }, { status: 401 });
  }

  // Lecture SOUS RLS : c'est le contrôle d'accès réel. Un non-membre obtient
  // null ici et n'ira jamais jusqu'à la lecture du fichier.
  // FK explicite : `documents` et `document_versions` se référencent
  // mutuellement (document_id / current_version_id). Sans ce hint, PostgREST
  // ne sait pas quelle relation suivre et renvoie null.
  const { data: version } = await supabase
    .from("document_versions")
    .select(
      "id, storage_key, mime_type, documents!document_versions_document_id_fkey!inner(id, name, folder_id, deal_id, deals!inner(id, org_id))",
    )
    .eq("id", versionId)
    .maybeSingle();

  if (!version) {
    return NextResponse.json({ error: "introuvable" }, { status: 404 });
  }

  const doc = version.documents as unknown as {
    id: string;
    name: string;
    folder_id: string;
    deal_id: string;
    deals: { id: string; org_id: string };
  };

  // Niveau effectif (hérité des dossiers parents, expiration prise en compte).
  // Fermé par défaut : toute erreur ou absence de droit => refus.
  const { data: level } = await supabase.rpc("my_permission", {
    p_folder: doc.folder_id,
  });

  if (!level || level === "none") {
    return NextResponse.json({ error: "accès refusé" }, { status: 403 });
  }

  // Seul le niveau 'watermark' impose le filigrane ; 'view' et au-dessus
  // donnent une page propre (cf. niveaux du prototype).
  const watermarked = level === "watermark";
  const stamp = new Date().toISOString().slice(0, 10);
  const watermark = watermarked ? `${user.email} · ${stamp}` : "";

  const admin = createAdminClient();
  const { data: file, error: dlError } = await admin.storage
    .from("documents")
    .download(version.storage_key);

  if (dlError || !file) {
    return NextResponse.json({ error: "lecture impossible" }, { status: 500 });
  }

  const raw = new Uint8Array(await file.arrayBuffer());
  const kind = docKind(doc.name, version.mime_type);

  if (kind === "other") {
    // Archive, vidéo, etc. : aucun aperçu filigrané possible.
    return NextResponse.json(
      { error: "unsupported_format", kind: "other" },
      { status: 415 },
    );
  }

  // PDF : rendu direct. Bureautique : on passe d'abord par le worker, qui rend
  // un PDF filigrané ensuite comme n'importe quel autre — le fichier source ne
  // sort jamais de notre infra.
  let pdfBytes: Uint8Array<ArrayBufferLike> = raw;
  if (kind === "office") {
    if (!workerConfigured()) {
      // Le worker n'est pas déployé : on le dit honnêtement, sans planter.
      return NextResponse.json(
        { error: "office_not_ready", kind: "office" },
        { status: 415 },
      );
    }
    try {
      const converted = await officeToPdf(raw, doc.name);
      if (!converted) throw new Error("no worker");
      pdfBytes = converted;
    } catch {
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
  } catch {
    return NextResponse.json({ error: "rendu impossible" }, { status: 500 });
  }

  // Chaque page ouverte est journalisée (audit chaîné).
  await admin.rpc("write_audit_as", {
    p_actor: user.id,
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
