/**
 * La préparation — logique pure des exigences (écrans 11 et 12).
 *
 * Deux axes, décidés avec le fondateur le 1er août 2026 : le DOMAINE range,
 * les SOURCES étiquettent. `category` confondait les deux — « financier » ne
 * dit pas de quoi parle la pièce, il dit qui la réclame — et, étant unique,
 * forçait à choisir entre une banque et un bailleur.
 *
 * Quatre états sont stockés. Deux autres, montrés par la maquette 11, se
 * déduisent ou n'existent pas :
 *
 *   · « À actualiser » se calcule (`estAActualiser`) : rien à maintenir à la
 *     main, donc rien à oublier de maintenir.
 *   · « En vérification » n'a aucun geste dans le produit. Tant que personne
 *     ne vérifie, l'afficher serait peindre un état que rien ne fait bouger.
 */

/** Les huit domaines, dans l'ordre où le dossier se construit. */
export const DOMAINES = [
  ["company_registration", "Société et immatriculation"],
  ["governance_and_ownership", "Gouvernance et actionnariat"],
  ["finance_and_accounting", "Finance et comptabilité"],
  ["tax", "Fiscalité"],
  ["commercial_and_market", "Commercial et marché"],
  ["team_and_people", "Équipe et RH"],
  ["technology_and_ip", "Technologie et PI"],
  ["impact_esg", "Impact et ESG"],
] as const;

const NOMS_DOMAINE = new Map<string, string>(DOMAINES);

export function domaineLabel(domaine: string): string {
  return NOMS_DOMAINE.get(domaine) ?? domaine;
}

/** Qui réclame la pièce. Plusieurs par exigence. */
const SOURCES: Record<string, string> = {
  ohada: "OHADA",
  bank: "Banque",
  dfi: "DFI",
  capital: "Capital",
};

export function sourceLabel(source: string): string {
  return SOURCES[source] ?? source;
}

/** Requis, Recommandé, Optionnel — ce qui décide de l'ordre de traitement. */
const NIVEAUX: Record<string, string> = {
  required: "Requis",
  recommended: "Recommandé",
  optional: "Optionnel",
};

export function niveauLabel(niveau: string): string {
  return NIVEAUX[niveau] ?? niveau;
}

export type StatutExigence =
  | "todo"
  | "in_progress"
  | "done"
  | "not_applicable";

const STATUTS: Record<StatutExigence, { label: string; tone: string }> = {
  todo: { label: "À préparer", tone: "neutral" },
  in_progress: { label: "En cours", tone: "blue" },
  done: { label: "Prête", tone: "green" },
  not_applicable: { label: "Non applicable", tone: "neutral" },
};

export function statutLabel(statut: string): { label: string; tone: string } {
  return STATUTS[statut as StatutExigence] ?? STATUTS.todo;
}

/**
 * « À actualiser » — une exigence prête dont la preuve a vieilli.
 *
 * `freshness_days` vient du référentiel : « Extrait RCCM de moins de 3 mois »
 * portait déjà cette règle dans son intitulé, sans que rien ne sache la lire.
 * Une exigence qui n'a pas de durée de validité ne périme jamais.
 */
export function estAActualiser(
  exigence: Pick<ExigenceBrute, "status" | "freshnessDays" | "lastProofAt">,
  maintenant: Date,
): boolean {
  if (exigence.status !== "done") return false;
  if (!exigence.freshnessDays || !exigence.lastProofAt) return false;

  const age = maintenant.getTime() - new Date(exigence.lastProofAt).getTime();
  return age > exigence.freshnessDays * 86_400_000;
}

/**
 * L'état affiché : le statut stocké, sauf si quelque chose le dépasse.
 *
 * Deux états ne sont pas stockés parce qu'ils se calculent — et se calculer,
 * c'est ne jamais devenir faux faute d'entretien :
 *
 *   · une suggestion en attente appelle un geste, elle passe devant ;
 *   · une preuve périmée n'est plus une preuve.
 */
export function etatAffiche(
  exigence: ExigenceBrute,
  maintenant: Date,
): { label: string; tone: string } {
  if (exigence.pending > 0 && exigence.proofs === 0) {
    return { label: "Pièce à confirmer", tone: "blue" };
  }
  if (estAActualiser(exigence, maintenant)) {
    return { label: "À actualiser", tone: "amber" };
  }
  return statutLabel(exigence.status);
}

export interface ExigenceBrute {
  id: string;
  domain: string;
  level: string;
  sources: string[];
  label: string;
  description: string;
  status: string;
  position: number;
  folderId: string | null;
  folderName: string | null;
  /** Durée de validité de la preuve, en jours. `null` = ne périme pas. */
  freshnessDays: number | null;
  expectedPeriod: string | null;
  acceptedFormats: string | null;
  /** Date de la preuve la plus récente — c'est elle qui vieillit. */
  lastProofAt: string | null;
  /** Preuves CONFIRMÉES — celles qui comptent pour le statut. */
  proofs: number;
  /** Suggestions en attente de confirmation. Une suggestion n'est pas une
   *  preuve : elle ne rend pas l'exigence prête, elle appelle un geste. */
  pending: number;
}

export interface GroupeExigences {
  domain: string;
  name: string;
  items: ExigenceBrute[];
  ready: number;
  /** Dénominateur de « x sur y prêtes » : le non-applicable n'est pas dû. */
  due: number;
}

/** Regroupe par domaine, dans l'ordre où le dossier se construit. */
export function grouper(exigences: readonly ExigenceBrute[]): GroupeExigences[] {
  const ordre = DOMAINES.map(([valeur]) => valeur as string);
  const groupes = new Map<string, ExigenceBrute[]>();

  for (const exigence of exigences) {
    const liste = groupes.get(exigence.domain);
    if (liste) liste.push(exigence);
    else groupes.set(exigence.domain, [exigence]);
  }

  const rang = (domaine: string) => {
    const index = ordre.indexOf(domaine);
    return index === -1 ? ordre.length : index;
  };

  const poidsNiveau = (niveau: string) =>
    niveau === "required" ? 0 : niveau === "recommended" ? 1 : 2;

  return [...groupes.entries()]
    .sort(([a], [b]) => rang(a) - rang(b))
    .map(([domain, items]) => ({
      domain,
      name: domaineLabel(domain),
      // Le requis d'abord : c'est ce qui bloque un closing, pas l'optionnel.
      items: [...items].sort(
        (a, b) =>
          poidsNiveau(a.level) - poidsNiveau(b.level) || a.position - b.position,
      ),
      ready: items.filter((item) => item.status === "done").length,
      due: items.filter((item) => item.status !== "not_applicable").length,
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
  if (exigence.pending > 0 && exigence.proofs === 0) return "Confirmer";
  if (exigence.proofs > 0) return "Voir la pièce";
  return exigence.folderId ? "Déposer une pièce" : "Associer une pièce";
}
