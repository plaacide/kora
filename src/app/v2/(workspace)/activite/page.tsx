import { organizationJournal } from "@/features/v2/server/journal";
import { requireV2Workspace } from "@/features/v2/server/session";
import { ActivityScreen } from "@/features/v2/ui/Activity";
import { Standalone } from "@/features/v2/ui/Shell";

/**
 * Écran 30, à l'échelle de l'organisation.
 *
 * Même écran que celui d'une opération : ce qui change est la portée, pas la
 * lecture. Deux composants distincts auraient divergé au premier ajout.
 *
 * `search={false}` : le journal porte sa propre recherche, qui filtre ce qui
 * est affiché — celle de l'en-tête ne saurait pas le faire.
 */
export default async function ActiviteGlobalePage() {
  const { organization } = await requireV2Workspace();
  const entrees = await organizationJournal(organization.id);

  return (
    <Standalone search={false} title="Activité">
      <ActivityScreen entrees={entrees} portee="votre organisation" />
    </Standalone>
  );
}
