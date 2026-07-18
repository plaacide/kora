"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { clientIp } from "@/lib/security/rate-limit";
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

  // Origine réelle de la requête : marche en local comme sur Vercel.
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host") ?? "localhost:3000";
  const link = `${proto}://${host}/invitation/${token}`;

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
