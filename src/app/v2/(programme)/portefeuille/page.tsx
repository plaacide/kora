import { RoutePlaceholder } from "@/features/v2/ui/RoutePlaceholder";
import { Standalone } from "@/features/v2/ui/Shell";

/** Écrans 06 et 07 — lot C. */
export default function PortefeuillePage() {
  return (
    <Standalone search={false} title="Portefeuille">
      <RoutePlaceholder
        contract={[
          "État vide (écran 06) : aucun indicateur à zéro n’est affiché.",
          "État rempli (écran 07) : quatre indicateurs, trois priorités au plus.",
          "Répond à « qui dois-je contacter aujourd’hui ? ».",
        ]}
        purpose="Toutes cohortes confondues, ce qui avance et ce qui décroche."
        title="Portefeuille"
      />
    </Standalone>
  );
}
