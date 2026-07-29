import { listOperations } from "@/features/v2/server/operations";
import { requireV2Workspace } from "@/features/v2/server/session";
import { OperationsList } from "@/features/v2/ui/Operations";

/**
 * Le handoff D.1 prévoit de sauter la liste tant qu'il n'y a qu'une opération.
 * La règle est retirée : avec une seule opération — le cas de tout fondateur
 * qui vient de s'inscrire — elle rendait l'écran inatteignable, et rien ne
 * permet encore d'en créer une seconde pour le faire apparaître.
 */
export default async function OperationsPage() {
  const { organization } = await requireV2Workspace();
  const operations = await listOperations(organization.id);

  return <OperationsList operations={operations} />;
}
