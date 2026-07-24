import { createServerClient } from "@supabase/ssr";
import { createClient as createBareClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * Client serveur.
 *
 * `flowType` : `@supabase/ssr` utilise PKCE par défaut, ce qui convient à la
 * navigation mais PAS aux liens envoyés par e-mail. PKCE produit un jeton
 * préfixé `pkce_`, inutilisable par `verifyOtp()` — et surtout lié à un
 * `code_verifier` déposé en cookie dans le navigateur qui a fait la demande.
 * Un lien de réinitialisation demandé sur un ordinateur et ouvert sur un
 * téléphone ne peut donc pas fonctionner.
 *
 * Les flux déclenchés par e-mail passent en `implicit` : le jeton est alors un
 * `token_hash` simple, vérifiable côté serveur depuis n'importe quel appareil.
 */
export async function createClient(
  options?: { flowType?: "pkce" | "implicit" },
) {
  // ⚠️ Depuis @supabase/ssr 0.12, `createServerClient` ÉCRASE l'option :
  // `auth: { ...options?.auth, flowType: "pkce", ... }` — notre « implicit »
  // était ignoré en silence, et tous les liens e-mail repartaient en `pkce_`
  // (donc « lien expiré » au premier clic). Rien ne le détecte au build.
  //
  // Pour les flux e-mail, on n'a besoin d'AUCUNE session ni cookie (l'action
  // attend justement la confirmation par e-mail) : client nu supabase-js,
  // réellement implicite, hors de portée de l'écrasement.
  if (options?.flowType === "implicit") {
    return createBareClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { flowType: "implicit", persistSession: false, autoRefreshToken: false } },
    );
  }

  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Appelé depuis un Server Component — ignoré (la session est
            // rafraîchie par le middleware).
          }
        },
      },
    },
  );
}
