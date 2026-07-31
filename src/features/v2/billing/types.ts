/**
 * Le vocabulaire de la facturation — chapitre 7.2 de l'architecture pricing.
 *
 * Sept notions distinctes, qu'on se garde de fondre : le segment de client, le
 * plan, le prix, la fonctionnalité, la limite, l'abonnement, l'usage. Les
 * mélanger ferait gagner une jointure et perdre la possibilité de changer un
 * prix sans toucher aux droits.
 */

export type SegmentClient = "business" | "program" | "funder";

export type StatutAbonnement =
  | "trialing"
  | "active"
  | "past_due"
  | "paused"
  | "cancelled"
  | "expired"
  | "pending"
  | "manual_contract";

export interface Prix {
  devise: string;
  intervalle: "month" | "year" | "cohort" | "custom";
  /** En unités entières : le franc CFA n'a pas de centimes. */
  montant: number | null;
  periodes: number;
}

export interface Plan {
  id: string;
  code: string;
  nom: string;
  description: string | null;
  segment: SegmentClient;
  gratuit: boolean;
  /** « à partir de » : le prix existe mais se négocie. */
  surDevis: boolean;
  badge: string | null;
  ordre: number;
  prix: Prix[];
}

export interface Droit {
  code: string;
  nom: string;
  categorie: string;
  /** `boolean` : on l'a ou non. `limit` : on en a un nombre. */
  nature: "boolean" | "limit";
  actif: boolean;
  /**
   * `null` sur une limite veut dire ILLIMITÉ, jamais zéro.
   *
   * La nuance décide de tout : « visiteurs externes illimités » est l'argument
   * du plan Raise, et un zéro par défaut le transformerait en interdiction.
   */
  limite: number | null;
}

export interface Abonnement {
  id: string;
  plan: Plan;
  statut: StatutAbonnement;
  intervalle: string | null;
  debutPeriode: string | null;
  finPeriode: string | null;
  finEssai: string | null;
  resiliationEnFinDePeriode: boolean;
}

/** Ce qu'une limite donne, et ce qui en est consommé. */
export interface Consommation {
  code: string;
  nom: string;
  limite: number | null;
  utilise: number;
  /** `null` quand la limite est illimitée : il n'y a pas de part d'un infini. */
  part: number | null;
  depasse: boolean;
}
