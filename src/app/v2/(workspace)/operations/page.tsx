import { RoutePlaceholder } from "@/features/v2/ui/RoutePlaceholder";

export default function OperationsPage() {
  return (
    <RoutePlaceholder
      title="Opérations"
      purpose="Retrouver les opérations actives et archivées avant d’entrer dans leur contexte."
      contract={[
        "Liste filtrable des opérations",
        "État privé, partagé, clôturé ou archivé",
        "Création d’une nouvelle opération",
        "Retour conservant filtres et position",
      ]}
    />
  );
}
