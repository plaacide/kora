/**
 * Les règles d'une cohorte et de ses invitations.
 *
 * Pures : ni Next, ni Supabase, ni date « maintenant » implicite — l'instant
 * est un paramètre, sans quoi ces règles seraient intestables et changeraient
 * de résultat entre le serveur et le navigateur.
 */

export type StatutInvitation =
  | "Envoyée"
  | "Lien ouvert"
  | "À relancer"
  | "Expirée"
  | "Acceptée";

/** Une invitation expire après 30 jours — écran 04, pied de tableau. */
export const JOURS_AVANT_EXPIRATION = 30;

/** Au-delà, une invitation sans réponse mérite une relance — écran 04. */
export const JOURS_AVANT_RELANCE = 14;

export interface InvitationBrute {
  status: "pending" | "accepted" | "revoked";
  createdAt: string;
  openedAt: string | null;
  acceptedAt: string | null;
}

function jours(depuis: string, maintenant: Date): number {
  const ecart = maintenant.getTime() - new Date(depuis).getTime();
  return Math.floor(ecart / 86_400_000);
}

/**
 * L'état d'une invitation, tel que l'écran 04 le nomme.
 *
 * L'ORDRE COMPTE. « Lien ouvert » passe avant « à relancer » : quelqu'un qui a
 * ouvert le lien sans aller au bout n'est pas quelqu'un qui n'a pas répondu —
 * c'est même, dit l'écran, l'invitation la plus prometteuse de la liste. Les
 * confondre ferait relancer par e-mail celui qu'il fallait appeler.
 */
export function statutInvitation(
  invitation: InvitationBrute,
  maintenant: Date,
): StatutInvitation {
  if (invitation.status === "accepted") return "Acceptée";

  const age = jours(invitation.createdAt, maintenant);
  if (age >= JOURS_AVANT_EXPIRATION) return "Expirée";
  if (invitation.openedAt) return "Lien ouvert";
  if (age >= JOURS_AVANT_RELANCE) return "À relancer";
  return "Envoyée";
}

/** Le ton du badge, dans le vocabulaire du thème. */
export function tonStatut(
  statut: StatutInvitation,
): "blue" | "neutral" | "amber" | "red" | "green" {
  if (statut === "Lien ouvert") return "blue";
  if (statut === "À relancer") return "amber";
  if (statut === "Expirée") return "red";
  if (statut === "Acceptée") return "green";
  return "neutral";
}

const MOIS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

/**
 * « mars → décembre 2026 » pour le panneau, « mars — décembre 2026 » en liste.
 *
 * L'ANNÉE N'EST ÉCRITE QU'UNE FOIS quand les deux bornes la partagent :
 * « mars 2026 — décembre 2026 » se lit deux fois plus lentement pour la même
 * information.
 */
export function periode(
  debut: string | null,
  fin: string | null,
  separateur: "→" | "—" = "→",
): string {
  if (!debut && !fin) return "période non renseignée";

  const dire = (date: string) => {
    const [annee, mois] = date.split("-");
    return { mois: MOIS[Number(mois) - 1] ?? "", annee };
  };

  if (debut && fin) {
    const d = dire(debut);
    const f = dire(fin);
    return d.annee === f.annee
      ? `${d.mois} ${separateur} ${f.mois} ${f.annee}`
      : `${d.mois} ${d.annee} ${separateur} ${f.mois} ${f.annee}`;
  }

  const seule = dire((debut ?? fin) as string);
  return `${debut ? "à partir de" : "jusqu’en"} ${seule.mois} ${seule.annee}`;
}

/**
 * L'effectif, tel que les écrans 03 et 05 l'écrivent.
 *
 * Deux formulations, et ce n'est pas un caprice : une cohorte vide n'a rien à
 * dire de ses entreprises, seulement de ses places restantes. Une cohorte
 * peuplée, l'inverse — le nombre de places n'intéresse plus personne.
 */
export function effectif(entreprises: number, places: number): string {
  return entreprises === 0
    ? `0 / ${places} places`
    : `${entreprises} entreprise${entreprises > 1 ? "s" : ""}`;
}
