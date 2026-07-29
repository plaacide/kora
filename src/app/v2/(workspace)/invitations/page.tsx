import { RoutePlaceholder } from "@/features/v2/ui/RoutePlaceholder";

export default function InvitationsPage() {
  return (
    <RoutePlaceholder
      title="Invitations et demandes"
      purpose="Traiter les invitations de programme, d’équipe et les demandes d’accès."
      contract={[
        "Contexte de l’organisation qui invite",
        "Données visibles et données privées",
        "Accepter, traiter plus tard ou décliner",
      ]}
    />
  );
}
