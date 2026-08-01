import { saisieOnboarding } from "@/features/v2/server/startup";
import { ObjectiveSelector } from "@/features/v2/ui/Onboarding";

export default async function OperationOnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { erreur } = await searchParams;
  const saisie = await saisieOnboarding();

  return (
    <ObjectiveSelector
      hasError={Boolean(erreur)}
      objectifEnregistre={saisie.objectif}
    />
  );
}
