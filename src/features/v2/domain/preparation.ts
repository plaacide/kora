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

/**
 * Qui réclame la pièce. Plusieurs par exigence.
 *
 * `ohada` N'EST PAS DANS CETTE LISTE, et c'est le fond du sujet. L'écran
 * l'affichait en pastille à côté de « Banque » et « DFI », présentant un
 * RÉGIME JURIDIQUE comme s'il était un prêteur. L'OHADA ne réclame rien : il
 * s'applique. Il constitue le socle commun aux quatorze pays proposés, et il
 * se dit autrement — voir `SOCLE` et `relevesDuSocle`.
 */
const SOURCES: Record<string, string> = {
  bank: "Banque",
  dfi: "DFI",
  capital: "Capital",
};

/** Le régime juridique commun, distinct de tout financeur. */
export const SOCLE = "ohada";
const SOCLE_LABEL = "Socle OHADA";

export function sourceLabel(source: string): string {
  return source === SOCLE ? SOCLE_LABEL : (SOURCES[source] ?? source);
}

/** Les financeurs seuls — le socle en est retiré. */
export function financeurs(sources: readonly string[]): string[] {
  return sources.filter((s) => s !== SOCLE);
}

/** L'exigence découle-t-elle du socle juridique commun ? */
export function relevesDuSocle(sources: readonly string[]): boolean {
  return sources.includes(SOCLE);
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

/**
 * Les cinq filtres de la maquette 11.
 *
 * Ils ne portent pas tous sur la même chose, et c'est voulu : « Requises »
 * filtre un NIVEAU, « À actualiser » un état déduit, les trois autres un
 * statut. C'est ainsi qu'on cherche dans un dossier — « qu'est-ce qui bloque »
 * n'est pas la même question que « où j'en suis ».
 *
 * Absent : « Par juridiction », que la maquette pose à côté. Rien en base ne
 * porte de juridiction, et un filtre qui ne filtre rien est pire qu'un filtre
 * manquant : il fait croire qu'on a cherché.
 */
export type FiltreExigences =
  | "toutes"
  | "a-traiter"
  | "requises"
  | "a-actualiser"
  | "pretes";

export const FILTRES: Array<[FiltreExigences, string]> = [
  ["toutes", "Toutes"],
  ["a-traiter", "À traiter"],
  ["requises", "Requises"],
  ["a-actualiser", "À actualiser"],
  ["pretes", "Prêtes"],
];

export function correspondAuFiltre(
  exigence: ExigenceBrute,
  filtre: FiltreExigences,
  maintenant: Date,
): boolean {
  const perimee = estAActualiser(exigence, maintenant);

  if (filtre === "toutes") return true;
  if (filtre === "requises") return exigence.level === "required";
  if (filtre === "a-actualiser") return perimee;
  // Une pièce périmée n'est plus prête : elle est justement à retraiter.
  if (filtre === "pretes") return exigence.status === "done" && !perimee;

  // « À traiter » : tout ce qui demande encore un geste. Le non-applicable
  // n'en demande aucun, il sort.
  return (
    exigence.status !== "not_applicable" &&
    (exigence.status !== "done" || perimee)
  );
}

/** Filtre par financeur — celui qui réclame la pièce. */
export function correspondAuFinanceur(
  exigence: ExigenceBrute,
  source: string,
): boolean {
  return source === "" || exigence.sources.includes(source);
}

/**
 * L'état d'UNE pièce rattachée.
 *
 * Une exigence peut porter trois exercices dont un seul a vieilli : afficher
 * le seul état de l'exigence obligerait à ouvrir chaque fichier pour trouver
 * lequel refaire.
 */
export function etatPiece(
  exigence: Pick<ExigenceBrute, "freshnessDays">,
  piece: { confirmed: boolean; linkedAt: string },
  maintenant: Date = new Date(),
): { label: string; tone: string } {
  if (!piece.confirmed) return { label: "À confirmer", tone: "blue" };

  if (exigence.freshnessDays) {
    const age = maintenant.getTime() - new Date(piece.linkedAt).getTime();
    if (age > exigence.freshnessDays * 86_400_000) {
      return { label: "À actualiser", tone: "amber" };
    }
  }

  return { label: "Prête", tone: "green" };
}

export interface Compte {
  pretes: number;
  aFournir: number;
  aActualiser: number;
}

/**
 * Les exigences REQUISES — celles que les compteurs mesurent.
 *
 * Les maquettes 09 et 11 affichent « 18 prêtes · 4 à fournir · 2 à
 * actualiser » à côté de « 18 sur 24 exigences requises » : 18 + 4 + 2 = 24.
 * Les trois chiffres portent donc sur le requis seul, et les recommandées sont
 * comptées à part (« 9/13 »).
 *
 * C'est juste : le recommandé n'empêche pas un closing, le mélanger au requis
 * ferait paraître un dossier plus en retard qu'il n'est.
 */
export function requises(
  exigences: readonly ExigenceBrute[],
): ExigenceBrute[] {
  return exigences.filter((item) => item.level === "required");
}

/**
 * Les trois chiffres de la maquette : prêtes, à fournir, à actualiser.
 *
 * Les trois catégories s'excluent, et leur somme est le nombre d'exigences
 * DUES : le non-applicable n'entre nulle part, sinon le total dépasserait ce
 * qu'on a réellement à faire.
 */
export function compter(
  exigences: readonly ExigenceBrute[],
  maintenant: Date,
): Compte {
  let pretes = 0;
  let aFournir = 0;
  let aActualiser = 0;

  for (const item of exigences) {
    if (item.status === "not_applicable") continue;

    if (estAActualiser(item, maintenant)) aActualiser += 1;
    else if (item.status === "done") pretes += 1;
    else aFournir += 1;
  }

  return { pretes, aFournir, aActualiser };
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

/**
 * Les pièces à rattacher, groupées par dossier.
 *
 * Une liste déroulante de vingt-quatre fichiers à plat oblige à connaître le
 * nom exact de ce qu'on cherche. Groupée par dossier, elle se parcourt comme
 * la data room elle-même — on retrouve une pièce par l'endroit où on l'a
 * rangée, ce qui est justement pourquoi on l'a rangée.
 *
 * Le chemin complet sert d'intitulé (« Financier / Exercice 2025 ») : deux
 * sous-dossiers homonymes sous des parents différents ne se confondent pas,
 * et la profondeur se lit sans indentation.
 */
export interface DossierArbre {
  id: string;
  name: string;
  parentId: string | null;
  indexPath: string;
}

export interface PieceRattachable {
  id: string;
  name: string;
  folderId: string | null;
}

export interface GroupePieces {
  /** Chemin lisible du dossier, ou « Racine » pour les pièces non rangées. */
  chemin: string;
  pieces: PieceRattachable[];
}

/** « Financier / Exercice 2025 » — remonté depuis le dossier vers la racine. */
export function cheminDossier(
  dossiers: ReadonlyMap<string, DossierArbre>,
  id: string,
): string {
  const noms: string[] = [];
  let courant = dossiers.get(id);
  let garde = 0;

  // Un cycle en base — impossible en théorie — ne doit pas figer l'écran.
  while (courant && garde < 20) {
    noms.unshift(courant.name);
    courant = courant.parentId ? dossiers.get(courant.parentId) : undefined;
    garde += 1;
  }

  return noms.join(" / ");
}

export function grouperParDossier(
  dossiers: readonly DossierArbre[],
  pieces: readonly PieceRattachable[],
): GroupePieces[] {
  const parId = new Map(dossiers.map((dossier) => [dossier.id, dossier]));

  const groupes = new Map<string, PieceRattachable[]>();
  const racine: PieceRattachable[] = [];

  for (const piece of pieces) {
    if (!piece.folderId || !parId.has(piece.folderId)) {
      racine.push(piece);
      continue;
    }
    const liste = groupes.get(piece.folderId);
    if (liste) liste.push(piece);
    else groupes.set(piece.folderId, [piece]);
  }

  // L'ordre de la data room, pas l'alphabet : `index_path` porte déjà la
  // numérotation que le fondateur voit dans son arborescence.
  const ordonnes = [...groupes.entries()].sort(([a], [b]) =>
    (parId.get(a)?.indexPath ?? "").localeCompare(
      parId.get(b)?.indexPath ?? "",
      undefined,
      { numeric: true },
    ),
  );

  const resultat: GroupePieces[] = ordonnes.map(([id, liste]) => ({
    chemin: cheminDossier(parId, id),
    pieces: [...liste].sort((a, b) => a.name.localeCompare(b.name)),
  }));

  // La racine en dernier : ces pièces ne se partagent pas, elles sont
  // l'exception plutôt que le rangement normal.
  if (racine.length > 0) {
    resultat.push({
      chemin: "Racine — non rangées",
      pieces: [...racine].sort((a, b) => a.name.localeCompare(b.name)),
    });
  }

  return resultat;
}

/**
 * La prochaine action — le cœur de la vue d'ensemble (écrans 08, 09, 10).
 *
 * Un fondateur qui ouvre son opération ne veut pas un tableau de bord, il veut
 * savoir quoi faire maintenant. Cette fonction répond à cette question à
 * partir de ce que la base sait, et rien d'autre.
 *
 * L'ORDRE des cas est une décision produit, pas un détail :
 *
 *   · une pièce PÉRIMÉE passe avant une pièce manquante. Contre-intuitif —
 *     elle semble faite — mais c'est justement le piège : elle est comptée
 *     prête, personne ne la regarde, et un investisseur la découvre. Et la
 *     réparer coûte un geste là où fournir une pièce absente coûte des jours.
 *     C'est aussi l'ordre que la maquette 09 retient.
 *   · une exigence REQUISE avant une recommandée : c'est ce qui bloque un
 *     closing.
 *   · une suggestion à confirmer en dernier des gestes documentaires : elle ne
 *     manque à personne, elle attend un clic.
 */
export type ProchaineAction =
  | { type: "referentiel" }
  | { type: "actualiser"; exigence: ExigenceBrute }
  | { type: "deposer"; exigence: ExigenceBrute }
  | { type: "confirmer"; exigence: ExigenceBrute }
  | { type: "partager" }
  | { type: "rien" };

export function prochaineAction(
  exigences: readonly ExigenceBrute[],
  accesActifs: number,
  maintenant: Date,
): ProchaineAction {
  if (exigences.length === 0) return { type: "referentiel" };

  const perimee = exigences.find((item) => estAActualiser(item, maintenant));
  if (perimee) return { type: "actualiser", exigence: perimee };

  const due = (item: ExigenceBrute) =>
    item.status !== "done" && item.status !== "not_applicable";

  const requise = exigences.find((item) => due(item) && item.level === "required");
  if (requise) return { type: "deposer", exigence: requise };

  const aConfirmer = exigences.find(
    (item) => item.pending > 0 && item.proofs === 0,
  );
  if (aConfirmer) return { type: "confirmer", exigence: aConfirmer };

  // Tout le requis est prêt. Une data room complète que personne ne voit
  // n'a servi à rien : le geste suivant est de la partager.
  if (accesActifs === 0) return { type: "partager" };

  const recommandee = exigences.find(
    (item) => due(item) && item.level === "recommended",
  );
  if (recommandee) return { type: "deposer", exigence: recommandee };

  return { type: "rien" };
}

/** Ce que la vue d'ensemble écrit dans son encadré. */
export function texteProchaineAction(action: ProchaineAction): {
  titre: string;
  explication: string;
} {
  switch (action.type) {
    case "referentiel":
      return {
        titre: "Poser votre plan de préparation",
        explication:
          "Le référentiel OHADA pose vingt-deux exigences réparties en huit domaines, chacune rattachée au dossier où sa pièce se dépose. Vous pourrez en ajouter et en retirer.",
      };
    case "actualiser":
      return {
        titre: `Mettre à jour « ${action.exigence.label} »`,
        explication: `La pièce fournie a dépassé sa durée de validité${
          action.exigence.expectedPeriod
            ? ` (${action.exigence.expectedPeriod.toLowerCase()})`
            : ""
        }. Elle compte encore comme prête, et c'est ce qui la rend risquée : personne ne la regarde plus.`,
      };
    case "deposer":
      return {
        titre: `Déposer « ${action.exigence.label} »`,
        explication: `${
          action.exigence.level === "required" ? "Exigence requise" : "Exigence recommandée"
        } du domaine ${domaineLabel(action.exigence.domain)}${
          // Le socle s'applique, il ne réclame pas : la tournure change avec lui.
          relevesDuSocle(action.exigence.sources) ? ", relevant du socle OHADA" : ""
        }${
          financeurs(action.exigence.sources).length
            ? `, réclamée par ${financeurs(action.exigence.sources).map(sourceLabel).join(" et ")}`
            : ""
        }. ${action.exigence.description}`,
      };
    case "confirmer":
      return {
        titre: `Confirmer l'association de « ${action.exigence.label} »`,
        explication:
          "Sanza a proposé une pièce pour cette exigence. Tant qu'elle n'est pas confirmée, elle ne compte pas comme fournie — c'est vous qui validez, jamais la machine.",
      };
    case "partager":
      return {
        titre: "Partager votre data room",
        explication:
          "Toutes les exigences requises sont prêtes et personne n'y a encore accès. Un accès est nominatif, daté, et son activité est journalisée.",
      };
    default:
      return {
        titre: "Rien ne bloque",
        explication:
          "Les exigences requises sont prêtes et votre data room est partagée. Suivez l'activité de vos invités pour savoir quand relancer.",
      };
  }
}

/**
 * Ce sur quoi le plan a réellement été construit.
 *
 * POURQUOI CE N'EST PAS UNE SIMPLE LISTE DES RÉPONSES. Annoncer « basé sur
 * votre pays » à quelqu'un dont le pays n'a rien changé serait la neuvième
 * fausse promesse du produit, après les huit retirées le 1er août. Le serveur
 * ne remonte donc que les axes ayant EFFECTIVEMENT produit une variante sur ce
 * plan — le reste n'est pas mentionné.
 *
 * Le socle OHADA figure toujours : il s'applique aux quatorze pays proposés,
 * et c'est vrai de toute opération.
 */
export interface BaseDuPlan {
  formeJuridique: string | null;
  pays: string | null;
  stade: string | null;
}

export function baseSur(base: BaseDuPlan): string[] {
  const lignes = ["le socle juridique OHADA"];
  if (base.formeJuridique) lignes.push(`votre forme juridique — ${base.formeJuridique}`);
  if (base.pays) lignes.push(`votre pays d’immatriculation — ${base.pays}`);
  if (base.stade) lignes.push(`votre stade — ${base.stade}`);
  return lignes;
}
