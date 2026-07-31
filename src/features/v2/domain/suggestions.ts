/**
 * Suggestion d'association pièce ↔ exigence — écran 17.
 *
 * L'appariement se fait UNIQUEMENT contre les exigences du modèle appliqué à
 * l'opération : rien n'est deviné hors de ce référentiel. Le calcul est
 * déterministe et explicable — pour une pièce donnée, on peut dire quels mots
 * ont produit la suggestion. C'est la condition pour qu'un fondateur accepte
 * ou refuse en connaissance de cause, ce que la maquette exige : « rien n'est
 * associé sans validation ».
 *
 * Le principe tient en une idée : un mot rare dans le référentiel vaut plus
 * qu'un mot fréquent. « RCCM » ne désigne qu'une exigence ; « politique » en
 * désigne trois. Sans cette pondération, « Politique RGPD.pdf » s'apparierait
 * à « Politique LBC/FT » sur un mot vide de sens distinctif.
 */

export interface Requirement {
  id: string;
  label: string;
  description?: string;
}

export interface Suggestion {
  requirementId: string;
  label: string;
  /** 0 à 1. Au-delà du seuil seulement, la suggestion est proposée. */
  score: number;
  /** Les mots qui ont produit la correspondance, pour pouvoir l'expliquer. */
  matched: string[];
}

/**
 * Mots trop courants pour distinguer quoi que ce soit.
 *
 * Volontairement court : chaque mot retiré ici est un mot qu'aucune
 * correspondance ne pourra plus utiliser. La pondération par rareté fait déjà
 * le gros du travail — cette liste ne traite que les mots grammaticaux.
 */
const VIDES = new Set([
  "de", "du", "des", "le", "la", "les", "un", "une", "et", "ou", "a", "au",
  "aux", "en", "dans", "pour", "par", "sur", "avec", "sans", "plus", "moins",
  "cours", "jour", "vigueur", "applicable", "applicables", "eventuelles",
  "selon", "toutes", "tout", "toute", "si", "ses", "son", "sa", "leur", "leurs",
  "doc", "document", "fichier", "final", "finale", "copie", "scan", "signe",
  "signee", "version", "vf", "def", "definitif",
  // Qualificatifs dont un fondateur affuble ses fichiers : ils disent l'état
  // de la pièce, jamais sa nature.
  "approuve", "approuvee", "revise", "revisee", "consolide", "consolidee",
  "maj", "mise", "nouveau", "nouvelle", "ancien", "ancienne", "provisoire",
]);

/** « États financiers — 2025 (v2).pdf » → ["etats", "financiers"]. */
export function mots(texte: string): string[] {
  return texte
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    // L'extension et les séparateurs disparaissent ; les sigles avec barre
    // oblique (LBC/FT) sont coupés en deux, ce qui reste distinctif.
    .replace(/\.[a-z0-9]{1,5}$/i, "")
    .split(/[^a-z0-9]+/)
    .filter((mot) => {
      if (mot.length < 2) return false;
      // Les années et numéros de version ne disent rien de la NATURE d'une
      // pièce : « États financiers 2024 » et « États financiers 2025 »
      // satisfont la même exigence.
      if (/^\d+$/.test(mot)) return false;
      if (/^v\d+$/.test(mot)) return false;
      return !VIDES.has(mot);
    });
}

/**
 * En deçà, la piste est trop mince pour valoir la peine d'être montrée.
 *
 * Volontairement bas. Les deux erreurs ne coûtent pas la même chose : une
 * suggestion inutile se refuse d'un clic, tandis qu'une suggestion manquante
 * oblige à chercher soi-même dans une liste de vingt-quatre exigences. Rien ne
 * s'associe sans validation — autant proposer largement.
 */
export const SEUIL = 0.16;

/** Au-delà, on n'aide plus : on noie. */
const MAX_SUGGESTIONS = 3;

/**
 * Rareté d'un mot dans le référentiel — plus il est rare, plus il compte.
 *
 * Un mot présent dans une seule exigence la désigne ; présent dans dix, il ne
 * désigne rien.
 */
function raretes(requirements: readonly Requirement[]): {
  poids: Map<string, number>;
  presence: Map<string, number>;
} {
  const presence = new Map<string, number>();

  for (const requirement of requirements) {
    const uniques = new Set([
      ...mots(requirement.label),
      ...mots(requirement.description ?? ""),
    ]);
    for (const mot of uniques) {
      presence.set(mot, (presence.get(mot) ?? 0) + 1);
    }
  }

  const total = Math.max(1, requirements.length);
  const poids = new Map<string, number>();
  for (const [mot, n] of presence) {
    // Logarithme : la décroissance doit être douce, pas brutale. Un mot dans
    // deux exigences reste utile, il vaut simplement moins qu'un mot unique.
    poids.set(mot, Math.log(1 + total / n));
  }
  return { poids, presence };
}

/**
 * Les exigences que ce nom de fichier pourrait satisfaire, les meilleures
 * d'abord.
 *
 * Rend un tableau vide quand rien ne dépasse le seuil — c'est un résultat
 * valable, et l'écran doit le dire plutôt que de proposer au hasard.
 */
