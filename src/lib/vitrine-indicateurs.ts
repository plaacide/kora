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
  /**
   * Libellé PROPOSÉ au fondateur dans son éditeur d'indicateurs.
   *
   * Il vit ici, à côté des alias, et pas dans l'éditeur : c'est ce qui garantit
   * que ce qu'il saisit est exactement ce que la fiche cherchera. Séparés, les
   * deux dérivent — le modèle existant écrivait « Revenu annualisé (ARR) »
   * quand la fiche cherchait « ARR », et personne ne le voyait.
   */
  libelle: string;
  /** Libellés acceptés côté saisie, normalisés à la comparaison. */
  alias: readonly string[];
}

const EQUITY: readonly LigneFiche[] = [
  // « Revenu annualisé (ARR) » est le libellé du modèle `vc` existant : sans
  // cet alias, les fiches déjà remplies s'afficheraient vides.
  { cle: "arr", libelle: "ARR", alias: ["arr", "revenus arr", "revenu annualise arr", "revenu annuel recurrent", "mrr annualise"] },
  { cle: "croissance", libelle: "Croissance", alias: ["croissance", "growth", "croissance annuelle", "yoy"] },
  { cle: "margeBrute", libelle: "Marge brute", alias: ["marge brute", "gross margin", "marge"] },
  { cle: "runway", libelle: "Runway", alias: ["runway", "autonomie", "tresorerie restante", "traction"] },
  { cle: "cacLtv", libelle: "CAC/LTV", alias: ["cac/ltv", "cac ltv", "ltv/cac", "cac"] },
  { cle: "tour", libelle: "Tour recherché", alias: ["tour recherche", "montant recherche", "levee", "tour"] },
  { cle: "dilution", libelle: "Dilution envisagée", alias: ["dilution", "dilution envisagee", "part cedee"] },
  { cle: "capTable", libelle: "Cap table", alias: ["cap table", "table de capitalisation", "actionnariat"] },
];

const DETTE: readonly LigneFiche[] = [
  { cle: "ca12", libelle: "CA 12 mois", alias: ["ca 12 mois", "chiffre d'affaires", "ca annuel", "revenus"] },
  { cle: "ebitda", libelle: "EBITDA", alias: ["ebitda", "excedent brut d'exploitation", "ebe"] },
  { cle: "couverture", libelle: "Couverture du service de la dette", alias: ["couverture du service de la dette", "dscr", "couverture"] },
  { cle: "endettement", libelle: "Endettement", alias: ["endettement", "dette totale", "gearing", "levier"] },
  { cle: "bfr", libelle: "BFR", alias: ["bfr", "besoin en fonds de roulement", "working capital"] },
  { cle: "garanties", libelle: "Garanties", alias: ["garanties", "suretes", "collateral"] },
  { cle: "saisonnalite", libelle: "Saisonnalité", alias: ["saisonnalite", "seasonality"] },
  { cle: "cycleTresorerie", libelle: "Cycle de trésorerie", alias: ["cycle de tresorerie", "cash cycle", "delai de rotation"] },
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

/**
 * Les huit lignes d'une lecture, prêtes à être chargées dans l'éditeur du
 * fondateur. Dérivées de `LIGNES` — donc impossibles à désynchroniser de ce
 * que la fiche ira chercher.
 */
export function modeleIndicateurs(lecture: Lecture): Array<{ l: string; v: string; s: string }> {
  return LIGNES[lecture].map((ligne) => ({ l: ligne.libelle, v: "", s: "" }));
}
