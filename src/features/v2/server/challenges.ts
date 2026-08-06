import "server-only";

import type { AvancementEntreprise } from "@/features/v2/domain/challenges";
import { createClient } from "@/lib/supabase/server";

import { requireV2User } from "./session";

/**
 * Les Challenges d'une cohorte — écrans 09 et 09b.
 *
 * DEUX LECTURES, COMPOSÉES ICI, conformément à ADR-004 : les entêtes d'un
 * côté, l'avancement par entreprise de l'autre. La base rend des faits bruts —
 * combien de critères requis, combien de faits — et le domaine en déduit
 * « en retard », « en cours » et « à faire ». La règle se teste ainsi sans
 * base, et son ordre d'évaluation est écrit une seule fois.
 */

export interface EntrepriseSuivie extends AvancementEntreprise {
  org: string;
  nom: string;
  fige: boolean;
}

export interface ChallengeLu {
  id: string;
  titre: string;
  categorie: string | null;
  echeance: string | null;
  criteres: number;
  entreprises: readonly EntrepriseSuivie[];
}

interface RangeeChallenge {
  id: string;
  title: string;
  category: string | null;
  due_on: string | null;
  criteres: number | string;
  entreprises: number | string;
  faits_total: number | string;
  terminees: number | string;
}

interface RangeeAvancement {
  challenge_id: string;
  startup_org: string;
  startup_name: string | null;
  requis: number | string;
  faits: number | string;
  fige: boolean;
}

/** `count(*)` est un `bigint` : PostgREST le rend en CHAÎNE, comme `numeric`. */
function entier(valeur: number | string | null): number {
  if (valeur === null) return 0;
  const n = typeof valeur === "number" ? valeur : Number(valeur);
  return Number.isFinite(n) ? n : 0;
}

export async function listerChallenges(
  cohorteId: string,
): Promise<readonly ChallengeLu[]> {
  await requireV2User();
  const supabase = await createClient();

  const [entetes, avancements] = await Promise.all([
    supabase.rpc("cohort_challenges", { p_cohort: cohorteId }),
    supabase.rpc("cohort_challenge_progress", { p_cohort: cohorteId }),
  ]);

  if (entetes.error || avancements.error) {
    // ADR-001 : l'écran ne voit rien de Postgres. Mais sans cette trace, une
    // liste vide se lit comme « aucun Challenge » alors que c'est la lecture
    // qui a échoué.
    console.error(
      "[v2 challenges] lecture",
      entetes.error ?? avancements.error,
    );
    throw new Error("challenges_illisibles");
  }

  const parChallenge = new Map<string, EntrepriseSuivie[]>();
  for (const r of (avancements.data ?? []) as RangeeAvancement[]) {
    const liste = parChallenge.get(r.challenge_id) ?? [];
    liste.push({
      faits: entier(r.faits),
      fige: r.fige,
      nom: r.startup_name ?? "—",
      org: r.startup_org,
      requis: entier(r.requis),
    });
    parChallenge.set(r.challenge_id, liste);
  }

  return ((entetes.data ?? []) as RangeeChallenge[]).map((c) => ({
    categorie: c.category,
    criteres: entier(c.criteres),
    echeance: c.due_on,
    entreprises: parChallenge.get(c.id) ?? [],
    id: c.id,
    titre: c.title,
  }));
}

/**
 * Remet à jour les critères connectés avant d'afficher.
 *
 * La fonction est MONOTONE — elle ne fait qu'ajouter, et deux passages
 * donnent le même résultat qu'un seul. On peut donc l'appeler à l'ouverture
 * d'un écran sans y réfléchir, et sans craindre de défaire quoi que ce soit.
 *
 * L'échec n'interrompt PAS l'affichage : un critère connecté qui n'a pas pu
 * être réévalué vaut mieux qu'un écran qui ne s'ouvre pas.
 */
export async function rafraichirChallenge(challengeId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("refresh_challenge_progress", {
    p_challenge: challengeId,
  });
  if (error) console.error("[v2 challenges] refresh", error);
}
