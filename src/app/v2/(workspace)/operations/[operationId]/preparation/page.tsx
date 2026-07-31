import {
  listRequirementsFull,
  requirementDetail,
  requirementHistory,
} from "@/features/v2/server/preparation";
import { ImportListPanel } from "@/features/v2/ui/ImportList";
import { PreparationPlan, RequirementPanel } from "@/features/v2/ui/Preparation";

/**
 * Écrans 11 et 12 — le plan de préparation et le détail d'une exigence.
 *
 * L'écran 13 (import d'une liste reçue) reste une maquette : rien n'extrait
 * d'exigences d'un PDF, et `checklist_items` n'a pas où retenir « demandé par
 * telle banque ». Le motif est écrit dans `preparation/actions.ts`.
 */
export default async function PreparationPage({
  params,
  searchParams,
}: {
  params: Promise<{ operationId: string }>;
  searchParams: Promise<{ exigence?: string; new?: string; import?: string }>;
}) {
  const [{ operationId }, query] = await Promise.all([params, searchParams]);

  const requirements = await listRequirementsFull(operationId);

  const detail = query.exigence
    ? await requirementDetail(operationId, query.exigence)
    : null;

  const history = detail
    ? await requirementHistory(operationId, detail.id)
    : [];

  return (
    <>
      <PreparationPlan
        ajout={query.new === "1"}
        operationId={operationId}
        requirements={requirements}
      />

      {detail && (
        <RequirementPanel
          history={history}
          operationId={operationId}
          requirement={detail}
        />
      )}

      {query.import === "1" && <ImportListPanel />}
    </>
  );
}
