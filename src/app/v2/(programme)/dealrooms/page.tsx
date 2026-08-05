import { RoutePlaceholder } from "@/features/v2/ui/RoutePlaceholder";
import { Standalone } from "@/features/v2/ui/Shell";

/** Écrans 18 à 28 — lots G et H. */
export default function DealroomsPage() {
  return (
    <Standalone search={false} title="Dealrooms">
      <RoutePlaceholder
        contract={[
          "État vide (écran 18), puis quatre statuts : brouillon, prête à publier, publiée, archivée.",
          "Une Dealroom est privée, sur invitation, et peut réunir plusieurs cohortes.",
          "Aucun document n’y est publié.",
        ]}
        purpose="Les espaces privés où le programme présente une sélection d’entreprises."
        title="Dealrooms"
      />
    </Standalone>
  );
}
