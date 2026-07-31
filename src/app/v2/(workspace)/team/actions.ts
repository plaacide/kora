"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { messageDeRefus } from "@/features/v2/billing/limites";
import { role } from "@/features/v2/domain/equipe";
import { originFromHeaders } from "@/lib/app-origin";
import { teamInvitationEmail } from "@/lib/email/templates";
import { sendEmail } from "@/lib/email/send";
import { createClient } from "@/lib/supabase/server";

/**
 * Les gestes de l'équipe — écran 33.
 *
 * `memberships` est écrivable directement par owner et admin : ses politiques
 * le permettent. On passe quand même par des RPC, parce que trois règles ne
 * tiennent pas dans une politique — le dernier propriétaire, le retrait de
 * soi-même, et l'écriture au journal. Un UPDATE nu les contournerait toutes les
 * trois.
 */

type Resultat = { ok: boolean; error?: string };

/** Les messages de la base, dits en français à qui les lit. */
const MESSAGES: Record<string, string> = {
  "dernier propriétaire":
    "C’est le seul propriétaire. Nommez-en un autre avant de changer celui-ci — sinon plus personne ne pourrait administrer l’organisation.",
  "retrait de soi-même":
    "Vous ne pouvez pas vous retirer vous-même depuis cet écran.",
  "droits insuffisants":
    "Seuls le propriétaire et les administrateurs gèrent l’équipe.",
  "seul un propriétaire nomme un propriétaire":
    "Seul un propriétaire peut nommer un autre propriétaire.",
  "membre introuvable": "Ce collaborateur n’existe plus.",
  "déjà dans l’équipe": "Cette personne fait déjà partie de l’équipe.",
  "déjà dans l'équipe": "Cette personne fait déjà partie de l’équipe.",
  "adresse invalide": "Cette adresse e-mail n’est pas valide.",
  "rôle interne attendu": "Ce rôle n’est pas un rôle d’équipe.",
  "invitation introuvable ou déjà traitée":
    "Cette invitation a déjà été acceptée ou révoquée.",
};

function traduire(message: string): string {
  // Un refus de plan passe en premier : il porte son issue, là où les autres
  // messages ne font que constater.
  const limite = messageDeRefus(message);
  if (limite) return limite;

  const cle = Object.keys(MESSAGES).find((m) => message.includes(m));
  return cle ? MESSAGES[cle] : message;
}

export async function setV2MemberRole(input: {
  memberId: string;
  role: "owner" | "admin" | "member" | "internal_viewer";
}): Promise<Resultat> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("set_member_role", {
    p_member: input.memberId,
    p_role: input.role,
  });

  if (error) {
    console.error("[v2 équipe] set_member_role échoué :", error);
    return { ok: false, error: traduire(error.message) };
  }

  revalidatePath("/v2/team");
  return { ok: true };
}

export async function removeV2Member(input: {
  memberId: string;
}): Promise<Resultat> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("remove_member", {
    p_member: input.memberId,
  });

  if (error) {
    console.error("[v2 équipe] remove_member échoué :", error);
    return { ok: false, error: traduire(error.message) };
  }

  revalidatePath("/v2/team");
  return { ok: true };
}

/**
 * Inviter un collaborateur — écran 33.
 *
 * L'invitation existe en base AVANT l'e-mail, et l'échec de l'envoi ne
 * l'annule pas : le lien reste valide et transmissible à la main. C'est la
 * leçon de l'assistant de partage, où un envoi raté faisait croire qu'aucun
 * accès n'avait été créé alors qu'il l'était.
 */
export async function inviteV2Member(input: {
  organizationId: string;
  email: string;
  role: "owner" | "admin" | "member" | "internal_viewer";
}): Promise<Resultat & { link?: string; emailError?: string; emailSkipped?: boolean }> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("invite_member", {
    p_org: input.organizationId,
    p_email: input.email.trim().toLowerCase(),
    p_role: input.role,
  });

  if (error) {
    console.error("[v2 équipe] invite_member échoué :", error);
    return { ok: false, error: traduire(error.message) };
  }

  const ligne = (Array.isArray(data) ? data[0] : data) as {
    token: string;
  } | null;

  if (!ligne?.token) {
    return { ok: false, error: "L’invitation n’a pas pu être créée." };
  }

  // Derrière un proxy, `host` porte l'adresse d'écoute du conteneur et non le
  // domaine public : le lien partirait injoignable chez le destinataire.
  const link = `${originFromHeaders(await headers())}/v2/rejoindre-equipe?token=${ligne.token}`;

  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", input.organizationId)
    .maybeSingle();

  const { subject, html } = teamInvitationEmail({
    orgName: (org as { name: string } | null)?.name ?? "Sanza",
    roleLabel: role(input.role).label,
    link,
    locale: "fr",
  });

  const envoi = await sendEmail({ to: input.email, subject, html });

  revalidatePath("/v2/team");
  return {
    ok: true,
    link,
    emailSkipped: envoi.skipped,
    emailError: envoi.ok ? undefined : envoi.error,
  };
}

/** Révoquer une invitation non encore acceptée. */
export async function revokeV2Invitation(input: {
  invitationId: string;
}): Promise<Resultat> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("revoke_org_invitation", {
    p_id: input.invitationId,
  });

  if (error) {
    console.error("[v2 équipe] revoke_org_invitation échoué :", error);
    return { ok: false, error: traduire(error.message) };
  }

  revalidatePath("/v2/team");
  return { ok: true };
}
