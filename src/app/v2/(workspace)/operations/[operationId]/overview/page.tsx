import { RoutePlaceholder } from "@/features/v2/ui/RoutePlaceholder";

export default function OperationOverviewPage() {
  return (
    <RoutePlaceholder
      title="Vue d’ensemble"
      purpose="Donner une prochaine action unique et une lecture factuelle de l’avancement."
      contract={[
        "Prochaine action expliquée",
        "Progression des exigences requises et recommandées",
        "Pièces à actualiser et échéance proche",
        "Activité récente sans déduction d’intention",
      ]}
    />
  );
}
