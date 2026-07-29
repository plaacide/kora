import { RoutePlaceholder } from "@/features/v2/ui/RoutePlaceholder";

export default function CompanyOnboardingPage() {
  return (
    <RoutePlaceholder
      title="Entreprise"
      purpose="Collecter l’identité stable qui contextualise le plan de préparation."
      contract={[
        "Nom commercial et informations juridiques",
        "Pays d’immatriculation et juridiction applicable",
        "Secteur, stade et présentation facultative",
        "Conservation du contexte d’une invitation éventuelle",
      ]}
    />
  );
}
