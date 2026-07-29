import { redirect } from "next/navigation";

import { v2Routes } from "@/features/v2/navigation/routes";
import { listOperations } from "@/features/v2/server/operations";
import { requireV2Workspace } from "@/features/v2/server/session";
import { OperationsList } from "@/features/v2/ui/Operations";

export default async function OperationsPage() {
  const { organization } = await requireV2Workspace();
  const operations = await listOperations(organization.id);

  // Handoff D.1 : avec une seule opération, la liste est sautée et on ouvre
  // directement son contenu. Elle n'apparaît qu'à partir de la deuxième.
  if (operations.length === 1) {
    redirect(v2Routes.operations.overview(operations[0].id));
  }

  return <OperationsList operations={operations} />;
}
