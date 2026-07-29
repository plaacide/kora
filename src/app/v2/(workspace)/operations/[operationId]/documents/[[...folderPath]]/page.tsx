import { RoutePlaceholder } from "@/features/v2/ui/RoutePlaceholder";

export default function DocumentsPage() {
  return (
    <RoutePlaceholder
      title="Data room"
      purpose="Organiser les pièces de l’opération sans confondre dossiers et exigences."
      contract={[
        "Arborescence restaurable dans l’URL",
        "Dépôt multiple avec progression par pièce",
        "Versions dans le détail de chaque pièce",
        "Visibilité explicite et privée par défaut",
      ]}
    />
  );
}
