/**
 * Le format du journal, partout pareil.
 *
 * Trois écrans affichent une chronologie — les versions d'une pièce, les
 * gestes sur une exigence, l'activité de l'accueil — et chacun l'écrivait à sa
 * façon : une date collée au nom, un e-mail brut en guise d'auteur, un nom de
 * fichier de soixante caractères qui poussait la ligne hors du panneau.
 *
 * La maquette 12 donne la forme : `12-05-2026 · Amara Diallo a remplacé la
 * pièce (v2)`. Une date courte, un point médian, une personne, un fait.
 */

/** « 12-05-2026 » — la forme du journal, plus dense que « 12 mai 2026 ». */
export function dateJournal(valeur: string): string {
  const d = new Date(valeur);
  const jj = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${jj}-${mm}-${d.getFullYear()}`;
}

/**
 * Raccourcit un nom de fichier trop long, en gardant son extension.
 *
 * L'extension porte le type de la pièce : la couper laisserait « Attestation
 * de régularité soci… » sans dire si c'est un PDF ou un tableur. On rogne
 * donc le milieu du nom, jamais la fin.
 */
export function nomCourt(nom: string, max = 32): string {
  if (nom.length <= max) return nom;

  const point = nom.lastIndexOf(".");
  // Un point trop en amont n'est pas une extension mais un nom à points.
  const extension = point > 0 && nom.length - point <= 6 ? nom.slice(point) : "";
  const base = extension ? nom.slice(0, point) : nom;

  // La moitié du budget, puis l'ellipse et l'extension.
  const garde = Math.max(8, Math.floor((max - extension.length) / 2));
  return `${base.slice(0, garde).trimEnd()}…${extension}`;
}

/**
 * Le nom d'une personne à partir de ce que le journal a retenu.
 *
 * `audit_log` ne garde que l'adresse. Sans profil correspondant — un compte
 * supprimé, un invité jamais inscrit — on affiche la partie avant l'arobase
 * plutôt que l'adresse entière : elle déborde et n'apprend rien de plus.
 */
export function nomActeur(email: string | null, nom?: string | null): string {
  if (nom && nom.trim()) return nom.trim();
  if (!email) return "—";
  return email.split("@")[0] ?? email;
}

/**
 * Les familles du journal — les onglets de la maquette 30.
 *
 * « Questions » n'y est pas : il n'existe aucune fonctionnalité de questions
 * dans le produit, donc aucune action à filtrer. Un onglet qui ne ramène
 * jamais rien fait douter du journal entier.
 */
export type FamilleJournal =
  | "tout"
  | "consultations"
  | "telechargements"
  | "acces"
  | "depots"
  | "preparation";

export const FAMILLES: Array<[FamilleJournal, string]> = [
  ["tout", "Tout"],
  ["consultations", "Consultations"],
  ["telechargements", "Téléchargements"],
  ["acces", "NDA et accès"],
  ["depots", "Dépôts et versions"],
  ["preparation", "Préparation"],
];

const FAMILLE_PAR_ACTION: Record<string, FamilleJournal> = {
  "document.page_viewed": "consultations",
  "document.downloaded": "telechargements",
  "document.uploaded": "depots",
  "document.version_added": "depots",
  "document.version_restored": "depots",
  "document.hidden": "depots",
  "document.unhidden": "depots",
  "invitation.created": "acces",
  "invitation.accepted": "acces",
  "invitation.revoked": "acces",
  "nda.signed": "acces",
};

export function familleDe(action: string): FamilleJournal | null {
  const connue = FAMILLE_PAR_ACTION[action];
  if (connue) return connue;
  return action.startsWith("checklist.") ? "preparation" : null;
}

/**
 * Le verbe d'une action, au passé composé.
 *
 * Une action inconnue rend son propre nom plutôt que d'être masquée : un
 * journal d'audit qui cache ce qu'il ne sait pas nommer n'est plus une preuve.
 */
const VERBES: Record<string, string> = {
  "document.page_viewed": "a consulté",
  "document.downloaded": "a téléchargé",
  "document.uploaded": "a déposé",
  "document.version_added": "a déposé une nouvelle version de",
  "document.version_restored": "a restauré",
  "document.hidden": "a masqué",
  "document.unhidden": "a rendu visible",
  "checklist.document_linked": "a rattaché",
  "checklist.document_unlinked": "a retiré",
  "checklist.document_suggested": "s’est vu proposer",
  "checklist.suggestion_dismissed": "a écarté",
  "checklist.status_changed": "a changé le statut de",
  "checklist.item_added": "a ajouté l’exigence",
  "checklist.template_applied": "a posé le référentiel",
  "dataroom.template_applied": "a créé l’arborescence",
  "invitation.created": "a créé un accès pour",
  "invitation.accepted": "a rejoint la data room",
  "invitation.revoked": "a révoqué l’accès de",
  "nda.signed": "a signé l’accord de confidentialité",
  "deal.created": "a créé l’opération",
  "raise.opened": "a ouvert la levée",
  "raise.updated": "a mis à jour la levée",
};

export function verbeDe(action: string): string {
  return VERBES[action] ?? action;
}

export interface EntreeJournal {
  id: number;
  actor: string;
  /** « Équipe » ou « Invité » — dérivé du rôle dans l'organisation. */
  role: string;
  action: string;
  cible: string;
  at: string;
}

export interface JourneeJournal {
  titre: string;
  entrees: EntreeJournal[];
}

/** « Aujourd'hui — 28 juillet 2026 », puis « Hier », puis la date seule. */
export function titreDuJour(valeur: string, maintenant: Date): string {
  const jour = new Date(valeur);
  const longue = jour.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const memeJour = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (memeJour(jour, maintenant)) return `Aujourd’hui — ${longue}`;

  const hier = new Date(maintenant.getTime() - 86_400_000);
  if (memeJour(jour, hier)) return `Hier — ${longue}`;

  return longue;
}

/**
 * Regroupe le journal par journée, du plus récent au plus ancien.
 *
 * Les entrées arrivent déjà triées : on ne retrie pas, on coupe. Retrier
 * risquerait de changer l'ordre à l'intérieur d'une seconde, et dans un
 * journal d'audit l'ordre EST l'information.
 */
export function grouperParJour(
  entrees: readonly EntreeJournal[],
  maintenant: Date,
): JourneeJournal[] {
  const journees: JourneeJournal[] = [];

  for (const entree of entrees) {
    const titre = titreDuJour(entree.at, maintenant);
    const derniere = journees.at(-1);

    if (derniere && derniere.titre === titre) derniere.entrees.push(entree);
    else journees.push({ titre, entrees: [entree] });
  }

  return journees;
}

/** « 14:12 » — l'heure seule, la date étant portée par le groupe. */
export function heure(valeur: string): string {
  return new Date(valeur).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
