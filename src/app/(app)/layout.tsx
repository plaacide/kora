import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shell/AppShell";

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
    .limit(1)
    .maybeSingle();

  if (!membership) redirect("/onboarding");

  const orgName =
    (membership.organizations as { name?: string } | null)?.name ?? "—";

  return (
    <AppShell orgName={orgName} userEmail={user.email ?? ""}>
      {children}
    </AppShell>
  );
}
