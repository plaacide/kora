"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Actions de l'enquête produit. Tout passe par des RPC `security definer` :
 * la règle du dépôt interdit l'écriture directe depuis le client, et ces
 * fonctions portent leur propre garde sur `auth.uid()`.
 */

/**
 * Ping d'usage. Renvoie les MINUTES cumulées, plafonnées côté base à deux
 * minutes par appel — un onglet laissé ouvert ne compte pas comme de l'usage.
 */
export async function pingUsage(): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("record_usage_ping");
  return typeof data === "number" ? data : 0;
}

export interface EtatEnquete {
  minutes: number;
  dejaRepondu: boolean;
  refuseDefinitivement: boolean;
  /** Dernière invitation, en millisecondes depuis l'époque, ou null. */
  dernierePropositionMs: number | null;
  /** Pays de la startup — décide de la devise de l'écran 3. */
  pays: string | null;
}

/** État d'éligibilité, relu à chaque montée en charge du compteur. */
export async function lireEtatEnquete(): Promise<EtatEnquete | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select(
      "usage_seconds, survey_completed_at, survey_dismissed_forever, survey_last_prompt_at",
    )
    .eq("id", user.id)
    .maybeSingle();
  if (!data) return null;

  const p = data as {
    usage_seconds: number | null;
    survey_completed_at: string | null;
    survey_dismissed_forever: boolean | null;
    survey_last_prompt_at: string | null;
  };

  // Le pays vient de la startup du fondateur, pas de l'organisation :
  // `organizations.default_currency` vaut XOF pour tout le monde, personne ne
  // l'a jamais renseignée.
  const { data: startup } = await supabase
    .from("startups")
    .select("country")
    .eq("owner_id", user.id)
    .maybeSingle();

  return {
    pays: (startup as { country: string | null } | null)?.country ?? null,
    minutes: Math.floor((p.usage_seconds ?? 0) / 60),
    dejaRepondu: !!p.survey_completed_at,
    refuseDefinitivement: !!p.survey_dismissed_forever,
    dernierePropositionMs: p.survey_last_prompt_at
      ? new Date(p.survey_last_prompt_at).getTime()
      : null,
  };
}

/** Contexte du deal courant, joint à la réponse pour l'exploiter ensuite. */
async function contexte(): Promise<{ readiness: number | null; docs: number | null }> {
  const supabase = await createClient();
  const { data: deal } = await supabase
    .from("deals")
    .select("id, readiness_score")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!deal) return { readiness: null, docs: null };

  const { count } = await supabase
    .from("documents")
    .select("id", { count: "exact", head: true })
    .eq("deal_id", (deal as { id: string }).id);

  return {
    readiness: (deal as { readiness_score: number | null }).readiness_score,
    docs: count ?? null,
  };
}

/**
 * Ouvre la réponse. Appelée UNIQUEMENT au « D'accord » de l'écran 0 : afficher
 * le carton n'est pas un consentement, et rien ne doit exister en base avant
 * ce clic (§0.6).
 */
export async function demarrerEnquete(minutes: number): Promise<number | null> {
  const supabase = await createClient();
  const { readiness, docs } = await contexte();
  const { data, error } = await supabase.rpc("survey_start", {
    p_readiness: readiness,
    p_docs: docs,
    p_minutes: minutes,
  });
  if (error) return null;
  return typeof data === "number" ? data : null;
}

/** Une écriture PAR ÉCRAN validé : un abandon laisse ce qui a été répondu. */
export async function repondreEnquete(input: {
  id: number;
  mood?: string;
  frictions?: string[];
  priceFair?: string;
  priceTooHigh?: string;
  comment?: string;
}): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc("survey_answer", {
    p_id: input.id,
    p_mood: input.mood ?? null,
    p_frictions: input.frictions ?? null,
    p_price_fair: input.priceFair ?? null,
    p_price_too_high: input.priceTooHigh ?? null,
    p_comment: input.comment ?? null,
  });
}

export async function terminerEnquete(id: number): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc("survey_complete", { p_id: id });
}

/** « Plus tard », la croix, Échap : on repose la question dans sept jours. */
export async function reporterEnquete(): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc("survey_postpone");
}

/** « Ne plus me demander » : définitif, y compris après reconnexion. */
export async function refuserEnquete(): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc("survey_never_again");
}
