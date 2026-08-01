"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

/**
 * Se déconnecter — le geste que la V2 n'avait pas.
 *
 * CE QUI MANQUAIT. Le rail portait un avatar, mais c'était un `<span>` décoratif :
 * aucun moyen de quitter sa session depuis la V2. Le seul `signOut` existant est
 * celui de l'écran Sécurité, et il ferme les AUTRES appareils — pas le sien. Un
 * fondateur qui se connecte depuis un poste partagé n'avait aucune sortie.
 *
 * ON NE RÉUTILISE PAS `logout()` de la V1 : elle renvoie vers `/connexion`,
 * l'écran de la V1. Se déconnecter de la V2 pour atterrir dans l'autre produit
 * est exactement ce qu'on vient de corriger sur les liens d'e-mail.
 *
 * `scope: "local"` est le défaut et c'est celui qu'on veut : fermer les sessions
 * des autres appareils au passage serait un geste bien plus large que ce que
 * « se déconnecter » annonce. L'écran Sécurité le propose séparément, et le dit.
 */
export async function logoutV2(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();

  // Pas de `?erreur=` : partir de son plein gré n'est pas un incident, et un
  // bandeau d'avertissement sur l'écran de connexion le laisserait croire.
  redirect("/v2/connexion");
}
