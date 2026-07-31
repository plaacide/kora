/**
 * Le pipeline investisseur — écrans 38 à 40, en logique pure.
 *
 * DEUX AXES, décidés avec le fondateur le 2 août 2026. `statut` mélangeait une
 * ÉTAPE de relation, un ENGAGEMENT et une ISSUE dans une seule colonne : un
 * investisseur en diligence qui avait soft-committé ne pouvait afficher qu'une
 * des deux choses, alors que c'est la phrase même qu'on prononce — « Sahel est
 * en diligence et a soft-committé 300 M ».
 *
 * Le handoff appelle cette distinction « non négociable ». Elle est en base.
 */

export const ETAPES = [
  ["a_cibler", "À cibler"],
  ["contacte", "Contacté"],
  ["premier_echange", "Premier échange"],
  ["interesse", "Intéressé"],
  ["diligence", "Diligence"],
  ["comite", "Comité ou offre"],
  ["engage", "Engagé"],
] as const;

export type EtapePipeline = (typeof ETAPES)[number][0];

const NOMS_ETAPE = new Map<string, string>(ETAPES);

export function etapeLabel(etape: string): string {
  return NOMS_ETAPE.get(etape) ?? etape;
}

export const ENGAGEMENTS = [
  ["aucun", "Aucun"],
  ["interet", "Intérêt indicatif"],
  ["soft_commit", "Soft-commit"],
  ["confirme", "Confirmé"],
  ["retire", "Retiré"],
] as const;

export type EngagementPipeline = (typeof ENGAGEMENTS)[number][0];

const NOMS_ENGAGEMENT = new Map<string, string>(ENGAGEMENTS);

export function engagementLabel(engagement: string): string {
  return NOMS_ENGAGEMENT.get(engagement) ?? engagement;
}

/**
 * La couleur d'un engagement.
 *
 * « Retiré » n'est pas peint en rouge : un investisseur qui dit non fait
 * partie d'un tour normal, et le voir en alerte à chaque ouverture de l'écran
 * ferait lire un échec là où il y a une réponse.
 */
export function engagementTon(engagement: string): string {
  if (engagement === "confirme") return "green";
  if (engagement === "soft_commit") return "orange";
  if (engagement === "interet") return "blue";
  return "neutral";
}

export interface InvestisseurPipeline {
  id: string;
  nom: string;
  organisation: string | null;
  email: string | null;
  ticket: number | null;
  etape: string;
  engagement: string;
  categorie: string | null;
  fonction: string | null;
  pays: string | null;
  source: string | null;
  responsable: string | null;
  prochaineAction: string | null;
  dateRelance: string | null;
  notes: string | null;
  /**
   * État de l'accès documentaire, DÉDUIT des invitations par l'adresse.
   * `null` quand l'investisseur n'a pas d'adresse, ou aucune invitation.
   */
  acces: string | null;
}

export interface ColonnePipeline {
  etape: string;
  nom: string;
  investisseurs: InvestisseurPipeline[];
  /** Somme des tickets — indicative, jamais un engagement. */
  ticket: number;
}

/**
 * Répartit le pipeline en colonnes d'étape, dans l'ordre du parcours.
 *
 * Une colonne vide reste affichée : c'est elle qui montre l'étape où il n'y a
 * personne, et donc où il faut aller.
 *
 * Les retirés restent dans leur colonne, avec leur badge : « en diligence,
 * retiré » se lit, alors que les sortir du tableau effacerait où la relation
 * s'était rendue — ce qu'on veut justement se rappeler au tour suivant.
 */
export function colonnes(
  investisseurs: readonly InvestisseurPipeline[],
): ColonnePipeline[] {
  return ETAPES.map(([etape, nom]) => {
    const dedans = investisseurs.filter((item) => item.etape === etape);
    return {
      etape,
      nom,
      investisseurs: dedans,
      ticket: dedans.reduce((somme, item) => somme + (item.ticket ?? 0), 0),
    };
  });
}

/**
 * Les tickets cumulés du pipeline, hors retirés.
 *
 * À ne JAMAIS confondre avec `raises.montant_engage` : la migration qui a créé
 * cette table le dit explicitement. Un ticket est une intention notée à la
 * main, le montant sécurisé est une déclaration du fondateur. Les sommer
 * gonflerait la levée d'espoirs — et compter les retirés la gonflerait de
 * refus.
 */
export function ticketsCumules(
  investisseurs: readonly InvestisseurPipeline[],
): number {
  return investisseurs
    .filter((item) => item.engagement !== "retire")
    .reduce((somme, item) => somme + (item.ticket ?? 0), 0);
}

/** Les relances dues, la plus urgente d'abord. */
export function relancesDues(
  investisseurs: readonly InvestisseurPipeline[],
  maintenant: Date,
): InvestisseurPipeline[] {
  return investisseurs
    .filter(
      (item) =>
        item.engagement !== "retire" &&
        item.dateRelance != null &&
        new Date(item.dateRelance).getTime() <= maintenant.getTime(),
    )
    .sort((a, b) => (a.dateRelance ?? "").localeCompare(b.dateRelance ?? ""));
}

/**
 * Les fonctions rencontrées chez un investisseur.
 *
 * Liste plutôt que texte libre, pour la même raison que les pays : « Partner »,
 * « Associé », « associé », « Partner @ XYZ » finissent tous en base, et plus
 * rien ne se regroupe. « Autre » existe pour ne pas bloquer quelqu'un dont le
 * titre n'y est pas — un champ fermé sans échappatoire se contourne en
 * mettant n'importe quoi dans le champ d'à côté.
 */
export const FONCTIONS = [
  "Associé / Partner",
  "Directeur d’investissement",
  "Chargé d’investissement",
  "Analyste",
  "Responsable pays",
  "Dirigeant / Fondateur",
  "Conseil / Avocat",
  "Autre",
] as const;

/** Les catégories d'investisseur — le même vocabulaire que l'audience d'une levée. */
export const CATEGORIES = [
  ["vc", "VC ou fonds"],
  ["dfi", "DFI ou fonds à impact"],
  ["banque", "Banque ou prêteur"],
  ["family_office", "Family office"],
  ["corporate", "Corporate"],
  ["autre", "Autre"],
] as const;

const NOMS_CATEGORIE = new Map<string, string>(CATEGORIES);

export function categorieLabel(categorie: string | null): string {
  if (!categorie) return "—";
  return NOMS_CATEGORIE.get(categorie) ?? categorie;
}
