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

export interface ChallengeFixture {
  id: string;
  titre: string;
  categorie: string;
  entreprises: number;
  echeance: string;
  /** Terminées, en cours, en retard, à faire — dans cet ordre. */
  repartition: { terminees: number; enCours: number; enRetard: number; aFaire: number };
}

/**
 * Les quatre Challenges actifs de Saison 4 — écran 09b.
 *
 * La barre est SEGMENTÉE, pas une jauge : vert ce qui est fait, orange ce qui
 * avance, rouge ce qui a dépassé. Une jauge unique dirait « 62 % » sans dire
 * qu'une entreprise est en retard, ce qui est la seule chose à voir ici.
 */
export const CHALLENGES: readonly ChallengeFixture[] = [
  {
    id: "demo-day",
    titre: "Préparer votre Demo Day",
    categorie: "Financement",
    entreprises: 8,
    echeance: "15 octobre 2026",
    repartition: { terminees: 5, enCours: 2, enRetard: 1, aFaire: 0 },
  },
  {
    id: "kpis",
    titre: "Mettre à jour vos KPIs",
    categorie: "Reporting",
    entreprises: 12,
    echeance: "30 août 2026",
    repartition: { terminees: 7, enCours: 4, enRetard: 1, aFaire: 0 },
  },
  {
    id: "ohada",
    titre: "Compléter vos pièces OHADA prioritaires",
    categorie: "Conformité",
    entreprises: 12,
    echeance: "30 novembre 2026",
    repartition: { terminees: 4, enCours: 6, enRetard: 0, aFaire: 2 },
  },
  {
    id: "dossier-investisseur-savane",
    titre: "Préparer le dossier investisseur — version Savane",
    categorie: "Levée de fonds",
    entreprises: 5,
    echeance: "30 septembre 2026",
    repartition: { terminees: 2, enCours: 3, enRetard: 0, aFaire: 0 },
  },
];

/** Le Challenge clos de l'écran 09b. */
export const CHALLENGES_TERMINES = [
  {
    titre: "Diagnostic ESG initial",
    categorie: "ESG",
    resultat: "12 / 12 terminées",
    clos: "clôturé le 15 juin",
  },
] as const;

/**
 * « 1 entreprise en retard », écran 09b.
 *
 * Ce chiffre ne se déduit PAS des quatre Challenges : deux d'entre eux
 * comptent un retard, mais la maquette n'annonce qu'une entreprise — deux
 * retards peuvent porter sur la même. Le compter à partir des lignes donnait 2.
 */
export const ENTREPRISES_EN_RETARD = 1;

export interface CritereFixture {
  libelle: string;
  /** Manuel : l'entreprise confirme. Connecté : Sanza valide tout seul. */
  source: "manuel" | "connecte";
  obligatoire: boolean;
  /** Écran 12 : un critère structurel ne se supprime pas d'un modèle Sanza. */
  structurel?: boolean;
}

export interface ModeleFixture {
  id: string;
  titre: string;
  categorie: string;
  duree: string;
  description?: string;
  criteres: readonly CritereFixture[];
  /** Écran 10 : « Déjà utilisé dans 2 de vos cohortes ». */
  cohortes?: number;
}

/** Les catégories du volet gauche de l'écran 10, et leurs comptes. */
export const CATEGORIES: readonly { nom: string; nombre: number }[] = [
  { nom: "Tous", nombre: 14 },
  { nom: "Levée de fonds", nombre: 3 },
  { nom: "Dette", nombre: 2 },
  { nom: "Finance", nombre: 2 },
  { nom: "Gouvernance", nombre: 2 },
  { nom: "Conformité", nombre: 2 },
  { nom: "Commercial", nombre: 1 },
  { nom: "ESG", nombre: 1 },
  { nom: "Reporting", nombre: 1 },
];

