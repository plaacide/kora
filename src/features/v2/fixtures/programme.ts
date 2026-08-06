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

/**
 * La même cohorte, le premier jour — écrans 03 et 04.
 *
 * Les maquettes 03 et 05 portent le MÊME nom, « Saison 4 · Agri & Agro », avec
 * 0 puis 12 entreprises : ce sont deux moments d'une cohorte, pas deux
 * cohortes. La liste de l'écran 02 n'en montre donc que trois, et cet état-ci
 * vit à part — sans quoi le programme aurait une quatrième cohorte qui
 * n'existe pas.
 */
const SAISON_4_JOUR_1: CohorteFixture = {
  id: "saison-4-jour-1",
  nom: "Saison 4 · Agri & Agro",
  periode: "mars → décembre 2026",
  periodeListe: "mars — décembre 2026",
  places: 15,
  entreprises: 0,
  challenges: 0,
  questions: 0,
  dealrooms: 0,
};

export function cohorte(id: string): CohorteFixture {
  if (id === SAISON_4_JOUR_1.id) return SAISON_4_JOUR_1;
  return COHORTES.find((item) => item.id === id) ?? COHORTES[0];
}

/**
 * Les indicateurs de la carte d'une cohorte — écran 02.
 *
 * ⚠️ CONFLIT ENTRE ÉCRANS, reproduit tel quel et non arbitré. L'écran 02
 * annonce « 3 Challenges en cours » pour Saison 4 ; l'écran 05 en compte 4,
 * deux fois — dans son sous-titre et dans le compteur du panneau contextuel.
 * La règle 1 du handoff demande de reproduire les écrans à l'identique ; son
 * §3 demande des fixtures cohérentes. Les deux ne peuvent pas tenir ici, donc
 * chaque écran garde son chiffre et le conflit est signalé.
 */
export interface IndicateurCohorte {
  valeur: number;
  libelle: string;
}

export const INDICATEURS_COHORTE: Record<string, readonly IndicateurCohorte[]> = {
  "saison-4": [
    { valeur: 12, libelle: "entreprises" },
    { valeur: 9, libelle: "préparations actives" },
    { valeur: 3, libelle: "Challenges en cours" },
    { valeur: 2, libelle: "actions à relancer" },
  ],
  "fintech-2026": [
    { valeur: 6, libelle: "entreprises" },
    { valeur: 4, libelle: "préparations actives" },
    { valeur: 1, libelle: "Challenge en cours" },
  ],
  "saison-3": [
    { valeur: 10, libelle: "entreprises" },
    { valeur: 7, libelle: "préparations menées" },
  ],
};

/**
 * Le ton d'un avatar. Les maquettes en donnent six, attribués une fois pour
 * toutes à chaque entreprise : CoolBricks est orange de l'écran 04 à l'écran 32.
 */
export type Ton = "orange" | "blue" | "green" | "amber" | "neutral" | "red";

export interface EntrepriseFixture {
  initiales: string;
  nom: string;
  ton: Ton;
  secteur: string;
  pays: string;
  /** L'opération que l'entreprise a choisi de présenter, écran 05. */
  operation: string | null;
  /** « Capital » ou « Dette » — la modalité, sous le nom de l'opération. */
  instrument: string | null;
  preparation: number | null;
  challenges: string | null;
  dealroom: string | null;
  aFaire: string | null;
  /** « Décroche » ou « Nouvelle », accolé au nom. */
  mention?: { texte: string; ton: "red" | "neutral" };
}

/** Les six entreprises affichées par l'écran 05, sur les douze de la cohorte. */
export const ENTREPRISES: readonly EntrepriseFixture[] = [
  {
    initiales: "CB",
    nom: "CoolBricks",
    ton: "orange",
    secteur: "Construction",
    pays: "Côte d’Ivoire",
    operation: "Levée Seed 2026",
    instrument: "Capital",
    preparation: 62,
    challenges: "2 en cours",
    dealroom: "Demo Day 2026",
    aFaire: "1 action prioritaire",
  },
  {
    initiales: "KF",
    nom: "Kalyx Foods",
    ton: "blue",
    secteur: "Agroalimentaire",
    pays: "Sénégal",
    operation: "Dette équipement",
    instrument: "Dette",
    preparation: 38,
    challenges: "1 en retard",
    dealroom: "Demo Day 2026",
    aFaire: "Relancer les KPIs",
    mention: { texte: "Décroche", ton: "red" },
  },
  {
    initiales: "NS",
    nom: "Nimba Solar",
    ton: "green",
    secteur: "Énergie",
    pays: "Guinée",
    operation: "Levée Seed 2026",
    instrument: "Capital",
    preparation: 81,
    challenges: "1 terminé",
    dealroom: "Demo Day 2026",
    aFaire: null,
  },
  {
    initiales: "BL",
    nom: "Bissap Labs",
    ton: "amber",
    secteur: "Ag-tech",
    pays: "Bénin",
    operation: null,
    instrument: null,
    preparation: null,
    challenges: null,
    dealroom: null,
    aFaire: "Proposer un Challenge",
    mention: { texte: "Nouvelle", ton: "neutral" },
  },
  {
    initiales: "WL",
    nom: "Wari Logistics",
    ton: "neutral",
    secteur: "Logistique",
    pays: "Mali",
    operation: "Levée Seed 2026",
    instrument: "Capital",
    preparation: 55,
    challenges: "1 en cours",
    dealroom: null,
    aFaire: null,
  },
  {
    initiales: "TH",
    nom: "Teranga Health",
    ton: "red",
    secteur: "Santé",
    pays: "Sénégal",
    operation: "Levée Pre-seed",
    instrument: "Capital",
    preparation: 31,
    challenges: "1 en retard",
    dealroom: null,
    aFaire: "Relancer",
    mention: { texte: "Décroche", ton: "red" },
  },
];

