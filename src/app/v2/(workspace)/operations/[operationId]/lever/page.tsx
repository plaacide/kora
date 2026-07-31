import { activeRaise } from "@/features/v2/server/raise";
import { Lever, type LeverQuery } from "@/features/v2/ui/Lever";

/**
 * Écrans 35 à 45 — la levée.
 *
 * `activeRaise` rend `null` quand l'opération n'a pas de levée en cours : ce
 * n'est pas une anomalie mais l'état de départ, et l'écran 35 y répond.
 */
export default async function LeverPage({
  params,
  searchParams,
}: {
  params: Promise<{ operationId: string }>;
  searchParams: Promise<LeverQuery>;
}) {
  const [{ operationId }, query] = await Promise.all([params, searchParams]);
  const raise = await activeRaise(operationId);

  return <Lever operationId={operationId} query={query} raise={raise} />;
}