/** Les trois modèles Sanza de la catégorie « Levée de fonds », écran 10. */
export const MODELES_SANZA: readonly ModeleFixture[] = [
  {
    id: "dossier-investisseur",
    titre: "Préparer le dossier investisseur",
    categorie: "Levée de fonds",
    duree: "2 semaines",
    description:
      "Une version claire et investissable de l’entreprise, prête à être partagée : pitch deck, états financiers, cap table et montant recherché. Le modèle le plus utilisé avant un Demo Day ou une mise en relation.",
    cohortes: 2,
    criteres: [
      { libelle: "Pitch deck finalisé", source: "manuel", obligatoire: true },
      {
        libelle: "États financiers disponibles",
        source: "connecte",
        obligatoire: true,
        structurel: true,
      },
      { libelle: "Cap table à jour", source: "connecte", obligatoire: true },
      {
        libelle: "Montant recherché renseigné",
        source: "connecte",
        obligatoire: true,
      },
      { libelle: "One-pager rédigé", source: "manuel", obligatoire: false },
    ],
  },
  {
    id: "levee-seed",
    titre: "Structurer votre levée Seed",
    categorie: "Levée de fonds",
    duree: "4 semaines",
    criteres: new Array(6).fill(null).map((_, rang) => ({
      libelle: `Critère ${rang + 1}`,
      source: "manuel" as const,
      obligatoire: true,
    })),
  },
  {
    id: "closing",
    titre: "Préparer votre closing",
    categorie: "Levée de fonds",
    duree: "3 semaines",
    criteres: new Array(4).fill(null).map((_, rang) => ({
      libelle: `Critère ${rang + 1}`,
      source: "manuel" as const,
      obligatoire: true,
    })),
  },
];

/** Les deux modèles privés de l'organisation — écran 16. */
export const MES_MODELES: readonly {
  titre: string;
  criteres: number;
  cohortes: string;
  modifie: string;
}[] = [
  {
    titre: "Demo Day — version Savane",
    criteres: 4,
    cohortes: "Utilisé dans 3 cohortes",
    modifie: "Modifié le 22 juillet",
  },
  {
    titre: "Reporting bailleur trimestriel",
    criteres: 3,
    cohortes: "Utilisé dans 1 cohorte",
    modifie: "Modifié le 4 juin",
  },
];

/** Le Challenge en cours de création — écran 11. */
export const CHALLENGE_NEUF = {
  titre: "Préparer votre Demo Day",
  description:
    "Présenter une version claire et investissable de votre entreprise.",
  type: "Financement",
  echeance: "15 octobre 2026",
  criteres: [
    { libelle: "Pitch deck finalisé", source: "manuel", obligatoire: true },
    { libelle: "KPIs à jour", source: "connecte", obligatoire: true },
    {
      libelle: "Montant recherché renseigné",
      source: "connecte",
      obligatoire: true,
    },
    {
      libelle: "Pitch de 5 minutes préparé",
      source: "manuel",
      obligatoire: false,
    },
  ] satisfies CritereFixture[],
} as const;

/** Le même Challenge, dérivé d'un modèle Sanza — écran 12. */
export const CHALLENGE_PERSONNALISE = {
  titre: "Préparer le dossier investisseur — version Savane",
  description:
    "Une version claire et investissable de votre entreprise, alignée sur la méthode Savane Accelerator.",
  type: "Levée de fonds",
  echeance: "30 septembre 2026",
  criteres: MODELES_SANZA[0].criteres,
} as const;

export interface AssignationFixture {
  initiales: string;
  nom: string;
  ton: Ton;
  secteur: string;
  pays: string;
  faits: number;
  total: number;
  statut: "En retard" | "En cours" | "Terminé" | "À faire";
  echeance: string;
}

/**
 * Le suivi de « Préparer votre Demo Day » — écran 14.
 *
 * L'ordre est celui de l'écran, et il n'est pas alphabétique : LES RETARDS
 * D'ABORD, puis l'échéance la plus proche. Un programme ouvre cette page pour
 * savoir qui relancer, pas pour lire une liste.
 */
