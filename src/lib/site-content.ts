/**
 * Contenu du site marketing — module NEUTRE (ni "use client" ni "use server").
 *
 * Exporter des constantes depuis un module client/serveur casse à l'exécution
 * (cf. AGENTS.md) ; ce fichier n'exporte que des données, il est importable des
 * deux côtés.
 *
 * Les indicateurs « En bref » et les checklists reprennent VOLONTAIREMENT les
 * valeurs de la maquette d'app (`Sanza App v5`), pour que l'aperçu marketing ne
 * promette rien que le produit ne montre : même cohérence marketing ↔ produit
 * exigée par le brief.
 */

export type AudienceId = "vc" | "dfi" | "banque";

export interface Audience {
  id: AudienceId;
  /** Libellé du sélecteur, ex. « VC · Equity ». */
  label: string;
  short: string;
}

export const AUDIENCES: Audience[] = [
  { id: "vc", label: "VC · Equity", short: "VC" },
  { id: "dfi", label: "DFI · Impact", short: "DFI" },
  { id: "banque", label: "Banque · Dette", short: "Banque" },
];

export interface Kpi {
  label: string;
  value: string;
  note: string;
  /** Ton de la note : accentue un seuil respecté. */
  good?: boolean;
}

/** Les 5 tuiles « En bref » par financeur — valeurs de la maquette d'app. */
export const KPIS: Record<AudienceId, Kpi[]> = {
  vc: [
    { label: "Revenu annualisé", value: "480 K$", note: "+140 % /an" },
    { label: "Marge brute", value: "38 %", note: "+6 pts vs. N-1" },
    { label: "Traction métier", value: "1 200 t", note: "/an · 14 clients B2B" },
    { label: "Runway", value: "11 mois", note: "trésorerie 640 K$" },
    { label: "Engagé sur le tour", value: "3,2 M$", note: "/10 M$ · lead Sequoia" },
  ],
  dfi: [
    { label: "Revenu annualisé", value: "480 K$", note: "+140 % /an" },
    { label: "Emplois créés", value: "320", note: "+90 sur 12 mois" },
    { label: "Part femmes", value: "61 %", note: "emplois & producteurs" },
    { label: "Producteurs sourcés", value: "2 400", note: "14 coopératives" },
    { label: "Gouvernance & E&S", value: "Conseil 5", note: "2 indép. · politique E&S" },
  ],
  banque: [
    { label: "EBITDA", value: "210 K$", note: "marge 18 %" },
    { label: "DSCR", value: "1,4×", note: "seuil ≥ 1,25×", good: true },
    { label: "Ancienneté du CA", value: "3 ans", note: "CA régulier" },
    { label: "Gearing (dette/FP)", value: "0,6×", note: "endettement maîtrisé" },
    { label: "Garanties", value: "Équip. + créances", note: "+ caution dirigeant" },
  ],
};

export interface ChecklistItem {
  ref: string;
  label: string;
  done: boolean;
}

/** Checklist de diligence qui change avec le financeur — le « moment fort ». */
export const CHECKLISTS: Record<AudienceId, ChecklistItem[]> = {
  vc: [
    { ref: "1.2", label: "Statuts & cap table", done: true },
    { ref: "2.1", label: "Prévisionnels 3 ans", done: false },
    { ref: "2.4", label: "Rétention / churn", done: false },
    { ref: "3.1", label: "Pacte d'associés", done: false },
  ],
  dfi: [
    { ref: "4.1", label: "Politique E&S", done: true },
    { ref: "4.2", label: "Mesure d'impact (emplois, femmes)", done: false },
    { ref: "1.5", label: "Composition & indépendance du conseil", done: false },
    { ref: "5.3", label: "Déclaration fiscale NINEA / IFU", done: false },
  ],
  banque: [
    { ref: "2.1", label: "États financiers SYSCOHADA certifiés", done: true },
    { ref: "2.5", label: "Plan de trésorerie & BFR", done: false },
    { ref: "3.4", label: "Garanties & sûretés", done: false },
    { ref: "2.7", label: "Relevés bancaires 12 mois", done: false },
  ],
};

/** Cartes « Financeurs » de l'accueil (§6). */
export interface FinanceurCard {
  id: AudienceId;
  title: string;
  kind: string;
  regarde: string;
  points: string[];
}

export const FINANCEURS: FinanceurCard[] = [
  {
    id: "vc",
    title: "VC",
    kind: "Equity",
    regarde: "regarde la croissance et le potentiel de sortie",
    points: [
      "Trajectoire de revenus et rétention",
      "Cap table et dilution",
      "Taille de marché et avantage défendable",
    ],
  },
  {
    id: "dfi",
    title: "DFI",
    kind: "Impact",
    regarde: "regarde l'impact et la conformité E&S",
    points: [
      "Emplois créés, part femmes, producteurs",
      "Politique environnementale & sociale",
      "Gouvernance et indépendance du conseil",
    ],
  },
  {
    id: "banque",
    title: "Banque",
    kind: "Dette",
    regarde: "regarde la capacité de remboursement",
    points: [
      "DSCR, gearing, ancienneté du chiffre d'affaires",
      "Garanties et sûretés disponibles",
      "États financiers SYSCOHADA certifiés",
    ],
  },
];

/** Grille de lecture Banque vs DFI (page Institutions §4). */
export const GRILLE = {
  banque: {
    title: "Banque",
    kind: "Dette",
    rows: [
      ["DSCR", "≥ 1,25×", "1,4×"],
      ["EBITDA / marge", "suivi", "210 K$ · 18 %"],
      ["Gearing (dette / fonds propres)", "maîtrisé", "0,6×"],
      ["Garanties & sûretés", "requis", "Équip. + créances"],
    ],
  },
  dfi: {
    title: "DFI",
    kind: "Impact",
    rows: [
      ["Emplois soutenus", "mesuré", "320"],
      ["Part femmes", "suivi", "61 %"],
      ["Producteurs / bénéficiaires", "mesuré", "2 400"],
      ["Politique E&S", "requis", "en place"],
    ],
  },
} as const;

/** Barre de confiance (§3). « SOC 2 en préparation » : décision fondateur — pas
 *  de certification acquise annoncée tant qu'elle n'existe pas. */
export const TRUST = [
  "Chiffré · SOC 2 en préparation",
  "Conforme OHADA-SYSCOHADA",
  "Journal infalsifiable",
  "NDA intégré",
  "Hébergé pour l'Afrique",
];
