import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProgrammeOnboarding } from "@/components/onboarding/ProgrammeOnboarding";

export default async function ProgrammeOnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  return <ProgrammeOnboarding />;
}
