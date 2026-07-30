import { requireV2Workspace } from "@/features/v2/server/session";
import { companyDefaults } from "@/features/v2/server/startup";
import {
  NewOperationWizard,
  type OperationDraft,
  type Step,
} from "@/features/v2/ui/NewOperation";

/**
 * L'assistant vit hors du shell : c'est une page focalisée, sans rail ni
 * panneau contextuel, comme les maquettes 55 à 57.
 *
 * Les valeurs saisies voyagent d'une étape à l'autre par l'URL : l'assistant
 * n'a pas d'état serveur, et un rafraîchissement en cours de route ne perd
 * donc rien.
 */
export default async function NewOperationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireV2Workspace();
  const params = await searchParams;

  const read = (name: string): string => {
    const raw = params[name];
    return typeof raw === "string" ? raw : "";
  };

  const step: Step =
    read("etape") === "infos" || read("etape") === "structure"
      ? (read("etape") as Step)
      : "type";

  // Le pays et le stade de l'entreprise sont déjà connus depuis l'onboarding :
  // on les propose plutôt que de les redemander (maquette 56).
  const company = await companyDefaults();

  const draft: OperationDraft = {
    type: read("type") || "equity",
    nom: read("nom"),
    pays: read("pays") || company.country,
    financeur: read("financeur"),
    stade: read("stade") || company.stage,
    montant: read("montant"),
    devise: read("devise"),
    tour: read("tour"),
    horizon: read("horizon"),
  };

  return (
    <NewOperationWizard draft={draft} erreur={read("erreur") || undefined} step={step} />
  );
}
