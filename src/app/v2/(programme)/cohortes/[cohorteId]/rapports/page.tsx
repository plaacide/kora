import { RoutePlaceholder } from "@/features/v2/ui/RoutePlaceholder";

/** Aucun écran du paquet ne maquette les rapports — lot J. */
export default function CohorteRapportsPage() {
  return (
    <RoutePlaceholder
      contract={[
        "Aucun des 34 écrans de référence ne montre cet écran.",
        "L’export bailleur en XLSX existe déjà et pourra s’y brancher.",
      ]}
      purpose="L’entrée est dans la navigation, l’écran n’est pas encore dessiné."
      title="Rapports"
    />
  );
}
