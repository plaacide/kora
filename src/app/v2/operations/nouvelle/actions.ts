"use server";

import { redirect } from "next/navigation";

import { v2Routes } from "@/features/v2/navigation/routes";
import { createClient } from "@/lib/supabase/server";

function value(formData: FormData, name: string): string | null {
  const raw = formData.get(name);
  if (typeof raw !== "string") return null;
  const normalized = raw.trim();
  return normalized || null;
}

/**
 * Les six choix de l'écran « type » ne correspondent pas un-à-un aux quatre
 * valeurs `objectif` en base. Un choix sans correspondance retombe sur
 * `levee`, comme partout ailleurs dans le produit (cf. `onboarding/actions.ts`).
 */
const OBJECTIVES: Record<string, string> = {
  equity: "levee",
  debt: "dette",
  dfi: "dfi",
  diligence: "diligence",
  audit: "levee",
  other: "levee",
};

function back(type: string, nom: string, erreur: string): never {
  const params = new URLSearchParams({ etape: "structure", type, nom, erreur });
  redirect(`${v2Routes.operations.new}?${params}`);
}

export async function createOperation(formData: FormData) {
  const type = value(formData, "type") ?? "equity";
  const nom = value(formData, "nom");
  const structure = value(formData, "structure");

  if (!nom) back(type, "", "nom");
  if (structure !== "recommandee" && structure !== "vide") back(type, nom, "structure");

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_data_room", {
    p_name: nom,
    p_objectif: OBJECTIVES[type] ?? "levee",
    p_template: structure === "recommandee",
  });

  if (error) {
    console.error("[v2 nouvelle-operation] create_data_room failed", error);
    back(type, nom, "enregistrement");
  }

  const id = (data as { id?: string } | null)?.id;
  if (!id) {
    console.error("[v2 nouvelle-operation] create_data_room: aucun id retourné");
    back(type, nom, "enregistrement");
  }

  redirect(v2Routes.operations.root(id));
}
