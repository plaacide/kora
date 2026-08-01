"use server";

import { redirect } from "next/navigation";

import {
  intentObjective,
  objectifPorteFinancement,
} from "@/features/v2/domain/operation";
import { v2Routes } from "@/features/v2/navigation/routes";
import { createClient } from "@/lib/supabase/server";

function value(formData: FormData, name: string): string | null {
  const raw = formData.get(name);
  if (typeof raw !== "string") return null;
  const normalized = raw.trim();
  return normalized || null;
}

function amount(valueToParse: string | null): number | null {
  if (!valueToParse) return null;
  const normalized = valueToParse.replace(/[^\d]/g, "");
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function fail(path: string, context: string, error: unknown): never {
  console.error(`[v2 onboarding] ${context}`, error);
  redirect(`${path}?erreur=enregistrement`);
}

export async function saveV2Company(formData: FormData) {
  const name = value(formData, "companyName");
  if (!name) redirect(`${v2Routes.onboarding.company}?erreur=nom`);

  const supabase = await createClient();
  const { error } = await supabase.rpc("save_startup", {
    p_name: name,
    p_country: value(formData, "country"),
    p_sector: value(formData, "sector"),
    p_stage: value(formData, "stage"),
    p_one_liner: value(formData, "description"),
    p_amount: null,
    p_arr: null,
    p_objectif: null,
    p_horizon: null,
  });

  if (error) fail(v2Routes.onboarding.company, "company save failed", error);
  redirect(v2Routes.onboarding.operation);
}

/**
 * Les quatre objectifs de l'écran, tels que la base les enregistre.
 *
 * Un objectif inconnu retombe sur `levee`, comme le garde-fou de
 * `save_startup` : mieux vaut la valeur par défaut qu'un enregistrement refusé.
 */
export async function saveV2Objective(formData: FormData) {
  const selected = value(formData, "objective");
  const objective =
    formData.get("skipObjective") === "1"
      ? null
      // `?? "equity"` A DISPARU. Il enregistrait « Lever en capital » pour
      // quelqu'un qui n'avait rien choisi — le navigateur bloque désormais
      // l'envoi, mais un formulaire peut toujours arriver sans le champ.
      // Retomber sur une valeur revient à décider à la place du fondateur.
      : intentObjective(selected);
  if (objective === null && formData.get("skipObjective") !== "1") {
    redirect(`${v2Routes.onboarding.operation}?erreur=objectif`);
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("save_startup", {
    p_name: null,
    p_country: null,
    p_sector: null,
    p_stage: null,
    p_one_liner: null,
    p_amount: null,
    p_arr: null,
    p_objectif: objective,
    p_horizon: null,
  });

  if (error) fail(v2Routes.onboarding.operation, "objective save failed", error);

  // L'ÉTAPE « DÉTAILS » NE CONCERNE QUE CE QUI SE FINANCE. Elle demandait un
  // montant et un stade de levée à tout le monde, y compris à qui prépare un
  // audit — et `complete_onboarding` jetait ces réponses, puisqu'elle n'ouvre
  // une levée que pour levee, dette et dfi. La data room existe sans levée :
  // le tunnel doit le refléter.
  if (objective && objectifPorteFinancement(objective)) {
    redirect(v2Routes.onboarding.details);
  }
  redirect(v2Routes.onboarding.result);
}

export async function saveV2Details(formData: FormData) {
  if (formData.get("skipDetails") !== "1") {
    const supabase = await createClient();
    const { error } = await supabase.rpc("save_startup", {
      p_name: null,
      p_country: null,
      p_sector: null,
      // `p_stage` PORTE LA MATURITÉ DE L'ENTREPRISE, pas le stade du tour. Les
      // deux écrivaient ici la même colonne : le dernier enregistré écrasait
      // l'autre, et leurs listes ne coïncidaient même pas.
      p_stage: null,
      p_modalite: value(formData, "modalite"),
      p_one_liner: null,
      p_amount: amount(value(formData, "targetAmount")),
      // La devise était saisie puis jetée : aucun paramètre ne la portait.
      p_devise: value(formData, "currency"),
      p_arr: null,
      p_objectif: null,
      p_horizon: value(formData, "targetDate"),
    });

    if (error) fail(v2Routes.onboarding.details, "details save failed", error);
  }

  redirect(v2Routes.onboarding.result);
}

export async function completeV2Onboarding(formData: FormData) {
  const destination =
    formData.get("destination") === "overview" ? "overview" : "preparation";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(v2Routes.auth.login);

  const { data: startup, error: startupError } = await supabase
    .from("startups")
    .select("name")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (startupError) {
    fail(v2Routes.onboarding.result, "startup lookup failed", startupError);
  }
  if (!startup?.name?.trim()) redirect(v2Routes.onboarding.company);

  const { error: profileError } = await supabase.rpc("set_account_type", {
    p_type: "founder",
  });
  if (profileError) {
    fail(v2Routes.onboarding.result, "founder profile update failed", profileError);
  }

  const { data: orgId, error: completionError } = await supabase.rpc(
    "complete_onboarding",
    {
      p_org_name: startup.name,
      p_create_room: true,
    },
  );
  if (completionError) {
    fail(v2Routes.onboarding.result, "workspace creation failed", completionError);
  }

  const { data: operation, error: operationError } = await supabase
    .from("deals")
    .select("id")
    .eq("org_id", orgId)
    .order("created_at")
    .limit(1)
    .maybeSingle();

  if (operationError || !operation) {
    fail(
      v2Routes.onboarding.result,
      "operation lookup failed",
      operationError ?? new Error("No operation created"),
    );
  }

  redirect(
    destination === "overview"
      ? v2Routes.operations.overview(operation.id)
      : v2Routes.operations.preparation(operation.id),
  );
}
