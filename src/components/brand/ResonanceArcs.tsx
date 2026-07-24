/**
 * « Arcs de résonance » — l'élément d'identité Sanza, généralisé à toute la
 * plateforme (handoff v2 §4).
 *
 * Cercles concentriques en trait fin qui débordent d'un coin, du plus orange
 * (intérieur) au plus transparent (extérieur). Purement décoratif.
 *
 * Le parent doit porter `position: relative; overflow: hidden`.
 *
 * Règles du handoff, à respecter en appelant ce composant :
 *  - panneaux Encre (auth, bienvenue, hero) : 2 jeux, coins opposés, 520–680 ;
 *  - écrans vides (empty states, 404, chargement) : 1 jeu, bas-droit, 480 ;
 *  - cartes sombres dans une page claire : 1 jeu, 200–260, bas-droit ;
 *  - modales à fond Encre : 1 jeu, 320 ;
 *  - bandeaux d'en-tête sombres : 1 jeu très large, `subtle` (opacités ÷ 2).
 *
 * Interdits : jamais derrière du texte long ou un tableau ; jamais plus de
 * 2 jeux par écran ; jamais de `fill` (trait 1.5px seulement) ; pas d'animation.
 */

type Corner = "bottom-right" | "top-left" | "top-right" | "bottom-left";
type Tone = "dark" | "light";

/** Opacités par ton, de l'anneau intérieur au plus extérieur. */
const STROKES: Record<Tone, [string, string, string, string]> = {
  // Sur Encre : orange qui s'éteint, puis blanc quasi imperceptible.
  dark: [
    "rgba(232,92,43,0.26)",
    "rgba(232,92,43,0.16)",
    "rgba(255,255,255,0.09)",
    "rgba(255,255,255,0.055)",
  ],
  // Sur fond clair (#F4F1EA / #FAF8F4) : orange léger puis encre très diluée.
  // Réservé aux grandes surfaces vides — jamais derrière une liste dense.
  light: [
    "rgba(232,92,43,0.12)",
    "rgba(232,92,43,0.12)",
    "rgba(23,26,44,0.05)",
    "rgba(23,26,44,0.05)",
  ],
};

/** Rayons du tracé de référence (viewBox 560). */
const RADII = [88, 146, 206, 268] as const;

export function ResonanceArcs({
  corner = "bottom-right",
  size = 560,
  tone = "dark",
  subtle = false,
}: {
  corner?: Corner;
  size?: number;
  tone?: Tone;
  /** Bandeaux d'en-tête : mêmes arcs, opacités divisées par deux. */
  subtle?: boolean;
}) {
  const pos: React.CSSProperties = { position: "absolute", pointerEvents: "none" };
  const off = -(size / 3);
  if (corner === "bottom-right") Object.assign(pos, { right: off, bottom: off });
  if (corner === "top-left") Object.assign(pos, { left: off, top: off });
  if (corner === "top-right") Object.assign(pos, { right: off, top: off });
  if (corner === "bottom-left") Object.assign(pos, { left: off, bottom: off });

  const strokes = STROKES[tone];

  return (
    <svg
      style={pos}
      width={size}
      height={size}
      viewBox="0 0 560 560"
      fill="none"
      aria-hidden
    >
      {RADII.map((r, i) => (
        <circle
          key={r}
          cx="280"
          cy="280"
          r={r}
          stroke={strokes[i]}
          strokeWidth="1.5"
          // `subtle` : on divise l'opacité par deux sans dupliquer la palette.
          opacity={subtle ? 0.5 : 1}
        />
      ))}
    </svg>
  );
}
