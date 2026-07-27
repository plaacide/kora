"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Décision sur une demande d'accès.
 *
 * L'action ne décide RIEN elle-même : elle relaie vers `decide_access_request`,
 * qui porte les gardes (le programme filtre, l'entreprise tranche, le mandat
 * fait exception) et écrit au journal d'audit de l'entreprise. La table n'a
 * aucune policy d'UPDATE — il n'existe donc pas de chemin qui contournerait
 * cette fonction, et donc pas de transition sans trace.
 */
export async function deciderDemande(
  demandeId: string,
  decision: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("decide_access_request", {
    p_request: demandeId,
    p_decision: decision,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/demandes");
  return { ok: true };
}