/** Les segments de l'écran 05. Le premier est actif. */
export const SEGMENTS: readonly string[] = [
  "Toutes · 12",
  "Prêtes · 3",
  "En cours · 5",
  "Décrochent · 2",
  "Nouvelles · 2",
];

export interface InvitationFixture {
  initiales: string;
  nom: string;
  ton: Ton;
  email: string;
  envoyee: string;
  activite: string;
  statut: string;
  statutTon: "blue" | "neutral" | "amber" | "red";
  action: string;
}

/** Les quatre invitations de l'écran 04 — aucune acceptée. */
export const INVITATIONS: readonly InvitationFixture[] = [
  {
    initiales: "CB",
    nom: "CoolBricks",
    ton: "orange",
    email: "aminata@coolbricks.ci",
    envoyee: "22 juillet",
    activite: "Lien ouvert hier",
    statut: "Lien ouvert",
    statutTon: "blue",
    action: "Relancer",
  },
  {
    initiales: "KF",
    nom: "Kalyx Foods",
    ton: "blue",
    email: "contact@kalyxfoods.sn",
    envoyee: "22 juillet",
    activite: "—",
    statut: "Envoyée",
    statutTon: "neutral",
    action: "Relancer",
  },
  {
    initiales: "NS",
    nom: "Nimba Solar",
    ton: "green",
    email: "k.diallo@nimba.gn",
    envoyee: "8 juillet",
    activite: "—",
    statut: "À relancer",
    statutTon: "amber",
    action: "Relancer",
  },
  {
    initiales: "BL",
    nom: "Bissap Labs",
    ton: "amber",
    email: "hello@bissap.co",
    envoyee: "12 juin",
    activite: "—",
    statut: "Expirée",
    statutTon: "red",
    action: "Renvoyer l’invitation",
  },
];

/**
 * Les Challenges actifs proposés à une entreprise qui arrive — écran 17.
 * « Pas d'assignation silencieuse » : la cohorte en compte trois, on les
 * propose, on ne les impose pas.
 */
export const CHALLENGES_A_PROPOSER: readonly { titre: string; criteres: number }[] =
  [
    { titre: "Préparer votre Demo Day", criteres: 4 },
    { titre: "Mettre à jour vos KPIs", criteres: 3 },
    { titre: "Compléter vos pièces OHADA prioritaires", criteres: 4 },
  ];

/** Le programme dont les maquettes portent le nom, de l'écran 02 à l'écran 33. */
export const PROGRAMME = {
  nom: "Savane Accelerator",
  initiales: "SA",
  /** Les initiales de l'avatar du rail, écran 01. */
  avatar: "FA",
} as const;

export interface MessageFixture {
  initiales: string;
  nom: string;
  ton: Ton;
  statut: string;
  statutTon: "amber" | "green" | "neutral";
  quand: string;
  corps: string;
  /** La réponse de l'entreprise, quand elle est venue. */
  reponse?: string;
}

/**
 * Le fil de l'écran 08 : une question en attente, une répondue, une suggestion.
 *
 * Une SUGGESTION n'attend rien — d'où son ton neutre, quand la question en
 * attente porte l'ambre. Confondre les deux ferait passer un conseil pour une
 * relance.
 */
export const MESSAGES: readonly MessageFixture[] = [
  {
    initiales: "CB",
    nom: "CoolBricks",
    ton: "orange",
    statut: "En attente",
    statutTon: "amber",
    quand: "envoyée il y a 2 jours",
    corps:
      "Votre montant recherché couvre-t-il le besoin en fonds de roulement 2027 ?",
  },
  {
    initiales: "KF",
    nom: "Kalyx Foods",
    ton: "blue",
    statut: "Répondu",
    statutTon: "green",
    quand: "répondu hier",
    corps:
      "Quel scénario de dette présentez-vous à la BOAD en priorité ?",
    reponse:
      "Le scénario équipement sur 5 ans. Le second passera en comité interne d’abord.",
  },
  {
    initiales: "NS",
    nom: "Nimba Solar",
    ton: "green",
    statut: "Suggestion",
    statutTon: "neutral",
    quand: "il y a 4 jours",
    corps:
      "Pensez à renseigner votre montant recherché avant le Demo Day — les investisseurs filtrent souvent sur ce champ.",
  },
];
