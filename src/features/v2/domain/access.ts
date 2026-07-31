/**
 * Les accès, en logique pure — ni base ni réseau, testable seul.
 *
 * Ce fichier remplace une liste de types écrits pendant la phase maquette
 * (huit états d'accès, des identifiants de dossiers visibles par accès) que
 * personne n'importait et que la base ne sait pas soutenir. Deux de ces états
 * n'existent nulle part : `draft` — une invitation n'est écrite qu'à la
 * dernière étape de l'assistant, il n'y a pas de brouillon en base — et
 * `email_verified`, que rien n'enregistre séparément.
 */

export interface NoeudDossier {
  id: string;
  parentId: string | null;
}

export interface Perimetre {
  folders: number;
  documents: number;
}

/**
 * Les dossiers réellement atteignables depuis un ensemble de droits.
 *
 * Un droit accordé sur un dossier vaut pour tout ce qu'il contient :
 * `effective_permission` remonte l'arborescence et s'arrête à la règle la plus
 * spécifique. Compter les seuls dossiers explicitement accordés mentirait donc
 * par défaut — « 1 dossier » pour un droit qui en ouvre onze.
 *
 * Un cycle en base — impossible en théorie, pas après une migration ratée — ne
 * fait pas boucler : un dossier déjà vu n'est pas revisité.
 */
export function fermetureDescendante(
  folders: readonly NoeudDossier[],
  accordes: readonly string[],
): Set<string> {
  const enfants = new Map<string, string[]>();
  for (const folder of folders) {
    if (!folder.parentId) continue;
    const liste = enfants.get(folder.parentId);
    if (liste) liste.push(folder.id);
    else enfants.set(folder.parentId, [folder.id]);
  }

  const connus = new Set(folders.map((folder) => folder.id));
  const atteints = new Set<string>();
  const file = accordes.filter((id) => connus.has(id));

  while (file.length > 0) {
    const id = file.pop() as string;
    if (atteints.has(id)) continue;
    atteints.add(id);
    for (const enfant of enfants.get(id) ?? []) file.push(enfant);
  }

  return atteints;
}

/** Ce que l'invité verra : dossiers atteints, pièces qu'ils contiennent. */
export function perimetre(
  folders: readonly NoeudDossier[],
  documentsParDossier: ReadonlyMap<string, number>,
  accordes: readonly string[],
): Perimetre {
  const atteints = fermetureDescendante(folders, accordes);

  let documents = 0;
  for (const id of atteints) documents += documentsParDossier.get(id) ?? 0;

  return { folders: atteints.size, documents };
}

/** « 6 dossiers · 25 pièces », ou un tiret quand plus rien n'est ouvert. */
export function perimetreLabel(valeur: Perimetre): string {
  if (valeur.folders === 0) return "—";
  const dossiers = `${valeur.folders} dossier${valeur.folders > 1 ? "s" : ""}`;
  const pieces = `${valeur.documents} pièce${valeur.documents > 1 ? "s" : ""}`;
  return `${dossiers} · ${pieces}`;
}

/**
 * L'état d'un accès, tel qu'il faut le dire au fondateur.
 *
 * La base ne connaît que quatre statuts. « Expiré » et « Expire bientôt » n'en
 * sont pas : ils se déduisent de l'échéance. Une invitation acceptée dont la
 * date est passée n'ouvre plus rien — l'afficher « active » ferait croire à un
 * accès vivant.
 */
export type EtatAcces =
  | "revoked"
  | "expired"
  | "expiring"
  | "active"
  | "nda_pending"
  | "sent";

/** Une échéance dans moins de sept jours mérite d'être signalée. */
export const JOURS_AVANT_ALERTE = 7;

export function etatAcces(
  status: string,
  expiresAt: string | null,
  maintenant: Date,
): EtatAcces {
  if (status === "revoked") return "revoked";

  if (expiresAt) {
    const restant = new Date(expiresAt).getTime() - maintenant.getTime();
    if (restant <= 0) return "expired";
    if (status === "accepted" && restant <= JOURS_AVANT_ALERTE * 86_400_000) {
      return "expiring";
    }
  }

  if (status === "accepted") return "active";
  if (status === "nda_pending") return "nda_pending";
  return "sent";
}

const LIBELLES: Record<EtatAcces, { label: string; tone: string }> = {
  revoked: { label: "Révoqué", tone: "red" },
  expired: { label: "Expiré", tone: "neutral" },
  expiring: { label: "Expire bientôt", tone: "amber" },
  active: { label: "Accès actif", tone: "green" },
  nda_pending: { label: "NDA en attente", tone: "blue" },
  sent: { label: "Invitation envoyée", tone: "neutral" },
};

export function etatLabel(etat: EtatAcces): { label: string; tone: string } {
  return LIBELLES[etat];
}

/** Les quatre onglets de la maquette 24, posés sur les états ci-dessus. */
export type FiltreAcces = "tous" | "actifs" | "attente" | "clos";

export function correspondAuFiltre(etat: EtatAcces, filtre: FiltreAcces): boolean {
  if (filtre === "tous") return true;
  if (filtre === "actifs") return etat === "active" || etat === "expiring";
  if (filtre === "attente") return etat === "nda_pending" || etat === "sent";
  return etat === "expired" || etat === "revoked";
}
