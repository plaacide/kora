import { type NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { originFromHeaders } from "@/lib/app-origin";
import { sendEmail } from "@/lib/email/send";
import {
  authEmail,
  type AuthEmailKind,
  type Locale,
} from "@/lib/email/auth-templates";
import { verifyWebhookSignature } from "@/lib/email/webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Send Email Hook : Supabase n'envoie plus les e-mails d'authentification
 * lui-même, il appelle cette route et c'est nous qui composons puis expédions.
 *
 * Pourquoi : ses gabarits de tableau de bord sont monolingues, hors du dépôt
 * (donc ni relus ni versionnés), et imposent `{{ .ConfirmationURL }}`, qui ne
 * produit pas le `token_hash` attendu par `/auth/confirm` — le défaut qui a
 * cassé la réinitialisation de mot de passe en production.
 *
 * En cas d'échec on répond 500 : Supabase considère alors l'envoi comme raté et
 * le signale, plutôt que de laisser l'utilisateur attendre un e-mail fantôme.
 */

/** Actions Supabase → gabarit, type de jeton et destination après vérification. */
const ACTIONS: Record<
  string,
  { kind: AuthEmailKind; otpType: string; next: string }
> = {
  signup: { kind: "signup", otpType: "signup", next: "/onboarding" },
  invite: { kind: "invite", otpType: "invite", next: "/onboarding" },
  magiclink: { kind: "magiclink", otpType: "magiclink", next: "/dashboard" },
  recovery: { kind: "recovery", otpType: "recovery", next: "/reinitialiser" },
  email_change: {
    kind: "email_change",
    otpType: "email_change",
    next: "/securite",
  },
  email_change_new: {
    kind: "email_change",
    otpType: "email_change",
    next: "/securite",
  },
  email_change_current: {
    kind: "email_change",
    otpType: "email_change",
    next: "/securite",
  },
  reauthentication: {
    kind: "reauthentication",
    otpType: "",
    next: "",
  },
};

interface HookPayload {
  user?: { id?: string; email?: string; new_email?: string };
  email_data?: {
    token?: string;
    token_hash?: string;
    token_new?: string;
    token_hash_new?: string;
    email_action_type?: string;
    redirect_to?: string;
  };
}

export async function POST(request: NextRequest) {
  const secret = process.env.SEND_EMAIL_HOOK_SECRET;
  if (!secret) {
    // Bruyant à dessein : sans secret la route refuse tout, donc AUCUN e-mail
    // d'authentification ne part. Le symptôme côté utilisateur est muet.
    console.error(
      "[email-hook] SEND_EMAIL_HOOK_SECRET absent : tous les e-mails " +
        "d'authentification sont refusés. Poser la variable d'environnement.",
    );
    return NextResponse.json({ error: "hook_not_configured" }, { status: 500 });
  }

  const payload = await request.text();
  const verdict = verifyWebhookSignature({
    payload,
    headers: request.headers,
    secret,
  });
  if (!verdict.ok) {
    console.error("[email-hook] signature refusée : %s", verdict.reason);
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  let body: HookPayload;
  try {
    body = JSON.parse(payload) as HookPayload;
  } catch {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const data = body.email_data ?? {};
  const action = data.email_action_type ?? "";
  const mapping = ACTIONS[action];
  if (!mapping) {
    console.error("[email-hook] action inconnue : %s", action);
    return NextResponse.json({ error: "unknown_action" }, { status: 400 });
  }

  const email = body.user?.email;
  if (!email) {
    return NextResponse.json({ error: "no_recipient" }, { status: 400 });
  }

  // Langue de l'utilisateur — la raison d'être de ce hook. Un compte tout juste
  // créé n'a pas encore de profil : le français est le défaut du marché visé.
  let locale: Locale = "fr";
  if (body.user?.id) {
    const { data: profile } = await createAdminClient()
      .from("profiles")
      .select("locale")
      .eq("id", body.user.id)
      .maybeSingle();
    if ((profile as { locale?: string } | null)?.locale === "en") locale = "en";
  }

  // Le changement d'adresse émet deux e-mails (ancienne et nouvelle adresse) et
  // chacun porte son propre jeton : prendre le mauvais rend le lien invalide.
  const isNewAddress = action === "email_change_new";
  const tokenHash =
    (isNewAddress ? data.token_hash_new : data.token_hash) ?? data.token_hash;
  const token = (isNewAddress ? data.token_new : data.token) ?? data.token;

  let link: string | undefined;
  if (mapping.otpType) {
    if (!tokenHash) {
      return NextResponse.json({ error: "no_token" }, { status: 400 });
    }
    // Origine dérivée des en-têtes du proxy : `request.url` porte l'adresse
    // interne du conteneur (cf. AGENTS.md).
    const origin = originFromHeaders(request.headers);
    const params = new URLSearchParams({
      token_hash: tokenHash,
      type: mapping.otpType,
      next: mapping.next,
    });
    link = `${origin}/auth/confirm?${params.toString()}`;
  }

  const { subject, html } = authEmail({
    kind: mapping.kind,
    locale,
    email,
    link,
    token,
    newEmail: body.user?.new_email,
  });

  const sent = await sendEmail({ to: email, subject, html });
  if (!sent.ok) {
    console.error(
      "[email-hook] envoi échoué (%s) : %s",
      action,
      sent.skipped ? "aucun fournisseur configuré" : sent.error,
    );
    return NextResponse.json({ error: "send_failed" }, { status: 500 });
  }

  return NextResponse.json({});
}
