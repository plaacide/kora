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
