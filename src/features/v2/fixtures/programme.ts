/**
 * Les données des écrans du parcours programme, écrites en dur.
 *
 * POURQUOI CE FICHIER EXISTE. L'ordre de travail arrêté le 29 juillet est
 * d'intégrer toutes les maquettes d'abord et de brancher ensuite. Ces valeurs
 * ne sont donc pas un provisoire honteux : ce sont celles des 34 écrans de
 * référence, recopiées telles quelles.
 *
 * POURQUOI UN SEUL MODULE. Le §3 du handoff est explicite — « une entreprise =
 * les mêmes valeurs sur TOUS les écrans où elle apparaît (05, 07, 13, 22, 30,
 * 31, 32). Toute incohérence introduite à l'intégration sera considérée comme
 * un bug. » Recopier les valeurs écran par écran garantirait cette
 * incohérence ; elles vivent ici une fois, et chaque écran s'y sert.
 *
 * Ce module est neutre : ni `use client`, ni `use server`, ni accès Supabase.
 * Il disparaîtra écran par écran au branchement.
 */

export interface CohorteFixture {
  id: string;
  /** « Saison 4 · Agri & Agro » — le point médian est dans la maquette. */
  nom: string;
  /** « mars → décembre 2026 » dans le panneau, « mars — décembre 2026 » en liste. */
  periode: string;
  periodeListe: string;
  places: number;
  entreprises: number;
  challenges: number;
  questions: number;
  dealrooms: number;
  archivee?: boolean;
}

/**
 * Les trois cohortes de l'écran 02 : deux actives, une archivée.
 *
 * Les compteurs du panneau contextuel viennent de l'écran 05, qui est le seul
 * à tous les montrer ensemble — 12 entreprises, 4 Challenges, 3 questions,
 * 2 Dealrooms.
 */
export const COHORTES: readonly CohorteFixture[] = [
  {
    id: "saison-4",
    nom: "Saison 4 · Agri & Agro",
    periode: "mars → décembre 2026",
    periodeListe: "mars — décembre 2026",
    places: 15,
    entreprises: 12,
    challenges: 4,
    questions: 3,
    dealrooms: 2,
  },
  {
    id: "fintech-2026",
    nom: "Fintech 2026",
    periode: "janvier → septembre 2026",
    periodeListe: "janvier — septembre 2026",
    places: 15,
    entreprises: 6,
    challenges: 1,
    questions: 0,
    dealrooms: 0,
  },
  {
    id: "saison-3",
    nom: "Saison 3 · Généraliste",
    periode: "septembre 2024 → juin 2025",
    periodeListe: "septembre 2024 — juin 2025",
    places: 15,
    entreprises: 10,
    challenges: 0,
    questions: 0,
    dealrooms: 0,
    archivee: true,
  },
];

export function cohorte(id: string): CohorteFixture {
  return COHORTES.find((item) => item.id === id) ?? COHORTES[0];
}

/** Le programme dont les maquettes portent le nom, de l'écran 02 à l'écran 33. */
export const PROGRAMME = {
  nom: "Savane Accelerator",
  initiales: "SA",
  /** Les initiales de l'avatar du rail, écran 01. */
  avatar: "FA",
} as const;
