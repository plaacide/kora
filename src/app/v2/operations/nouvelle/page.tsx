import { requireV2Workspace } from "@/features/v2/server/session";
import { NewOperationWizard, type Step } from "@/features/v2/ui/NewOperation";

/**
 * L'assistant vit hors du shell : c'est une page focalisée, sans rail ni
 * panneau contextuel, comme les maquettes 55 à 57.
 */
export default async function NewOperationPage({
  searchParams,
}: {
  searchParams: Promise<{ etape?: string }>;
}) {
  await requireV2Workspace();
  const { etape } = await searchParams;
  const step: Step =
    etape === "infos" || etape === "structure" ? etape : "type";

  return <NewOperationWizard step={step} />;
}
