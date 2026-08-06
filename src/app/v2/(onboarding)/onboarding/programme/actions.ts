"use server";

import { redirect } from "next/navigation";

import { v2Routes } from "@/features/v2/navigation/routes";
import { createClient } from "@/lib/supabase/server";

const ROUTES = v2Routes.programme.onboarding;

function valeur(formData: FormData, nom: string): string | null {
  const brut = formData.get(nom);
  if (typeof brut !== "string") return null;
  return brut.trim() || null;
}

/**
 * L'échec ne dit jamais ce que Postgres a dit — ADR-001. L'écran reçoit un
 * code fermé, le détail part dans le journal du serveur.
 */
function echec(chemin: string, contexte: string, erreur: unknown): never {
  console.error(`[v2 onboarding programme] ${contexte}`, erreur);
  redirect(`${chemin}?erreur=enregistrement`);
}

/** Étape 2 — l'organisation. `save_programme` la crée si elle n'existe pas. */
export async function enregistrerOrganisation(formData: FormData) {
  const nom = valeur(formData, "nom");
  if (!nom) redirect(`${ROUTES.organisation}?erreur=nom`);

  const supabase = await createClient();
  const { error } = await supabase.rpc("save_programme", {
    p_name: nom,
    p_type: valeur(formData, "type"),
    p_country: valeur(formData, "pays"),
    p_website: valeur(formData, "site"),
    p_volume: null,
  });

  if (error) echec(ROUTES.organisation, "save_programme", error);
  redirect(ROUTES.accompagnement);
}

/** Étape 3 — les façons d'accompagner. Plusieurs réponses possibles. */
export async function enregistrerAccompagnement(formData: FormData) {
  const focus = formData
    .getAll("accompagnement")
    .filter((item): item is string => typeof item === "string");

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_programme_focus", {
    p_focus: focus,
  });

  if (error) echec(ROUTES.accompagnement, "set_programme_focus", error);
  redirect(ROUTES.cohorte);
}

/**
 * Les mois donnés en clair par les deux listes de l'écran 00c.
 *
 * La base attend des dates : on prend le premier jour du mois de début et le
 * dernier du mois de fin. Une cohorte se pense en mois, pas en jours —
 * demander une date précise ferait inventer une réponse.
 */
const MOIS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

function enDate(libelle: string | null, finDuMois: boolean): string | null {
  if (!libelle) return null;
  const [mois, annee] = libelle.toLowerCase().split(" ");
  const rang = MOIS.indexOf(mois ?? "");
  if (rang < 0 || !/^\d{4}$/.test(annee ?? "")) return null;
  const jour = finDuMois
    ? new Date(Date.UTC(Number(annee), rang + 1, 0))
    : new Date(Date.UTC(Number(annee), rang, 1));
  return jour.toISOString().slice(0, 10);
}

/** Étape 4 — la première cohorte. */
export async function creerPremiereCohorte(formData: FormData) {
  const nom = valeur(formData, "nom");
  if (!nom) redirect(`${ROUTES.cohorte}?erreur=nom`);

  const places = Number(valeur(formData, "places") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.rpc("create_cohort", {
    p_name: nom,
    p_seats: Number.isSafeInteger(places) && places > 0 ? places : null,
    p_starts_on: enDate(valeur(formData, "debut"), false),
    p_ends_on: enDate(valeur(formData, "fin"), true),
    p_goal: null,
  });

  if (error) echec(ROUTES.cohorte, "create_cohort", error);
  redirect(ROUTES.pret);
}

/** « Créer ma cohorte plus tard » — on passe, sans rien écrire. */
export async function reporterLaCohorte() {
  redirect(ROUTES.pret);
}

/**
 * Étape 5 — l'espace est prêt.
 *
 * Clôt le tunnel, puis entre par la porte que le bouton nomme. Les deux mènent
 * au produit : c'est le seul endroit du parcours où l'on quitte l'inscription.
 */
export async function terminerOnboardingProgramme(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("finish_programme_onboarding");

  if (error) echec(ROUTES.pret, "finish_programme_onboarding", error);

  redirect(
    formData.get("destination") === "inviter"
      ? v2Routes.programme.cohortes.entreprises("saison-4-jour-1")
      : v2Routes.programme.cohortes.list,
  );
}
