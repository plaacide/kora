import { listFolders } from "@/features/v2/server/documents";
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
  const folders = await listFolders(operationId);

  return (
    <OperationShell
      folders={folders.map((folder) => folder.name)}
      operationId={operationId}
    >
      {children}
    </OperationShell>
  );
}
