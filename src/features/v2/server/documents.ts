import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { suggestForBatch } from "../domain/suggestions";

/**
 * Lecture de l'arborescence documentaire d'une opération.
 *
 * Rien n'est inventé ici : chaque colonne affichée vient d'une colonne réelle.
 * Ce que la base ne sait pas — la visibilité par pièce, les états
 * « à actualiser » ou « archivée » — est omis plutôt que simulé. Voir les
 * notes de `../domain/documents`.
 */

export interface FolderRow {
  id: string;
  name: string;
  indexPath: string;
  documentCount: number;
  guestCount: number;
}

export interface DocumentRow {
  id: string;
  indexPath: string;
  name: string;
  requirement: string | null;
  /** Masquée aux invités — la table le signale, la maquette 15 aussi. */
  hidden: boolean;
  guestCount: number;
  versionNo: number | null;
  updatedAt: string | null;
  owner: string | null;
  status: string;
}

interface FolderRecord {
  id: string;
  name: string;
  index_path: string;
  parent_id: string | null;
  position: number;
}

/**
 * Nombre d'INVITÉS ayant un accès effectif à chaque dossier.
 *
 * `deal_folder_access` liste tous les membres de l'organisation, fondateur
 * compris — il a évidemment accès à ses propres dossiers. Les compter ferait
 * afficher « Visible par 1 accès » sur une data room que personne d'extérieur
 * n'a jamais vue. Seuls les `guest` disent quelque chose du partage.
 */
async function guestCountByFolder(
  supabase: SupabaseClient,
  operationId: string,
): Promise<Map<string, number>> {
  const { data, error } = await supabase.rpc("deal_folder_access", {
    p_deal: operationId,
  });

  // Un accès illisible ne doit pas faire disparaître la data room : on
  // affichera « Privée » partout, ce qui est le défaut le moins trompeur.
  if (error) return new Map();

  const counts = new Map<string, number>();
  for (const row of (data ?? []) as Array<{
    folder_id: string;
    role: string;
    level: string;
  }>) {
    if (row.level === "none" || row.role !== "guest") continue;
    counts.set(row.folder_id, (counts.get(row.folder_id) ?? 0) + 1);
  }
  return counts;
}

/**
 * Résout un chemin de dossiers exprimé en NOMS vers son identifiant.
 *
 * Les URL de la V2 portent les noms (`/documents/Finance et comptabilité`),
 * la base indexe par identifiant. On descend donc niveau par niveau en
 * suivant `parent_id` : deux dossiers homonymes sous des parents différents
 * ne se confondent pas. Restent les homonymes entre frères — la base ne
 * l'interdit pas ; le premier par position gagne, faute de mieux.
 */
export async function resolveFolderPath(
  operationId: string,
  path: readonly string[],
): Promise<{ id: string; name: string } | null> {
  if (path.length === 0) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("folders")
    .select("id, name, index_path, parent_id, position")
    .eq("deal_id", operationId)
    .order("position");

  if (error) throw error;

  const rows = (data ?? []) as FolderRecord[];
  let parentId: string | null = null;
  let current: FolderRecord | undefined;

  for (const segment of path) {
    // Le segment arrive ENCORE ENCODÉ : Next ne décode pas les portions d'une
    // route attrape-tout. « Conformité » parvient ici en
    // « Conformit%C3%A9 », qui ne correspond à aucun nom en base — tous les
    // dossiers accentués rendaient donc un 404, y compris depuis les liens
    // que l'application fabrique elle-même.
    //
    // Le décodage est protégé : une séquence « % » invalide dans une URL
    // trafiquée ferait lever `decodeURIComponent`, et une visite malformée
    // doit rendre « introuvable », pas une erreur serveur.
    let nom = segment;
    try {
      nom = decodeURIComponent(segment);
    } catch {
      return null;
    }

    current = rows.find(
      (row) => row.parent_id === parentId && row.name === nom,
    );
    if (!current) return null;
    parentId = current.id;
  }

  return current ? { id: current.id, name: current.name } : null;
}

export async function listFolders(operationId: string): Promise<FolderRow[]> {
  const supabase = await createClient();

  const [{ data, error }, guests] = await Promise.all([
    supabase
      .from("folders")
      .select("id, name, index_path, parent_id, position")
      .eq("deal_id", operationId)
      .is("parent_id", null)
      .order("position"),
    guestCountByFolder(supabase, operationId),
  ]);

  if (error) throw error;

  const rows = (data ?? []) as FolderRecord[];
  if (rows.length === 0) return [];

  const { data: documents } = await supabase
    .from("documents")
    .select("folder_id")
    .eq("deal_id", operationId);

  const documentCounts = new Map<string, number>();
  for (const row of (documents ?? []) as Array<{ folder_id: string }>) {
    documentCounts.set(row.folder_id, (documentCounts.get(row.folder_id) ?? 0) + 1);
  }

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    indexPath: row.index_path,
    documentCount: documentCounts.get(row.id) ?? 0,
    guestCount: guests.get(row.id) ?? 0,
  }));
}

