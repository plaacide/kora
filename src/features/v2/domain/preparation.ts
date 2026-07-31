/**
 * La préparation — logique pure des exigences (écrans 11 et 12).
 *
 * Ce fichier remplace une liste de types écrits pendant la phase maquette que
 * personne n'importait : huit domaines, trois niveaux, six états. La base n'en
 * porte aucun. L'écart est réel et vaut d'être nommé plutôt que peint :
 *
 *   · Trois niveaux (Requis / Recommandé / Optionnel) — `checklist_items` n'a
 *     pas de colonne de niveau ; toutes les exigences du référentiel sont au
 *     même rang.
 *   · Six états — `checklist_status` en compte trois : `todo`, `in_progress`,
 *     `done`. « À actualiser », « Non applicable », « En vérification »
 *     n'existent nulle part.
 *   · Huit domaines — la base en connaît trois (`ohada`, `financier`, `dfi`),
 *     qui tiennent d'ailleurs plus du financeur que du domaine.
 *   · Une juridiction par exigence — rien ne la porte.
 *
 * Afficher ces états reviendrait à peindre des choses que rien ne peut faire
 * changer. On travaille donc sur ce que la base sait ; les manques sont dans
 * la boussole, à trancher avec le fondateur.
 */

/** Les trois catégories du référentiel, dites en français. */
const DOMAINES: Record<string, string> = {
  ohada: "Société et conformité OHADA",
  financier: "Finance et comptabilité",
  dfi: "Bailleurs et institutions",
};

export function domaineLabel(categorie: string): string {
  return DOMAINES[categorie] ?? categorie;
}

/** Le tag de provenance affiché sur chaque exigence. */
const SOURCES: Record<string, string> = {
  ohada: "OHADA",
  financier: "Financier",
  dfi: "DFI",
};

export function sourceLabel(categorie: string): string {
  return SOURCES[categorie] ?? categorie;
}

export type StatutExigence = "todo" | "in_progress" | "done";

const STATUTS: Record<StatutExigence, { label: string; tone: string }> = {
  todo: { label: "À préparer", tone: "neutral" },
  in_progress: { label: "En cours", tone: "blue" },
  done: { label: "Prête", tone: "green" },
};

export function statutLabel(statut: string): { label: string; tone: string } {
  return STATUTS[statut as StatutExigence] ?? STATUTS.todo;
}

export interface ExigenceBrute {
  id: string;
  category: string;
  label: string;
  description: string;
  status: string;
  position: number;
  folderId: string | null;
  folderName: string | null;
  /** Nombre de pièces rattachées — la preuve, pas l'intention. */
  proofs: number;
}

export interface GroupeExigences {
  category: string;
  name: string;
  items: ExigenceBrute[];
  ready: number;
}

/** Regroupe par domaine, dans l'ordre du référentiel. */
export function grouper(exigences: readonly ExigenceBrute[]): GroupeExigences[] {
  const ordre = ["ohada", "financier", "dfi"];
  const groupes = new Map<string, ExigenceBrute[]>();

  for (const exigence of exigences) {
    const liste = groupes.get(exigence.category);
    if (liste) liste.push(exigence);
    else groupes.set(exigence.category, [exigence]);
  }

  const rang = (categorie: string) => {
    const index = ordre.indexOf(categorie);
    return index === -1 ? ordre.length : index;
  };

  return [...groupes.entries()]
    .sort(([a], [b]) => rang(a) - rang(b))
    .map(([category, items]) => ({
      category,
      name: domaineLabel(category),
      items: [...items].sort((a, b) => a.position - b.position),
      ready: items.filter((item) => item.status === "done").length,
    }));
}

/** Les filtres que la base sait honorer, et ce qu'ils retiennent. */
export type FiltreExigences = "toutes" | "a-traiter" | "en-cours" | "pretes";

export function correspondAuFiltre(
  statut: string,
  filtre: FiltreExigences,
): boolean {
  if (filtre === "toutes") return true;
  if (filtre === "a-traiter") return statut === "todo";
  if (filtre === "en-cours") return statut === "in_progress";
  return statut === "done";
}

export interface Compte {
  pretes: number;
  enCours: number;
  aFournir: number;
}

export function compter(exigences: readonly ExigenceBrute[]): Compte {
  return {
    pretes: exigences.filter((item) => item.status === "done").length,
    enCours: exigences.filter((item) => item.status === "in_progress").length,
    aFournir: exigences.filter((item) => item.status === "todo").length,
  };
}

/**
 * Le geste proposé sur une exigence.
 *
 * Il suit la PREUVE, pas le statut : une exigence marquée « en cours » sans
 * pièce se traite en déposant, une exigence qui en a une se relit.
 */
export function actionLabel(exigence: ExigenceBrute): string {
  if (exigence.proofs > 0) return "Voir la pièce";
  return exigence.folderId ? "Déposer une pièce" : "Associer une pièce";
}
