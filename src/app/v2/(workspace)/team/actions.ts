"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { role } from "@/features/v2/domain/equipe";
import {
  type CodeErreur,
  codeDepuisPostgres,
  echec,
  type Resultat,
} from "@/features/v2/domain/erreurs";
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

/**
 * Le dictionnaire local a rejoint le catalogue commun, où il est testé.
 *
 * Reste ce que le catalogue ne peut pas savoir : « droits insuffisants » se dit
 * mieux quand on sait de quel écran il vient. Ici, ce sont le propriétaire et
 * les administrateurs qui gèrent l'équipe — la formulation générale ne le dirait
 * pas, et c'est précisément ce que la personne a besoin de savoir.
 */
function codeEquipe(message: string): CodeErreur {
  const code = codeDepuisPostgres(message);
  return code === "droits.insuffisants" ? "equipe.droits_insuffisants" : code;
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
    return echec(codeEquipe(error.message));
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
    return echec(codeEquipe(error.message));
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
}): Promise<Resultat<{ link?: string; emailError?: string; emailSkipped?: boolean }>> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("invite_member", {
    p_org: input.organizationId,
    p_email: input.email.trim().toLowerCase(),
    p_role: input.role,
  });

  if (error) {
    console.error("[v2 équipe] invite_member échoué :", error);
    return echec(codeEquipe(error.message));
  }

  const ligne = (Array.isArray(data) ? data[0] : data) as {
    token: string;
  } | null;

  if (!ligne?.token) {
    return echec("equipe.invitation_non_creee");
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
    return echec(codeEquipe(error.message));
  }

  revalidatePath("/v2/team");
  return { ok: true };
}
