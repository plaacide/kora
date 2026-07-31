"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

/**
 * Accepter une invitation à rejoindre une équipe.
 *
 * Le contrôle d'adresse est fait par la RPC, pas ici : un contrôle posé
 * uniquement côté application se contourne en appelant la RPC directement.
 */
export async function acceptV2TeamInvitation(input: {
  token: string;
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("accept_org_invitation", {
    p_token: input.token,
  });

  if (error) {
    console.error("[v2 équipe] accept_org_invitation échoué :", error);

    const dit: Record<string, string> = {
      "cette invitation ne vous est pas destinée":
        "Cette invitation est adressée à une autre adresse e-mail.",
      "invitation expirée": "Ce lien a expiré.",
      "invitation révoquée": "Cette invitation a été révoquée.",
      "invitation déjà acceptée": "Cette invitation a déjà été acceptée.",
      "non authentifié": "Connectez-vous d’abord.",
    };
    const cle = Object.keys(dit).find((m) => error.message.includes(m));

    return { ok: false, error: cle ? dit[cle] : error.message };
  }

  revalidatePath("/v2", "layout");
  return { ok: true };
}
