import { InvestorsScreen } from "@/features/v2/ui/Investors";

export default async function InvestorsPage({
  params,
}: {
  params: Promise<{ operationId: string }>;
}) {
  const { operationId } = await params;

  return <InvestorsScreen operationId={operationId} />;
}
