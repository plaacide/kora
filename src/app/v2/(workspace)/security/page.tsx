import { RoutePlaceholder } from "@/features/v2/ui/RoutePlaceholder";

export default function SecurityPage() {
  return (
    <RoutePlaceholder
      title="Sécurité"
      purpose="Regrouper la protection du compte et les événements de sécurité."
      contract={[
        "2FA obligatoire avant le premier partage externe",
        "Sessions actives et révocation",
        "Codes de récupération",
        "Journal de sécurité distinct de l’activité documentaire",
      ]}
    />
  );
}
