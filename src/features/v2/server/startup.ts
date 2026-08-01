import "server-only";

import { createClient } from "@/lib/supabase/server";

/**
 * Ce que l'entreprise a déjà déclaré à l'onboarding.
 *
 * L'assistant de création d'opération pré-remplit son pays et son stade avec
 * ces valeurs plutôt que de les redemander : la maquette 56 le dit en toutes
 * lettres — « les informations permanentes sont réutilisées, vous ne referez
 * pas l'onboarding ».
 */
export interface CompanyDefaults {
  country: string;
  stage: string;
}

/**
 * Tout ce que l'onboarding a déjà enregistré, pour le réafficher.
 *
 * POURQUOI. Chaque étape écrit en base par `save_startup`, mais aucun écran ne
 * relisait : revenir à l'étape précédente montrait des champs vides, et le
 * fondateur croyait avoir tout perdu. Il ressaisissait — ou abandonnait.
 *
 * Ce n'est PAS un retour des valeurs par défaut. Un champ jamais rempli reste
 * vide ; on ne réaffiche que ce que la personne a elle-même donné.
 */
export interface SaisieOnboarding {
  nom: string;
  pays: string;
  secteur: string;
  stade: string;
  description: string;
  objectif: string;
  montant: string;
  devise: string;
  /** Le « comment » du financement — son vocabulaire dépend de l'objectif. */
  modalite: string;
  horizon: string;
  formeJuridique: string;
  immatriculation: string;
  siteWeb: string;
}

const VIDE: SaisieOnboarding = {
  nom: "", pays: "", secteur: "", stade: "",
  description: "", objectif: "", montant: "", devise: "", modalite: "",
  horizon: "", formeJuridique: "", immatriculation: "", siteWeb: "",
};

export async function saisieOnboarding(): Promise<SaisieOnboarding> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return VIDE;

  const { data } = await supabase
    .from("startups")
    .select("name, country, sector, stage, one_liner, objectif, amount_sought_usd, devise, modalite_financement, horizon, forme_juridique, numero_immatriculation, site_web")
    .eq("owner_id", user.id)
    .maybeSingle();

  const ligne = data as {
    name: string | null;
    country: string | null;
    sector: string | null;
    stage: string | null;
    one_liner: string | null;
    objectif: string | null;
    amount_sought_usd: number | null;
    devise: string | null;
    modalite_financement: string | null;
    horizon: string | null;
    forme_juridique: string | null;
    numero_immatriculation: string | null;
    site_web: string | null;
  } | null;

  return {
    nom: ligne?.name ?? "",
    pays: ligne?.country ?? "",
    secteur: ligne?.sector ?? "",
    stade: ligne?.stage ?? "",
    description: ligne?.one_liner ?? "",
    objectif: ligne?.objectif ?? "",
    // `save_startup` pose `''` quand le nom n'a jamais été donné : on ne
    // réaffiche pas un zéro là où le fondateur n'a rien écrit.
    montant: ligne?.amount_sought_usd ? String(ligne.amount_sought_usd) : "",
    devise: ligne?.devise ?? "",
    modalite: ligne?.modalite_financement ?? "",
    horizon: ligne?.horizon ?? "",
    formeJuridique: ligne?.forme_juridique ?? "",
    immatriculation: ligne?.numero_immatriculation ?? "",
    siteWeb: ligne?.site_web ?? "",
  };
}

export async function companyDefaults(): Promise<CompanyDefaults> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { country: "", stage: "" };

  const { data } = await supabase
    .from("startups")
    .select("country, stage")
    .eq("owner_id", user.id)
    .maybeSingle();

  return {
    country: data?.country ?? "",
    stage: data?.stage ?? "",
  };
}
