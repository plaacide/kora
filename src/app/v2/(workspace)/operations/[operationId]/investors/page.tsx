import { activeRaise, pipelineInvestors } from "@/features/v2/server/raise";
import { InvestorsScreen } from "@/features/v2/ui/Investors";

/**
 * Écrans 38 à 40 — le pipeline investisseur.
 *
 * La devise vient de la levée : un ticket sans devise ne veut rien dire, et
 * une opération sans levée n'a pas encore de monnaie de compte.
 */
export default async function InvestorsPage({
  params,
  searchParams,
}: {
  params: Promise<{ operationId: string }>;
  searchParams: Promise<{ vue?: string; panel?: string }>;
}) {
  const [{ operationId }, query] = await Promise.all([params, searchParams]);

  const [investisseurs, raise] = await Promise.all([
    pipelineInvestors(operationId),
    activeRaise(operationId),
  ]);

  return (
    <InvestorsScreen
      devise={raise?.currency ?? "XOF"}
      edite={query.panel ?? null}
      investisseurs={investisseurs}
      operationId={operationId}
      vue={query.vue ?? "colonnes"}
    />
  );
}
