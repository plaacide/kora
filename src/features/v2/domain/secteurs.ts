/**
 * Les secteurs d'activité — pour la fiche d'entreprise.
 *
 * L'onboarding en proposait CINQ, écrits en dur dans la page : Énergie,
 * Finance, Agriculture, Santé, Éducation. Une entreprise de logistique, de
 * construction ou de télécoms n'avait rien à cocher — et le champ étant
 * obligatoire, elle choisissait au hasard. Un secteur faux vaut moins qu'un
 * secteur vide : il fausse tout regroupement ultérieur sans qu'on le sache.
 *
 * LES GROUPES SERVENT À LIRE, PAS À FILTRER. C'est le libellé du secteur qui
 * est stocké, jamais son groupe : demander les deux laisserait un jour
 * « Fintech · Agriculture » dans la base, et personne pour trancher.
 *
 * « Autre » ferme la liste sans l'enfermer. Un champ fermé sans échappatoire se
 * contourne toujours — en mettant n'importe quoi dans le champ d'à côté.
 */

export const GROUPES_SECTEUR = [
  "Économie réelle",
  "Services",
  "Technologies",
  "Ressources et environnement",
] as const;

export type GroupeSecteur = (typeof GROUPES_SECTEUR)[number];

export const SECTEURS: Array<[string, GroupeSecteur]> = [
  // Économie réelle
  ["Agriculture", "Économie réelle"],
  ["Agroalimentaire", "Économie réelle"],
  ["Élevage", "Économie réelle"],
  ["Pêche et aquaculture", "Économie réelle"],
  ["Industrie et manufacture", "Économie réelle"],
  ["Construction et BTP", "Économie réelle"],
  ["Immobilier", "Économie réelle"],
  ["Textile et mode", "Économie réelle"],
  ["Commerce et distribution", "Économie réelle"],

  // Services
  ["Services financiers", "Services"],
  ["Assurance", "Services"],
  ["Microfinance", "Services"],
  ["Santé", "Services"],
  ["Éducation et formation", "Services"],
  ["Transport et logistique", "Services"],
  ["Tourisme et hôtellerie", "Services"],
  ["Restauration", "Services"],
  ["Médias et création", "Services"],
  ["Services aux entreprises", "Services"],
  ["Conseil et ingénierie", "Services"],

  // Technologies
  ["Logiciel et services numériques", "Technologies"],
  ["Fintech", "Technologies"],
  ["Commerce en ligne", "Technologies"],
  ["Télécommunications", "Technologies"],
  ["Intelligence artificielle et données", "Technologies"],
  ["Santé numérique", "Technologies"],
  ["Technologies agricoles", "Technologies"],
  ["Technologies éducatives", "Technologies"],

  // Ressources et environnement
  ["Énergie", "Ressources et environnement"],
  ["Énergies renouvelables", "Ressources et environnement"],
  ["Mines et ressources", "Ressources et environnement"],
  ["Pétrole et gaz", "Ressources et environnement"],
  ["Eau et assainissement", "Ressources et environnement"],
  ["Déchets et recyclage", "Ressources et environnement"],
  ["Environnement et climat", "Ressources et environnement"],

  ["Autre secteur", "Services"],
];

/**
 * Les secteurs rangés par groupe, dans l'ordre de `GROUPES_SECTEUR`.
 *
 * Rendu pour des `<optgroup>` : sur trente-six entrées, une liste plate oblige
 * à tout parcourir. Les groupes ne sont pas stockés, ils aident seulement l'œil.
 */
export function secteursParGroupe(): Array<{
  groupe: GroupeSecteur;
  secteurs: string[];
}> {
  return GROUPES_SECTEUR.map((groupe) => ({
    groupe,
    secteurs: SECTEURS.filter(([, g]) => g === groupe).map(([nom]) => nom),
  }));
}
