/**
 * Les règles d'une Dealroom — écrans 18 à 28.
 *
 * Le quatrième statut n'est PAS en base. `dealroom_status` ne connaît que
 * `brouillon`, `publiee` et `archivee` ; « prête à publier » se déduit. Le
 * stocker créerait deux sources qui finiraient par se contredire — et c'est
 * toujours celle qui s'affiche qui a l'air d'avoir raison.
 */

export type StatutStocke = "brouillon" | "publiee" | "archivee";
export type StatutAffiche =
  | "Brouillon"
  | "Prête à publier"
  | "Publiée"
  | "Archivée";

export interface FaitsDealroom {
  statut: StatutStocke | string;
  entreprises: number;
  /** Combien d'entreprises n'ont PAS encore donné leur accord. */
  enAttente: number;
}

/**
 * Le statut tel que l'écran le nomme.
 *
 * UN BROUILLON VIDE N'EST PAS PRÊT. Sans cette condition, une Dealroom qu'on
 * vient de créer s'annoncerait « prête à publier » — zéro entreprise, donc
 * zéro accord manquant. Publier une Dealroom vide ne dit rien à personne.
 */
export function statutAffiche(faits: FaitsDealroom): StatutAffiche {
  if (faits.statut === "archivee") return "Archivée";
  if (faits.statut === "publiee") return "Publiée";
  if (faits.entreprises > 0 && faits.enAttente === 0) return "Prête à publier";
  return "Brouillon";
}

const TONS: Record<StatutAffiche, string | undefined> = {
  Archivée: undefined,
  Brouillon: undefined,
  "Prête à publier": "blue",
  Publiée: "green",
};

export function tonStatut(statut: StatutAffiche): string | undefined {
  return TONS[statut];
}

/**
 * Ce qui empêche de publier, dit à l'entreprise près.
 *
 * L'écran 22 promet que « Publier » reste désactivé tant que des accords
 * manquent, ET qu'il dit pourquoi. Un bouton grisé sans raison est une
 * impasse : le programme ne sait pas qui relancer.
 */
export function blocagePublication(faits: FaitsDealroom): string | null {
  if (faits.statut !== "brouillon") return null;
  if (faits.entreprises === 0) {
    return "Ajoutez au moins une entreprise avant de publier.";
  }
  if (faits.enAttente > 0) {
    return faits.enAttente === 1
      ? "Une entreprise n’a pas encore donné son accord."
      : `${faits.enAttente} entreprises n’ont pas encore donné leur accord.`;
  }
  return null;
}

/** L'accord d'une entreprise, tel que l'écran 26 le nomme. */
export function libelleAccord(statut: string): { texte: string; ton?: string } {
  switch (statut) {
    case "accorde":
      return { texte: "Accordé", ton: "green" };
    case "refuse":
      return { texte: "Refusé", ton: "red" };
    case "retire":
      // RETIRÉ N'EST PAS REFUSÉ. Un accord retiré a existé, et l'entreprise
      // figurait peut-être déjà dans une page publique. Les confondre
      // effacerait ce qui s'est passé.
      return { texte: "Retiré", ton: "red" };
    default:
      return { texte: "En attente", ton: "amber" };
  }
}
