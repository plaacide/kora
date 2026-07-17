/**
 * Constantes de permissions — module NEUTRE (surtout pas "use server").
 *
 * Un fichier "use server" ne peut exporter que des fonctions async : Next
 * remplace toute autre export par une référence d'action côté client, et la
 * valeur devient inutilisable (un tableau exporté depuis un tel module n'est
 * plus un tableau dans le navigateur).
 */
export const LEVELS = ["none", "watermark", "view", "download", "edit"] as const;

export type Level = (typeof LEVELS)[number];

/** Niveau suivant : Aucun → Filigrané → Voir → Télécharger → Éditer → Aucun. */
export function nextLevel(current: Level): Level {
  return LEVELS[(LEVELS.indexOf(current) + 1) % LEVELS.length];
}
