import type { CSSProperties } from "react";

/**
 * Anneaux décoratifs — STATIQUES, opacité très basse (brief : plus de cercles
 * concentriques pulsants de l'ancien site). De simples cercles SVG, sans
 * animation, réservés aux fonds sombres.
 */
export function Rings({
  size = 520,
  style,
  className,
}: {
  size?: number;
  style?: CSSProperties;
  className?: string;
}) {
  const radii = [0.24, 0.4, 0.56, 0.72];
  const c = size / 2;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      style={{ position: "absolute", pointerEvents: "none", ...style }}
      aria-hidden
    >
      {radii.map((r, i) => (
        <circle
          key={r}
          cx={c}
          cy={c}
          r={size * r}
          fill="none"
          stroke={
            i < 2 ? "rgba(232,92,43,0.16)" : "rgba(255,255,255,0.05)"
          }
          strokeWidth={1}
        />
      ))}
    </svg>
  );
}
