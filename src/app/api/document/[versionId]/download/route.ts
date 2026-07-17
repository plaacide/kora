import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Sert le fichier ORIGINAL — uniquement aux niveaux 'download' / 'edit'.
 *
 * C'est le seul endroit de l'application qui expose un document source.
 * Tout le reste passe par la visionneuse (pages filigranées).
 */
export async function GET(
  _request: Request,
  ctx: { params: Promise<{ versionId: string }> },
) {
  const { versionId } = await ctx.params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "non authentifié" }, { status: 401 });
  }

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

  const { data: level } = await supabase.rpc("my_permission", {
    p_folder: doc.folder_id,
  });

  // Fermé par défaut : seuls 'download' et 'edit' ouvrent l'original.
  if (level !== "download" && level !== "edit") {
    return NextResponse.json({ error: "téléchargement refusé" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: file, error } = await admin.storage
    .from("documents")
    .download(version.storage_key);

  if (error || !file) {
    return NextResponse.json({ error: "lecture impossible" }, { status: 500 });
  }

  // Un téléchargement autorisé reste un événement traçable.
  await admin.rpc("write_audit_as", {
    p_actor: user.id,
    p_org: doc.deals.org_id,
    p_action: "document.downloaded",
    p_target_type: "document",
    p_target_id: doc.id,
    p_metadata: { name: doc.name, level },
    p_deal: doc.deal_id,
  });

  return new NextResponse(await file.arrayBuffer(), {
    status: 200,
    headers: {
      "Content-Type": version.mime_type ?? "application/octet-stream",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(doc.name)}"`,
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}
