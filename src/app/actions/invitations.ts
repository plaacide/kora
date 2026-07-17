"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { clientIp } from "@/lib/security/rate-limit";
import type { Level } from "@/lib/permissions";

export async function createInvitation(input: {
  dealId: string;
  email: string;
  ndaRequired: boolean;
  level: Level;
  expiresAt?: string | null;
}): Promise<{ ok: boolean; token?: string; error?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("create_invitation", {
    p_deal: input.dealId,
    p_email: input.email,
    p_nda_required: input.ndaRequired,
    p_level: input.level,
    p_expires: input.expiresAt || null,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/invitations");
  return { ok: true, token: (data as { token?: string })?.token };
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
