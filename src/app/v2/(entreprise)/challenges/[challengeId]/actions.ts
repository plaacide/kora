"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

/**
 * L'entreprise confirme — ou retire — un critère manuel, écran 42.
 *
 * C'EST ELLE QUI COCHE, jamais le programme. `set_challenge_criterion` le fait
 * respecter : elle ne trouve l'entreprise que par l'appartenance de
 * l'appelant, et refuse tout critère CONNECTÉ, qui se valide seul.
 */
export async function basculerCritere(formData: FormData) {
  const challengeId = formData.get("challenge");
  const critereId = formData.get("critere");
  if (typeof challengeId !== "string" || typeof critereId !== "string") {
    redirect("/v2/accueil");
  }

  const retour = `/v2/challenges/${challengeId}`;
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_challenge_criterion", {
    p_challenge: challengeId,
    p_criterion: critereId,
    p_done: formData.get("fait") === "1",
  });

  if (error) {
    // ADR-001 : l'écran reçoit un code fermé, le détail part au journal.
    console.error("[v2 challenge entreprise] set_challenge_criterion", error);
    redirect(`${retour}?erreur=1`);
  }

  redirect(retour);
}
