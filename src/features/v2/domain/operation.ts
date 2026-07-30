export const OPERATION_TYPES = [
  "equity",
  "bank_debt",
  "dfi_or_grant",
  "due_diligence",
  "undecided",
] as const;

export type OperationType = (typeof OPERATION_TYPES)[number];

export const OPERATION_LIFECYCLES = [
  "draft",
  "active",
  "closed",
  "archived",
] as const;

export type OperationLifecycle = (typeof OPERATION_LIFECYCLES)[number];

export const OPERATION_SHARING_STATES = ["private", "shared"] as const;

export type OperationSharingState =
  (typeof OPERATION_SHARING_STATES)[number];

export interface OperationSummary {
  id: string;
  organizationId: string;
  name: string;
  type: OperationType;
  lifecycle: OperationLifecycle;
  sharingState: OperationSharingState;
  targetDate: string | null;
  tracksMultipleFunders: boolean;
}

/**
 * Opération telle que la liste l'affiche.
 *
 * `OperationSummary` décrit le modèle cible ; cette carte décrit ce que les
 * colonnes réellement présentes permettent de montrer aujourd'hui. `targetDate`
 * et `tracksMultipleFunders` en sont absents faute de source en base.
 */
export interface OperationCard {
  id: string;
  name: string;
  type: OperationType;
  lifecycle: OperationLifecycle;
  sharingState: OperationSharingState;
  /** Préparation du dossier, de 0 à 100. */
  preparation: number;
  documentCount: number;
  guestCount: number;
  lastActivityAt: string | null;
}

export function operationSupportsInvestorTracking(
  operation: Pick<OperationSummary, "type" | "tracksMultipleFunders">,
): boolean {
  return operation.type === "equity" || operation.tracksMultipleFunders;
}

/**
 * Les comptes créés avant l'élargissement de `objectif` portent tous `levee`,
 * y compris ceux qui avaient répondu « financement bancaire » ou « institution
 * ou bailleur » : leur réponse n'a pas été enregistrée et ne se devine pas.
 */
const OPERATION_TYPES_BY_OBJECTIF: Record<string, OperationType> = {
  levee: "equity",
  dette: "bank_debt",
  dfi: "dfi_or_grant",
  diligence: "due_diligence",
};

export function operationType(objectif: string | null): OperationType {
  if (!objectif) return "undecided";
  return OPERATION_TYPES_BY_OBJECTIF[objectif] ?? "undecided";
}

/** `draft` et `closed` n'ont pas de source : seul l'archivage est enregistré. */
export function operationLifecycle(archivedAt: string | null): OperationLifecycle {
  return archivedAt ? "archived" : "active";
}

export function sharingState(guestCount: number): OperationSharingState {
  return guestCount > 0 ? "shared" : "private";
}

/**
 * Les six intentions proposées à la création d'une opération (écran 55).
 *
 * Elles ne se confondent pas avec `OperationType` : ce sont les mots de
 * l'écran, six choix, quand la base n'enregistre que quatre `objectif`.
 */
export const OPERATION_INTENTS = [
  "equity",
  "debt",
  "dfi",
  "diligence",
  "audit",
  "other",
] as const;

export type OperationIntent = (typeof OPERATION_INTENTS)[number];

/**
 * Une levée ne se conçoit que là où un montant est recherché : une diligence
 * subie ou un audit n'en portent pas. Cela ne dit pas qu'une levée sera
 * ouverte — depuis le découplage data room ↔ levée, seule une saisie
 * explicite du fondateur l'ouvre — seulement qu'elle serait légitime.
 */
export function intentCanCarryRaise(intent: string): boolean {
  return intent === "equity" || intent === "debt" || intent === "dfi";
}

/**
 * Les comptes créés avant l'élargissement de `objectif` portent tous `levee`.
 * Les intentions sans correspondance en base y retombent aussi : mieux vaut
 * l'objectif par défaut qu'un enregistrement refusé.
 */
const OBJECTIVES_BY_INTENT: Record<string, string> = {
  equity: "levee",
  debt: "dette",
  dfi: "dfi",
  diligence: "diligence",
  audit: "levee",
  other: "levee",
};

export function intentObjective(intent: string): string {
  return OBJECTIVES_BY_INTENT[intent] ?? "levee";
}
