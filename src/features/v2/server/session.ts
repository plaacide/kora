import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { v2Routes } from "../navigation/routes";

export interface V2UserContext {
  id: string;
  email: string;
}

export interface V2WorkspaceContext {
  user: V2UserContext;
  organization: {
    id: string;
    name: string;
  };
}

export async function requireV2User(): Promise<V2UserContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(v2Routes.auth.login);

  const { data: assurance } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (
    assurance?.currentLevel === "aal1" &&
    assurance?.nextLevel === "aal2"
  ) {
    redirect(v2Routes.auth.twoFactor);
  }

  return {
    id: user.id,
    email: user.email ?? "",
  };
}

export async function requireV2Workspace(): Promise<V2WorkspaceContext> {
  const user = await requireV2User();
  const supabase = await createClient();
  const { data: membership } = await supabase
    .from("memberships")
    .select("org_id, organizations(name)")
    .eq("user_id", user.id)
    .order("created_at")
    .limit(1)
    .maybeSingle();

  if (!membership) redirect(v2Routes.onboarding.company);

  const organization = membership.organizations as {
    name?: string;
  } | null;

  return {
    user,
    organization: {
      id: membership.org_id,
      name: organization?.name ?? "—",
    },
  };
}

/**
 * Le métier du compte connecté — `founder`, `investor` ou `sae`.
 *
 * POURQUOI ELLE EXISTE. `/v2` envoyait TOUT LE MONDE sur l'accueil fondateur.
 * Un programme qui se connectait voyait donc les écrans d'une entreprise, et
 * son propre espace n'était atteignable qu'en tapant l'adresse à la main —
 * c'est-à-dire, pour celui qui l'utilise, qu'il n'existait pas.
 *
 * C'est la seule lecture de base que le parcours programme fait aujourd'hui,
 * et elle ne sert qu'à ORIENTER : aucun écran n'en dépend, les données restent
 * en dur jusqu'à ce que les maquettes soient toutes intégrées.
 */
export type MetierCompte = "founder" | "investor" | "sae";

export async function metierDuCompte(userId: string): Promise<MetierCompte> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("account_type")
    .eq("id", userId)
    .maybeSingle();

  const metier = data?.account_type;
  return metier === "sae" || metier === "investor" ? metier : "founder";
}
