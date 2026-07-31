"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

/**
 * Répondre à une demande d'accès — écran 26.
 *
 * `decide_access_request` fait plus que changer un statut : accorder crée les
 * permissions réelles sur les dossiers de l'opération. C'est pourquoi elle
 * seule décide — une écriture directe changerait l'étiquette sans ouvrir la
 * porte, et le fondateur croirait avoir accordé un accès qui n'existe pas.
 */
export async function decideV2Request(input: {
  requestId: string;
  decision: "granted" | "refused";
  note?: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("decide_access_request", {
    p_request: input.requestId,
    p_decision: input.decision,
    p_note: input.note?.trim() || null,
  });

  if (error) {
    console.error("[v2 invitations] decide_access_request échoué :", error);
    return { ok: false, error: error.message };
  }

  revalidatePath("/v2/invitations");
  return { ok: true };
}
