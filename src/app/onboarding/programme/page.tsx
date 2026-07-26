import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProgrammeOnboarding } from "@/components/onboarding/ProgrammeOnboarding";

/**
 * Reprise (spec §8) : chaque étape enregistre, donc le rechargement doit
 * reprendre où l'on s'est arrêté. On le déduit de l'état réel — pas d'un cookie :
 *   - aucune organisation  → étape 03 (structure) ;
 *   - organisation, aucune cohorte → étape 04 ;
 *   - au moins une cohorte  → étape 05 (invitations).
 */
export default async function ProgrammeOnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const { data: mem } = await supabase
    .from("memberships")
    .select("org_id, organizations(name, cohort_limit)")
    .eq("user_id", user.id)
    .order("created_at")
    .limit(1)
    .maybeSingle();

  let initialStep = 1;
  let initialName = "";
  let defaultSeats = 10;

  const orgId = (mem as { org_id?: string } | null)?.org_id;
  if (orgId) {
    const org = (mem as { organizations?: { name?: string; cohort_limit?: number } })
      .organizations;
    initialName = org?.name ?? "";
    defaultSeats = org?.cohort_limit ?? 10;

    const { count } = await supabase
      .from("cohorts")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId);
    initialStep = (count ?? 0) > 0 ? 3 : 2;
  }

  return (
    <ProgrammeOnboarding
      initialStep={initialStep}
      initialName={initialName}
      defaultSeats={defaultSeats}
    />
  );
}
