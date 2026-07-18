/**
 * « Arcs de résonance » : cercles concentriques en trait fin qui débordent
 * d'un coin, du plus orange au plus blanc en s'éloignant. Décor des panneaux
 * Encre (auth, /bienvenue). Purement décoratif.
 */
export function ResonanceArcs({
  corner = "bottom-right",
  size = 480,
}: {
  corner?: "bottom-right" | "top-left" | "top-right" | "bottom-left";
  size?: number;
}) {
  const pos: React.CSSProperties = { position: "absolute", pointerEvents: "none" };
  const off = -(size / 3);
  if (corner === "bottom-right") Object.assign(pos, { right: off, bottom: off });
  if (corner === "top-left") Object.assign(pos, { left: off, top: off });
  if (corner === "top-right") Object.assign(pos, { right: off, top: off });
  if (corner === "bottom-left") Object.assign(pos, { left: off, bottom: off });

  return (
    <svg
      style={pos}
      width={size}
      height={size}
      viewBox="0 0 480 480"
      fill="none"
      aria-hidden
    >
      <circle cx="240" cy="240" r="80" stroke="rgba(232,92,43,0.22)" strokeWidth="1.5" />
      <circle cx="240" cy="240" r="130" stroke="rgba(232,92,43,0.15)" strokeWidth="1.5" />
      <circle cx="240" cy="240" r="180" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
      <circle cx="240" cy="240" r="232" stroke="rgba(255,255,255,0.05)" strokeWidth="1.5" />
    </svg>
  );
}
