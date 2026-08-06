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

/** ADR-001 : l'écran reçoit un code fermé, jamais le message de Postgres. */
function echec(chemin: string, contexte: string, erreur: unknown): never {
  console.error(`[v2 cohortes] ${contexte}`, erreur);
  redirect(`${chemin}?erreur=enregistrement`);
}

/** Créer une cohorte — écrans 01 et 02. */
export async function creerCohorte(formData: FormData) {
  const nom = valeur(formData, "nom");
  if (!nom) redirect(`${ROUTES.list}?erreur=nom`);

  const places = Number(valeur(formData, "places") ?? "");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_cohort", {
    p_name: nom,
    p_seats: Number.isSafeInteger(places) && places > 0 ? places : null,
    p_starts_on: valeur(formData, "debut"),
    p_ends_on: valeur(formData, "fin"),
    // `p_goals`, au PLURIEL et en tableau : une migration du 30 juillet a
    // remplacé l'objectif unique. Lire la première migration venue donne une
    // signature morte — PostgREST répond alors 404 sur une fonction qui
    // existe, et l'écran croit à une panne.
    p_goals: null,
  });

  if (error) echec(ROUTES.list, "create_cohort", error);
  // La cohorte créée est vide : on entre là où il y a quelque chose à faire.
  redirect(data?.id ? ROUTES.entreprises(data.id) : ROUTES.list);
}

/**
 * Inviter une entreprise — écran 04.
 *
 * Le NOM est facultatif et pourtant demandé : sans lui, l'écran d'acceptation
 * dit une adresse e-mail là où l'entreprise attend son nom.
 */
export async function inviterEntreprise(formData: FormData) {
  const cohorteId = valeur(formData, "cohorte");
  const email = valeur(formData, "email");
  const retour = cohorteId ? ROUTES.entreprises(cohorteId) : ROUTES.list;

  if (!email) redirect(`${retour}?erreur=email`);

  const supabase = await createClient();
  // DEUX ARGUMENTS, PAS TROIS. La migration du 31 juillet qui ajoute `p_name`
  // n'est pas appliquée sur staging : le dépôt est en avance sur la base. On
  // appelle ce qui EXISTE, et le nom saisi attend que la migration passe —
  // d'ici là, la liste affiche l'adresse, ce que `listerInvitations` prévoit.
  const { error } = await supabase.rpc("invite_to_cohort", {
    p_email: email,
    p_cohort: cohorteId,
  });

  if (error) echec(retour, "invite_to_cohort", error);
  redirect(retour);
}
