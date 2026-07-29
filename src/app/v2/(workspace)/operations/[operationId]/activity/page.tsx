import { RoutePlaceholder } from "@/features/v2/ui/RoutePlaceholder";

export default function ActivityPage() {
  return (
    <RoutePlaceholder
      title="Activité"
      purpose="Retracer les événements documentaires utiles au suivi et à l’audit."
      contract={[
        "Personne et organisation authentifiées",
        "Action, cible et horodatage",
        "Historique conservé après révocation",
        "Séparation du journal de sécurité",
      ]}
    />
  );
}
