/**
 * Les engagements de la levée — écrans 43 et 44.
 *
 * Logique pure : aucune I/O, donc testable ligne à ligne. Ce fichier porte la
 * seule règle qui compte vraiment ici — celle qui décide quel argent est
 * réellement sécurisé — et il vaut mieux qu'elle soit à un endroit qu'on peut
 * vérifier qu'éparpillée dans trois composants.
 */

export type NiveauEngagement = "interet" | "soft_commit" | "confirme";

export interface Niveau {
  cle: NiveauEngagement;
  label: string;
  /** Le libellé court des tableaux, où la colonne est étroite. */
  court: string;
  aide: string;
  tone: "neutral" | "orange" | "green";
  /** Compte-t-il dans le montant sécurisé ? */
  compte: boolean;
}

export const NIVEAUX: readonly Niveau[] = [
  {
    cle: "interet",
    label: "Intérêt indicatif",
    court: "Intérêt",
    aide: "Un ordre de grandeur évoqué — non compté dans le montant sécurisé",
    tone: "neutral",
    compte: false,
  },
  {
    cle: "soft_commit",
    label: "Soft-commit déclaré",
    court: "Soft-commit",
    aide: "Intention communiquée explicitement, non contractuelle",
    tone: "orange",
    compte: true,
  },
  {
    cle: "confirme",
    label: "Engagement confirmé",
    court: "Confirmé",
    aide: "Confirmation écrite ou term sheet signé",
    tone: "green",
    compte: true,
  },
] as const;

export function niveau(cle: string): Niveau {
  return NIVEAUX.find((n) => n.cle === cle) ?? NIVEAUX[0];
}

export interface Engagement {
  id: string;
  investorId: string;
  investisseur: string;
  organisation: string | null;
  niveau: NiveauEngagement;
  montant: number;
  devise: string | null;
  date: string;
  preuve: string | null;
  commentaire: string | null;
  responsable: string | null;
  modifieLe: string;
  /** `true` si la ligne a été requalifiée depuis sa création. */
  requalifie: boolean;
}

export interface Total {
  montant: number;
  investisseurs: number;
}

export interface Ventilation {
  confirme: Total;
  soft: Total;
  interet: Total;
  /** Confirmés + soft-commits. Les intérêts indicatifs n'y entrent JAMAIS. */
  securise: number;
}

/**
 * La ventilation que `raises.montant_engage` ne pouvait pas porter.
 *
 * Un total unique ne se scinde pas après coup : une fois que « 200 M » est
 * saisi, rien ne dit ce qui est signé et ce qui tient sur une conversation.
 * D'où les lignes — et d'où cette fonction, qui les recompose sans jamais
 * mélanger les deux natures.
 */
export function ventilation(
  engagements: readonly Engagement[],
): Ventilation {
  const total = (cle: NiveauEngagement): Total => {
    const lignes = engagements.filter((e) => e.niveau === cle);
    return {
      montant: lignes.reduce((somme, e) => somme + e.montant, 0),
      investisseurs: lignes.length,
    };
  };

  const confirme = total("confirme");
  const soft = total("soft_commit");

  return {
    confirme,
    soft,
    interet: total("interet"),
    securise: confirme.montant + soft.montant,
  };
}

/** Ce qu'il reste à trouver. Jamais négatif : dépasser sa cible n'est pas un manque. */
export function restant(cible: number | null, securise: number): number {
  return Math.max(0, (cible ?? 0) - securise);
}

/**
 * Une ligne du journal des requalifications — écran 44.
 *
 * `avant` est absent à la première déclaration : on n'écrit pas « aucun
 * niveau requalifié en soft-commit », on écrit « soft-commit enregistré ».
 */
export interface Requalification {
  id: string;
  investisseur: string;
  avant: { niveau: NiveauEngagement; montant: number } | null;
  apres: { niveau: NiveauEngagement; montant: number };
  preuve: string | null;
  auteur: string | null;
  at: string;
  retire: boolean;
}

const compact = new Intl.NumberFormat("fr-FR", {
  notation: "compact",
  maximumFractionDigits: 1,
});

/** « 120 M », « 1,5 Md » — la forme des phrases d'historique. */
export function montantCourt(valeur: number): string {
  return compact.format(valeur);
}

export function phraseRequalification(ligne: Requalification): string {
  if (ligne.retire) return "engagement retiré";

  const apres = `${niveau(ligne.apres.niveau).label.toLowerCase()} (${montantCourt(ligne.apres.montant)})`;

  if (!ligne.avant) {
    return `${apres.charAt(0).toUpperCase()}${apres.slice(1)} enregistré`;
  }

  const avant = `${niveau(ligne.avant.niveau).label.toLowerCase()} (${montantCourt(ligne.avant.montant)})`;
  return `${avant} requalifié en ${apres}`;
}
