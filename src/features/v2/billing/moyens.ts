/**
 * Les moyens de paiement, et ce que chacun impose vraiment.
 *
 * POURQUOI CE FICHIER EXISTE. Genius Pay ne traite pas les deux moyens de la
 * même façon, et la différence n'est pas cosmétique :
 *
 *   mobile money — un numéro est OBLIGATOIRE, et c'est le seul moyen que leur
 *                  API d'abonnement accepte. Donc le seul qui puisse porter un
 *                  prélèvement récurrent.
 *   carte        — aucun numéro n'est demandé, mais leur API d'abonnement
 *                  n'accepte PAS la carte. Donc paiement par paiement.
 *
 * Un écran qui ignorerait cette asymétrie demanderait un numéro à quelqu'un qui
 * paie par carte — une donnée personnelle réclamée pour rien — ou promettrait un
 * renouvellement automatique à quelqu'un qui devra régler à la main.
 *
 * Logique pure, donc testable : c'est elle qui décide ce que l'écran réclame.
 */

export type MoyenDePaiement = "mobile_money" | "card";

export interface Moyen {
  code: MoyenDePaiement;
  label: string;
  aide: string;
  /** Le numéro est-il indispensable pour que le paiement aboutisse ? */
  exigeTelephone: boolean;
  /** Ce moyen peut-il porter un abonnement qui se reconduit ? */
  porteAbonnement: boolean;
  /**
   * Ce qu'on envoie dans `payment_method`.
   *
   * `null` pour le mobile money : en l'omettant, Genius Pay affiche SA page de
   * choix d'opérateur. Imposer Wave à quelqu'un qui a Orange Money est le
   * meilleur moyen de perdre un paiement déjà décidé.
   */
  paymentMethod: string | null;
}

export const MOYENS: readonly Moyen[] = [
  {
    code: "mobile_money",
    label: "Mobile money",
    aide: "Wave, Orange Money, MTN, Moov. Vous choisirez l’opérateur à l’étape suivante.",
    exigeTelephone: true,
    porteAbonnement: true,
    paymentMethod: null,
  },
  {
    code: "card",
    label: "Carte bancaire",
    aide: "Visa ou Mastercard. Aucun numéro de téléphone ne vous sera demandé.",
    exigeTelephone: false,
    porteAbonnement: false,
    paymentMethod: "card",
  },
];

export function moyen(code: string): Moyen | null {
  return MOYENS.find((m) => m.code === code) ?? null;
}

/**
 * Nettoyer un numéro saisi à la main.
 *
 * On tape « 07 12 34 56 78 », « +225 07-12-34-56-78 », parfois avec un point.
 * Refuser ces formes serait refuser la façon dont les gens écrivent réellement
 * leur numéro.
 */
export function normaliserTelephone(saisie: string): string {
  const nettoye = saisie.replace(/[\s.\-()]/g, "");
  return nettoye.startsWith("+") ? `+${nettoye.slice(1).replace(/\D/g, "")}` : nettoye.replace(/\D/g, "");
}

/**
 * Un numéro est-il plausible ?
 *
 * DÉLIBÉRÉMENT PERMISSIF. Les plans de numérotation d'Afrique de l'Ouest
 * changent — la Côte d'Ivoire est passée de 8 à 10 chiffres en 2021, et un
 * validateur trop précis aurait alors refusé tout le pays. On vérifie donc une
 * longueur plausible, et on laisse Genius Pay refuser ce qui n'existe pas : eux
 * savent, nous devinons.
 */
export function telephonePlausible(saisie: string): boolean {
  const numero = normaliserTelephone(saisie);
  const chiffres = numero.replace(/\D/g, "");
  return chiffres.length >= 8 && chiffres.length <= 15;
}

/**
 * Ce qu'on promet — et ce qu'on ne promet pas — pour l'échéance suivante.
 *
 * AUCUNE DE CES PHRASES NE DIT « AUTOMATIQUEMENT ». La documentation de Genius
 * Pay ne confirme pas que le renouvellement est un prélèvement réel : elle
 * évoque une relance. Et en mobile money, Wave comme Orange demandent souvent
 * une confirmation à chaque débit. Promettre le prélèvement puis couper l'accès
 * de quelqu'un qui attendait qu'on le débite serait le pire des deux mondes.
 *
 * À réécrire le jour où ils répondent par écrit — et pas avant.
 */
export function phraseEcheance(code: MoyenDePaiement, intervalle: "month" | "year"): string {
  const periode = intervalle === "year" ? "an" : "mois";

  if (code === "card") {
    return (
      `Vous réglez ${intervalle === "year" ? "un an" : "un mois"} d’avance. ` +
      `Nous vous présenterons l’échéance suivante avant qu’elle n’arrive — ` +
      `la carte n’est pas conservée.`
    );
  }

  return (
    `Vous réglez ${intervalle === "year" ? "un an" : "un mois"} d’avance. ` +
    `Nous vous préviendrons avant chaque échéance ; selon votre opérateur, ` +
    `le débit du ${periode} suivant peut demander votre confirmation.`
  );
}

/**
 * Ce qui manque pour lancer le paiement, dit à la personne qui le lit.
 *
 * `null` quand tout est là. Un formulaire qui se contente de griser son bouton
 * laisse deviner ce qui cloche.
 */
export function refusDeSaisie(input: {
  moyen: MoyenDePaiement;
  telephone: string;
}): string | null {
  const choisi = moyen(input.moyen);
  if (!choisi) return "Choisissez un moyen de paiement.";

  if (!choisi.exigeTelephone) return null;

  if (!input.telephone.trim()) {
    return "Indiquez le numéro qui recevra la demande de paiement.";
  }

  if (!telephonePlausible(input.telephone)) {
    return "Ce numéro semble incomplet. Vérifiez-le, avec l’indicatif si vous en mettez un.";
  }

  return null;
}
