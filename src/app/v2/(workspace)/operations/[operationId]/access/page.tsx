import { RoutePlaceholder } from "@/features/v2/ui/RoutePlaceholder";

export default function AccessPage() {
  return (
    <RoutePlaceholder
      title="Partage et accès"
      purpose="Créer, prévisualiser, suivre et révoquer des accès externes précis."
      contract={[
        "Assistant en quatre étapes",
        "Périmètre de dossiers et exceptions par pièce",
        "NDA, filigrane, téléchargement et expiration",
        "Prévisualisation exacte avant envoi",
      ]}
    />
  );
}
