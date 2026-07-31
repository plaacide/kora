import "server-only";

import { cheminDossier, type DossierArbre } from "@/features/v2/domain/preparation";
import { createClient } from "@/lib/supabase/server";

/**
 * La recherche — écran 66.
 *
 * Elle porte sur les PIÈCES, à travers toutes les opérations : c'est la
 * question qu'un fondateur se pose vraiment — « où est ce fichier ? » — et non
 * « quelles opérations s'appellent ainsi », qu'il lit déjà dans sa liste.
 *
 * La recherche se fait en base et non sur des lignes déjà chargées : une data
 * room compte des centaines de pièces, et tout ramener pour filtrer ensuite
 * marcherait sur le jeu de test avant de s'effondrer sur un vrai dossier.
 */

export interface ResultatRecherche {
  id: string;
  name: string;
  operationId: string;
  operationName: string;
  archived: boolean;
  /** « Corporate / RCCM & existence légale », ou null à la racine. */
  folderPath: string | null;
  versionNo: number | null;
  createdAt: string;
}

export interface OperationFiltre {
  id: string;
  name: string;
  archived: boolean;
}

/** Combien de résultats au plus. Au-delà, c'est la requête qu'il faut affiner. */
const LIMITE = 60;

/**
 * Échappe les jokers de `ilike`.
 *
 * Sans cela, chercher « 100% » ramènerait tout : `%` est un joker, et
 * l'utilisateur croirait à un bug de la recherche plutôt qu'à une syntaxe.
 */
function motif(terme: string): string {
  return `%${terme.replaceAll("\\", "\\\\").replaceAll("%", "\\%").replaceAll("_", "\\_")}%`;
}

export async function searchDocuments(
  organizationId: string,
  terme: string,
  options: { operationId?: string; archivees?: boolean } = {},
): Promise<ResultatRecherche[]> {
  const propre = terme.trim();
  if (propre.length < 2) return [];

  const supabase = await createClient();

  // Les opérations de l'organisation, pour rattacher chaque pièce et savoir
  // laquelle est archivée. La RLS borne déjà à ce que l'utilisateur voit.
  const { data: deals } = await supabase
    .from("deals")
    .select("id, name, archived_at")
    .eq("org_id", organizationId);

  const operations = new Map(
    ((deals ?? []) as Array<{
      id: string;
      name: string;
      archived_at: string | null;
    }>).map((deal) => [deal.id, deal]),
  );

  const retenues = [...operations.values()]
    .filter((deal) => {
      if (options.operationId) return deal.id === options.operationId;
      // Sans filtre explicite, les archivées restent hors de la liste : on ne
      // cherche pas dans ce qu'on a rangé, sauf à le demander.
      return options.archivees ? Boolean(deal.archived_at) : !deal.archived_at;
    })
    .map((deal) => deal.id);

  if (retenues.length === 0) return [];

  const { data: documents } = await supabase
    .from("documents")
    .select(
      "id, name, deal_id, folder_id, created_at, document_versions!documents_current_version_fk(version_no)",
    )
    .in("deal_id", retenues)
    .ilike("name", motif(propre))
    .order("created_at", { ascending: false })
    .limit(LIMITE);

  const lignes = (documents ?? []) as unknown as Array<{
    id: string;
    name: string;
    deal_id: string;
    folder_id: string | null;
    created_at: string;
    document_versions: { version_no: number } | Array<{ version_no: number }> | null;
  }>;

  if (lignes.length === 0) return [];

  // Le chemin complet demande tout l'arbre des opérations concernées : « RH »
  // seul ne dit pas dans quelle data room on est.
  const { data: folders } = await supabase
    .from("folders")
    .select("id, name, parent_id, index_path")
    .in("deal_id", [...new Set(lignes.map((row) => row.deal_id))]);

  const arbre = new Map<string, DossierArbre>(
    ((folders ?? []) as Array<{
      id: string;
      name: string;
      parent_id: string | null;
      index_path: string | null;
    }>).map((folder) => [
      folder.id,
      {
        id: folder.id,
        name: folder.name,
        parentId: folder.parent_id,
        indexPath: folder.index_path ?? "",
      },
    ]),
  );

  return lignes.map((row) => {
    const deal = operations.get(row.deal_id);
    const version = Array.isArray(row.document_versions)
      ? row.document_versions[0]
      : row.document_versions;

    return {
      id: row.id,
      name: row.name,
      operationId: row.deal_id,
      operationName: deal?.name ?? "Opération",
      archived: Boolean(deal?.archived_at),
      folderPath: row.folder_id ? cheminDossier(arbre, row.folder_id) : null,
      versionNo: version?.version_no ?? null,
      createdAt: row.created_at,
    };
  });
}

/** Les puces de filtre : les opérations de l'organisation. */
export async function searchableOperations(
  organizationId: string,
): Promise<OperationFiltre[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("deals")
    .select("id, name, archived_at")
    .eq("org_id", organizationId)
    .order("created_at", { ascending: false });

  return ((data ?? []) as Array<{
    id: string;
    name: string;
    archived_at: string | null;
  }>).map((deal) => ({
    id: deal.id,
    name: deal.name,
    archived: Boolean(deal.archived_at),
  }));
}
