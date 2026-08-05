import { RoutePlaceholder } from "@/features/v2/ui/RoutePlaceholder";
import { Standalone } from "@/features/v2/ui/Shell";

/** Les demandes d'accès des investisseurs — écran 33 côté programme, lot I. */
export default function DemandesPage() {
  return (
    <Standalone search={false} title="Demandes">
      <RoutePlaceholder
        contract={[
          "Chaque demande passe par le programme, puis par l’entreprise.",
          "La décision finale appartient à l’entreprise, sauf mandat explicite.",
        ]}
        purpose="Les demandes d’accès aux data rooms, venues des Dealrooms."
        title="Demandes"
      />
    </Standalone>
  );
}