export const ASSIGNATIONS: readonly AssignationFixture[] = [
  {
    initiales: "TH", nom: "Teranga Health", ton: "red",
    secteur: "Santé", pays: "Sénégal",
    faits: 1, total: 4, statut: "En retard", echeance: "dépassée de 4 jours",
  },
  {
    initiales: "CB", nom: "CoolBricks", ton: "orange",
    secteur: "Construction", pays: "Côte d’Ivoire",
    faits: 3, total: 4, statut: "En cours", echeance: "demain",
  },
  {
    initiales: "WL", nom: "Wari Logistics", ton: "neutral",
    secteur: "Logistique", pays: "Mali",
    faits: 2, total: 4, statut: "En cours", echeance: "15 octobre",
  },
  {
    initiales: "NS", nom: "Nimba Solar", ton: "green",
    secteur: "Énergie", pays: "Guinée",
    faits: 4, total: 4, statut: "Terminé", echeance: "terminé le 28 juillet",
  },
  {
    initiales: "KF", nom: "Kalyx Foods", ton: "blue",
    secteur: "Agroalimentaire", pays: "Sénégal",
    faits: 4, total: 4, statut: "Terminé", echeance: "terminé le 25 juillet",
  },
  {
    initiales: "BL", nom: "Bissap Labs", ton: "amber",
    secteur: "Ag-tech", pays: "Bénin",
    faits: 4, total: 4, statut: "Terminé", echeance: "terminé le 24 juillet",
  },
];

/** Les segments de l'écran 14. Le total dépasse les six lignes affichées. */
export const SEGMENTS_SUIVI: readonly string[] = [
  "Toutes · 8", "En retard · 1", "En cours · 2", "À faire · 0", "Terminées · 5",
];

/**
 * L'état des quatre critères de CoolBricks — panneau de l'écran 15.
 *
 * AUCUN NE MÈNE À UN DOCUMENT, et la note du pied le répète. Un critère
 * connecté dit « validé automatiquement », un critère manuel dit qui l'a
 * confirmé et quand — jamais avec quelle pièce.
 */
export const CRITERES_SUIVIS: readonly {
  libelle: string;
  detail: string;
  fait: boolean;
}[] = [
  { libelle: "Pitch deck finalisé", fait: true,
    detail: "Manuel · confirmé par l’entreprise le 24 juillet" },
  { libelle: "KPIs à jour", fait: true,
    detail: "Connecté à Sanza · validé automatiquement" },
  { libelle: "Montant recherché renseigné", fait: true,
    detail: "Connecté à Sanza · validé automatiquement" },
  { libelle: "Pitch de 5 minutes préparé", fait: false,
    detail: "Manuel · en attente de confirmation" },
];

/**
 * Les entreprises proposées à l'assignation — écran 13.
 *
 * ⚠️ CONFLIT ENTRE ÉCRANS, reproduit tel quel. Bissap Labs porte ici 12 % de
 * préparation ; l'écran 05 l'affiche « Nouvelle », sans opération ni
 * préparation. Chaque écran garde son chiffre, le conflit est signalé.
 */
export const A_ASSIGNER: readonly {
  initiales: string; nom: string; ton: Ton;
  secteur: string; pays: string; preparation: number; retenue: boolean;
}[] = [
  { initiales: "CB", nom: "CoolBricks", ton: "orange", secteur: "Construction", pays: "Côte d’Ivoire", preparation: 62, retenue: true },
  { initiales: "KF", nom: "Kalyx Foods", ton: "blue", secteur: "Agroalimentaire", pays: "Sénégal", preparation: 38, retenue: true },
  { initiales: "NS", nom: "Nimba Solar", ton: "green", secteur: "Énergie", pays: "Guinée", preparation: 81, retenue: false },
  { initiales: "BL", nom: "Bissap Labs", ton: "amber", secteur: "Ag-tech", pays: "Bénin", preparation: 12, retenue: true },
];

