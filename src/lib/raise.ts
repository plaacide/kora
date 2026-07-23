/**
 * Modèle de la levée (table `raises`). Module NEUTRE : ni "use client" ni
 * "use server" — il exporte un type et des constantes, importés à la fois par
 * la page serveur et le modal client (cf. AGENTS.md sur les constantes
 * partagées).
 */

/** Une ligne de la vitrine : libellé, valeur, précision, mis en avant (vert). */
export interface Indicateur {
  l: string;
  v: string;
  s?: string;
  g?: boolean;
}

/** Vitrine = indicateurs par audience (clé = 'vc' | 'dfi' | 'banque'). */
export type Vitrine = Record<string, Indicateur[]>;

export interface Raise {
  id: string;
  /** Nom propre de la levée (ex. « Série A 2026 »), indépendant de la data room. */
  name?: string | null;
  montant_cible: number | null;
  montant_engage: number;
  devise: string;
  type_tour: string | null;
  stade: string | null;
  valorisation_pre: number | null;
  date_cloture: string | null;
  audience: string[];
  description: string | null;
  statut: string;
  indicateurs?: Vitrine | null;
}

export interface RaiseInvestor {
  id: string;
  nom: string;
  organisation: string | null;
  email: string | null;
  ticket: number | null;
  statut: string;
}

/**
 * Modèles de vitrine par audience : les indicateurs que ce type d'investisseur
 * regarde en priorité. Ce sont des LIBELLÉS d'amorçage (valeurs vides) — le
 * fondateur saisit ses chiffres réels. Rien n'est inventé : on propose la
 * structure, pas les valeurs.
 */
export const VITRINE_TEMPLATES: Record<string, Indicateur[]> = {
  vc: [
    { l: "Revenu annualisé (ARR)", v: "", s: "" },
    { l: "Croissance", v: "", s: "" },
    { l: "Marge brute", v: "", s: "" },
    { l: "Traction", v: "", s: "" },
    { l: "Runway", v: "", s: "" },
  ],
  dfi: [
    { l: "Emplois créés", v: "", s: "" },
    { l: "Part femmes", v: "", s: "" },
    { l: "Bénéficiaires / producteurs", v: "", s: "" },
    { l: "Impact E&S", v: "", s: "" },
    { l: "Gouvernance", v: "", s: "" },
  ],
  banque: [
    { l: "EBITDA", v: "", s: "" },
    { l: "DSCR", v: "", s: "" },
    { l: "Ancienneté du chiffre d'affaires", v: "", s: "" },
    { l: "Gearing (dette / fonds propres)", v: "", s: "" },
    { l: "Garanties", v: "", s: "" },
  ],
};

export const STATUT_PIPELINE: { key: string; label: string; tone: "green" | "amber" | "gray" }[] = [
  { key: "invite", label: "Invité", tone: "gray" },
  { key: "nda", label: "NDA en attente", tone: "amber" },
  { key: "soft_commit", label: "Soft-commit", tone: "green" },
  { key: "diligence", label: "En diligence", tone: "amber" },
  { key: "engage", label: "Engagé", tone: "green" },
  { key: "refuse", label: "Décliné", tone: "gray" },
];

export const TYPE_TOUR: { key: string; label: string }[] = [
  { key: "equity", label: "Equity" },
  { key: "dette", label: "Dette" },
  { key: "safe", label: "SAFE" },
  { key: "convertible", label: "Obligation convertible" },
];

export const STADE_RAISE: { key: string; label: string }[] = [
  { key: "pre_seed", label: "Pré-seed" },
  { key: "seed", label: "Seed" },
  { key: "serie_a", label: "Série A" },
  { key: "serie_b_plus", label: "Série B+" },
];

export const AUDIENCES: { key: string; label: string }[] = [
  { key: "vc", label: "VC · Equity" },
  { key: "dfi", label: "DFI · Impact" },
  { key: "banque", label: "Banque · Dette" },
];

export const DEVISES: string[] = ["USD", "EUR", "XOF"];

export function labelOf(list: { key: string; label: string }[], key: string | null): string {
  return list.find((x) => x.key === key)?.label ?? "";
}
