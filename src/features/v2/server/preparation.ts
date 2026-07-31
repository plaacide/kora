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

/** La forme brute rendue par PostgREST, avant traduction. */
interface LigneExigence {
  id: string;
  domain: string;
  level: string;
  sources: string[] | null;
  label: string;
  description: string;
  status: string;
  position: number;
  folder_id: string | null;
  freshness_days: number | null;
  expected_period: string | null;
  accepted_formats: string | null;
}

/** Un seul endroit traduit la ligne : deux lectures qui divergent, ce sont
 *  deux écrans qui affichent la même exigence différemment. */
function enExigence(
  ligne: LigneExigence,
  extra: {
    folderName: string | null;
    proofs: number;
    pending: number;
    lastProofAt: string | null;
  },
): ExigenceBrute {
  return {
    id: ligne.id,
    domain: ligne.domain,
    level: ligne.level,
    sources: ligne.sources ?? [],
    label: ligne.label,
    description: ligne.description,
    status: ligne.status,
    position: ligne.position,
    folderId: ligne.folder_id,
    freshnessDays: ligne.freshness_days,
    expectedPeriod: ligne.expected_period,
    acceptedFormats: ligne.accepted_formats,
    ...extra,
  };
}

export interface ProofRow {
  id: string;
  name: string;
  versionNo: number | null;
  linkedAt: string;
  /** `false` = suggestion proposée par Sanza, pas encore validée. */
  confirmed: boolean;
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
      .select(
        "id, domain, level, sources, label, description, status, position, folder_id, freshness_days, expected_period, accepted_formats",
      )
      .eq("deal_id", operationId)
      .order("domain")
      .order("position"),
    supabase.from("folders").select("id, name").eq("deal_id", operationId),
  ]);

  const lignes = (items ?? []) as Array<LigneExigence>;

  if (lignes.length === 0) return [];

  // `linked_at` porte la date du rattachement, pas celle du fichier. C'est la
  // bonne mesure ici : ce qu'on veut savoir, c'est depuis quand cette preuve
  // tient lieu de réponse à l'exigence.
  const { data: preuves } = await supabase
    .from("checklist_item_documents")
    .select("item_id, linked_at, confirmed")
    .in(
      "item_id",
      lignes.map((item) => item.id),
    );

  const comptes = new Map<string, number>();
  const attentes = new Map<string, number>();
  const derniere = new Map<string, string>();
  for (const row of (preuves ?? []) as Array<{
    item_id: string;
    linked_at: string;
    confirmed: boolean;
  }>) {
    if (!row.confirmed) {
      attentes.set(row.item_id, (attentes.get(row.item_id) ?? 0) + 1);
      continue;
    }
    comptes.set(row.item_id, (comptes.get(row.item_id) ?? 0) + 1);
    // La fraîcheur se mesure sur les preuves confirmées seules : une
    // suggestion récente ne rajeunit pas un dossier.
    const connue = derniere.get(row.item_id);
    if (!connue || row.linked_at > connue) derniere.set(row.item_id, row.linked_at);
  }

  const noms = new Map(
    ((folders ?? []) as Array<{ id: string; name: string }>).map((folder) => [
      folder.id,
      folder.name,
    ]),
  );

  return lignes.map((item) => enExigence(item, {
    folderName: item.folder_id ? (noms.get(item.folder_id) ?? null) : null,
    proofs: comptes.get(item.id) ?? 0,
    pending: attentes.get(item.id) ?? 0,
    lastProofAt: derniere.get(item.id) ?? null,
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
    .select(
      "id, domain, level, sources, label, description, status, position, folder_id, freshness_days, expected_period, accepted_formats",
    )
    .eq("deal_id", operationId)
    .eq("id", requirementId)
    .maybeSingle();

  if (!item) return null;

  const ligne = item as unknown as LigneExigence;

  const [{ data: liens }, { data: folder }] = await Promise.all([
    supabase
      .from("checklist_item_documents")
      .select(
        "document_id, linked_at, confirmed, documents(name, document_versions!documents_current_version_fk(version_no))",
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
      confirmed: boolean;
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
      confirmed: lien.confirmed,
    };
  });

  const confirmees = proofDocuments.filter((p) => p.confirmed);

  return {
    ...enExigence(ligne, {
      folderName: (folder as { name: string } | null)?.name ?? null,
      proofs: confirmees.length,
      pending: proofDocuments.length - confirmees.length,
      // Les liens arrivent triés du plus récent au plus ancien.
      lastProofAt: confirmees[0]?.linkedAt ?? null,
    }),
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
  if (valeur === "not_applicable") return "non applicable";
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
