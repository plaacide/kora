import { RoutePlaceholder } from "@/features/v2/ui/RoutePlaceholder";

export default function OperationOnboardingPage() {
  return (
    <RoutePlaceholder
      title="Objectif de financement"
      purpose="Comprendre ce que le fondateur prépare avant de générer son plan."
      contract={[
        "Capital, dette bancaire, DFI ou subvention, diligence reçue",
        "Option indécise avec plan de base modifiable",
        "Aucun partage automatique",
      ]}
    />
  );
}
