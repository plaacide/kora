import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InvestorOnboarding } from "@/components/onboarding/InvestorOnboarding";

export default async function InvestorOnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const firstName = (profile?.full_name ?? "").split(" ")[0] || "";
  return <InvestorOnboarding firstName={firstName} />;
}
