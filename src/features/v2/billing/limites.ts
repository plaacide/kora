/**
 * Ce qu'on dit à quelqu'un dont le plan refuse un geste — §15.
 *
 * La base renvoie « limite atteinte : active_deals ». Un code n'aide personne.
 * UN REFUS SANS ISSUE EST UNE IMPASSE : chaque message nomme ce qui bloque,
 * puis les deux sorties — libérer de la place, ou changer de plan. Le §15
 * insiste d'ailleurs sur la première : on demande d'archiver, on ne supprime
 * jamais.
 *
 * Logique pure, donc testable : c'est le texte que verra le fondateur au pire
 * moment de son parcours, il mérite d'être vérifié.
 */

export interface RefusDeLimite {
  /** Le code de la limite, tel que la base le renvoie. */
  code: string;
  titre: string;
  /** Ce qui bloque, et ce qu'on peut faire — deux phrases, pas plus. */
  explication: string;
  /** L'issue qui ne coûte rien, quand elle existe. */
  issue: string | null;
}

const REFUS: Record<string, Omit<RefusDeLimite, "code">> = {
  active_deals: {
    titre: "Votre plan n’autorise pas une opération de plus",
    explication:
      "Les opérations déjà ouvertes ne sont pas touchées : elles restent " +
      "complètes et accessibles.",
    issue:
      "Archivez une opération terminée — l’archivage est réversible et ne " +
      "supprime rien — ou passez à un plan supérieur.",
  },
  internal_users: {
    titre: "Votre équipe est au complet pour ce plan",
    explication:
      "Les collaborateurs déjà présents gardent leur accès. Seules les " +
      "nouvelles invitations sont suspendues.",
    issue:
      "Retirez un collaborateur qui n’intervient plus, ou passez à un plan " +
      "supérieur.",
  },
  external_visitors: {
    titre: "Vous avez atteint le nombre de visiteurs externes de ce plan",
    explication:
      "Les accès déjà ouverts restent valables. Réinviter une personne déjà " +
      "présente ne compte pas — c’est une personne de plus qui est refusée.",
    issue:
      "Révoquez un accès qui n’a plus lieu d’être, ou passez au plan Raise, " +
      "qui n’en limite pas le nombre.",
  },
  storage_gb: {
    titre: "L’espace de stockage de votre plan est plein",
    explication:
      "Vos pièces restent en place et consultables. Seuls les nouveaux dépôts " +
      "sont suspendus.",
    issue: "Passez à un plan supérieur pour retrouver de l’espace.",
  },
};

/**
 * Reconnaître un refus de limite dans un message d'erreur de la base.
 *
 * `null` quand ce n'en est pas un : l'appelant affichera alors l'erreur telle
 * quelle plutôt que d'inventer une explication commerciale à un incident
 * technique.
 */
export function refusDeLimite(message: string): RefusDeLimite | null {
  const trouve = message.match(/limite atteinte\s*:\s*([a-z_]+)/i);
  if (!trouve) return null;

  const code = trouve[1];
  const connu = REFUS[code];

  if (!connu) {
    // Une limite qu'on n'a pas encore mise en mots : on le dit sans broder.
    return {
      code,
      titre: "Votre plan ne permet pas ce geste",
      explication: "Une limite de votre abonnement a été atteinte.",
      issue: null,
    };
  }

  return { code, ...connu };
}

/** Le message complet, d'un seul tenant, pour un bandeau d'erreur. */
export function messageDeRefus(message: string): string | null {
  const refus = refusDeLimite(message);
  if (!refus) return null;

  return [refus.titre + ".", refus.explication, refus.issue]
    .filter(Boolean)
    .join(" ");
}
