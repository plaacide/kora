/**
 * Les objectifs d'une cohorte — les nôtres et les leurs.
 *
 * Module NEUTRE (cf. AGENTS.md) : lu côté serveur comme côté client.
 *
 * DEUX NATURES DANS UNE SEULE COLONNE. Les objectifs connus sont stockés par
 * un code stable (`leve`, `dette`…) et TRADUITS à l'affichage ; un objectif
 * libre est stocké tel que le programme l'a écrit et s'affiche tel quel.
 *
 * On ne les sépare pas en deux colonnes parce que, du point de vue de la
 * cohorte, ce sont la même chose : ce qu'elle cherche à obtenir. Les séparer
 * obligerait chaque écran à recoller les deux listes, et l'ordre de saisie
 * serait perdu.
 *
 * La distinction se fait à la lecture : le code est-il dans notre liste ? Cela
 * suppose qu'un objectif libre ne s'appelle jamais exactement « leve » — ce
 * qu'aucun humain n'écrit, et qui n'aurait de toute façon pas d'autre sens.
 */

export const OBJECTIFS_CONNUS = [
  "leve",
  "dette",
  "conformite",
  "croissance",
] as const;

export type ObjectifConnu = (typeof OBJECTIFS_CONNUS)[number];

/** Au-delà, ce n'est plus un objectif mais une description. Aligné sur la base. */
export const MAX_OBJECTIFS = 6;

/** Un objectif libre plus long qu'un titre ne se lit pas dans une étiquette. */
export const MAX_LONGUEUR_OBJECTIF = 40;

export function estObjectifConnu(v: string): v is ObjectifConnu {
  return (OBJECTIFS_CONNUS as readonly string[]).includes(v);
}

/**
 * Le libellé à afficher. `traduire` vient de l'appelant (`useTranslations` ou
 * `getTranslations`) : ce module ne dépend d'aucun runtime i18n, ce qui lui
 * permet de rester neutre.
 */
export function libelleObjectif(
  valeur: string,
  traduire: (cle: string) => string,
): string {
  if (!estObjectifConnu(valeur)) return valeur;
  const cles: Record<ObjectifConnu, string> = {
    leve: "goalRaise",
    dette: "goalDebt",
    conformite: "goalCompliance",
    croissance: "goalGrowth",
  };
  return traduire(cles[valeur]);
}

/**
 * Normalise un objectif libre avant de l'ajouter.
 *
 * Renvoie `null` si la saisie ne donne rien d'utilisable. Le rognage vit ici
 * ET dans la base : l'écran l'applique pour ne pas afficher une étiquette
 * fantôme, la base parce qu'une garde d'écran se contourne.
 */
export function normaliserObjectifLibre(saisie: string): string | null {
  const v = saisie.trim().replace(/\s+/g, " ");
  if (v === "") return null;
  return v.slice(0, MAX_LONGUEUR_OBJECTIF);
}
