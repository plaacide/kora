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