export interface DealroomFixture {
  id: string;
  nom: string;
  statut: "Publiée" | "Brouillon" | "Prête à publier" | "Archivée";
  entreprises: number;
  investisseurs: number | null;
  demandes: number | null;
  consentementsEnAttente: number | null;
  activite: string | null;
}

/** Les trois Dealrooms de l'écran 19 : deux publiées, une en brouillon. */
export const DEALROOMS: readonly DealroomFixture[] = [
  {
    id: "demo-day-2026", nom: "Demo Day 2026", statut: "Publiée",
    entreprises: 12, investisseurs: 28, demandes: 6,
    consentementsEnAttente: null, activite: "aujourd’hui",
  },
  {
    id: "agri-2026", nom: "Agri 2026", statut: "Publiée",
    entreprises: 8, investisseurs: 14, demandes: 2,
    consentementsEnAttente: null, activite: "il y a 3 jours",
  },
  {
    id: "women-led", nom: "Sélection Women-led", statut: "Brouillon",
    entreprises: 5, investisseurs: null, demandes: null,
    consentementsEnAttente: 3, activite: null,
  },
];

/** L'identité de la Dealroom en cours de création — écran 20. */
export const DEALROOM_NEUVE = {
  nomInterne: "Demo Day 2026",
  titrePublic: "Meet the next generation of African founders",
  sousTitre: "12 entreprises sélectionnées par Savane Accelerator",
  contact: "investors@savane.africa",
  /** L'accent choisi à l'étape 2. Le vert de la maquette 21. */
  accent: "#147a5c",
  partenaires: ["AFD", "Proparco"],
} as const;

/**
 * Les entreprises proposées à la Dealroom — écran 22.
 *
 * Le consentement est le pivot : « une entreprise sans accord peut préparer la
 * Dealroom, mais ne sera pas publiée ». Quatre états, dont un REFUS qui reste
 * visible — masquer un refus reviendrait à le faire oublier.
 */
export const CANDIDATES_DEALROOM: readonly {
  initiales: string; nom: string; ton: Ton;
  secteur: string; pays: string; cohorte: string; stade: string;
  preparation: number;
  consentement: "Accord donné" | "En attente" | "À demander" | "Refusé";
  retenue: boolean;
}[] = [
  { initiales: "CB", nom: "CoolBricks", ton: "orange", secteur: "Construction", pays: "Côte d’Ivoire", cohorte: "Agri & Agro", stade: "Seed", preparation: 62, consentement: "Accord donné", retenue: true },
  // §4 du handoff : Kalyx Foods est en Seed, pas en Série A.
  { initiales: "KF", nom: "Kalyx Foods", ton: "blue", secteur: "Agroalimentaire", pays: "Sénégal", cohorte: "Agri & Agro", stade: "Seed", preparation: 38, consentement: "En attente", retenue: true },
  { initiales: "NS", nom: "Nimba Solar", ton: "green", secteur: "Énergie", pays: "Guinée", cohorte: "Agri & Agro", stade: "Seed", preparation: 81, consentement: "Accord donné", retenue: true },
  { initiales: "MP", nom: "Moneta Pay", ton: "neutral", secteur: "Fintech", pays: "Togo", cohorte: "Fintech 2026", stade: "Série A", preparation: 74, consentement: "À demander", retenue: false },
  { initiales: "TH", nom: "Teranga Health", ton: "red", secteur: "Santé", pays: "Sénégal", cohorte: "Agri & Agro", stade: "Pre-seed", preparation: 31, consentement: "Refusé", retenue: false },
];

/** Les trois vignettes de l'aperçu investisseur — écrans 21 et 24. */
export const APERCU_ENTREPRISES: readonly { nom: string; ligne: string }[] = [
  { nom: "CoolBricks", ligne: "Construction · Seed" },
  { nom: "Kalyx Foods", ligne: "Agro · Seed" },
  { nom: "Nimba Solar", ligne: "Énergie · Seed" },
];

