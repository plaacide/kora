import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shell/AppShell";
import { getCurrentDeal, getDealRole, getAnyRole } from "@/lib/current-deal";
import { personaFor } from "@/lib/persona";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/connexion");

  // Enforcement 2FA: si un facteur est vérifié, exiger aal2.
  const { data: aal } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel === "aal1" && aal?.nextLevel === "aal2") {
    redirect("/connexion/2fa");
  }

  const { data: membership } = await supabase
    .from("memberships")
    .select("org_id, organizations(name)")
    .eq("user_id", user?.id ?? "")
    .limit(1)
    .maybeSingle();

  if (!membership) redirect("/onboarding");

  const { deal, deals } = await getCurrentDeal(supabase);

  // L'organisation affichée, comme le rôle, est celle DU deal ouvert : un
  // utilisateur peut appartenir à plusieurs organisations, et afficher le nom
  // de l'une avec les données de l'autre serait trompeur.
  const { data: dealOrg } = deal
    ? await supabase
        .from("organizations")
        .select("name")
        .eq("id", deal.org_id)
        .maybeSingle()
    : { data: null };

  const orgName =
    dealOrg?.name ??
    (membership.organizations as { name?: string } | null)?.name ??
    "—";

  const role = deal
    ? await getDealRole(supabase, deal.org_id)
    : await getAnyRole(supabase);

  // Le métier de l'utilisateur décide du vocabulaire et des écrans proposés.
  // Lu ici, une seule fois, plutôt que dans chaque page.
  const { data: profil } = await supabase
    .from("profiles")
    .select("account_type")
    .eq("id", user.id)
    .maybeSingle();
  const persona = personaFor(
    (profil as { account_type?: string } | null)?.account_type,
    role,
  );

  return (
    <AppShell
      orgName={orgName}
      userEmail={user.email ?? ""}
      deals={deals}
      currentDealId={deal?.id ?? null}
      role={role}
      persona={persona}
    >
      {children}
    </AppShell>
  );
}
