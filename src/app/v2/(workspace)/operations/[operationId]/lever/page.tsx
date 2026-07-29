import { Lever, type LeverQuery } from "@/features/v2/ui/Lever";

export default async function LeverPage({
  params,
  searchParams,
}: {
  params: Promise<{ operationId: string }>;
  searchParams: Promise<LeverQuery>;
}) {
  const [{ operationId }, query] = await Promise.all([params, searchParams]);

  return <Lever operationId={operationId} query={query} />;
}