interface DocumentRecord {
  id: string;
  name: string;
  index_path: string;
  status: string;
  hidden_from_guests: boolean | null;
  folder_id: string;
  created_by: string | null;
  document_versions: {
    version_no: number;
    created_at: string;
    uploaded_by: string | null;
  } | null;
}

/**
 * Exigences satisfaites par chaque pièce.
 *
 * L'association vit dans `checklist_item_documents` depuis que
 * `checklist_items.document_id` a été retirée : une pièce peut servir
 * plusieurs exigences, et une exigence accepter plusieurs preuves.
 */
async function requirementByDocument(
  supabase: SupabaseClient,
  documentIds: readonly string[],
): Promise<Map<string, string>> {
  if (documentIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from("checklist_item_documents")
    .select("document_id, checklist_items(label)")
    .in("document_id", documentIds);

  if (error) return new Map();

  // Supabase type la jointure comme un tableau ; elle n'en rend qu'un ici.
  const labels = new Map<string, string>();
  for (const row of (data ?? []) as unknown as Array<{
    document_id: string;
    checklist_items: { label: string } | Array<{ label: string }> | null;
  }>) {
    const joined = Array.isArray(row.checklist_items)
      ? row.checklist_items[0]
      : row.checklist_items;
    if (!joined?.label || labels.has(row.document_id)) continue;
    labels.set(row.document_id, joined.label);
  }
  return labels;
}

async function namesByProfile(
  supabase: SupabaseClient,
  ids: readonly string[],
): Promise<Map<string, string>> {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return new Map();

  const { data } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", unique);

  return new Map(
    ((data ?? []) as Array<{ id: string; full_name: string | null }>).map(
      (row) => [row.id, row.full_name ?? "—"],
    ),
  );
}

export interface DocumentVersion {
  id: string;
  versionNo: number;
  createdAt: string;
  author: string | null;
  sizeBytes: number | null;
  mimeType: string | null;
  active: boolean;
}

export interface DocumentEvent {
  action: string;
  actor: string;
  at: string;
  page: number | null;
}

export interface DocumentDetail {
  id: string;
  name: string;
  status: string;
  /** Masquée aux invités — le droit du dossier ne s'applique plus à elle. */
  hidden: boolean;
  folderName: string | null;
  requirement: string | null;
  guestCount: number;
  versions: DocumentVersion[];
  events: DocumentEvent[];
}

/** « application/pdf » → « PDF ». Ce que le fondateur lit, pas le type MIME. */
export function fileKind(mime: string | null): string {
  if (!mime) return "Fichier";
  if (mime.includes("pdf")) return "PDF";
  if (mime.includes("spreadsheet") || mime.includes("excel")) return "XLSX";
  if (mime.includes("presentation") || mime.includes("powerpoint")) return "PPTX";
  if (mime.includes("word") || mime.includes("document")) return "DOCX";
  if (mime.startsWith("image/")) return "Image";
  return "Fichier";
}

/**
 * Tout ce que le panneau de détail montre d'une pièce (écran 18).
 *
 * Les versions et le journal viennent de deux sources distinctes :
 * `document_versions` porte l'historique des dépôts, `audit_log` celui des
 * consultations. Aucune des deux n'était lue jusqu'ici — le panneau affichait
 * quatre champs sur sept.
 */
export async function documentDetail(
  operationId: string,
  documentId: string,
): Promise<DocumentDetail | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("documents")
    .select(
      "id, name, status, hidden_from_guests, folder_id, current_version_id, folders(name)",
    )
    .eq("id", documentId)
    .eq("deal_id", operationId)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as unknown as {
    id: string;
    name: string;
    status: string;
    hidden_from_guests: boolean | null;
    folder_id: string | null;
    current_version_id: string | null;
    folders: { name: string } | Array<{ name: string }> | null;
  };

  const { data: versionRows } = await supabase
    .from("document_versions")
    .select("id, version_no, created_at, uploaded_by, size_bytes, mime_type")
    .eq("document_id", documentId)
    .order("version_no", { ascending: false });

  const versions = (versionRows ?? []) as Array<{
    id: string;
    version_no: number;
    created_at: string;
    uploaded_by: string | null;
    size_bytes: number | null;
    mime_type: string | null;
  }>;

  // Le journal ne porte que l'identifiant de l'acteur et son e-mail : on
  // préfère le nom déclaré quand il existe.
  const { data: eventRows } = await supabase
    .from("audit_log")
    .select("action, actor_email, created_at, metadata")
    .eq("target_id", documentId)
    .order("created_at", { ascending: false })
    .limit(12);

  const [requirements, authors, guests] = await Promise.all([
    requirementByDocument(supabase, [documentId]),
    namesByProfile(
      supabase,
      versions.map((v) => v.uploaded_by).filter((id): id is string => Boolean(id)),
    ),
    guestCountByFolder(supabase, operationId),
  ]);

  const first = <T,>(value: T | T[] | null): T | null =>
    Array.isArray(value) ? value[0] ?? null : value;

  return {
    id: row.id,
    name: row.name,
    status: row.status,
    hidden: row.hidden_from_guests ?? false,
    folderName: first(row.folders)?.name ?? null,
    requirement: requirements.get(documentId) ?? null,
    guestCount: row.folder_id ? guests.get(row.folder_id) ?? 0 : 0,
    versions: versions.map((version) => ({
      id: version.id,
      versionNo: version.version_no,
      createdAt: version.created_at,
      author: version.uploaded_by ? authors.get(version.uploaded_by) ?? null : null,
      sizeBytes: version.size_bytes,
      mimeType: version.mime_type,
      active: version.id === row.current_version_id,
    })),
    events: (
      (eventRows ?? []) as Array<{
        action: string;
        actor_email: string | null;
        created_at: string;
        metadata: { page?: number } | null;
      }>
    ).map((event) => ({
      action: event.action,
      actor: event.actor_email ?? "—",
      at: event.created_at,
      page: event.metadata?.page ?? null,
    })),
  };
}

