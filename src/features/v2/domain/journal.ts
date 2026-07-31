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
