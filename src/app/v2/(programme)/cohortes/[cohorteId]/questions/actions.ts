"use server";

import { redirect } from "next/navigation";

import { v2Routes } from "@/features/v2/navigation/routes";
import { createClient } from "@/lib/supabase/server";

const ROUTES = v2Routes.programme.cohortes;

function valeur(formData: FormData, nom: string): string | null {
  const brut = formData.get(nom);
  if (typeof brut !== "string") return null;
  return brut.trim() || null;
}

/**
 * Envoyer une question ou une suggestion — écran 08.
 *
 * Le TYPE vient du formulaire et n'est pas deviné. `create_program_thread`
 * refuse toute valeur hors « question » et « suggestion » plutôt que de
 * retomber sur un défaut : une suggestion transformée en question attendrait
 * une réponse que l'entreprise ne doit à personne.
 */
export async function envoyerMessage(formData: FormData) {
  const cohorteId = valeur(formData, "cohorte");
  if (!cohorteId) redirect(ROUTES.list);

  const retour = ROUTES.questions(cohorteId);
  const entreprise = valeur(formData, "entreprise");
  const corps = valeur(formData, "corps");

  if (!entreprise) redirect(`${retour}?erreur=entreprise`);
  if (!corps) redirect(`${retour}?erreur=corps`);

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_program_thread", {
    p_body: corps,
    p_cohort: cohorteId,
    p_startup: entreprise,
    p_type: valeur(formData, "type") === "suggestion" ? "suggestion" : "question",
  });

  if (error) {
    // ADR-001 : l'écran reçoit un code fermé, le détail part au journal.
    console.error("[v2 questions] create_program_thread", error);
    redirect(`${retour}?erreur=envoi`);
  }

  redirect(retour);
}
