/**
 * Le graphique de l'accueil (maquettes 73 et 74).
 *
 * Les coordonnées sont calculées ici plutôt que dans le composant : c'est de
 * l'arithmétique pure, et une courbe fausse ne se voit pas à la relecture du
 * JSX. La géométrie reprend celle de la maquette — viewBox 1020×240, axe des
 * abscisses à y=204, sommet à y=20.
 */

export const CHART_LEFT = 72;
export const CHART_RIGHT = 1006;
export const CHART_TOP = 20;
export const CHART_BASELINE = 204;

/** Cinq graduations, comme la maquette : le maximum, trois quarts, puis zéro. */
const TICK_COUNT = 5;

export interface ChartPoint {
  x: number;
  y: number;
  value: number;
  day: string;
}

export interface ChartGeometry {
  points: ChartPoint[];
  /** `points` prêt à poser dans l'attribut `points` d'une `<polyline>`. */
  polyline: string;
  ticks: Array<{ y: number; label: string }>;
  max: number;
}

/**
 * Plafond lisible de l'axe vertical.
 *
 * Un maximum brut donnerait des graduations comme « 11, 8.25, 5.5 ». On monte
 * donc au multiple de quatre supérieur — quatre parce que l'axe a quatre
 * intervalles. Une série vide garde un axe gradué jusqu'à 4 : un graphique
 * sans repère aurait l'air cassé plutôt que vide.
 */
export function chartCeiling(values: readonly number[]): number {
  const highest = Math.max(0, ...values);
  if (highest === 0) return 4;
  return Math.ceil(highest / 4) * 4;
}

export function chartGeometry(
  series: ReadonlyArray<{ day: string; value: number }>,
): ChartGeometry {
  const max = chartCeiling(series.map((entry) => entry.value));
  const height = CHART_BASELINE - CHART_TOP;
  const step =
    series.length > 1 ? (CHART_RIGHT - CHART_LEFT) / (series.length - 1) : 0;

  const points = series.map((entry, index) => ({
    x: Math.round((CHART_LEFT + index * step) * 10) / 10,
    y:
      Math.round((CHART_BASELINE - (entry.value / max) * height) * 10) / 10,
    value: entry.value,
    day: entry.day,
  }));

  const ticks = Array.from({ length: TICK_COUNT }, (_, index) => {
    const share = index / (TICK_COUNT - 1);
    return {
      y: Math.round(CHART_TOP + share * height),
      label: String(Math.round(max - share * max)),
    };
  });

  return {
    points,
    polyline: points.map((point) => `${point.x},${point.y}`).join(" "),
    ticks,
    max,
  };
}

/**
 * Les dates portées sous l'axe.
 *
 * Trente étiquettes se chevaucheraient : la maquette en montre sept, réparties.
 */
export function chartLabels(
  points: readonly ChartPoint[],
  wanted = 7,
): Array<{ x: number; label: string }> {
  if (points.length === 0) return [];
  if (points.length <= wanted) {
    return points.map((point) => ({ x: point.x, label: point.day }));
  }

  const stride = (points.length - 1) / (wanted - 1);
  return Array.from({ length: wanted }, (_, index) => {
    const point = points[Math.round(index * stride)];
    return { x: point.x, label: point.day };
  });
}

/** « 24 min », « 1 h 05 » — jamais « 0 min » pour une lecture qui a eu lieu. */
export function readingTime(totalMs: number): string {
  const minutes = Math.round(totalMs / 60000);
  if (minutes < 1) return "moins d’une minute";
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${String(rest).padStart(2, "0")}`;
}

/**
 * Ce que `perm_level` autorise, dit en clair.
 *
 * « watermark » ne veut rien dire pour un fondateur ; ce qui compte est ce
 * que la personne peut faire du document, pas le nom technique du niveau.
 */
const LEVEL_LABELS: Record<string, string> = {
  none: "Aucun accès",
  watermark: "Lecture filigranée",
  view: "Lecture",
  download: "Téléchargement",
  edit: "Modification",
};

export function accessLevelLabel(level: string): string {
  return LEVEL_LABELS[level] ?? level;
}

const STATUS_LABELS: Record<string, { label: string; tone: string }> = {
  sent: { label: "Invitation envoyée", tone: "blue" },
  accepted: { label: "Actif", tone: "green" },
  expired: { label: "Expiré", tone: "neutral" },
  revoked: { label: "Révoqué", tone: "red" },
};

export function invitationStatusLabel(
  status: string,
  expiresAt: string | null,
  now: Date = new Date(),
): { label: string; tone: string } {
  // Une invitation acceptée dont l'échéance est passée n'ouvre plus rien : la
  // base garde `accepted`, mais l'afficher tel quel ferait croire à un accès
  // encore vivant.
  if (expiresAt && new Date(expiresAt) < now) {
    return STATUS_LABELS.expired;
  }
  return STATUS_LABELS[status] ?? { label: status, tone: "neutral" };
}

/** Deux lettres pour la pastille : « Amina Diallo » → « AD ». */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "—";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
