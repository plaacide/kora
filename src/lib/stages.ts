/**
 * Étapes du pipeline — module NEUTRE.
 *
 * Ne JAMAIS déclarer ça dans un fichier "use client" ou "use server" :
 * Next remplace alors les exports par des références (client/action) et la
 * valeur n'est plus un tableau à l'exécution (`STAGES is not iterable`).
 * Même piège que les constantes de permissions — cf. src/lib/permissions.ts.
 */
export const STAGES = [
  "sourcing",
  "screening",
  "due_diligence",
  "ic",
  "signed",
  "passed",
] as const;

export type Stage = (typeof STAGES)[number];
