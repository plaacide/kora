import "server-only";

import { createClient } from "@/lib/supabase/server";

/**
 * Ce que la visionneuse a besoin de savoir avant d'afficher la première page.
 *
 * Le fichier lui-même ne passe pas par ici : les pages sont servies une à une
 * par `/api/viewer/[versionId]/[page]`, en images déjà rendues et filigranées.
 * Le source ne quitte jamais le serveur.
 */

export interface ViewerDocument {
  versionId: string;
  documentId: string;
  operationId: string;
  operationName: string;
  documentName: string;
  folderName: string | null;
  versionNo: number;
  /** `watermark` | `view` | `download` | `edit` — `none` n'arrive jamais ici. */
  level: string;
}

/**
 * Résout la version ACTIVE d'un document et le droit du lecteur dessus.
 *
 * Rend `null` quand la pièce n'existe pas, n'est pas visible, ou quand le
 * lecteur n'a aucun droit : l'appelant en fait un 404. Distinguer « absente »
 * de « interdite » dirait déjà quelque chose à qui n'a rien à savoir.
 */
export async function viewerDocument(
  documentId: string,
): Promise<ViewerDocument | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("documents")
    .select(
      "id, name, deal_id, current_version_id, folders(name), deals(name), document_versions!documents_current_version_fk(version_no)",
    )
    .eq("id", documentId)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as unknown as {
    id: string;
    name: string;
    deal_id: string;
    current_version_id: string | null;
    folders: { name: string } | Array<{ name: string }> | null;
    deals: { name: string } | Array<{ name: string }> | null;
    document_versions: { version_no: number } | Array<{ version_no: number }> | null;
  };

  if (!row.current_version_id) return null;

  const { data: level } = await supabase.rpc("my_document_permission", {
    p_doc: documentId,
  });

  if (!level || level === "none") return null;

  const first = <T,>(value: T | T[] | null): T | null =>
    Array.isArray(value) ? value[0] ?? null : value;

  return {
    versionId: row.current_version_id,
    documentId: row.id,
    operationId: row.deal_id,
    operationName: first(row.deals)?.name ?? "—",
    documentName: row.name,
    folderName: first(row.folders)?.name ?? null,
    versionNo: first(row.document_versions)?.version_no ?? 1,
    level: level as string,
  };
}
