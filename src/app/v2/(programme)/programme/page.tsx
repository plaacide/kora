import { RoutePlaceholder } from "@/features/v2/ui/RoutePlaceholder";
import { Standalone } from "@/features/v2/ui/Shell";

/**
 * L'accueil du programme.
 *
 * Le rail des maquettes le porte en première position, et aucun des 34 écrans
 * ne le dessine. L'entrée existe donc, et dit ce qu'elle attend plutôt que de
 * mener nulle part.
 */
export default function AccueilProgrammePage() {
  return (
    <Standalone search={false} title="Accueil">
      <RoutePlaceholder
        contract={[
          "Aucun des 34 écrans de référence ne montre cet écran.",
          "Le portefeuille répond déjà à « qui dois-je contacter aujourd’hui ? ».",
        ]}
        purpose="L’entrée est en tête du rail, l’écran n’est pas encore dessiné."
        title="Accueil"
      />
    </Standalone>
  );
}
