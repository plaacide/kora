import { createServerClient } from "@supabase/ssr";
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
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: options?.flowType ? { flowType: options.flowType } : undefined,
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
