import { RoutePlaceholder } from "@/features/v2/ui/RoutePlaceholder";

export default function InvestorsPage() {
  return (
    <RoutePlaceholder
      title="Investisseurs"
      purpose="Suivre les relations sans transformer les consultations en intention supposée."
      contract={[
        "Relation, accès et engagement financier séparés",
        "Vue tableau et vue par étapes",
        "Prochaine action et notes internes",
        "Signaux documentaires présentés comme des signaux uniquement",
      ]}
    />
  );
}