export interface PendingAssociation {
  documentId: string;
  documentName: string;
  suggestion: {
    requirementId: string;
    label: string;
    matched: string[];
  } | null;
}

/**
 * Les associations à confirmer après un dépôt (écran 17).
 *
 * Les suggestions sont calculées contre les exigences de CETTE opération, et
 * contre rien d'autre. Les pièces déjà rattachées sont écartées : reproposer
 * une association confirmée ferait douter de ce qui a été validé.
 */
export async function pendingAssociations(
  operationId: string,
  documentIds: readonly string[],
): Promise<PendingAssociation[]> {
  if (documentIds.length === 0) return [];

  const supabase = await createClient();

  const [{ data: docs }, { data: liens }] = await Promise.all([
    supabase
      .from("documents")
      .select("id, name")
      .eq("deal_id", operationId)
      .in("id", documentIds),
    supabase
      .from("checklist_item_documents")
      .select("document_id, item_id, confirmed, checklist_items(label)")
      .in("document_id", documentIds),
  ]);

  // Les suggestions ne sont plus recalculées ici : elles ont été écrites au
  // dépôt, non confirmées. Les recalculer donnerait un écran qui ne montre
  // pas ce que la base retient — et qui changerait d'avis à chaque
  // rechargement si l'algorithme évoluait entre-temps.
  const suggerees = new Map<string, { requirementId: string; label: string }>();
  const confirmees = new Set<string>();

  for (const lien of (liens ?? []) as unknown as Array<{
    document_id: string;
    item_id: string;
    confirmed: boolean;
    checklist_items: { label: string } | Array<{ label: string }> | null;
  }>) {
    if (lien.confirmed) {
      confirmees.add(lien.document_id);
      continue;
    }
    const joint = Array.isArray(lien.checklist_items)
      ? lien.checklist_items[0]
      : lien.checklist_items;
    suggerees.set(lien.document_id, {
      requirementId: lien.item_id,
      label: joint?.label ?? "",
    });
  }

  const parId = new Map(
    ((docs ?? []) as Array<{ id: string; name: string }>).map((doc) => [
      doc.id,
      doc.name,
    ]),
  );

  // L'ordre de dépôt est celui que le fondateur a sous les yeux. Une pièce
  // déjà confirmée n'a plus rien à confirmer : elle sort de l'écran.
  return documentIds
    .filter((id) => parId.has(id) && !confirmees.has(id))
    .map((id) => {
      const suggestion = suggerees.get(id);
      return {
        documentId: id,
        documentName: parId.get(id) as string,
        suggestion: suggestion
          ? { ...suggestion, matched: [] as string[] }
          : null,
      };
    });
}

/**
 * Calcule les suggestions d'un lot et les écrit, NON confirmées.
 *
 * Appelée une fois le dépôt terminé. C'est le seul endroit où l'algorithme
 * tourne : l'écran 17 relit ensuite ce qui a été écrit, au lieu de refaire le
 * calcul et de risquer d'afficher autre chose que ce que la base retient.
 */
