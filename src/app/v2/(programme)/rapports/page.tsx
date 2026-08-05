import { RoutePlaceholder } from "@/features/v2/ui/RoutePlaceholder";
import { Standalone } from "@/features/v2/ui/Shell";

/** Aucun écran du paquet ne maquette les rapports — lot J. */
export default function RapportsPage() {
  return (
    <Standalone search={false} title="Rapports">
      <RoutePlaceholder
        contract={[
          "Aucun des 34 écrans de référence ne montre cet écran.",
          "L’export bailleur en XLSX existe déjà (`/api/portefeuille/export`).",
        ]}
        purpose="L’entrée est dans le rail, l’écran n’est pas encore dessiné."
        title="Rapports"
      />
    </Standalone>
  );
}
