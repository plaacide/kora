import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { renderPdfPage } from "@/lib/viewer/render";

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
      "id, storage_key, mime_type, documents!document_versions_document_id_fkey!inner(id, name, deal_id, deals!inner(id, org_id))",
    )
    .eq("id", versionId)
    .maybeSingle();

  if (!version) {
    return NextResponse.json({ error: "introuvable" }, { status: 404 });
  }

  const doc = version.documents as unknown as {
    id: string;
    name: string;
    deal_id: string;
    deals: { id: string; org_id: string };
  };

  // Filigrane : identité du lecteur + date. Rend toute capture traçable.
  const stamp = new Date().toISOString().slice(0, 10);
  const watermark = `${user.email} · ${stamp}`;

  const admin = createAdminClient();
  const { data: file, error: dlError } = await admin.storage
    .from("documents")
    .download(version.storage_key);

  if (dlError || !file) {
    return NextResponse.json({ error: "lecture impossible" }, { status: 500 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const isPdf =
    version.mime_type === "application/pdf" ||
    version.storage_key.toLowerCase().endsWith(".pdf");

  if (!isPdf) {
    return NextResponse.json(
      { error: "type non pris en charge par la visionneuse" },
      { status: 415 },
    );
  }

  let png: Buffer;
  let pageCount: number;
  try {
    const rendered = await renderPdfPage(bytes, pageNo, watermark);
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
    p_metadata: { page: pageNo, name: doc.name },
    p_deal: doc.deal_id,
  });

  return new NextResponse(new Uint8Array(png), {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      // Jamais mis en cache : le filigrane est propre à ce lecteur et à cette date.
      "Cache-Control": "private, no-store, max-age=0",
      "X-Page-Count": String(pageCount),
      "Content-Disposition": "inline",
    },
  });
}
