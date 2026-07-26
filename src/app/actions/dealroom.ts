"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Actions du dealroom, côté programme.
 *
 * Toutes passent par des RPC `security definer` qui portent leurs propres
 * gardes : la règle du dépôt interdit l'écriture directe depuis le client, et
 * ici elle protège davantage qu'une convention — c'est le consentement des
 * entreprises qui est en jeu.
 */

export interface Resultat {
  ok: boolean;
  error?: string;
  /** Nombre d'entreprises réellement publiées. */
  n?: number;
}

/**
 * Met à jour la vitrine d'une cohorte.
 *
 * Les deux conditions — consentement vivant ET dossier entamé — sont vérifiées
 * DANS la base, pas ici : une garde côté écran se contourne. Cette fonction
 * peut donc publier moins d'entreprises qu'on ne lui en passe, et c'est voulu.
 * Le nombre renvoyé est celui des publications réelles.
 */
export async function publierVitrine(
  cohorteId: string,
  startupOrgIds: string[],
): Promise<Resultat> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("publish_showcase", {
    p_cohort: cohorteId,
    p_startups: startupOrgIds,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/cohortes/${cohorteId}`);
  return { ok: true, n: typeof data === "number" ? data : 0 };
}

/** Retire une fiche de la vitrine. NE RÉVOQUE AUCUN ACCÈS déjà accordé. */
export async function depublier(
  cohorteId: string,
  startupOrgId: string,
): Promise<Resultat> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("showcase_entries")
    .update({ unpublished_at: new Date().toISOString() })
    .eq("cohort_id", cohorteId)
    .eq("startup_org_id", startupOrgId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/cohortes/${cohorteId}`);
  return { ok: true };
}

/**
 * Poser une question ou laisser une suggestion à une entreprise.
 *
 * DEUX OBJETS, pas un fil de discussion : une question attend une réponse, une
 * suggestion n'attend rien. Les règles §9 refusent explicitement le chat libre
 * — un fil non lu est une dette.
 */
export async function ecrireAEntreprise(input: {
  cohorteId: string;
  startupOrgId: string;
  type: "question" | "suggestion";
  body: string;
}): Promise<Resultat> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: cohorte } = await supabase
    .from("cohorts")
    .select("org_id")
    .eq("id", input.cohorteId)
    .maybeSingle();
  if (!cohorte) return { ok: false, error: "cohorte introuvable" };

  const { error } = await supabase.from("program_threads").insert({
    program_org_id: (cohorte as { org_id: string }).org_id,
    startup_org_id: input.startupOrgId,
    type: input.type,
    body: input.body.trim(),
    // Une suggestion naît « ouverte » comme une question ; c'est l'affichage
    // côté startup qui la passera « lue ». On ne présume pas de sa lecture.
    author: user?.id ?? null,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/cohortes/${input.cohorteId}`);
  return { ok: true };
}
