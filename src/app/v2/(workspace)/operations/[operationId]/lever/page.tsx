import { activeRaise, pipelineInvestors } from "@/features/v2/server/raise";
import { Lever, type LeverQuery } from "@/features/v2/ui/Lever";

/**
 * Écrans 35 à 45 — la levée, pipeline compris.
 *
 * Le pipeline vit DANS Lever, comme la maquette 38 le montre. Il avait été
 * bâti sur une route séparée que rien n'atteignait — l'onglet, lui, affichait
 * encore quatre investisseurs de démonstration.
 */
export default async function LeverPage({
  params,
  searchParams,
}: {
  params: Promise<{ operationId: string }>;
  searchParams: Promise<LeverQuery>;
}) {
  const [{ operationId }, query] = await Promise.all([params, searchParams]);

  const [raise, investisseurs] = await Promise.all([
    activeRaise(operationId),
    pipelineInvestors(operationId),
  ]);

  return (
    <Lever
      investisseurs={investisseurs}
      operationId={operationId}
      query={query}
      raise={raise}
    />
  );
}
