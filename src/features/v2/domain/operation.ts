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
 * LES SIX INTENTIONS, ET RIEN D'AUTRE.
 *
 * Cette liste était écrite DEUX FOIS : six entrées dans « Nouvelle opération »,
 * quatre dans l'onboarding, avec des descriptions différentes pour les quatre
 * communes. Les deux écrans posent pourtant la même question — celui qui
 * répondait « Préparer un audit » à la création ne pouvait pas le dire à
 * l'inscription.
 *
 * Les libellés retenus sont les plus courts, ceux de « Nouvelle opération ».
 * Un choix se lit en diagonale ; une énumération de cas se lit deux fois.
 */
export interface Intention {
  /** Le vocabulaire de l'écran. */
  valeur: string;
  /** Ce que la base enregistre. */
  objectif: string;
  titre: string;
  description: string;
  icone: string;
}

export const INTENTIONS: readonly Intention[] = [
  {
    valeur: "equity",
    objectif: "levee",
    titre: "Lever en capital",
    description: "Ouvrez votre capital à des investisseurs.",
    icone: "pulse",
  },
  {
    valeur: "debt",
    objectif: "dette",
    titre: "Obtenir un financement bancaire",
    description: "Préparez un dossier de dette ou de prêt.",
    icone: "landmark",
  },
  {
    valeur: "dfi",
    objectif: "dfi",
    titre: "Répondre à une institution ou un bailleur",
    description: "Subventions, DFI et bailleurs internationaux.",
    icone: "globe",
  },
  {
    valeur: "diligence",
    objectif: "diligence",
    titre: "Répondre à une diligence",
    description: "Un tiers examine votre entreprise.",
    icone: "file",
  },
  {
    valeur: "audit",
    objectif: "audit",
    titre: "Préparer un audit",
    description: "Audit légal, financier ou d’impact.",
    icone: "shield-check",
  },
  {
    valeur: "autre",
    objectif: "autre",
    titre: "Autre demande documentaire",
    description: "Toute autre transmission structurée de pièces.",
    icone: "folder",
  },
];

/**
 * L'intention vers l'objectif enregistré.
 *
 * `audit` et `autre` VALAIENT `levee` : la base ne connaissait que quatre
 * valeurs, et ces deux-là y retombaient. Le rail annonçait donc « Levée en
 * capital » sur une opération d'audit, à laquelle `complete_onboarding` ouvrait
 * en prime une ligne dans `raises` — puisque `levee` compte parmi les objectifs
 * de financement. La migration `20260801180000` les a rendues légitimes ; la
 * correspondance est désormais l'identité.
 *
 * Une intention inconnue retombe sur `levee` : mieux vaut l'objectif par défaut
 * qu'un enregistrement refusé.
 */
const OBJECTIVES_BY_INTENT: Record<string, string> = Object.fromEntries(
  INTENTIONS.map((i) => [i.valeur, i.objectif]),
);

/**
 * `null` quand l'intention est absente ou inconnue — et non « levee ».
 *
 * Le repli silencieux enregistrait « Lever en capital » pour quelqu'un qui
 * n'avait rien choisi, ou dont le choix n'était pas reconnu. Un défaut posé à la
 * place de l'utilisateur est indiscernable d'une réponse, et c'est ce qui rend
 * l'erreur invisible : l'appelant décide maintenant quoi en faire.
 */
export function intentObjective(intent: string | null): string | null {
  if (!intent) return null;
  return OBJECTIVES_BY_INTENT[intent] ?? null;
}

/**
 * Ce que l'opération cherche, dit en toutes lettres.
 *
 * Le rail affichait « Levée en capital » quelle que soit l'opération, y compris
 * un dossier bancaire. Une étiquette fausse sur l'écran qu'on regarde toute la
 * journée finit par être crue.
 *
 * Une valeur inconnue est rendue telle quelle plutôt que remplacée : elle reste
 * lisible, et le jour où un septième objectif apparaît, l'écran ne ment pas en
 * attendant qu'on le nomme.
 */
const OBJECTIFS: Record<string, string> = {
  levee: "Levée en capital",
  dette: "Financement bancaire",
  dfi: "Financement DFI ou impact",
  diligence: "Diligence",
  audit: "Audit",
  autre: "Demande documentaire",
};

export function libelleObjectif(objectif: string | null): string | null {
  if (!objectif) return null;
  return OBJECTIFS[objectif] ?? objectif;
}
