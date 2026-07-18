import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FounderOnboarding } from "@/components/onboarding/FounderOnboarding";

export default async function FounderOnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  return <FounderOnboarding />;
}
