"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Result = { ok: boolean; error?: string };

/** Étape 1 investisseur : type, organisation, ticket. */
export async function saveInvestorProfile(input: {
  investorType?: string;
  organisation?: string;
  ticket?: number | null;
  sectors?: string[];
  geographies?: string[];
  stages?: string[];
}): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("save_investor_profile", {
    p_type: input.investorType ?? null,
    p_org: input.organisation ?? null,
    p_ticket: input.ticket ?? null,
    p_sectors: input.sectors ?? null,
    p_geographies: input.geographies ?? null,
    p_stages: input.stages ?? null,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Fondateur : fiche startup + objectif + levée (upsert progressif). */
export async function saveStartup(input: {
  name?: string;
  country?: string;
  sector?: string;
  stage?: string;
  oneLiner?: string;
  amount?: number | null;
  arr?: number | null;
  /** 'levee' | 'diligence' — pilote l'écran et les données collectées. */
  objectif?: string;
  /** Trimestre de clôture visé — « Q4 2026 », « later »… */
  horizon?: string;
}): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("save_startup", {
    p_name: input.name ?? null,
    p_country: input.country ?? null,
    p_sector: input.sector ?? null,
    p_stage: input.stage ?? null,
    p_one_liner: input.oneLiner ?? null,
    p_amount: input.amount ?? null,
    p_arr: input.arr ?? null,
    p_objectif: input.objectif ?? null,
    p_horizon: input.horizon ?? null,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * Programme — étape 03 : structure. Crée l'organisation au premier appel,
 * la met à jour aux suivants. N'achève PAS l'onboarding (cf. migration) :
 * un abandon après cette étape ne perd rien, et le rechargement reprend ici.
 */
export async function saveProgramme(input: {
  name: string;
  type?: string;
  country?: string;
  website?: string;
  volume?: number | null;
}): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("save_programme", {
    p_name: input.name,
    p_type: input.type ?? null,
    p_country: input.country ?? null,
    p_website: input.website ?? null,
    p_volume: input.volume ?? null,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Programme — étape 04 : première cohorte. Renvoie son id pour l'étape 05. */
export async function createFirstCohort(input: {
  name: string;
  seats?: number | null;
  startsOn?: string | null;
  endsOn?: string | null;
  /**
   * Plusieurs objectifs, mêlant nos codes connus et les libellés libres du
   * programme. La base rogne, dédoublonne et plafonne — pas nous.
   */
  goals?: string[];
}): Promise<Result & { cohortId?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_cohort", {
    p_name: input.name,
    p_seats: input.seats ?? null,
    p_starts_on: input.startsOn ?? null,
    p_ends_on: input.endsOn ?? null,
    p_goals: input.goals ?? null,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, cohortId: (data as { id: string } | null)?.id };
}

/** Programme — étape 06 : bienvenue. Marque l'onboarding fini, puis /bienvenue. */
export async function finishProgrammeOnboarding(): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("finish_programme_onboarding", {});
  if (error) return { ok: false, error: error.message };
  redirect("/bienvenue");
}

/** Termine : crée l'espace de travail + marque onboardé, puis /bienvenue. */
/**
 * Termine l'inscription. `createRoom` décide si la data room (et la levée) est
 * créée dans la foulée : c'est un choix du fondateur, plus un automatisme.
 * À false, il arrive sur « PREMIER PAS · Créez votre data room » et choisit
 * lui-même le nom et le modèle de dossiers.
 */
export async function completeOnboarding(
  orgName: string,
  createRoom = true,
): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("complete_onboarding", {
    p_org_name: orgName,
    p_create_room: createRoom,
  });
  if (error) return { ok: false, error: error.message };
  redirect("/bienvenue");
}