export function suggestForFile(
  fileName: string,
  requirements: readonly Requirement[],
): Suggestion[] {
  const motsFichier = new Set(mots(fileName));
  if (motsFichier.size === 0 || requirements.length === 0) return [];

  const { poids, presence } = raretes(requirements);

  // Un mot que le référentiel ignore pèse CONTRE la correspondance, mais à
  // demi seulement. C'est ce qui empêche « Politique RGPD » de passer pour
  // « Politique LBC/FT » — « rgpd » ne désigne rien ici et tire le score vers
  // le bas.
  //
  // À demi, parce qu'un mot inconnu est le plus souvent du bruit — un nom
  // d'entreprise, une mention interne — et non la preuve que la pièce est
  // étrangère. Au poids plein, « Statuts — société.pdf » était rejeté : le
  // mot « société » suffisait à effacer « statuts ».
  const poidsInconnu = Math.log(1 + requirements.length) / 2;
  const poidsDe = (mot: string) => poids.get(mot) ?? poidsInconnu;

  const totalFichier = [...motsFichier].reduce(
    (somme, mot) => somme + poidsDe(mot),
    0,
  );

  const suggestions = requirements.map((requirement) => {
    const motsLabel = new Set(mots(requirement.label));
    const motsDescription = new Set(mots(requirement.description ?? ""));

    const matched: string[] = [];
    let reconnu = 0;
    let couvertLabel = 0;
    let totalLabel = 0;
    let couvertDescription = 0;
    let totalDescription = 0;

    for (const mot of motsLabel) {
      totalLabel += poidsDe(mot);
      if (motsFichier.has(mot)) {
        couvertLabel += poidsDe(mot);
        reconnu += poidsDe(mot);
        matched.push(mot);
      }
    }

    for (const mot of motsDescription) {
      if (motsLabel.has(mot)) continue;
      totalDescription += poidsDe(mot);
      if (motsFichier.has(mot)) {
        couvertDescription += poidsDe(mot);
        reconnu += poidsDe(mot);
        matched.push(mot);
      }
    }

    // Deux questions, et il faut répondre oui aux deux.
    //
    // `precision` : les mots de ce fichier pointent-ils vers cette exigence,
    // ou parlent-ils surtout d'autre chose ?
    // `couverture` : ce qui a été reconnu désigne-t-il vraiment l'exigence,
    // ou n'est-ce qu'un mot de passage dans son libellé ?
    //
    // Le produit des deux (moyenne géométrique) effondre le score dès que
    // l'une faiblit — une moyenne simple laisserait passer un fichier
    // étranger qui partagerait un seul mot très courant.
    //
    // La pénalité des mots non reconnus est plafonnée à ce qui a été reconnu.
    // Sans ce plafond, « Statuts NIMBA SOLAR SAS 2026.pdf » était rejeté : la
    // raison sociale, que le référentiel ignore forcément, effaçait le seul
    // mot qui comptait. Un fondateur nomme ses fichiers avec le nom de son
    // entreprise — c'est la règle, pas l'exception.
    const inconnu = Math.max(0, totalFichier - reconnu);
    const precision =
      reconnu === 0 ? 0 : reconnu / (reconnu + Math.min(inconnu, reconnu));

    // La description compte pour la couverture, à trois quarts : « Bilan » ne
    // figure que dans la description des états financiers, et c'est pourtant
    // le nom que porte la pièce déposée. L'ignorer rejetait « Bilan 2025.pdf ».
    const couvLabel = totalLabel === 0 ? 0 : couvertLabel / totalLabel;
    const couvDescription =
      totalDescription === 0 ? 0 : couvertDescription / totalDescription;
    const couverture = Math.max(couvLabel, couvDescription * 0.75);

    // Un mot PROPRE à l'exigence pousse la piste devant les autres — « bilan »
    // ne désigne que les états financiers, quand « politique » en désigne
    // plusieurs. Le classement s'en trouve juste ; aucune piste n'est écartée
    // pour autant, c'est au fondateur de trancher.
    const motPropre = matched.some((mot) => (presence.get(mot) ?? 0) === 1);
    const base = precision * Math.sqrt(couverture);

    return {
      requirementId: requirement.id,
      label: requirement.label,
      score: motPropre ? base : base * 0.7,
      matched,
    };
  });

  return suggestions
    .filter((suggestion) => suggestion.score >= SEUIL)
    .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label))
    .slice(0, MAX_SUGGESTIONS);
}

/**
 * Une suggestion par pièce déposée, la meilleure seulement.
 *
 * Une exigence déjà retenue par une pièce mieux notée n'est plus proposée aux
 * suivantes : deux pièces qui se disputent la même exigence produiraient un
 * écran où confirmer l'une invalide l'autre.
 */
export function suggestForBatch(
  fileNames: readonly string[],
  requirements: readonly Requirement[],
): Array<{ fileName: string; suggestion: Suggestion | null }> {
  const classees = fileNames
    .map((fileName) => ({
      fileName,
      candidates: suggestForFile(fileName, requirements),
    }))
    .sort(
      (a, b) => (b.candidates[0]?.score ?? 0) - (a.candidates[0]?.score ?? 0),
    );

  const prises = new Set<string>();
  const resultat = new Map<string, Suggestion | null>();

  for (const { fileName, candidates } of classees) {
    const libre = candidates.find(
      (candidate) => !prises.has(candidate.requirementId),
    );
    if (libre) prises.add(libre.requirementId);
    resultat.set(fileName, libre ?? null);
  }

  // L'ordre de dépôt est celui que le fondateur a sous les yeux : on le rend.
  return fileNames.map((fileName) => ({
    fileName,
    suggestion: resultat.get(fileName) ?? null,
  }));
}
