export const DOCUMENT_STATES = [
  "uploading",
  "processing",
  "needs_confirmation",
  "ready",
  "to_update",
  "archived",
  "failed",
] as const;

export type DocumentState = (typeof DOCUMENT_STATES)[number];

export const DOCUMENT_VISIBILITIES = [
  "private",
  "restricted",
  "hidden_from_guests",
] as const;

export type DocumentVisibility = (typeof DOCUMENT_VISIBILITIES)[number];

export interface DocumentReference {
  id: string;
  operationId: string;
  folderId: string | null;
  activeVersionId: string;
  displayName: string;
  state: DocumentState;
  visibility: DocumentVisibility;
  ownerId: string;
  linkedRequirementIds: string[];
  validUntil: string | null;
}

/**
 * Les quatre états que `doc_status` connaît réellement.
 *
 * `DOCUMENT_STATES` en décrit sept : c'est le modèle cible. `needs_confirmation`,
 * `to_update` et `archived` n'ont aucune source en base — les afficher
 * reviendrait à inventer une information sur des pièces réelles.
 */
export const STORED_DOCUMENT_STATES = [
  "uploading",
  "processing",
  "ready",
  "failed",
] as const;

export type StoredDocumentState = (typeof STORED_DOCUMENT_STATES)[number];

const STATE_LABELS: Record<StoredDocumentState, { label: string; tone: string }> = {
  uploading: { label: "Dépôt en cours", tone: "blue" },
  processing: { label: "En préparation", tone: "blue" },
  ready: { label: "Prête", tone: "green" },
  failed: { label: "Échec du dépôt", tone: "red" },
};

export function documentStateLabel(
  state: string,
): { label: string; tone: string } {
  return (
    STATE_LABELS[state as StoredDocumentState] ?? { label: state, tone: "neutral" }
  );
}

/**
 * Ce que le tableau affiche dans la colonne « Visibilité ».
 *
 * La base ne porte aucune visibilité PAR DOCUMENT : le droit se pose sur le
 * dossier (`permissions.folder_id`). On décrit donc l'accès du dossier qui
 * contient la pièce, sans prétendre à une finesse qui n'existe pas.
 */
export function folderVisibilityLabel(guestCount: number): string {
  if (guestCount === 0) return "Privée";
  if (guestCount === 1) return "Visible par 1 accès";
  return `Visible par ${guestCount} accès`;
}
