import "server-only";

import { createClient } from "@/lib/supabase/server";

import {
  effectif,
  periode,
  statutInvitation,
  tonStatut,
  type StatutInvitation,
} from "../domain/cohorte";
import { requireV2Workspace } from "./session";

/**
 * Le canal de lecture des cohortes.
 *
 * COLONNES ÉNUMÉRÉES, comme `sae_portfolio()`. Un `select *` ferait sortir
 * demain une colonne que personne n'a décidé de montrer aujourd'hui : la
 * frontière de confidentialité de ce parcours tient à ce que rien n'y soit
 * implicite.
 */
export interface CohorteLue {
  id: string;
  nom: string;
  periode: string;
  periodeListe: string;
  places: number;
  entreprises: number;
  effectif: string;
  archivee: boolean;
}

export interface InvitationLue {
  id: string;
  email: string;
  nom: string;
  initiales: string;
  envoyee: string;
  activite: string;
  statut: StatutInvitation;
  ton: ReturnType<typeof tonStatut>;
}

function initiales(nom: string): string {
  const mots = nom.trim().split(/[\s·-]+/).filter(Boolean);
  if (mots.length === 0) return "??";
  return mots.slice(0, 2).map((m) => m[0]?.toUpperCase() ?? "").join("");
}

const JOUR = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" });

function enClair(date: string | null): string {
  return date ? JOUR.format(new Date(date)) : "—";
}

export async function listerCohortes(): Promise<readonly CohorteLue[]> {
  const { organization } = await requireV2Workspace();
  const supabase = await createClient();

  const [{ data: cohortes }, { data: membres }] = await Promise.all([
    supabase
      .from("cohorts")
      .select("id, name, seats, starts_on, ends_on, archived_at")
      .eq("org_id", organization.id)
      .order("created_at", { ascending: false }),
    supabase.from("cohort_members").select("cohort_id"),
  ]);

  const parCohorte = new Map<string, number>();
  for (const membre of membres ?? []) {
    parCohorte.set(membre.cohort_id, (parCohorte.get(membre.cohort_id) ?? 0) + 1);
  }

  return (cohortes ?? []).map((cohorte) => {
    const entreprises = parCohorte.get(cohorte.id) ?? 0;
    return {
      id: cohorte.id,
      nom: cohorte.name,
      periode: periode(cohorte.starts_on, cohorte.ends_on, "→"),
      periodeListe: periode(cohorte.starts_on, cohorte.ends_on, "—"),
      places: cohorte.seats,
      entreprises,
      effectif: effectif(entreprises, cohorte.seats),
      archivee: Boolean(cohorte.archived_at),
    };
  });
}

export async function lireCohorte(id: string): Promise<CohorteLue | null> {
  const cohortes = await listerCohortes();
  return cohortes.find((cohorte) => cohorte.id === id) ?? null;
}

/**
 * Les invitations d'une cohorte, avec leur état déduit du temps.
 *
 * L'INSTANT EST PRIS UNE FOIS, ici, et passé à la règle. Le laisser à
 * `Date.now()` dans la règle ferait deux résultats différents pour deux
 * lignes de la même liste, à la seconde près d'un changement de jour.
 */
export async function listerInvitations(
  cohorteId: string,
): Promise<readonly InvitationLue[]> {
  const { organization } = await requireV2Workspace();
  const supabase = await createClient();
  const maintenant = new Date();

  const { data } = await supabase
    .from("cohort_links")
    .select("id, email, company_name, status, created_at, opened_at, accepted_at")
    .eq("sae_org_id", organization.id)
    .eq("cohort_id", cohorteId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((ligne) => {
    const statut = statutInvitation(
      {
        status: ligne.status,
        createdAt: ligne.created_at,
        openedAt: ligne.opened_at,
        acceptedAt: ligne.accepted_at,
      },
      maintenant,
    );
    const nom = ligne.company_name || ligne.email;

    return {
      id: ligne.id,
      email: ligne.email,
      nom,
      initiales: initiales(nom),
      envoyee: enClair(ligne.created_at),
      // « Lien ouvert hier » : l'écran 04 dit QUAND, pas seulement QUE.
      activite: ligne.opened_at ? `Lien ouvert ${enClair(ligne.opened_at)}` : "—",
      statut,
      ton: tonStatut(statut),
    };
  });
}
