import { RoutePlaceholder } from "@/features/v2/ui/RoutePlaceholder";

/** Les Dealrooms où figurent les entreprises de cette cohorte — lots G et H. */
export default function CohorteDealroomsPage() {
  return (
    <RoutePlaceholder
      contract={[
        "Une Dealroom peut réunir des entreprises de plusieurs cohortes.",
        "Chaque entreprise donne son accord Dealroom par Dealroom.",
      ]}
      purpose="Les espaces investisseurs où les entreprises de cette cohorte sont présentées."
      title="Dealrooms"
    />
  );
}
