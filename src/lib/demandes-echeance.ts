/**
 * L'échéance d'une demande d'accès (§5 des règles du persona programme).
 *
 * Module NEUTRE (cf. AGENTS.md) : lu par l'écran du programme comme par la
 * fiche vitrine de l'investisseur, côté serveur comme côté client.
 *
 * L'EXPIRATION EST CALCULÉE, PAS BALAYÉE. Une demande périmée reste `pending`
 * en base — il n'y a pas d'ordonnanceur sur cette installation, et en
 * fabriquer un pour changer un statut serait disproportionné. Son échéance
 * suffit à la dire périmée. La même règle vit dans
 * `public.access_request_deadline()`, et les deux DOIVENT dire la même chose :
 * l'écran informe, la base refuse. Changer l'un sans l'autre produit un bouton
 * qui échoue, ou pire, un bouton qui marche là où l'écran dit non.
 */

/** Délai au-delà duquel une demande sans réponse est périmée. */
export const JOURS_AVANT_EXPIRATION = 30;

const MS_PAR_JOUR = 1000 * 60 * 60 * 24;

/**
 * Jours restants avant péremption. Négatif une fois l'échéance passée.
 *
 * Isolé ici comme les autres lectures d'horloge du dépôt : `Date.now()`
 * pendant un rendu viole `react-hooks/purity`.
 */
export function joursAvantPeremption(
  creeLe: string,
  relanceeLe: string | null,
): number {
  const depart = new Date(relanceeLe ?? creeLe).getTime();
  const echeance = depart + JOURS_AVANT_EXPIRATION * MS_PAR_JOUR;
  return Math.ceil((echeance - new Date().getTime()) / MS_PAR_JOUR);
}

/**
 * L'état RÉEL d'une demande, statut et échéance confondus.
 *
 * Le statut seul ment : une demande de trois mois est toujours `pending` en
 * base. Tout ce qui affiche une demande doit passer par ici, sinon la moitié
 * des écrans dira « en attente » quand l'autre dira « expirée ».
 *
 *  · `expiree`  — sans réponse et hors délai ; plus personne ne décide ;
 *  · `bientot`  — sans réponse, moins d'une semaine restante ;
 *  · `enAttente`— sans réponse, dans les temps ;
 *  · `tranchee` — une décision a été prise ; l'échéance ne la concerne plus.
 */
export type EtatDemande = "expiree" | "bientot" | "enAttente" | "tranchee";

/** En deçà, on prévient : une file qu'on découvre périmée est une file perdue. */
export const JOURS_ALERTE = 7;

export function etatDemande(
  statut: string,
  creeLe: string,
  relanceeLe: string | null,
): EtatDemande {
  if (statut !== "pending") return "tranchee";
  const jours = joursAvantPeremption(creeLe, relanceeLe);
  if (jours <= 0) return "expiree";
  if (jours <= JOURS_ALERTE) return "bientot";
  return "enAttente";
}

/** Une seule relance, et elle est consommée dès que la date existe. */
export function relancable(statut: string, relanceeLe: string | null): boolean {
  return statut === "pending" && relanceeLe === null;
}
