import { listOperations } from "@/features/v2/server/operations";
import { requireV2Workspace } from "@/features/v2/server/session";
import { OperationDialog, type DialogKind } from "@/features/v2/ui/Dialogs";
import { OperationsList } from "@/features/v2/ui/Operations";

const DIALOGS: DialogKind[] = [
  "limite-plan",
  "limite-close",
  "cloture",
  "archivage",
  "dealroom",
];

/**
 * Le handoff D.1 prévoyait de sauter la liste tant qu'il n'y avait qu'une
 * opération. Les écrans 52, 53 et 54 lui donnent un état par cas : il n'y a
 * donc rien à sauter.
 */
export default async function OperationsPage({
  searchParams,
}: {
  searchParams: Promise<{ dialogue?: string }>;
}) {
  const { dialogue } = await searchParams;
  const { organization } = await requireV2Workspace();
  const operations = await listOperations(organization.id);
  const kind = DIALOGS.find((item) => item === dialogue);

  return (
    <>
      <OperationsList operations={operations} />
      {kind && <OperationDialog kind={kind} />}
    </>
  );
}
