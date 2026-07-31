/**
 * Le pipeline investisseur — écrans 38 à 40, en logique pure.
 *
 * DIVERGENCE À CONNAÎTRE. `raise_investors.statut` mélange trois axes :
 * une ÉTAPE de relation (`invite`, `diligence`), un ENGAGEMENT
 * (`soft_commit`, `engage`) et une ISSUE (`refuse`). Les maquettes 38 et 39
 * les séparent : sept colonnes d'étape, plus une colonne « Engagement »
 * distincte.
 *
 * On travaille sur les six valeurs réelles plutôt que d'en peindre sept, et
 * l'écart est écrit dans la boussole. Les scinder demanderait de décider ce
 * qu'un investisseur « en diligence qui a soft-committé » doit afficher — une
 * question produit, pas technique.
 */

export const ETAPES = [
  ["invite", "À contacter"],
  ["nda", "NDA signé"],
  ["soft_commit", "Soft-commit"],
  ["diligence", "Diligence"],
  ["engage", "Engagé"],
  ["refuse", "Écarté"],
] as const;

export type EtapePipeline = (typeof ETAPES)[number][0];

const NOMS = new Map<string, string>(ETAPES);

export function etapeLabel(statut: string): string {
  return NOMS.get(statut) ?? statut;
}

/** La couleur d'une étape. « Écarté » n'est pas un échec, c'est une réponse. */
export function etapeTon(statut: string): string {
  if (statut === "engage") return "green";
  if (statut === "soft_commit") return "orange";
  if (statut === "diligence" || statut === "nda") return "blue";
  if (statut === "refuse") return "neutral";
  return "neutral";
}

export interface InvestisseurPipeline {
  id: string;
  nom: string;
  organisation: string | null;
  email: string | null;
  ticket: number | null;
  statut: string;
  /**
   * État de l'accès documentaire, DÉDUIT des invitations par l'adresse.
   * `null` quand l'investisseur n'a pas d'adresse, ou aucune invitation.
   */
  acces: string | null;
}

export interface ColonnePipeline {
  statut: string;
  nom: string;
  investisseurs: InvestisseurPipeline[];
  /** Somme des tickets — indicative, jamais un engagement. */
  ticket: number;
}

/**
 * Répartit le pipeline en colonnes, dans l'ordre du parcours.
 *
 * Une colonne vide reste affichée : c'est elle qui montre l'étape où il n'y a
 * personne, et donc où il faut aller.
 */
export function colonnes(
  investisseurs: readonly InvestisseurPipeline[],
): ColonnePipeline[] {
  return ETAPES.map(([statut, nom]) => {
    const dedans = investisseurs.filter((item) => item.statut === statut);
    return {
      statut,
      nom,
      investisseurs: dedans,
      ticket: dedans.reduce((somme, item) => somme + (item.ticket ?? 0), 0),
    };
  });
}

/**
 * Les tickets cumulés du pipeline.
 *
 * À ne JAMAIS confondre avec `raises.montant_engage` : la migration qui a créé
 * cette table le dit explicitement. Un ticket est une intention notée à la
 * main, le montant sécurisé est une déclaration du fondateur. Les sommer
 * gonflerait la levée d'espoirs.
 */
export function ticketsCumules(
  investisseurs: readonly InvestisseurPipeline[],
): number {
  return investisseurs.reduce((somme, item) => somme + (item.ticket ?? 0), 0);
}
