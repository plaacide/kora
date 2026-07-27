"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { originFromHeaders } from "@/lib/app-origin";
import { sendEmail } from "@/lib/email/send";
import { showcaseInviteEmail } from "@/lib/email/templates";

/**
 * Actions du dealroom, côté programme.
 *
 * Toutes passent par des RPC `security definer` qui portent leurs propres
 * gardes : la règle du dépôt interdit l'écriture directe depuis le client, et
 * ici elle protège davantage qu'une convention — c'est le consentement des
 * entreprises qui est en jeu.
 */

export interface Resultat {
  ok: boolean;
  error?: string;
  /** Nombre d'entreprises réellement publiées. */
  n?: number;
}

/**
 * Met à jour la vitrine d'une cohorte.
 *
 * Les deux conditions — consentement vivant ET dossier entamé — sont vérifiées
 * DANS la base, pas ici : une garde côté écran se contourne. Cette fonction
 * peut donc publier moins d'entreprises qu'on ne lui en passe, et c'est voulu.
 * Le nombre renvoyé est celui des publications réelles.
 */
export async function publierVitrine(
  cohorteId: string,
  startupOrgIds: string[],
): Promise<Resultat> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("publish_showcase", {
    p_cohort: cohorteId,
    p_startups: startupOrgIds,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/cohortes/${cohorteId}`);
  return { ok: true, n: typeof data === "number" ? data : 0 };
}

/** Retire une fiche de la vitrine. NE RÉVOQUE AUCUN ACCÈS déjà accordé. */
export async function depublier(
  cohorteId: string,
  startupOrgId: string,
): Promise<Resultat> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("showcase_entries")
    .update({ unpublished_at: new Date().toISOString() })
    .eq("cohort_id", cohorteId)
    .eq("startup_org_id", startupOrgId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/cohortes/${cohorteId}`);
  revalidatePath("/dealroom");
  return { ok: true };
}

/**
 * Poser une question ou laisser une suggestion à une entreprise.
 *
 * DEUX OBJETS, pas un fil de discussion : une question attend une réponse, une
 * suggestion n'attend rien. Les règles §9 refusent explicitement le chat libre
 * — un fil non lu est une dette.
 */
export async function ecrireAEntreprise(input: {
  cohorteId: string;
  startupOrgId: string;
  type: "question" | "suggestion";
  body: string;
}): Promise<Resultat> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: cohorte } = await supabase
    .from("cohorts")
    .select("org_id")
    .eq("id", input.cohorteId)
    .maybeSingle();
  if (!cohorte) return { ok: false, error: "cohorte introuvable" };

  const { error } = await supabase.from("program_threads").insert({
    program_org_id: (cohorte as { org_id: string }).org_id,
    startup_org_id: input.startupOrgId,
    type: input.type,
    body: input.body.trim(),
    // Une suggestion naît « ouverte » comme une question ; c'est l'affichage
    // côté startup qui la passera « lue ». On ne présume pas de sa lecture.
    author: user?.id ?? null,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/cohortes/${input.cohorteId}`);
  return { ok: true };
}

export interface InvitationResultat extends Resultat {
  /** Le lien reste utilisable à la main quand l'e-mail n'est pas parti. */
  link?: string;
  emailSkipped?: boolean;
  emailError?: string;
}

/**
 * Le programme ouvre sa vitrine à un investisseur, nominativement.
 *
 * PAS DE LIEN ANONYME, c'est la règle §4 : la vitrine n'est pas publique, elle
 * n'est pas indexée, et l'accès est lié à une ADRESSE. Le jeton seul ne suffit
 * pas — `accept_showcase_invite` refuse si l'adresse du compte connecté n'est
 * pas celle invitée. Un lien qui fuite ne donne donc rien.
 *
 * Comme pour les invitations de cohorte, un échec d'envoi n'annule pas
 * l'invitation : elle existe en base, et le lien reste transmissible à la main.
 */
export async function inviterVitrine(
  cohorteId: string,
  email: string,
): Promise<InvitationResultat> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("invite_to_showcase", {
    p_cohort: cohorteId,
    p_email: email,
  });
  if (error) return { ok: false, error: error.message };

  const acces = data as { token: string };

  // `originFromHeaders` et non `request.url` : le lien part chez un tiers, et
  // derrière le proxy l'URL de la requête porte `0.0.0.0:8080` (cf. AGENTS.md).
  const link = `${originFromHeaders(await headers())}/vitrine/rejoindre/${acces.token}`;

  const { data: cohorte } = await supabase
    .from("cohorts")
    .select("name, organizations(name)")
    .eq("id", cohorteId)
    .maybeSingle();

  const { subject, html } = showcaseInviteEmail({
    saeName:
      (cohorte?.organizations as unknown as { name?: string } | null)?.name ??
      "Un programme",
    cohortName: (cohorte as { name?: string } | null)?.name ?? "—",
    link,
    locale: (await getLocale()) as "fr" | "en",
  });

  const sent = await sendEmail({ to: email, subject, html });

  revalidatePath("/dealroom");
  return {
    ok: true,
    link,
    emailSkipped: sent.skipped,
    emailError: sent.ok ? undefined : sent.error,
  };
}

/**
 * Ferme la vitrine à un investisseur.
 *
 * NE TOUCHE À AUCUN ACCÈS DE DATA ROOM. Si cette personne a obtenu l'accès à
 * une salle par une demande acceptée, cet accès a été accordé par l'ENTREPRISE
 * et vit ailleurs (`memberships`, `permissions`). Le programme n'a pas à le
 * reprendre depuis son écran de vitrine : ce serait défaire la décision d'un
 * tiers sans qu'il en soit informé.
 */
export async function revoquerAccesVitrine(id: string): Promise<Resultat> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("revoke_showcase_access", { p_id: id });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dealroom");
  return { ok: true };
}
