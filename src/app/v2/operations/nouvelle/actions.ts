"use server";

import { redirect } from "next/navigation";

import {
  intentCanCarryRaise,
  intentObjective,
} from "@/features/v2/domain/operation";
import { v2Routes } from "@/features/v2/navigation/routes";
import { createClient } from "@/lib/supabase/server";
import { messageDeRefus } from "@/features/v2/billing/limites";

function value(formData: FormData, name: string): string | null {
  const raw = formData.get(name);
  if (typeof raw !== "string") return null;
  const normalized = raw.trim();
  return normalized || null;
}

/** Intitulés de l'écran → valeurs de `raises.stade`. */
const STAGES: Record<string, string> = {
  "Pré-amorçage": "pre_seed",
  Amorçage: "seed",
  "Série A": "serie_a",
  "Série B et plus": "serie_b_plus",
};

/** « 500 000 000 » ou « 500.000.000 » → 500000000. */
function amount(raw: string | null): number | null {
  if (!raw) return null;
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return null;
  const parsed = Number(digits);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function back(formData: FormData, erreur: string): never {
  const params = new URLSearchParams({ etape: "structure", erreur });
  for (const name of [
    "type",
    "nom",
    "pays",
    "financeur",
    "stade",
    "montant",
    "devise",
    "tour",
    "horizon",
  ]) {
    const carried = value(formData, name);
    if (carried) params.set(name, carried);
  }
  redirect(`${v2Routes.operations.new}?${params}`);
}

export async function createOperation(formData: FormData) {
  const type = value(formData, "type") ?? "equity";
  const nom = value(formData, "nom");
  const structure = value(formData, "structure");

  if (!nom) back(formData, "nom");
  if (structure !== "recommandee" && structure !== "vide") back(formData, "structure");

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_data_room", {
    p_name: nom,
    p_objectif: intentObjective(type),
    p_template: structure === "recommandee",
  });

  if (error) {
    console.error("[v2 nouvelle-operation] create_data_room failed", error);
    // Un refus de plan n'est pas une panne : il se dit avec son issue, sinon
    // le fondateur croit à un bug et recommence.
    back(formData, messageDeRefus(error.message) ? "limite" : "enregistrement");
  }

  const id = (data as { id?: string } | null)?.id;
  if (!id) {
    console.error("[v2 nouvelle-operation] create_data_room: aucun id retourné");
    back(formData, "enregistrement");
  }

  const pays = value(formData, "pays");
  const stade = value(formData, "stade");

  // Pays et stade décrivent l'entreprise, pas l'opération : ils n'ont pas de
  // colonne sur `deals`. On les renvoie donc à `save_startup`, qui met à jour
  // partiellement — les champs laissés vides ne sont pas écrasés.
  if (pays || stade) {
    const { error: startupError } = await supabase.rpc("save_startup", {
      p_name: null,
      p_country: pays,
      p_sector: null,
      p_stage: stade,
      p_one_liner: null,
      p_amount: null,
      p_arr: null,
      p_objectif: null,
      p_horizon: null,
    });

    if (startupError) {
      // L'opération existe déjà : on ne la perd pas pour un champ secondaire.
      console.error("[v2 nouvelle-operation] save_startup failed", startupError);
    }
  }

  await openRaiseIfRequested(supabase, formData, { id, type, nom, stade });

  redirect(v2Routes.operations.root(id));
}

/**
 * La levée n'est ouverte que si le fondateur a renseigné au moins un de ses
 * détails. Créer une opération n'ouvre plus de levée d'office depuis le
 * découplage (`20260726200000_dataroom_sans_levee.sql`) : une diligence n'en
 * a pas, et même une levée en capital peut attendre. Le choix reste au
 * fondateur — remplir, ou laisser vide et y revenir plus tard.
 */
async function openRaiseIfRequested(
  supabase: Awaited<ReturnType<typeof createClient>>,
  formData: FormData,
  operation: { id: string; type: string; nom: string; stade: string | null },
): Promise<void> {
  if (!intentCanCarryRaise(operation.type)) return;

  const financeur = value(formData, "financeur");
  const montant = amount(value(formData, "montant"));
  const devise = value(formData, "devise");
  const tour = value(formData, "tour");
  const horizon = value(formData, "horizon");

  if (!financeur && montant === null && !devise && !tour && !horizon) return;

  const { error: raiseError } = await supabase.rpc("create_raise", {
    p_deal: operation.id,
    p_name: operation.nom,
  });

  if (raiseError) {
    console.error("[v2 nouvelle-operation] create_raise failed", raiseError);
    return;
  }

  const { error: saveError } = await supabase.rpc("save_raise", {
    p_deal: operation.id,
    p_montant_cible: montant,
    p_montant_engage: null,
    p_devise: devise,
    p_type_tour: tour,
    p_stade: operation.stade ? STAGES[operation.stade] ?? null : null,
    p_valorisation_pre: null,
    p_date_cloture: horizon,
    p_audience: financeur ? [financeur] : null,
    p_description: null,
  });

  if (saveError) {
    console.error("[v2 nouvelle-operation] save_raise failed", saveError);
  }
}
