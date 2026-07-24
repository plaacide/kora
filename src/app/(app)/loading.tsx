/**
 * Chargement de route. Plus de skeleton : juste le « a » de Sanza qui respire,
 * ses deux échos orange décalés derrière la lettre (comme l'icône de marque).
 * L'animation `sz-vib` fait pulser les échos.
 */
import { ResonanceArcs } from "@/components/brand/ResonanceArcs";

export default function Loading() {
  return (
    <div className="relative overflow-hidden flex items-center justify-center min-h-[60vh]">
      {/* Écran de chargement : 1 jeu d'arcs, bas-droit, 480 (handoff v2 §4). */}
      <ResonanceArcs corner="bottom-right" size={480} tone="light" />
      <span
        className="relative inline-block"
        style={{
          fontFamily: "var(--font-instrument), 'Instrument Sans', sans-serif",
          fontWeight: 700,
          fontSize: 84,
          lineHeight: 1,
          letterSpacing: "-0.015em",
        }}
        aria-label="Chargement"
      >
        <span
          aria-hidden
          className="absolute left-[0.52em] top-0"
          style={{ color: "#f08a5e", opacity: 0.3, animation: "sz-vib 2.4s ease-in-out infinite" }}
        >
          a
        </span>
        <span
          aria-hidden
          className="absolute left-[0.26em] top-0"
          style={{ color: "#e85c2b", opacity: 0.55, animation: "sz-vib 2.4s ease-in-out infinite" }}
        >
          a
        </span>
        <span className="relative text-[#171a2c]">a</span>
      </span>
    </div>
  );
}
