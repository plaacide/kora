import { searchDocuments, searchableOperations } from "@/features/v2/server/search";
import { requireV2Workspace } from "@/features/v2/server/session";
import { SearchScreen } from "@/features/v2/ui/Search";

/**
 * Écran 66 — la recherche.
 *
 * La requête est un paramètre d'URL, pas un état de composant : une recherche
 * se partage avec un associé et se retrouve dans l'historique.
 */
export default async function RecherchePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; operation?: string; archivees?: string }>;
}) {
  const [{ organization }, query] = await Promise.all([
    requireV2Workspace(),
    searchParams,
  ]);

  const terme = query.q ?? "";
  const operationId = query.operation ?? null;
  const archivees = query.archivees === "1";

  const [operations, resultats] = await Promise.all([
    searchableOperations(organization.id),
    searchDocuments(organization.id, terme, {
      operationId: operationId ?? undefined,
      archivees,
    }),
  ]);

  return (
    <SearchScreen
      archivees={archivees}
      operationId={operationId}
      operations={operations}
      resultats={resultats}
      terme={terme}
    />
  );
}