export async function writeSuggestions(
  operationId: string,
  documentIds: readonly string[],
): Promise<number> {
  if (documentIds.length === 0) return 0;

  const supabase = await createClient();

  const [{ data: docs }, { data: items }, { data: liens }] = await Promise.all([
    supabase
      .from("documents")
      .select("id, name")
      .eq("deal_id", operationId)
      .in("id", documentIds),
    supabase
      .from("checklist_items")
      .select("id, label, description")
      .eq("deal_id", operationId),
    supabase
      .from("checklist_item_documents")
      .select("document_id")
      .in("document_id", documentIds),
  ]);

  // Une pièce déjà rattachée — suggestion précédente ou preuve confirmée — ne
  // se re-suggère pas : le fondateur a déjà eu la question sous les yeux.
  const dejaVues = new Set(
    ((liens ?? []) as Array<{ document_id: string }>).map((l) => l.document_id),
  );

  const requirements = ((items ?? []) as Array<{
    id: string;
    label: string;
    description: string | null;
  }>).map((item) => ({
    id: item.id,
    label: item.label,
    description: item.description ?? undefined,
  }));

  const parId = new Map(
    ((docs ?? []) as Array<{ id: string; name: string }>)
      .filter((doc) => !dejaVues.has(doc.id))
      .map((doc) => [doc.id, doc.name]),
  );
  const ordonnes = documentIds.filter((id) => parId.has(id));
  if (ordonnes.length === 0) return 0;

  const lot = suggestForBatch(
    ordonnes.map((id) => parId.get(id) as string),
    requirements,
  );

  let ecrites = 0;
  for (const [index, id] of ordonnes.entries()) {
    const suggestion = lot[index]?.suggestion;
    if (!suggestion) continue;

    const { error } = await supabase.rpc("attach_checklist_document", {
      p_item: suggestion.requirementId,
      p_doc: id,
      p_confirmed: false,
    });

    // Une suggestion qui échoue n'est pas une perte de données : la pièce est
    // déposée, elle reste associable à la main. On continue le lot.
    if (error) console.error("[v2 suggestions] écriture échouée", error);
    else ecrites += 1;
  }

  return ecrites;
}

/** Toutes les exigences de l'opération, pour le choix manuel de l'écran 17. */
export async function listRequirements(
  operationId: string,
): Promise<Array<{ id: string; label: string }>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("checklist_items")
    .select("id, label, domain, position")
    .eq("deal_id", operationId)
    .order("domain")
    .order("position");

  return ((data ?? []) as Array<{ id: string; label: string }>).map((item) => ({
    id: item.id,
    label: item.label,
  }));
}

export async function listDocuments(
  operationId: string,
  folderId: string,
): Promise<DocumentRow[]> {
  const supabase = await createClient();

  // `documents_current_version_fk` désigne la version ACTIVE, pas la dernière
  // déposée : après une restauration, les deux diffèrent.
  const { data, error } = await supabase
    .from("documents")
    .select(
      "id, name, index_path, status, hidden_from_guests, folder_id, created_by, document_versions!documents_current_version_fk(version_no, created_at, uploaded_by)",
    )
    .eq("deal_id", operationId)
    .eq("folder_id", folderId)
    .order("position");

  if (error) throw error;

  const rows = (data ?? []) as unknown as DocumentRecord[];
  if (rows.length === 0) return [];

  const ids = rows.map((row) => row.id);
  const authorIds = rows
    .map((row) => row.document_versions?.uploaded_by ?? row.created_by)
    .filter((id): id is string => Boolean(id));

  const [requirements, authors, guests] = await Promise.all([
    requirementByDocument(supabase, ids),
    namesByProfile(supabase, authorIds),
    guestCountByFolder(supabase, operationId),
  ]);

  const guestCount = guests.get(folderId) ?? 0;

  return rows.map((row) => {
    const version = row.document_versions;
    const authorId = version?.uploaded_by ?? row.created_by;

    return {
      id: row.id,
      indexPath: row.index_path,
      name: row.name,
      requirement: requirements.get(row.id) ?? null,
      hidden: row.hidden_from_guests ?? false,
      // Une pièce masquée n'est visible d'aucun invité, quel que soit le
      // droit posé sur son dossier : afficher le compte du dossier ferait
      // croire l'inverse.
      guestCount: row.hidden_from_guests ? 0 : guestCount,
      versionNo: version?.version_no ?? null,
      updatedAt: version?.created_at ?? null,
      owner: authorId ? authors.get(authorId) ?? null : null,
      status: row.status,
    };
  });
}
