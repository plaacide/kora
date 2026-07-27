/**
 * Les huit lignes de la fiche, par lecture (§4 de la spec d'UI).
 *
 * LE PROBLÈME QUE CE MODULE RÉSOUT. La spec veut huit lignes NOMMÉES et fixes,
 * identiques d'une fiche à l'autre — c'est ce qui rend deux entreprises
 * comparables. Or les indicateurs existants (`raises.indicateurs`) sont un
 * tableau LIBRE de `{ l: libellé, v: valeur }` par audience : un fondateur y
 * écrit ce qu'il veut, comme il veut.
 *
 * On ne peut donc pas afficher « ARR » en espérant que quelqu'un ait tapé
 * exactement « ARR ». Chaque ligne porte ses ALIAS, et la correspondance se
 * fait sur un libellé normalisé — sans accents, sans ponctuation, sans casse.
 *
 * ⚠️ CE QU'ON N'INVENTE PAS. Une ligne sans correspondance reste « non
 * communiqué ». On ne la calcule pas depuis une autre, on ne la remplace pas
 * par zéro : la spec l'interdit, et un zéro affiché à un investisseur est une
 * affirmation, pas une absence.
 *
 * Module NEUTRE (cf. AGENTS.md) — lu côté serveur comme côté client.
 */

export type Lecture = "equity" | "dette";

export interface LigneFiche {
  /** Clé i18n du libellé, sous `showcase.rows`. */
  cle: string;
  /** Libellés acceptés côté saisie, normalisés à la comparaison. */
  alias: readonly string[];
}

const EQUITY: readonly LigneFiche[] = [
  { cle: "arr", alias: ["arr", "revenus arr", "revenu annuel recurrent", "mrr annualise"] },
  { cle: "croissance", alias: ["croissance", "growth", "croissance annuelle", "yoy"] },
  { cle: "margeBrute", alias: ["marge brute", "gross margin", "marge"] },
  { cle: "runway", alias: ["runway", "autonomie", "tresorerie restante"] },
  { cle: "cacLtv", alias: ["cac/ltv", "cac ltv", "ltv/cac", "cac"] },
  { cle: "tour", alias: ["tour recherche", "montant recherche", "levee", "tour"] },
  { cle: "dilution", alias: ["dilution", "dilution envisagee", "part cedee"] },
  { cle: "capTable", alias: ["cap table", "table de capitalisation", "actionnariat"] },
];

const DETTE: readonly LigneFiche[] = [
  { cle: "ca12", alias: ["ca 12 mois", "chiffre d'affaires", "ca annuel", "revenus"] },
  { cle: "ebitda", alias: ["ebitda", "excedent brut d'exploitation", "ebe"] },
  { cle: "couverture", alias: ["couverture du service de la dette", "dscr", "couverture"] },
  { cle: "endettement", alias: ["endettement", "dette totale", "gearing", "levier"] },
  { cle: "bfr", alias: ["bfr", "besoin en fonds de roulement", "working capital"] },
  { cle: "garanties", alias: ["garanties", "suretes", "collateral"] },
  { cle: "saisonnalite", alias: ["saisonnalite", "seasonality"] },
  { cle: "cycleTresorerie", alias: ["cycle de tresorerie", "cash cycle", "delai de rotation"] },
];

export const LIGNES: Record<Lecture, readonly LigneFiche[]> = {
  equity: EQUITY,
  dette: DETTE,
};

/** Sans accents, sans ponctuation, sans casse — « Marge brute % » = « marge brute ». */
function normaliser(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9/ ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export interface IndicateurSaisi {
  l: string;
  v: string;
}

/**
 * Remplit les huit lignes d'une lecture depuis les indicateurs saisis.
 * `null` signifie « non communiqué » — jamais zéro, jamais une estimation.
 */
export function lignesRemplies(
  lecture: Lecture,
  saisis: IndicateurSaisi[],
): Array<{ cle: string; valeur: string | null }> {
  const parLibelle = new Map(saisis.map((i) => [normaliser(i.l), i.v]));
  return LIGNES[lecture].map((ligne) => {
    for (const a of ligne.alias) {
      const v = parLibelle.get(normaliser(a));
      if (v != null && String(v).trim() !== "") return { cle: ligne.cle, valeur: String(v) };
    }
    return { cle: ligne.cle, valeur: null };
  });
}

/** Au-delà, la fiche porte un bandeau : des chiffres de plus de 3 mois trompent. */
export const JOURS_AVANT_BANDEAU = 90;
