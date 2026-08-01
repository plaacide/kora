import { listOperations } from "@/features/v2/server/operations";
import { requireV2Workspace } from "@/features/v2/server/session";
import { ArchiveOperationDialog } from "@/features/v2/ui/Dialogs";
import { OperationsList } from "@/features/v2/ui/Operations";

/**
 * Le handoff D.1 prévoyait de sauter la liste tant qu'il n'y avait qu'une
 * opération. Les écrans 52, 53 et 54 lui donnent un état par cas : il n'y a
 * donc rien à sauter.
 */
export default async function OperationsPage({
  searchParams,
}: {
  searchParams: Promise<{ archiver?: string }>;
}) {
  const { archiver } = await searchParams;
  const { organization } = await requireV2Workspace();
  const operations = await listOperations(organization.id);

  // Le dialogue ne s'ouvre que sur une opération QUI EXISTE et qui appartient à
  // cette organisation. Auparavant `?dialogue=archivage` suffisait à afficher
  // une fenêtre nommant « Série A 2026 » à n'importe qui.
  const cible = archiver
    ? operations.find((operation) => operation.id === archiver)
    : undefined;

  return (
    <>
      <OperationsList operations={operations} />
      {cible && (
        <ArchiveOperationDialog
          archived={cible.lifecycle === "archived"}
          name={cible.name}
          operationId={cible.id}
        />
      )}
    </>
  );
}
