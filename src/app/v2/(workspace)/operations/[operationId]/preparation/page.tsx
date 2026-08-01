import {
  attachableDocuments,
  baseDuPlan,
  listRequirementsFull,
  requirementDetail,
  requirementHistory,
} from "@/features/v2/server/preparation";
import { PreparationPlan, RequirementPanel } from "@/features/v2/ui/Preparation";

/**
 * Écrans 11 et 12 — le plan de préparation et le détail d'une exigence.
 *
 * L'écran 13 (import d'une liste reçue) n'est plus atteignable : il affichait
 * « Banque Atlantique Sénégal » déjà saisi et cinq exigences écrites en dur,
 * alors que rien n'extrait d'exigences d'un PDF et que `checklist_items` n'a
 * pas où retenir « demandé par telle banque ». Nommer une banque réelle sur un
 * écran qui ne fait rien est le défaut même des huit phrases retirées.
 *
 * C'est probablement la fonctionnalité la plus utile de celles qui restent :
 * elle appartient au lot L, avec la provenance nominative.
 */
export default async function PreparationPage({
  params,
  searchParams,
}: {
  params: Promise<{ operationId: string }>;
  searchParams: Promise<{ exigence?: string; new?: string }>;
}) {
  const [{ operationId }, query] = await Promise.all([params, searchParams]);

  const [requirements, base] = await Promise.all([
    listRequirementsFull(operationId),
    baseDuPlan(operationId),
  ]);

  const detail = query.exigence
    ? await requirementDetail(operationId, query.exigence)
    : null;

  const [history, attachable] = detail
    ? await Promise.all([
        requirementHistory(operationId, detail.id),
        attachableDocuments(operationId, detail.id),
      ])
    : [[], []];

  return (
    <>
      <PreparationPlan
        ajout={query.new === "1"}
        base={base}
        operationId={operationId}
        requirements={requirements}
      />

      {detail && (
        <RequirementPanel
          attachable={attachable}
          history={history}
          operationId={operationId}
          requirement={detail}
        />
      )}

    </>
  );
}
