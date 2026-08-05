import { RoutePlaceholder } from "@/features/v2/ui/RoutePlaceholder";

/** Écran 03 — vue d'ensemble d'une cohorte, lot B. */
export default function CohortePage() {
  return (
    <RoutePlaceholder
      contract={[
        "État vide (écran 03) : inviter par e-mail ou importer une liste.",
        "Rien n’apparaît avant qu’une entreprise ait accepté l’invitation.",
        "Le programme voit l’avancement, jamais les pièces.",
      ]}
      purpose="Ce que la cohorte a produit, et ce qui l’attend."
      title="Vue d’ensemble"
    />
  );
}
