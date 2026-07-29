import { RoutePlaceholder } from "@/features/v2/ui/RoutePlaceholder";

export default function OnboardingResultPage() {
  return (
    <RoutePlaceholder
      title="Plan de préparation prêt"
      purpose="Présenter la première valeur créée et conduire vers une pièce prioritaire."
      contract={[
        "Opération et juridiction appliquée",
        "Exigences requises et recommandées",
        "Espace privé créé en brouillon",
        "Action vers les pièces prioritaires",
      ]}
    />
  );
}
