/**
 * Cercles concentriques du site public — l'écho visuel du logo, en grand.
 *
 * Distinct de `ResonanceArcs` (utilisé par le dashboard) : la maquette du site
 * emploie des rayons, des opacités et des débords précis, que reproduire à
 * l'identique importe plus que de mutualiser un composant approchant.
 */
export function ResonanceRings({
  size = 640,
  radii,
  strokes,
  className,
  style,
}: {
  size?: number;
  radii: number[];
  /** Une couleur de trait par rayon, dans l'ordre. */
  strokes: string[];
  className?: string;
  style?: React.CSSProperties;
}) {
  const c = size / 2;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      aria-hidden
      className={className}
      style={{ position: "absolute", pointerEvents: "none", ...style }}
    >
      {radii.map((r, i) => (
        <circle
          key={r}
          cx={c}
          cy={c}
          r={r}
          stroke={strokes[i] ?? strokes[strokes.length - 1]}
          strokeWidth="1.5"
        />
      ))}
    </svg>
  );
}
