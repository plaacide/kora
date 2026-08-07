/**
 * Le maillon « Objectif → Modèle recommandé ».
 *
 * L'entreprise déclare un objectif en créant son opération ; le référentiel
 * filtre déjà son plan de préparation en conséquence — `sources_pour_objectif`
 * rend `{capital,ohada}` pour une levée, `{bank,ohada}` pour une dette. Ce
 * module ferme le chaînon d'après : à quel MODÈLE Sanza cet objectif conduit.
 *
 * ⚠️ IL N'Y A PAS DE MODÈLE POUR TOUT, ET C'EST VOULU. Un audit et une
 * diligence sont SUBIS — `intentCanCarryRaise()` les écarte déjà des
 * opérations qui portent une levée, avec ce commentaire : « une diligence
 * subie ou un audit n'en portent pas ». Un modèle Sanza accompagne une
 * préparation qu'on décide, vers un financement qu'on recherche. Recommander
 * un modèle à quelqu'un qui subit un audit, ce serait lui proposer d'avancer
 * là où il n'a pas la main sur le calendrier.
 *
 * ⚠️ ON NE S'APPUIE PAS SUR L'OBJECTIF DE LA COHORTE. `cohorts.goal` existe
 * mais porte un AUTRE vocabulaire — « leve », « conformite », « croissance » —
 * dont deux valeurs n'ont aucun référentiel derrière elles. Et le code V2 ne
 * l'écrit jamais : `create_cohort` est appelée avec `p_goals: null` partout.
 * S'y fier donnerait une recommandation fondée sur du vide.
 */

/** Les catégories des trois modèles Sanza livrés par défaut. */
export const CATEGORIES_SANZA = [
  "Levée de fonds",
  "Dette",
  "Institutionnel",
] as const;

export type CategorieSanza = (typeof CATEGORIES_SANZA)[number];

/**
 * L'objectif tel qu'il est ENREGISTRÉ sur l'opération, et non tel que l'écran
 * le nomme. La base n'en garde que quatre là où l'écran en propose six.
 */
const PAR_OBJECTIF: Readonly<Record<string, CategorieSanza>> = {
  dette: "Dette",
  dfi: "Institutionnel",
  levee: "Levée de fonds",
};

/** L'intention telle que l'ÉCRAN la nomme — six mots, écran 55. */
const PAR_INTENTION: Readonly<Record<string, CategorieSanza>> = {
  debt: "Dette",
  dfi: "Institutionnel",
  equity: "Levée de fonds",
};

/**
 * Le modèle que Sanza recommande pour cet objectif — ou `null`.
 *
 * Accepte les deux vocabulaires, celui de la base et celui de l'écran, parce
 * que l'appelant n'a pas toujours le même sous la main et qu'une conversion
 * oubliée rendrait silencieusement `null`.
 */
export function modeleRecommande(
  objectif: string | null | undefined,
): CategorieSanza | null {
  if (!objectif) return null;
  return PAR_OBJECTIF[objectif] ?? PAR_INTENTION[objectif] ?? null;
}

/**
 * Pourquoi ce modèle est recommandé — la phrase que l'écran affiche.
 *
 * Une recommandation sans motif est un ordre. Celle-ci dit ce qu'elle lit :
 * l'objectif que l'entreprise a elle-même déclaré.
 */
export function motifRecommandation(objectif: string | null): string | null {
  const modele = modeleRecommande(objectif);
  if (!modele) return null;
  switch (modele) {
    case "Dette":
      return "Recommandé — cette entreprise prépare un financement bancaire.";
    case "Institutionnel":
      return "Recommandé — cette entreprise prépare un financement institutionnel.";
    default:
      return "Recommandé — cette entreprise prépare une levée de fonds.";
  }
}

/**
 * Le modèle qui convient au PLUS GRAND NOMBRE d'une cohorte.
 *
 * Une cohorte mêle des objectifs ; un Challenge s'assigne à plusieurs
 * entreprises à la fois. On propose donc le modèle majoritaire, et l'écran dit
 * combien d'entreprises il couvre — sans quoi le programme croirait qu'il les
 * couvre toutes.
 *
 * Rend `null` en cas d'ÉGALITÉ PARFAITE plutôt que de départager au hasard :
 * une recommandation qui bascule d'un chargement à l'autre vaut moins que pas
 * de recommandation du tout.
 */
export function modeleMajoritaire(
  objectifs: readonly (string | null)[],
): { modele: CategorieSanza; couvre: number } | null {
  const compte = new Map<CategorieSanza, number>();
  for (const o of objectifs) {
    const m = modeleRecommande(o);
    if (m) compte.set(m, (compte.get(m) ?? 0) + 1);
  }
  if (compte.size === 0) return null;

  const classe = [...compte.entries()].sort((a, b) => b[1] - a[1]);
  if (classe.length > 1 && classe[0]![1] === classe[1]![1]) return null;

  return { couvre: classe[0]![1], modele: classe[0]![0] };
}
