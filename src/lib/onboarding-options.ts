/**
 * Listes de l'onboarding : pays, secteurs, stades, types d'investisseur,
 * géographies.
 *
 * Chaque entrée sépare la VALEUR de son LIBELLÉ :
 *  - `value` est ce qui part en base. Elle est en français et le reste — les
 *    lignes déjà enregistrées portent « Côte d'Ivoire », « Pré-seed »,
 *    « Santé ». Traduire la valeur ferait deux vocabulaires pour une même
 *    donnée et casserait tout filtre existant.
 *  - `key` désigne le libellé affiché, résolu par next-intl. C'est lui, et lui
 *    seul, qui change avec la langue.
 *
 * ⚠️ Module NEUTRE (ni "use client", ni "use server") : une constante exportée
 * depuis un module directive-é est remplacée par une référence à l'exécution
 * (cf. AGENTS.md).
 */
export interface OptionOnboarding {
  /** Valeur persistée — ne jamais traduire. */
  value: string;
  /** Clé i18n du libellé, sous `onboarding.options.*`. */
  key: string;
}

export const PAYS: readonly OptionOnboarding[] = [
  { value: "Côte d'Ivoire", key: "civ" },
  { value: "Sénégal", key: "sen" },
  { value: "Bénin", key: "ben" },
  { value: "Mali", key: "mli" },
  { value: "Togo", key: "tgo" },
  { value: "Burkina Faso", key: "bfa" },
  { value: "Cameroun", key: "cmr" },
  { value: "Nigeria", key: "nga" },
  { value: "Autre", key: "autre" },
];

/** Secteurs proposés au fondateur — « Autre » compris. */
export const SECTEURS: readonly OptionOnboarding[] = [
  { value: "Agritech", key: "agritech" },
  { value: "Fintech", key: "fintech" },
  { value: "Santé", key: "sante" },
  { value: "Logistique", key: "logistique" },
  { value: "Énergie", key: "energie" },
  { value: "Éducation", key: "education" },
  { value: "Autre", key: "autre" },
];

/**
 * Secteurs d'une thèse d'investissement — sans « Autre » : une thèse se
 * définit par ce qu'elle vise, pas par un fourre-tout.
 */
export const SECTEURS_THESE: readonly OptionOnboarding[] = SECTEURS.filter(
  (s) => s.key !== "autre",
);

export const STADES: readonly OptionOnboarding[] = [
  { value: "Pré-seed", key: "preseed" },
  { value: "Seed", key: "seed" },
  { value: "Série A", key: "serieA" },
  { value: "Série B+", key: "serieBplus" },
];

export const TYPES_INVESTISSEUR: readonly OptionOnboarding[] = [
  { value: "Fonds VC", key: "vc" },
  { value: "Business angel", key: "angel" },
  { value: "DFI", key: "dfi" },
  { value: "Family office", key: "familyOffice" },
  { value: "Corporate", key: "corporate" },
];

export const GEOGRAPHIES: readonly OptionOnboarding[] = [
  { value: "Afrique de l'Ouest", key: "ouest" },
  { value: "Afrique de l'Est", key: "est" },
  { value: "Afrique du Nord", key: "nord" },
  { value: "Afrique australe", key: "australe" },
];
