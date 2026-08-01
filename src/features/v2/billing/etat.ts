import type { Abonnement, Consommation } from "./types";

/**
 * Dans quel état se trouve un abonnement, et ce qu'on en dit — §5 du handoff.
 *
 * POURQUOI UNE FONCTION PURE PLUTÔT QUE DES CONDITIONS DANS LE JSX. Six états,
 * dont quatre se ressemblent, décidés au fil de l'écran : c'est ainsi qu'on
 * finit par afficher « Actif » à quelqu'un dont le paiement a échoué. Ici, un
 * seul endroit tranche, et un test dit ce qu'il tranche.
 *
 * LA NUANCE QUE LE HANDOFF SIMPLIFIE, ET QU'IL FAUT TENIR. Il parle d'un état
 * « lecture seule après l'échéance ». Notre modèle en distingue deux, et ils
 * n'ont pas les mêmes conséquences :
 *
 *   IMPAYÉ (`past_due`) — le client doit de l'argent. §16 : l'espace passe en
 *     lecture seule, tout reste visible, rien ne s'écrit.
 *   RÉSILIÉ, terme passé — le client ne doit rien. Il retombe au plan gratuit
 *     et garde tout ce que ce plan permet. Lui dire « lecture seule » serait
 *     l'effrayer pour rien.
 *
 * Les confondre reviendrait à traiter un client parti proprement comme un
 * mauvais payeur.
 */

export type EtatAbonnement =
  | "gratuit"
  | "essai"
  | "actif"
  | "paiement_en_attente"
  | "impaye"
  | "resiliation_annoncee"
  | "termine";

export interface Bandeau {
  ton: "amber" | "red" | "neutral";
  titre: string;
  explication: string;
  /** Le geste proposé, quand il y en a un qui a du sens. */
  action: "reessayer" | "reprendre" | "souscrire" | null;
}

export function etatAbonnement(abonnement: Abonnement | null): EtatAbonnement {
  if (!abonnement) return "gratuit";

  switch (abonnement.statut) {
    case "trialing":
      return "essai";
    case "past_due":
      return "impaye";
    case "pending":
      return "paiement_en_attente";
    case "cancelled":
    case "expired":
      return "termine";
    default:
      // `cancel_at_period_end` ne change pas le statut : l'abonnement reste
      // actif jusqu'au terme. C'est précisément ce qu'on doit montrer — servi,
      // mais qui s'arrête à une date connue.
      return abonnement.resiliationEnFinDePeriode ? "resiliation_annoncee" : "actif";
  }
}

/**
 * Ce que le badge dit à côté du nom du plan.
 *
 * « Résilié — actif jusqu'au 1er septembre » plutôt que « Actif » : les deux
 * sont vrais, mais seul le premier prévient.
 */
export function badgeEtat(
  etat: EtatAbonnement,
  finPeriode: string | null,
  formaterDate: (iso: string) => string,
): { label: string; tone: string } {
  switch (etat) {
    case "gratuit":
      return { label: "Plan gratuit", tone: "neutral" };
    case "essai":
      return { label: "Essai en cours", tone: "blue" };
    case "paiement_en_attente":
      return { label: "Paiement en attente", tone: "amber" };
    case "impaye":
      return { label: "Paiement en retard", tone: "red" };
    case "resiliation_annoncee":
      return {
        label: finPeriode
          ? `Résilié — actif jusqu’au ${formaterDate(finPeriode)}`
          : "Résilié — actif jusqu’au terme",
        tone: "amber",
      };
    case "termine":
      return { label: "Terminé", tone: "neutral" };
    default:
      return { label: "Actif", tone: "green" };
  }
}

/**
 * Le bandeau à poser en haut de l'écran, quand il y a lieu.
 *
 * `null` quand tout va bien : un écran qui porte en permanence un encart
 * d'information apprend à ne plus être lu.
 */
export function bandeauEtat(etat: EtatAbonnement): Bandeau | null {
  switch (etat) {
    case "paiement_en_attente":
      return {
        ton: "amber",
        titre: "Paiement en cours de validation",
        explication:
          "Votre opérateur n’a pas encore confirmé. Cela prend parfois quelques " +
          "minutes — il n’y a rien à faire, et surtout rien à repayer.",
        action: null,
      };
    case "impaye":
      return {
        ton: "red",
        titre: "Votre dernier paiement n’a pas abouti",
        explication:
          "Aucun montant ne vous a été débité. Votre espace reste consultable, " +
          "mais les créations sont suspendues jusqu’au règlement.",
        action: "reessayer",
      };
    case "resiliation_annoncee":
      return {
        ton: "amber",
        titre: "Votre abonnement prend fin au terme de la période réglée",
        explication:
          "D’ici là, rien ne change. Ensuite, vous reviendrez au plan gratuit — " +
          "aucune donnée n’est supprimée.",
        action: "reprendre",
      };
    case "termine":
      return {
        ton: "neutral",
        titre: "Vous êtes revenu au plan gratuit",
        explication:
          "Vos opérations, vos pièces et votre journal sont intacts. Seules les " +
          "créations au-delà des limites du plan gratuit sont refusées.",
        action: "souscrire",
      };
    default:
      return null;
  }
}

/**
 * La limite la plus tendue, pour proposer une sortie qui parle.
 *
 * « Vous avez atteint la limite d'opérations actives » aide ; « vous avez
 * atteint une limite » oblige à chercher laquelle.
 */
export function limiteLaPlusTendue(
  consommation: readonly Consommation[],
): Consommation | null {
  const atteintes = consommation.filter(
    (c) => c.limite !== null && c.utilise >= c.limite,
  );
  if (atteintes.length === 0) return null;

  // La plus dépassée d'abord : c'est celle qui bloque le plus tôt.
  return [...atteintes].sort(
    (a, b) => b.utilise / (b.limite || 1) - a.utilise / (a.limite || 1),
  )[0];
}
