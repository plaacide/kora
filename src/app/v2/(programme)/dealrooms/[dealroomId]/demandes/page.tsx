import { RoutePlaceholder } from "@/features/v2/ui/RoutePlaceholder";

/** Entrée de la navigation de Dealroom que le paquet ne dessine pas. */
export default function Page() {
  return (
    <RoutePlaceholder
      contract={[
        "L’entrée est dans la navigation de la Dealroom.",
        "Aucun des 38 écrans de référence ne montre cet écran.",
      ]}
      purpose="Écran non maquetté."
      title="Demandes"
    />
  );
}
