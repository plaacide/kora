/**
 * Les règles du portefeuille — écrans 06 et 07.
 *
 * ADR-004 les place ICI et non en base : ce sont des règles produit, elles se
 * testent sans base. La fonction `sae_portfolio()` rend des FAITS ; ce module
 * en tire ce que l'écran affiche.
 *
 * Ce fichier ne contient que ce que les écrans DÉFINISSENT. Les segments
 * « Décrochent » et « Nouvelles » n'y sont pas : les maquettes les affichent
 * sans jamais dire ce qui les déclenche, et une règle inventée serait pire
 * qu'une règle absente — elle aurait l'air d'une donnée.
 */

/** Une ligne de `sae_portfolio()` — une OPÉRATION, pas une entreprise. */
export interface LignePortefeuille {
  startupOrg: string;
  startupName: string;
  dealId: string;
  amount: number | null;
  currency: string | null;
  readiness: number | null;
}

/**
 * Le seuil de « Prête », et le seul que le paquet chiffre.
 *
 * Écran 07, sous l'indicateur : « préparation ≥ 75 % ».
 */
export const SEUIL_PRETE = 75;

export function estPrete(preparation: number | null): boolean {
  return preparation !== null && preparation >= SEUIL_PRETE;
}

/**
 * Le nombre d'ENTREPRISES, qui n'est pas le nombre de lignes.
 *
 * `sae_portfolio()` rend une ligne par opération, et la V2 promet qu'une
 * entreprise peut en mener plusieurs — c'est même ce que dit son rail. Compter
 * les lignes afficherait donc « 18 entreprises » là où il y en a 14.
 */
export function nombreEntreprises(lignes: readonly LignePortefeuille[]): number {
  return new Set(lignes.map((l) => l.startupOrg)).size;
}

/** Les entreprises dont AU MOINS une opération a atteint le seuil. */
export function nombrePretes(lignes: readonly LignePortefeuille[]): number {
  const pretes = new Set<string>();
  for (const l of lignes) if (estPrete(l.readiness)) pretes.add(l.startupOrg);
  return pretes.size;
}

/**
 * La préparation moyenne, sur les opérations qui en ont une.
 *
 * Une opération sans préparation est ÉCARTÉE, pas comptée pour zéro : une
 * entreprise qui vient d'arriver ferait chuter la moyenne de tout le
 * portefeuille, et le programme lirait un recul là où il y a une arrivée.
 *
 * Rend `null` quand rien n'est mesurable — l'écran n'affiche alors pas
 * l'indicateur, plutôt que d'écrire « 0 % ».
 */
export function preparationMoyenne(
  lignes: readonly LignePortefeuille[],
): number | null {
  const mesurees = lignes
    .map((l) => l.readiness)
    .filter((r): r is number => r !== null);
  if (mesurees.length === 0) return null;
  return Math.round(mesurees.reduce((a, b) => a + b, 0) / mesurees.length);
}

/**
 * L'écart de préparation en POINTS, pas en pourcentage.
 *
 * L'écran dit « +6 pts sur 30 jours ». Passer de 52 à 58, c'est +6 points et
 * +11,5 % — deux nombres justes qui ne veulent pas dire la même chose. Le
 * paquet a choisi les points.
 */
export function tendance(
  actuelle: number | null,
  anterieure: number | null,
): number | null {
  if (actuelle === null || anterieure === null) return null;
  return actuelle - anterieure;
}

/** Un volume recherché, dans UNE devise. */
export interface VolumeParDevise {
  devise: string;
  montant: number;
  operations: number;
}

/**
 * Les montants recherchés, GROUPÉS PAR DEVISE et jamais additionnés entre
 * elles.
 *
 * La maquette affiche « 3,4 M€ » pour tout le portefeuille. Or rien dans ce
 * produit ne convertit une devise en une autre : aucun taux, nulle part. Une
 * somme de XOF et d'EUR affichée en euros serait un chiffre faux ayant l'air
 * d'un chiffre. On rend donc une ligne par devise, à l'écran de décider
 * comment les présenter.
 *
 * Trié par montant décroissant : la devise dominante en premier.
 */
export function volumeRecherche(
  lignes: readonly LignePortefeuille[],
): readonly VolumeParDevise[] {
  const parDevise = new Map<string, VolumeParDevise>();

  for (const l of lignes) {
    if (l.amount === null || l.amount <= 0) continue;
    const devise = l.currency?.trim() || "—";
    const vu = parDevise.get(devise);
    if (vu) {
      vu.montant += l.amount;
      vu.operations += 1;
    } else {
      parDevise.set(devise, { devise, montant: l.amount, operations: 1 });
    }
  }

  return [...parDevise.values()].sort(
    (a, b) => b.montant - a.montant || a.devise.localeCompare(b.devise),
  );
}
