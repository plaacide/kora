import { ObjectiveSelector } from "@/features/v2/ui/Onboarding";

export default async function OperationOnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { erreur } = await searchParams;
  return <ObjectiveSelector hasError={Boolean(erreur)} />;
}
