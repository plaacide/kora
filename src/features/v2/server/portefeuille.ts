import "server-only";

import type { LignePortefeuille } from "@/features/v2/domain/portefeuille";
import { createClient } from "@/lib/supabase/server";

import { requireV2User } from "./session";

/**
 * Le portefeuille d'un programme — écrans 06 et 07.
 *
 * ADR-004 (tranchée le 6 août, option B) : la lecture passe par une fonction à
 * COLONNES ÉNUMÉRÉES, pas par une politique RLS. `sae_portfolio()` décide seule
 * ce qu'un programme voit d'une entreprise, et elle est relisible d'un coup
 * d'œil. Les Challenges et les Dealrooms auront leurs propres fonctions quand
 * ces objets existeront ; on ne les fait pas entrer ici.
 *
 * La fonction est `security definer` et filtre déjà sur l'appelant : elle ne
 * rend que les entreprises des cohortes du programme connecté, et seulement si
 * son abonnement est à jour.
 */

/** Une ligne du portefeuille, telle que l'écran la consomme. */
export interface LigneLue extends LignePortefeuille {
  dealName: string | null;
  stage: string | null;
  secteur: string | null;
  pays: string | null;
  /**
   * Les libellés des exigences non fournies, CINQ AU PLUS — `sae_portfolio()`
   * tronque ce tableau. C'est un aperçu, jamais un compte : le compte est
   * `restants`.
   */
  apercuManques: readonly string[];
}

interface RangeeBrute {
  startup_org: string;
  startup_name: string | null;
  deal_id: string;
  deal_name: string | null;
  stage: string | null;
  amount: number | string | null;
  currency: string | null;
  readiness: number | null;
  items_total: number | string | null;
  items_done: number | string | null;
  missing: string[] | null;
  sector: string | null;
  country: string | null;
}

/**
 * `amount` est un `numeric` Postgres : PostgREST le rend en CHAÎNE pour ne pas
 * perdre de précision. Le passer tel quel dans une addition concaténerait les
 * montants au lieu de les additionner — « 500000 » + « 300000 » = « 500000300000 ».
 */
function nombre(valeur: number | string | null): number | null {
  if (valeur === null) return null;
  const n = typeof valeur === "number" ? valeur : Number(valeur);
  return Number.isFinite(n) ? n : null;
}

export async function lirePortefeuille(): Promise<readonly LigneLue[]> {
  await requireV2User();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("sae_portfolio");

  if (error) {
    // ADR-001 : l'écran ne verra jamais le message de Postgres. Mais il part
    // dans le journal, sans quoi un portefeuille vide se lit comme « aucune
    // entreprise » alors que c'est la lecture qui a échoué.
    console.error("[v2 portefeuille] sae_portfolio", error);
    throw new Error("portefeuille_illisible");
  }

  return ((data ?? []) as RangeeBrute[]).map((r) => ({
    startupOrg: r.startup_org,
    startupName: r.startup_name ?? "—",
    dealId: r.deal_id,
    dealName: r.deal_name,
    stage: r.stage,
    amount: nombre(r.amount),
    currency: r.currency,
    readiness: r.readiness,
    secteur: r.sector,
    pays: r.country,
    // `items_total` et `items_done` sont des `bigint` : PostgREST les rend en
    // chaîne, comme `amount`. D'où la même conversion explicite.
    restants: Math.max(
      0,
      (nombre(r.items_total) ?? 0) - (nombre(r.items_done) ?? 0),
    ),
    apercuManques: r.missing ?? [],
  }));
}
