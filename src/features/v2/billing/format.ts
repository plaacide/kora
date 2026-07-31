import type { Plan, Prix, StatutAbonnement } from "./types";

/**
 * La mise en mots de la facturation — logique pure, donc testable.
 *
 * Elle vit à part parce qu'elle décide de ce que le fondateur COMPREND : « 0 »
 * ou « Gratuit », « 217 500 » ou « 18 125 par mois, facturé à l'année ». Le
 * même nombre, deux décisions différentes.
 */

const NOMBRE = new Intl.NumberFormat("fr-FR");

export function montant(valeur: number, devise = "XOF"): string {
  return `${NOMBRE.format(valeur)} ${devise}`;
}

/** Le prix affiché sur une carte de plan. */
export function prixAffiche(plan: Plan, intervalle: "month" | "year"): {
  principal: string;
  detail: string | null;
} {
  if (plan.gratuit) return { principal: "Gratuit", detail: null };

  if (plan.surDevis) {
    const base = plan.prix[0];
    return {
      principal: "Sur devis",
      detail: base?.montant
        ? `à partir de ${montant(base.montant, base.devise)}`
        : null,
    };
  }

  // Les plans de cohorte n'ont ni mensuel ni annuel : leur seul prix vaut pour
  // la durée incluse. Forcer un « par mois » le rendrait faux.
  const cohorte = plan.prix.find((p) => p.intervalle === "cohort");
  if (cohorte?.montant != null) {
    return {
      principal: montant(cohorte.montant, cohorte.devise),
      detail: `par cohorte · ${cohorte.periodes} mois inclus`,
    };
  }

  const choisi =
    plan.prix.find((p) => p.intervalle === intervalle) ?? plan.prix[0];
  if (!choisi?.montant) return { principal: "—", detail: null };

  if (choisi.intervalle === "year") {
    // Le mensuel équivalent, parce que c'est ainsi qu'on compare deux plans.
    const parMois = Math.round(choisi.montant / 12);
    return {
      principal: montant(choisi.montant, choisi.devise),
      detail: `par an · soit ${montant(parMois, choisi.devise)} par mois`,
    };
  }

  return { principal: montant(choisi.montant, choisi.devise), detail: "par mois" };
}

/**
 * L'économie d'un engagement annuel.
 *
 * `null` quand il n'y a rien à gagner : afficher « économisez 0 % » est une
 * promesse qui se retourne.
 */
export function economieAnnuelle(plan: Plan): number | null {
  const mois = plan.prix.find((p) => p.intervalle === "month")?.montant;
  const an = plan.prix.find((p) => p.intervalle === "year")?.montant;
  if (!mois || !an) return null;

  const pleinTarif = mois * 12;
  if (an >= pleinTarif) return null;
  return Math.round(((pleinTarif - an) / pleinTarif) * 100);
}

const STATUTS: Record<StatutAbonnement, { label: string; tone: string }> = {
  trialing: { label: "Essai en cours", tone: "blue" },
  active: { label: "Actif", tone: "green" },
  past_due: { label: "Paiement en retard", tone: "red" },
  paused: { label: "Suspendu", tone: "amber" },
  cancelled: { label: "Résilié", tone: "neutral" },
  expired: { label: "Expiré", tone: "neutral" },
  pending: { label: "En attente", tone: "amber" },
  manual_contract: { label: "Contrat", tone: "green" },
};

export function libelleStatut(statut: StatutAbonnement): {
  label: string;
  tone: string;
} {
  return STATUTS[statut] ?? { label: statut, tone: "neutral" };
}

/**
 * Les jours restants d'un essai.
 *
 * `maintenant` est un paramètre : une durée calculée sur l'horloge interne ne
 * se teste pas, et un compte à rebours faux se remarque tout de suite.
 */
export function joursRestants(
  fin: string | null,
  maintenant: Date,
): number | null {
  if (!fin) return null;
  const reste = new Date(fin).getTime() - maintenant.getTime();
  if (reste <= 0) return 0;
  return Math.ceil(reste / (24 * 60 * 60 * 1000));
}

/** « 0,02 Go », « 4 » — une limite en gigaoctets ne s'écrit pas comme un compte. */
export function quantite(code: string, valeur: number): string {
  if (code === "storage_gb") {
    return `${valeur.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} Go`;
  }
  return NOMBRE.format(valeur);
}

export type { Prix };
