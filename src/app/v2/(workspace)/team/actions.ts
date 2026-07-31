"use server";

import { revalidatePath } from "next/cache";

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
};

function traduire(message: string): string {
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
