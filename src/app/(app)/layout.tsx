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
