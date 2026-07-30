import { redirect } from "next/navigation";

import { v2Routes } from "@/features/v2/navigation/routes";

/**
 * `/v2/operations/new` était avalé par la route dynamique `[operationId]` :
 * « new » passait pour un identifiant et menait à une fiche d'opération
 * inexistante. On le renvoie vers l'assistant.
 */
export default function NewOperationAlias() {
  redirect(v2Routes.operations.new);
}
