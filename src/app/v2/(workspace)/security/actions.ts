"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

/**
 * Les gestes de sécurité — écran 34.
 *
 * L'inscription d'un facteur TOTP se fait dans le navigateur : c'est Supabase
 * qui la gère, l'application n'en voit que le résultat. Ces actions ne font
 * donc pas l'authentification — elles en gardent la trace, et déconnectent les
 * autres appareils.
 */

type Resultat = { ok: boolean; error?: string };

export async function logV2Security(input: {
  action:
    | "security.mfa_enabled"
    | "security.mfa_disabled"
    | "security.sessions_revoked";
}): Promise<Resultat> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("log_security_event", {
    p_action: input.action,
    p_metadata: {},
  });

  if (error) {
    console.error("[v2 sécurité] log_security_event échoué :", error);
    return { ok: false, error: error.message };
  }

  revalidatePath("/v2/security");
  return { ok: true };
}

/**
 * Déconnecter les autres appareils.
 *
 * La maquette montre une LISTE des sessions actives, avec appareil, ville et
 * heure. Supabase ne l'expose pas : ni au client, ni par l'API
 * d'administration — il n'existe aucun point d'accès qui énumère les sessions
 * d'un utilisateur. Trois lignes plausibles valaient donc pire que rien.
 *
 * Le GESTE, lui, existe : `scope: "others"` révoque toutes les sessions sauf
 * celle-ci. C'est ce que la maquette appelle « Tout déconnecter sauf ici », et
 * c'est ce qu'on garde — l'action utile, sans l'inventaire qu'on ne sait pas
 * établir.
 */
export async function signOutOtherDevices(): Promise<Resultat> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signOut({ scope: "others" });

  if (error) {
    console.error("[v2 sécurité] déconnexion des autres appareils :", error);
    return { ok: false, error: error.message };
  }

  await supabase.rpc("log_security_event", {
    p_action: "security.sessions_revoked",
    p_metadata: {},
  });

  revalidatePath("/v2/security");
  return { ok: true };
}