/** Les quatre indicateurs de l'écran 25. */
export const DEALROOM_CHIFFRES: readonly {
  titre: string; valeur: number; detail: string;
}[] = [
  { titre: "Entreprises", valeur: 12, detail: "10 fiches publiées" },
  { titre: "Investisseurs", valeur: 28, detail: "19 ont accepté l’invitation" },
  { titre: "Demandes d’accès", valeur: 6, detail: "2 à traiter" },
  { titre: "Consultations", valeur: 18, detail: "cette semaine" },
];

/** L'activité récente de l'écran 25 — trois lignes, du plus récent au plus ancien. */
export const DEALROOM_ACTIVITE: readonly { fait: string; quand: string }[] = [
  { fait: "Acme Ventures a consulté la fiche CoolBricks", quand: "il y a 2 heures" },
  { fait: "Marie Dupont (Acme Ventures) a demandé l’accès à la data room de CoolBricks", quand: "hier" },
  { fait: "Kalyx Foods a donné son accord pour cette Dealroom", quand: "il y a 3 jours" },
];

/**
 * Les entreprises de la Dealroom publiée — écran 26.
 *
 * L'OPÉRATION EST CHOISIE PAR L'ENTREPRISE, jamais par le programme : c'est le
 * titre même de la colonne. Kalyx Foods est « en attente du choix », donc non
 * publiée — voir INCOHERENCES-MAQUETTES.md §1, l'écran 30 la montre pourtant.
 */
export const DEALROOM_ENTREPRISES: readonly {
  initiales: string; nom: string; ton: Ton; secteur: string; pays: string;
  cohorte: string; operation: string; publiee: boolean;
  consentement: "Accord donné" | "En attente"; demandes: string | null;
}[] = [
  { initiales: "CB", nom: "CoolBricks", ton: "orange", secteur: "Construction", pays: "Côte d’Ivoire", cohorte: "Agri & Agro", operation: "Levée Seed 2026", publiee: true, consentement: "Accord donné", demandes: "3 demandes" },
  { initiales: "NS", nom: "Nimba Solar", ton: "green", secteur: "Énergie", pays: "Guinée", cohorte: "Agri & Agro", operation: "Levée Seed 2026", publiee: true, consentement: "Accord donné", demandes: "2 demandes" },
  { initiales: "MP", nom: "Moneta Pay", ton: "neutral", secteur: "Fintech", pays: "Togo", cohorte: "Fintech 2026", operation: "Série A 2026", publiee: true, consentement: "Accord donné", demandes: "1 demande" },
  { initiales: "KF", nom: "Kalyx Foods", ton: "blue", secteur: "Agroalimentaire", pays: "Sénégal", cohorte: "Agri & Agro", operation: "en attente du choix", publiee: false, consentement: "En attente", demandes: null },
];

/** L'audience de l'écran 27 — cinq états d'invitation, dont un accès retiré. */
export const DEALROOM_AUDIENCE: readonly {
  personne: string; organisation: string;
  statut: "Acceptée" | "Envoyée" | "Expirée" | "Accès retiré";
  ton: "green" | "neutral" | "red" | undefined;
  activite: string; action: string; actionGrise?: boolean;
}[] = [
  { personne: "Marie Dupont · marie@fund.com", organisation: "Acme Ventures", statut: "Acceptée", ton: "green", activite: "a consulté 3 fiches · hier", action: "Retirer l’accès", actionGrise: true },
  { personne: "Jean Koffi · j.koffi@dfi.org", organisation: "WestBridge DFI", statut: "Acceptée", ton: "green", activite: "a demandé 1 accès · il y a 2 jours", action: "Retirer l’accès", actionGrise: true },
  { personne: "sofia@impact.vc", organisation: "Impact Partners", statut: "Envoyée", ton: "neutral", activite: "—", action: "Relancer" },
  { personne: "t.mensah@axiscap.com", organisation: "Axis Capital", statut: "Expirée", ton: "red", activite: "—", action: "Renvoyer" },
  { personne: "paul@oldfund.com", organisation: "—", statut: "Accès retiré", ton: undefined, activite: "retiré le 18 juillet", action: "—" },
];
