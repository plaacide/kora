import { operationJournal } from "@/features/v2/server/journal";
import { ActivityScreen } from "@/features/v2/ui/Activity";

/** Écran 30 — le journal d'une opération. */
export default async function ActivityPage({
  params,
}: {
  params: Promise<{ operationId: string }>;
}) {
  const { operationId } = await params;
  const entrees = await operationJournal(operationId);

  return <ActivityScreen entrees={entrees} portee="cette opération" />;
}
