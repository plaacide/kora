import { organizationJournal } from "@/features/v2/server/journal";
import { requireV2Workspace } from "@/features/v2/server/session";
import { ActivityScreen } from "@/features/v2/ui/Activity";

/**
 * Écran 30, à l'échelle de l'organisation.
 *
 * Même écran que celui d'une opération : ce qui change est la portée, pas la
 * lecture. Deux composants distincts auraient divergé au premier ajout.
 */
export default async function ActiviteGlobalePage() {
  const { organization } = await requireV2Workspace();
  const entrees = await organizationJournal(organization.id);

  return <ActivityScreen entrees={entrees} portee="votre organisation" />;
}
