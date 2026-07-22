"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Vitrine } from "@/lib/raise";

type Result = { ok: boolean; error?: string };

/**
 * Enregistre la levée EN COURS d'un deal (modal « Modifier la levée »).
 *
 * Écriture auditée côté base (RPC `save_raise`) : le client ne touche jamais la
 * table directement. Les montants sont des entiers (unité de la devise).
 */
export async function saveRaise(input: {
  dealId: string;
  montantCible?: number | null;
  montantEngage?: number | null;
  devise?: string;
  typeTour?: string;
  stade?: string;
  valorisationPre?: number | null;
  dateCloture?: string | null;
  audience?: string[];
  description?: string;
}): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("save_raise", {
    p_deal: input.dealId,
    p_montant_cible: input.montantCible ?? null,
    p_montant_engage: input.montantEngage ?? null,
    p_devise: input.devise ?? null,
    p_type_tour: input.typeTour ?? null,
    p_stade: input.stade ?? null,
    p_valorisation_pre: input.valorisationPre ?? null,
    p_date_cloture: input.dateCloture || null,
    p_audience: input.audience ?? null,
    p_description: input.description ?? null,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/deal");
  revalidatePath("/dashboard");
  return { ok: true };
}

/** Ajoute ou met à jour un investisseur du pipeline (id absent = création). */
export async function saveRaiseInvestor(input: {
  dealId: string;
  id?: string | null;
  nom?: string;
  organisation?: string;
  email?: string;
  ticket?: number | null;
  statut?: string;
}): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("save_raise_investor", {
    p_deal: input.dealId,
    p_id: input.id ?? null,
    p_nom: input.nom ?? null,
    p_organisation: input.organisation ?? null,
    p_email: input.email ?? null,
    p_ticket: input.ticket ?? null,
    p_statut: input.statut ?? null,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/deal");
  return { ok: true };
}

/** Retire un investisseur du pipeline. */
export async function deleteRaiseInvestor(id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_raise_investor", { p_id: id });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/deal");
  return { ok: true };
}

/** Clôture la levée en cours (elle passe en historique). */
export async function closeRaise(dealId: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("close_raise", { p_deal: dealId });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/deal");
  revalidatePath("/dashboard");
  return { ok: true };
}

/** Ouvre un nouveau tour : clôture l'actuel s'il existe, puis en crée un vierge. */
export async function openRaise(dealId: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("open_raise", { p_deal: dealId });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/deal");
  revalidatePath("/dashboard");
  return { ok: true };
}

/** Documente une levée ANTÉRIEURE à la plateforme (tour déjà clôturé). */
export async function addPastRaise(input: {
  dealId: string;
  montant?: number | null;
  stade?: string;
  devise?: string;
  date?: string | null;
  description?: string;
}): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("add_past_raise", {
    p_deal: input.dealId,
    p_montant: input.montant ?? null,
    p_stade: input.stade ?? null,
    p_devise: input.devise ?? null,
    p_date: input.date || null,
    p_description: input.description ?? null,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/deal");
  return { ok: true };
}

/** Supprime un tour (correction d'historique). */
export async function deleteRaise(id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_raise", { p_id: id });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/deal");
  return { ok: true };
}

/** Enregistre la vitrine d'indicateurs (par audience) de la levée en cours. */
export async function saveRaiseIndicators(
  dealId: string,
  indicateurs: Vitrine,
): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("save_raise_indicators", {
    p_deal: dealId,
    p_indicateurs: indicateurs,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/deal");
  return { ok: true };
}
