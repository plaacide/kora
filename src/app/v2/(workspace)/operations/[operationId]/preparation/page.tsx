import { RoutePlaceholder } from "@/features/v2/ui/RoutePlaceholder";

export default function PreparationPage() {
  return (
    <RoutePlaceholder
      title="Préparation"
      purpose="Présenter les exigences documentaires adaptées au financement et à la juridiction."
      contract={[
        "Regroupement par domaine documentaire",
        "Niveaux requis, recommandé et optionnel",
        "États actionnables sans vocabulaire culpabilisant",
        "Association d’une pièce à plusieurs exigences",
      ]}
    />
  );
}
