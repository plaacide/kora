import "server-only";

import { createClient } from "@/lib/supabase/server";

import { requireV2User } from "./session";

/**
 * Ce que le programme a déjà déclaré de lui-même.
 *
 * Sert à réafficher le tunnel d'inscription tel qu'on l'a laissé : revenir à
 * une étape sur des champs vides donne l'impression d'avoir tout perdu, et on
 * ressaisit — c'est le défaut déjà corrigé sur l'onboarding fondateur.
 */
export interface SaisieProgramme {
  organisationId: string | null;
  nom: string;
  type: string | null;
  pays: string | null;
  site: string | null;
  focus: readonly string[];
  cohorte: {
    id: string;
    nom: string;
    places: number;
    debut: string | null;
    fin: string | null;
  } | null;
}

const VIDE: SaisieProgramme = {
  organisationId: null,
  nom: "",
  type: null,
  pays: null,
  site: null,
  focus: [],
  cohorte: null,
};

export async function saisieProgramme(): Promise<SaisieProgramme> {
  const user = await requireV2User();
  const supabase = await createClient();

  const { data: membership } = await supabase
    .from("memberships")
    .select("org_id")
    .eq("user_id", user.id)
    .order("created_at")
    .limit(1)
    .maybeSingle();

  if (!membership?.org_id) return VIDE;

  const [{ data: org }, { data: cohortes }] = await Promise.all([
    supabase
      .from("organizations")
      .select("id, name, program_type, country, website")
      .eq("id", membership.org_id)
      .maybeSingle(),
    // La PREMIÈRE cohorte, celle que l'inscription vient de créer — d'où
    // l'ordre croissant. Sans `order by`, la ligne rendue est arbitraire :
    // c'est la mine désamorcée sept fois dans ce dépôt.
    supabase
      .from("cohorts")
      .select("id, name, seats, starts_on, ends_on")
      .eq("org_id", membership.org_id)
      .order("created_at")
      .limit(1),
  ]);

  if (!org) return VIDE;

  // LU À PART, ET SANS ROMPRE LE RESTE. Cette colonne n'existe qu'une fois la
  // migration du 6 août appliquée ; la demander dans la requête principale
  // faisait échouer TOUTE la lecture, et l'écran affichait une organisation
  // vide au lieu de la vraie. Une colonne absente doit coûter cette colonne,
  // pas la page.
  const { data: focusRow } = await supabase
    .from("organizations")
    .select("program_focus")
    .eq("id", membership.org_id)
    .maybeSingle();

  const premiere = cohortes?.[0];

  return {
    organisationId: org.id,
    nom: org.name ?? "",
    type: org.program_type ?? null,
    pays: org.country ?? null,
    site: org.website ?? null,
    focus: (focusRow?.program_focus as string[] | null) ?? [],
    cohorte: premiere
      ? {
          id: premiere.id,
          nom: premiere.name,
          places: premiere.seats,
          debut: premiere.starts_on,
          fin: premiere.ends_on,
        }
      : null,
  };
}
