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

/**
 * Le programme invite une startup à rejoindre sa cohorte.
 *
 * `cohortId` cible une cohorte nommée (étape 05 de l'onboarding, ou depuis le
 * détail d'une cohorte). Absent, l'invitation reste rattachée au programme sans
 * cohorte précise — le flux général existant.
 */
export async function inviteToCohort(
  email: string,
  cohortId?: string,
  nom?: string,
): Promise<CohorteResult> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("invite_to_cohort", {
    p_email: email,
    p_cohort: cohortId ?? null,
    p_name: nom?.trim() || null,
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
  revalidatePath("/cohortes");
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
  revalidatePath("/cohortes");
  revalidatePath("/portefeuille");
  return { ok: true };
}

/**
 * Relance une invitation restée sans réponse : même lien, échéance repoussée.
 *
 * Le jeton ne change pas. Un invité qui a gardé le premier e-mail doit pouvoir
 * s'en servir — lui invalider son lien parce qu'on lui en a renvoyé un serait
 * le punir d'avoir tardé.
 */
export async function relancerInvitation(
  linkId: string,
): Promise<CohorteResult> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("relaunch_cohort_link", {
    p_link: linkId,
  });
  if (error) return { ok: false, error: error.message };

  const link = `${originFromHeaders(await headers())}/rejoindre/${data as string}`;

  // Le destinataire et le nom du programme : la RPC ne rend que le jeton, et
  // la RLS autorise ici la lecture — l'appelant est membre du programme.
  const { data: lien } = await supabase
    .from("cohort_links")
    .select("email, sae_org_id")
    .eq("id", linkId)
    .maybeSingle();
  const l = lien as { email: string; sae_org_id: string } | null;

  const { data: org } = l
    ? await supabase
        .from("organizations")
        .select("name")
        .eq("id", l.sae_org_id)
        .maybeSingle()
    : { data: null };

  const { subject, html } = cohortInviteEmail({
    saeName: (org as { name?: string } | null)?.name ?? "Un programme",
    link,
    locale: (await getLocale()) as "fr" | "en",
  });

  const sent = l ? await sendEmail({ to: l.email, subject, html }) : { ok: false, skipped: true, error: undefined };

  revalidatePath("/cohortes");
  return {
    ok: true,
    link,
    emailSkipped: sent.skipped,
    emailError: sent.ok ? undefined : sent.error,
  };
}

/**
 * Relance TOUTES les invitations en attente d'une cohorte — « Relancer tout le
 * monde » de l'écran 09.
 *
 * La base fait la mise à jour et rend la liste ; on n'envoie que les e-mails.
 * Boucler sur la relance unitaire depuis le navigateur aurait multiplié les
 * allers-retours et laissé le travail à moitié fait si l'onglet se ferme.
 */
export async function relancerToutes(
  cohorteId: string,
): Promise<{ ok: boolean; n?: number; error?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("relaunch_cohort_links", {
    p_cohort: cohorteId,
  });
  if (error) return { ok: false, error: error.message };

  const liens = (data ?? []) as Array<{
    email: string; company_name: string | null; token: string;
  }>;
  if (liens.length === 0) return { ok: true, n: 0 };

  const origine = originFromHeaders(await headers());
  const locale = (await getLocale()) as "fr" | "en";

  const { data: cohorte } = await supabase
    .from("cohorts")
    .select("organizations(name)")
    .eq("id", cohorteId)
    .maybeSingle();
  const saeName =
    (cohorte?.organizations as unknown as { name?: string } | null)?.name ??
    "Un programme";

  // En série, pas en parallèle : Resend limite le débit, et une rafale de
  // quinze envois simultanés se fait écrêter — on perdrait des relances sans
  // le voir.
  for (const l of liens) {
    const { subject, html } = cohortInviteEmail({
      saeName,
      link: `${origine}/rejoindre/${l.token}`,
      locale,
    });
    await sendEmail({ to: l.email, subject, html });
  }

  revalidatePath("/cohortes");
  return { ok: true, n: liens.length };
}
