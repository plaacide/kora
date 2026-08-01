"use server";

import { revalidatePath } from "next/cache";

import {
  codeDepuisPostgres,
  echec,
  type Resultat,
} from "@/features/v2/domain/erreurs";
import { createClient } from "@/lib/supabase/server";

/**
 * Archiver une opération, ou la remettre en activité.
 *
 * CE QUE CETTE ACTION REMPLACE. `OperationDialog` était entièrement décoratif :
 * le menu « ⋯ » de la liste ouvrait une fenêtre qui nommait toujours
 * « Série A 2026 », quelle que soit l'opération, et dont les deux boutons
 * n'avaient aucun gestionnaire. On confirmait un archivage, la fenêtre se
 * fermait, rien n'était archivé.
 *
 * `set_deal_archived` pose ou retire `archived_at` et écrit au journal. Elle ne
 * supprime rien : une opération archivée reste lisible, ses documents et ses
 * accès sont intacts. C'est ce qui permet de la dire réversible sans mentir.
 */
export async function setV2OperationArchived(input: {
  operationId: string;
  archived: boolean;
}): Promise<Resultat> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("set_deal_archived", {
    p_deal: input.operationId,
    p_archived: input.archived,
  });

  if (error) {
    console.error("[v2 opérations] set_deal_archived échoué :", error);
    return echec(codeDepuisPostgres(error.message));
  }

  // La liste ET le rail de l'opération : archiver change le compte des
  // opérations actives, que le rail affiche.
  revalidatePath("/v2/operations");
  revalidatePath(`/v2/operations/${input.operationId}`, "layout");
  return { ok: true };
}
