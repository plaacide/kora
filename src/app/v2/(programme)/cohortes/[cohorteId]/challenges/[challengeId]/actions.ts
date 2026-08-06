"use server";

import { redirect } from "next/navigation";

import { v2Routes } from "@/features/v2/navigation/routes";
import { createClient } from "@/lib/supabase/server";

const ROUTES = v2Routes.programme.cohortes;

/**
 * Assigner un Challenge — écran 13.
 *
 * Un Challenge EXISTANT s'assigne à tout moment à de nouvelles entreprises,
 * sans le recréer : c'est ce que dit la maquette, et pourquoi cet écran est
 * atteignable depuis la liste comme depuis le suivi.
 *
 * `assign_challenge` filtre elle-même sur les membres de la cohorte, et
 * n'ajoute jamais deux fois la même. On peut donc renvoyer une sélection qui
 * contient déjà des entreprises assignées — c'est exactement ce que fait
 * l'écran quand on coche « toute la cohorte ».
 */
export async function assignerChallenge(formData: FormData) {
  const cohorteId = formData.get("cohorte");
  const challengeId = formData.get("challenge");

  if (typeof cohorteId !== "string" || typeof challengeId !== "string") {
    redirect(ROUTES.list);
  }

  const retour = ROUTES.challenge(cohorteId, challengeId);
  const entreprises = formData
    .getAll("entreprise")
    .filter((v): v is string => typeof v === "string" && v.length > 0);

  if (entreprises.length === 0) {
    redirect(`${retour}?assigner=1&erreur=aucune`);
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("assign_challenge", {
    p_challenge: challengeId,
    p_startups: entreprises,
  });

  if (error) {
    // ADR-001 : l'écran reçoit un code fermé, le détail part au journal.
    console.error("[v2 challenges] assign_challenge", error);
    redirect(`${retour}?assigner=1&erreur=assignation`);
  }

  redirect(retour);
}
