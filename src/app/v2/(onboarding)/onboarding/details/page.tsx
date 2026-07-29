import { RoutePlaceholder } from "@/features/v2/ui/RoutePlaceholder";

export default function OperationDetailsOnboardingPage() {
  return (
    <RoutePlaceholder
      title="Détails de l’opération"
      purpose="Poser uniquement les questions utiles au type de financement choisi."
      contract={[
        "Questions conditionnelles par type d’opération",
        "Champs non indispensables reportables",
        "Import futur d’une liste de pièces reçue",
      ]}
    />
  );
}
