"use server";

import { revalidatePath } from "next/cache";

import {
  codeDepuisPostgres,
  echec,
  type Resultat,
} from "@/features/v2/domain/erreurs";
import { createClient } from "@/lib/supabase/server";

/**
 * Accepter une invitation à rejoindre une équipe.
 *
 * Le contrôle d'adresse est fait par la RPC, pas ici : un contrôle posé
 * uniquement côté application se contourne en appelant la RPC directement.
 */
export async function acceptV2TeamInvitation(input: {
  token: string;
}): Promise<Resultat> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("accept_org_invitation", {
    p_token: input.token,
  });

  if (error) {
    console.error("[v2 équipe] accept_org_invitation échoué :", error);

    // Le troisième dictionnaire local, avec le même repli brut que les deux
    // autres. Il vit désormais dans le catalogue commun.
    return echec(codeDepuisPostgres(error.message));
  }

  revalidatePath("/v2", "layout");
  return { ok: true };
}
