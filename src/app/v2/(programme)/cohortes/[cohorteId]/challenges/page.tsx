import { RoutePlaceholder } from "@/features/v2/ui/RoutePlaceholder";

/** Écrans 09, 09b, 10 à 16 — lots E et F. */
export default function ChallengesPage() {
  return (
    <RoutePlaceholder
      contract={[
        "État vide (écran 09) : créer un Challenge ou parcourir la bibliothèque.",
        "Actifs (écran 09b) : un Challenge s’assigne sans être recréé.",
        "Le programme suit l’état de chaque critère, jamais le document qui le satisfait.",
      ]}
      purpose="Les actions structurées demandées aux entreprises de la cohorte."
      title="Challenges"
    />
  );
}
