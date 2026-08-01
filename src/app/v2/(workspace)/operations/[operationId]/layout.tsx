import { libelleObjectif } from "@/features/v2/domain/operation";
import { countActiveAccesses } from "@/features/v2/server/access";
import { listFolders } from "@/features/v2/server/documents";
import { listOperationNames } from "@/features/v2/server/operations";
import { preparationProgress } from "@/features/v2/server/preparation";
import { requireV2Workspace } from "@/features/v2/server/session";
import { OperationShell } from "@/features/v2/ui/Shell";

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ operationId: string }>;
}) {
  const { operationId } = await params;

  // Le rail listait huit dossiers en dur, ceux de la maquette. Une opération
  // créée sans gabarit n'en a aucun, une data room réorganisée n'a pas
  // ceux-là : le rail annonçait des dossiers qui n'existaient pas.
  // Le rail annonçait « Série A 2026 · Levée en capital » sur TOUTES les
  // opérations, et son sélecteur listait trois noms de maquette qui renvoyaient
  // tous à la liste. Un sélecteur qui ne sélectionne rien.
  const { organization } = await requireV2Workspace();

  const [folders, activeAccesses, preparation, operations] = await Promise.all([
    listFolders(operationId),
    countActiveAccesses(operationId),
    preparationProgress(operationId),
    listOperationNames(organization.id),
  ]);

  const courante = operations.find((op) => op.id === operationId);

  return (
    <OperationShell
      activeAccesses={activeAccesses}
      folders={folders.map((folder) => folder.name)}
      operationId={operationId}
      operationName={courante?.nom}
      operationObjectif={libelleObjectif(courante?.objectif ?? null)}
      operations={operations}
      preparation={preparation}
    >
      {children}
    </OperationShell>
  );
}
