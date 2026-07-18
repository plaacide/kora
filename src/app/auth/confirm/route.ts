import { type NextRequest, NextResponse } from "next/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Échange le jeton d'un e-mail (récupération de mot de passe, confirmation
 * d'adresse) contre une session, puis redirige.
 *
 * Pourquoi une route serveur et pas la page directement : le lien contient un
 * `token_hash` à usage unique qu'il faut vérifier côté serveur pour poser les
 * cookies de session. Laisser le client s'en charger imposerait de faire
 * transiter le jeton dans l'URL du navigateur, où il finirait dans l'historique
 * et les journaux du proxy.
 *
 * `next` est volontairement restreint aux chemins internes : accepter une URL
 * complète ferait de cette route une redirection ouverte, utilisable pour
 * envoyer un utilisateur authentifié vers un site de hameçonnage depuis un lien
 * qui porte notre domaine.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/dashboard";

  const destination = next.startsWith("/") && !next.startsWith("//")
    ? next
    : "/dashboard";

  if (!tokenHash || !type) {
    return NextResponse.redirect(`${origin}/connexion?erreur=lien_invalide`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    type,
    token_hash: tokenHash,
  });

  if (error) {
    // Lien expiré ou déjà utilisé : on renvoie vers la demande, pas vers une
    // page d'erreur muette — l'utilisateur doit pouvoir en redemander un.
    return NextResponse.redirect(
      `${origin}/mot-de-passe-oublie?erreur=lien_expire`,
    );
  }

  return NextResponse.redirect(`${origin}${destination}`);
}
