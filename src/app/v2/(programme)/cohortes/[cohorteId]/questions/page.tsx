import { RoutePlaceholder } from "@/features/v2/ui/RoutePlaceholder";

/** Écran 08 — lot D. */
export default function QuestionsPage() {
  return (
    <RoutePlaceholder
      contract={[
        "Une question attend une réponse. Une suggestion n’en attend pas.",
        "Ce n’est pas un chat : ni saisie en cours, ni présence, ni accusé de lecture.",
        "L’entreprise répond quand elle le souhaite. Pas de relance automatique.",
      ]}
      purpose="Le canal écrit entre le programme et ses entreprises."
      title="Questions & suggestions"
    />
  );
}
