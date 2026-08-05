import { COHORTES } from "@/features/v2/fixtures/programme";
import { v2Routes } from "@/features/v2/navigation/routes";
import { RoutePlaceholder } from "@/features/v2/ui/RoutePlaceholder";
import { Standalone } from "@/features/v2/ui/Shell";

/** Écrans 01 et 02 — lot B. La coque, elle, est déjà en place. */
export default function CohortesPage() {
  return (
    <Standalone search="Rechercher une cohorte" title="Mes cohortes">
      <RoutePlaceholder
        contract={[
          "État vide (écran 01) : « Commencez par une cohorte », une seule action.",
          "État rempli (écran 02) : cohortes actives, puis archivées.",
          "Aucun indicateur n’est affiché tant qu’il n’a pas de donnée.",
        ]}
        links={COHORTES.map((item) => ({
          href: v2Routes.programme.cohortes.root(item.id),
          label: item.nom,
        }))}
        purpose="Les groupes d’entreprises que le programme accompagne sur une période donnée."
        title="Mes cohortes"
      />
    </Standalone>
  );
}
