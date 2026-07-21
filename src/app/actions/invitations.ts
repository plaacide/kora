"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { originFromHeaders } from "@/lib/app-origin";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";
import { sendEmail } from "@/lib/email/send";
import { invitationEmail } from "@/lib/email/templates";
import type { Level } from "@/lib/permissions";

export interface InviteResult {
  ok: boolean;
  token?: string;
  link?: string;
  /** L'email n'est pas parti : l'appelant doit proposer le lien à copier. */
  emailSkipped?: boolean;
  emailError?: string;
  error?: string;
}

export async function createInvitation(input: {
  dealId: string;
  email: string;
  ndaRequired: boolean;
  level: Level;
  expiresAt?: string | null;
}): Promise<InviteResult> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("create_invitation", {
    p_deal: input.dealId,
    p_email: input.email,
    p_nda_required: input.ndaRequired,
    p_level: input.level,
    p_expires: input.expiresAt || null,
  });

  if (error) return { ok: false, error: error.message };

  const invitation = data as { token: string; deal_id: string };
  const token = invitation.token;

  // Derrière Traefik, `host` porte l'adresse d'écoute du conteneur
  // (`0.0.0.0:8080`), pas le domaine public : le lien partait injoignable.
  // C'est le domaine public qui compte ici plus qu'ailleurs — le lien part
  // par e-mail chez un tiers, et rien ne le ramène vers nous s'il est faux.
  const link = `${originFromHeaders(await headers())}/invitation/${token}`;

  const { data: deal } = await supabase
    .from("deals")
    .select("name, organizations(name)")
    .eq("id", input.dealId)
    .maybeSingle();

  const orgName =
    (deal?.organizations as unknown as { name?: string } | null)?.name ?? "Sanza";
  const locale = (await getLocale()) as "fr" | "en";

  const { subject, html } = invitationEmail({
    orgName,
    dealName: deal?.name ?? "",
    link,
    ndaRequired: input.ndaRequired,
    locale,
  });

  const sent = await sendEmail({ to: input.email, subject, html });

  // L'échec d'envoi ne doit PAS invalider l'invitation : elle existe en base
  // et le lien reste utilisable. On le remonte pour transmission manuelle.
  revalidatePath("/invitations");
  return {
    ok: true,
    token,
    link,
    emailSkipped: sent.skipped,
    emailError: sent.ok ? undefined : sent.error,
  };
}

/**
 * Créer son accès depuis une invitation — pour un invité qui n'a PAS de compte.
 *
 * Le blocage résolu : un investisseur invité arrivait sur la page, on lui
 * demandait de se connecter, mais il n'avait ni compte ni mot de passe. Le
 * renvoyer vers l'inscription générique imposait un SECOND e-mail de
 * confirmation à l'adresse qui venait justement de recevoir l'invitation —
 * une friction absurde.
 *
 * Le compte est donc créé ici, e-mail pré-confirmé. Ce n'est pas un trou de
 * sécurité : le jeton d'invitation est non devinable et a été envoyé À cette
 * adresse ; le posséder démontre l'accès à la boîte, exactement ce qu'un
 * e-mail de confirmation vérifierait. C'est le modèle « invitation = compte
 * pré-vérifié » de GitHub ou Slack.
 */
export async function createInvitedAccount(input: {
  token: string;
  fullName: string;
  password: string;
}): Promise<{ ok: boolean; error?: string; exists?: boolean }> {
  const ip = await clientIp();
  if (!rateLimit(`invite-signup:${ip}`, 6, 60 * 60 * 1000).ok) {
    return { ok: false, error: "too_many_attempts" };
  }

  const nom = input.fullName.trim();
  if (nom.length < 2) return { ok: false, error: "name_too_short" };
  const pwd = input.password;
  if (pwd.length < 8 || !/[a-zA-Z]/.test(pwd) || !/[0-9]/.test(pwd)) {
    return { ok: false, error: "weak_password" };
  }

  const supabase = await createClient();

  // Le jeton décide de l'e-mail : l'invité ne le choisit pas, il ne peut donc
  // pas se créer un accès pour une autre adresse que celle invitée.
  const { data: rows } = await supabase.rpc("invitation_public", {
    p_token: input.token,
  });
  const invite = (rows as unknown as Array<{
    email: string;
    valid: boolean;
  }> | null)?.[0];
  if (!invite || !invite.valid) return { ok: false, error: "invalid_invitation" };

  const locale = (await getLocale()) as "fr" | "en";
  const admin = createAdminClient();

  const { data: created, error } = await admin.auth.admin.createUser({
    email: invite.email,
    password: pwd,
    email_confirm: true,
    user_metadata: { full_name: nom, locale, account_type: "investor" },
  });

  if (error) {
    // Adresse déjà connue : on n'écrase pas un compte, on invite à se connecter.
    if (/already|registered|exist/i.test(error.message)) {
      return { ok: false, exists: true };
    }
    return { ok: false, error: error.message };
  }

  // Le déclencheur a créé le profil sans métier : on le pose à « investisseur ».
  if (created.user) {
    await admin
      .from("profiles")
      .update({ account_type: "investor" })
      .eq("id", created.user.id);
  }

  // Connexion immédiate : pose les cookies de session pour que le retour sur la
  // page d'invitation trouve un utilisateur authentifié et ouvre la porte NDA.
  const { error: signErr } = await supabase.auth.signInWithPassword({
    email: invite.email,
    password: pwd,
  });
  if (signErr) return { ok: false, error: signErr.message };

  return { ok: true };
}

/**
 * Signature du NDA + ouverture de l'accès.
 * IP et user-agent sont capturés côté serveur : ils font partie de la preuve
 * et ne doivent pas être déclarés par le client.
 */
export async function acceptInvitation(input: {
  token: string;
  signerName: string;
}): Promise<{ ok: boolean; dealId?: string; error?: string }> {
  const supabase = await createClient();
  const h = await headers();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "not_authenticated" };

  const { data, error } = await supabase.rpc("accept_invitation", {
    p_token: input.token,
    p_signer_name: input.signerName,
    p_ip: await clientIp(),
    p_user_agent: h.get("user-agent") ?? null,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/data-room");
  return { ok: true, dealId: data as string };
}
