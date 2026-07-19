"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { originFromHeaders } from "@/lib/app-origin";
import { sendEmail } from "@/lib/email/send";
import { cohortInviteEmail } from "@/lib/email/templates";

export interface CohorteResult {
  ok: boolean;
  link?: string;
  /** L'email n'est pas parti : l'appelant doit proposer le lien à copier. */
  emailSkipped?: boolean;
  emailError?: string;
  error?: string;
}

/** Le programme invite une startup à rejoindre sa cohorte. */
export async function inviteToCohort(email: string): Promise<CohorteResult> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("invite_to_cohort", {
    p_email: email,
  });
  if (error) return { ok: false, error: error.message };

  const lien = data as { token: string; sae_org_id: string };

  // `originFromHeaders` et non `host` : le lien part par e-mail chez un tiers,
  // rien ne le ramène vers nous s'il est faux (cf. AGENTS.md).
  const link = `${originFromHeaders(await headers())}/rejoindre/${lien.token}`;

  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", lien.sae_org_id)
    .maybeSingle();

  const { subject, html } = cohortInviteEmail({
    saeName: (org as { name?: string } | null)?.name ?? "Un programme",
    link,
    locale: (await getLocale()) as "fr" | "en",
  });

  const sent = await sendEmail({ to: email, subject, html });

  // Comme pour les invitations investisseur : un échec d'envoi n'invalide pas
  // le rattachement, qui existe en base. Le lien reste transmissible à la main.
  revalidatePath("/cohorte");
  return {
    ok: true,
    link,
    emailSkipped: sent.skipped,
    emailError: sent.ok ? undefined : sent.error,
  };
}

/** Le fondateur accepte : c'est lui, et lui seul, qui engage sa startup. */
export async function acceptCohortLink(
  token: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("accept_cohort_link", {
    p_token: token,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard");
  return { ok: true };
}

/** Rompre le lien — des deux côtés, le programme comme la startup. */
export async function revokeCohortLink(
  linkId: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("revoke_cohort_link", {
    p_link: linkId,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/cohorte");
  revalidatePath("/portefeuille");
  return { ok: true };
}
