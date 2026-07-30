import "server-only";

import { createClient } from "@/lib/supabase/server";

/**
 * Ce que l'entreprise a déjà déclaré à l'onboarding.
 *
 * L'assistant de création d'opération pré-remplit son pays et son stade avec
 * ces valeurs plutôt que de les redemander : la maquette 56 le dit en toutes
 * lettres — « les informations permanentes sont réutilisées, vous ne referez
 * pas l'onboarding ».
 */
export interface CompanyDefaults {
  country: string;
  stage: string;
}

export async function companyDefaults(): Promise<CompanyDefaults> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { country: "", stage: "" };

  const { data } = await supabase
    .from("startups")
    .select("country, stage")
    .eq("owner_id", user.id)
    .maybeSingle();

  return {
    country: data?.country ?? "",
    stage: data?.stage ?? "",
  };
}
