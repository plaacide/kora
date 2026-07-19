import "server-only";
import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getCurrentDeal, getDealRole, getAnyRole } from "@/lib/current-deal";
import { personaFor, type Persona } from "@/lib/persona";

/**
 * Métier de l'utilisateur courant, pour un composant serveur.
 *
 * Enveloppé dans `cache()` de React : chaque écran a besoin du métier pour
 * choisir son vocabulaire, et sans mémoïsation la même requête serait rejouée
 * dix fois par rendu. `cache()` la limite à une par requête HTTP.
 */
export const getPersona = cache(
  async (supabase: SupabaseClient): Promise<Persona> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return "fund";

    const { deal } = await getCurrentDeal(supabase);
    const role = deal
      ? await getDealRole(supabase, deal.org_id)
      : await getAnyRole(supabase);

    const { data: profil } = await supabase
      .from("profiles")
      .select("account_type")
      .eq("id", user.id)
      .maybeSingle();

    return personaFor(
      (profil as { account_type?: string } | null)?.account_type,
      role,
    );
  },
);
