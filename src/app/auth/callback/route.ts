import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { originFromHeaders } from "@/lib/app-origin";

/** Types de compte acceptés depuis l'URL — jamais la valeur brute. */
const ROLES = ["investor", "founder", "sae"] as const;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Échange un `code` PKCE contre une session.
 *
 * Complète `/auth/confirm`, qui traite l'autre mécanisme (`token_hash`).
 * Les gabarits d'e-mail par défaut de Supabase pointent vers
 * `/auth/v1/verify?token=pkce_…&redirect_to=<Site URL>` : Supabase confirme
 * l'adresse, puis renvoie sur le site avec `?code=…`.
 *
 * Sans cette route, personne n'échangeait ce code. Le fondateur cliquait,
 * atterrissait sur la page d'accueil sans être connecté et sans le moindre
 * message — son compte était pourtant bien activé. Beaucoup en concluent que
 * l'inscription a échoué et recommencent.
 *
 * Note : le code PKCE ne peut être échangé que par le navigateur qui a lancé
 * l'inscription (il détient le vérificateur). Ouvrir l'e-mail sur un autre
 * appareil est un cas courant — d'où le repli vers la connexion plutôt qu'une
 * page d'erreur : l'adresse est confirmée, il ne reste qu'à se connecter.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/onboarding";
  const origin = originFromHeaders(request.headers);

  const destination =
    next.startsWith("/") && !next.startsWith("//") ? next : "/onboarding";

  if (!code) {
    return NextResponse.redirect(`${origin}/connexion`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/connexion?erreur=session_absente`);
  }

  // Inscription par Google / LinkedIn : le type de compte choisi sur l'écran
  // arrive en paramètre. On ne l'écrase JAMAIS s'il est déjà posé — sinon une
  // simple reconnexion depuis l'écran d'inscription changerait le persona d'un
  // compte existant, et donc tout son parcours.
  const role = searchParams.get("role");
  const userId = data.user?.id;
  if (userId && role && (ROLES as readonly string[]).includes(role)) {
    const admin = createAdminClient();
    const { data: profil } = await admin
      .from("profiles")
      .select("account_type")
      .eq("id", userId)
      .maybeSingle();
    if (!(profil as { account_type?: string | null } | null)?.account_type) {
      await admin.from("profiles").update({ account_type: role }).eq("id", userId);
    }
  }

  return NextResponse.redirect(`${origin}${destination}`);
}
