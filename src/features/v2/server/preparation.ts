import "server-only";

import type { ExigenceBrute } from "@/features/v2/domain/preparation";
import { createClient } from "@/lib/supabase/server";

/**
 * Les exigences d'une opération — écrans 11 et 12.
 *
 * La preuve n'est pas une colonne : depuis `preuves_multiples`, une exigence
 * peut porter plusieurs pièces via `checklist_item_documents`. Compter la
 * colonne `document_id` — qui existe encore — donnerait « 1 » là où le
 * fondateur a déposé trois exercices.
 */

export interface ProofRow {
  id: string;
  name: string;
  versionNo: number | null;
  linkedAt: string;
}

export interface RequirementDetail extends ExigenceBrute {
  proofDocuments: ProofRow[];
}

export async function listRequirementsFull(
  operationId: string,
): Promise<ExigenceBrute[]> {
  const supabase = await createClient();

  const [{ data: items }, { data: folders }] = await Promise.all([
    supabase
      .from("checklist_items")
      .select("id, category, label, description, status, position, folder_id")
      .eq("deal_id", operationId)
      .order("category")
      .order("position"),
    supabase.from("folders").select("id, name").eq("deal_id", operationId),
  ]);

  const lignes = (items ?? []) as Array<{
    id: string;
    category: string;
    label: string;
    description: string;
    status: string;
    position: number;
    folder_id: string | null;
  }>;

  if (lignes.length === 0) return [];

  const { data: preuves } = await supabase
    .from("checklist_item_documents")
    .select("item_id")
    .in(
      "item_id",
      lignes.map((item) => item.id),
    );

  const comptes = new Map<string, number>();
  for (const row of (preuves ?? []) as Array<{ item_id: string }>) {
    comptes.set(row.item_id, (comptes.get(row.item_id) ?? 0) + 1);
  }

  const noms = new Map(
    ((folders ?? []) as Array<{ id: string; name: string }>).map((folder) => [
      folder.id,
      folder.name,
    ]),
  );

  return lignes.map((item) => ({
    id: item.id,
    category: item.category,
    label: item.label,
    description: item.description,
    status: item.status,
    position: item.position,
    folderId: item.folder_id,
    folderName: item.folder_id ? (noms.get(item.folder_id) ?? null) : null,
    proofs: comptes.get(item.id) ?? 0,
  }));
}

/** Une exigence et ses pièces — le panneau de l'écran 12. */
export async function requirementDetail(
  operationId: string,
  requirementId: string,
): Promise<RequirementDetail | null> {
  const supabase = await createClient();

  const { data: item } = await supabase
    .from("checklist_items")
    .select("id, category, label, description, status, position, folder_id")
    .eq("deal_id", operationId)
    .eq("id", requirementId)
    .maybeSingle();

  if (!item) return null;

  const ligne = item as {
    id: string;
    category: string;
    label: string;
    description: string;
    status: string;
    position: number;
    folder_id: string | null;
  };

  const [{ data: liens }, { data: folder }] = await Promise.all([
    supabase
      .from("checklist_item_documents")
      .select(
        "document_id, linked_at, documents(name, document_versions!documents_current_version_fk(version_no))",
      )
      .eq("item_id", requirementId)
      .order("linked_at", { ascending: false }),
    ligne.folder_id
      ? supabase.from("folders").select("name").eq("id", ligne.folder_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  // PostgREST rend les jointures sous forme de tableau ou d'objet selon la
  // cardinalité qu'il déduit ; on ramène les deux formes au même dénominateur
  // plutôt que de parier sur l'une.
  const premier = <T,>(valeur: T | T[] | null | undefined): T | null =>
    Array.isArray(valeur) ? (valeur[0] ?? null) : (valeur ?? null);

  const proofDocuments = (
    (liens ?? []) as unknown as Array<{
      document_id: string;
      linked_at: string;
      documents:
        | { name: string; document_versions: { version_no: number }[] | { version_no: number } | null }
        | Array<{ name: string; document_versions: { version_no: number }[] | { version_no: number } | null }>
        | null;
    }>
  ).map((lien) => {
    const document = premier(lien.documents);
    const version = premier(document?.document_versions);

    return {
      id: lien.document_id,
      name: document?.name ?? "Pièce supprimée",
      versionNo: version?.version_no ?? null,
      linkedAt: lien.linked_at,
    };
  });

  return {
    id: ligne.id,
    category: ligne.category,
    label: ligne.label,
    description: ligne.description,
    status: ligne.status,
    position: ligne.position,
    folderId: ligne.folder_id,
    folderName: (folder as { name: string } | null)?.name ?? null,
    proofs: proofDocuments.length,
    proofDocuments,
  };
}

/**
 * Le journal d'une exigence — écran 12, bloc « Historique ».
 *
 * `write_audit` range l'identifiant de l'exigence dans `target_id` pour les
 * trois gestes qui la touchent : changement de statut, rattachement et
 * détachement d'une pièce.
 */
/** Le journal garde l'énumération brute ; on la relit en français. */
function statutMot(valeur: unknown): string {
  if (valeur === "done") return "prête";
  if (valeur === "in_progress") return "en cours";
  if (valeur === "todo") return "à préparer";
  return String(valeur ?? "?");
}

export async function requirementHistory(
  operationId: string,
  requirementId: string,
): Promise<Array<{ id: number; texte: string; actor: string; at: string }>> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("audit_log")
    .select("id, action, actor_email, created_at, metadata")
    .eq("deal_id", operationId)
    .eq("target_type", "checklist")
    .eq("target_id", requirementId)
    .order("created_at", { ascending: false })
    .limit(50);

  return ((data ?? []) as Array<{
    id: number;
    action: string;
    actor_email: string | null;
    created_at: string;
    metadata: Record<string, unknown> | null;
  }>).map((row) => {
    const piece = (row.metadata?.document_name as string) ?? "une pièce";

    const texte =
      row.action === "checklist.document_linked"
        ? `a rattaché « ${piece} »`
        : row.action === "checklist.document_unlinked"
          ? `a retiré « ${piece} »`
          : row.action === "checklist.status_changed"
            ? `a marqué l’exigence « ${statutMot(row.metadata?.status)} »`
            : row.action;

    return {
      id: row.id,
      texte,
      actor: row.actor_email ?? "—",
      at: row.created_at,
    };
  });
}
