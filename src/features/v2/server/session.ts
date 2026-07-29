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
