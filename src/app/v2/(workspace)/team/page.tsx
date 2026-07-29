import { RoutePlaceholder } from "@/features/v2/ui/RoutePlaceholder";

export default function TeamPage() {
  return (
    <RoutePlaceholder
      title="Équipe"
      purpose="Gérer séparément les collaborateurs internes de l’entreprise."
      contract={[
        "Propriétaire, administrateur, contributeur, lecteur interne",
        "Droits explicites par capacité",
        "Aucun rôle de modification pour un invité externe",
      ]}
    />
  );
}
