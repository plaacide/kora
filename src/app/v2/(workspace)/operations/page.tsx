import { redirect } from "next/navigation";

import { v2Routes } from "@/features/v2/navigation/routes";
import { listOperations } from "@/features/v2/server/operations";
import { requireV2Workspace } from "@/features/v2/server/session";
import { OperationsList } from "@/features/v2/ui/Operations";

export default async function OperationsPage({
  searchParams,
}: {
  searchParams: Promise<{ liste?: string }>;
}) {
  const { liste } = await searchParams;
  const { organization } = await requireV2Workspace();
  const operations = await listOperations(organization.id);

  // Handoff D.1 : avec une seule opération, la liste est sautée et on ouvre
  // directement son contenu. Elle n'apparaît qu'à partir de la deuxième.
  //
  // `?liste=1` force son affichage : sans cette porte, l'écran est
  // inatteignable tant qu'on n'a qu'une opération — et rien ne permet encore
  // d'en créer une seconde.
  if (operations.length === 1 && liste !== "1") {
    redirect(v2Routes.operations.overview(operations[0].id));
  }

  return <OperationsList operations={operations} />;
}
