import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Contrôle d'accès commun aux routes de la visionneuse (pages rendues et
 * tableurs). Extrait pour qu'il n'existe qu'UNE implémentation : deux copies
 * de cette logique, c'est la garantie qu'une des deux finira par diverger.
 *
 * Ordre volontaire : session, puis lecture SOUS RLS (un non-membre obtient
 * null et n'ira jamais jusqu'au fichier), puis niveau effectif hérité des
 * dossiers parents. Fermé par défaut.
 */

export interface ViewerDoc {
  id: string;
  name: string;
  folder_id: string;
  deal_id: string;
  deals: { id: string; org_id: string };
}

export interface ViewerAccess {
  userId: string;
  userEmail: string;
  storageKey: string;
  mimeType: string | null;
  doc: ViewerDoc;
  /** Niveau effectif : 'watermark' | 'view' | 'edit' … jamais 'none'. */
  level: string;
}

export type AccessResult =
  | { ok: true; access: ViewerAccess }
  | { ok: false; status: number; error: string };

export async function resolveVersionAccess(
  versionId: string,
): Promise<AccessResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, status: 401, error: "non authentifié" };

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

  if (!version) return { ok: false, status: 404, error: "introuvable" };

  const doc = version.documents as unknown as ViewerDoc;

  const { data: level } = await supabase.rpc("my_permission", {
    p_folder: doc.folder_id,
  });

  if (!level || level === "none") {
    return { ok: false, status: 403, error: "accès refusé" };
  }

  return {
    ok: true,
    access: {
      userId: user.id,
      userEmail: user.email ?? "",
      storageKey: version.storage_key,
      mimeType: version.mime_type,
      doc,
      level: level as string,
    },
  };
}
