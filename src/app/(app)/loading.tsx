/**
 * Chargement de route : le « a » de Sanza qui respire, ses échos orange
 * décalés derrière la lettre.
 *
 * Le dessin vient de `SanzaLogo` (variante `markOnly`) et non d'une copie
 * locale. La copie qui vivait ici avait déjà dérivé — elle peignait ses deux
 * échos de DEUX couleurs différentes alors que la marque n'en a qu'une.
 * C'est exactement ce que le contrôle « aucune reproduction inline » vise.
 */
import { ResonanceArcs } from "@/components/brand/ResonanceArcs";
import { SanzaLogo } from "@/components/ui/SanzaLogo";

export default function Loading() {
  return (
    <div className="relative overflow-hidden flex items-center justify-center min-h-[60vh]">
      {/* Écran de chargement : 1 jeu d'arcs, bas-droit, 480 (handoff v2 §4). */}
      <ResonanceArcs corner="bottom-right" size={480} tone="light" />
      <span className="relative" role="status" aria-label="Chargement">
        <SanzaLogo size={84} animate markOnly />
      </span>
    </div>
  );
}
