import "server-only";

import { createClient } from "@/lib/supabase/server";

import type {
  Abonnement,
  Consommation,
  Droit,
  Plan,
  SegmentClient,
  StatutAbonnement,
} from "./types";

/**
 * Le service central des droits — chapitre 10 de l'architecture pricing.
 *
 * LA RÈGLE QUI COMMANDE TOUT (§7.1) : aucun composant n'a le droit d'écrire
 * `if (plan === "raise")`. Une telle ligne se recopie, puis se contredit — et
 * six mois plus tard personne ne sait plus ce que le plan Raise ouvre vraiment.
 * Tout passe par ici, et ce fichier lit la base.
 *
 * Conséquence pratique : changer ce qu'un plan inclut est une écriture en base,
 * pas un déploiement.
 */

/** Le plan par défaut d'une organisation sans abonnement : le plan gratuit. */
const PLAN_PAR_DEFAUT = "business_ready";

interface LignePlan {
  id: string;
  code: string;
  name: string;
  description: string | null;
  is_free: boolean;
  is_custom_pricing: boolean;
  badge: string | null;
  display_order: number;
  customer_segments: { code: string } | Array<{ code: string }> | null;
  plan_prices: Array<{
    currency: string;
    billing_interval: string;
    unit_amount: number | null;
    billing_period_count: number;
  }> | null;
}

function enPlan(row: LignePlan): Plan {
  const segment = Array.isArray(row.customer_segments)
    ? row.customer_segments[0]
    : row.customer_segments;

  return {
    id: row.id,
    code: row.code,
    nom: row.name,
    description: row.description,
    segment: (segment?.code ?? "business") as SegmentClient,
    gratuit: row.is_free,
    surDevis: row.is_custom_pricing,
    badge: row.badge,
    ordre: row.display_order,
    prix: (row.plan_prices ?? []).map((p) => ({
      devise: p.currency,
      intervalle: p.billing_interval as Prix["intervalle"],
      montant: p.unit_amount,
      periodes: p.billing_period_count,
    })),
  };
}

type Prix = Plan["prix"][number];

const CHAMPS_PLAN =
  "id, code, name, description, is_free, is_custom_pricing, badge, display_order, customer_segments(code), plan_prices(currency, billing_interval, unit_amount, billing_period_count)";

/** Le catalogue complet, pour la page de tarification. */
export async function planCatalog(): Promise<Plan[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("plans")
    .select(CHAMPS_PLAN)
    .eq("is_active", true)
    .order("display_order");

  if (error) console.error("[v2 abonnement] catalogue :", error);

  return ((data ?? []) as unknown as LignePlan[]).map(enPlan);
}

/**
 * L'abonnement vivant d'un espace de travail.
 *
 * `null` n'est pas une anomalie : une organisation qui vient de se créer n'a
 * pas encore d'abonnement, et elle doit pouvoir travailler. C'est le plan
 * gratuit qui s'applique alors — voir `workspacePlan`.
 */
export async function workspaceSubscription(
  workspaceId: string,
): Promise<Abonnement | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("subscriptions")
    .select(
      // LA CLÉ ÉTRANGÈRE EST NOMMÉE, ET ELLE DOIT L'ÊTRE. Depuis la descente
      // différée, `subscriptions` pointe DEUX fois vers `plans` : `plan_id`,
      // le plan servi, et `pending_plan_id`, celui qui prendra effet au terme.
      // Écrire `plans(…)` laisse PostgREST devant deux chemins, et il refuse
      // la requête entière (PGRST201) plutôt que d'en choisir un.
      //
      // L'écran retombait alors sur le plan gratuit et affichait « Ready » à
      // une organisation qui venait de payer Raise. Une lecture qui échoue
      // doit se voir ; ici elle se déguisait en réponse plausible.
      `id, status, billing_interval, current_period_start, current_period_end,
       trial_end, cancel_at_period_end,
       plans!subscriptions_plan_id_fkey(${CHAMPS_PLAN})`,
    )
    .eq("workspace_id", workspaceId)
    .in("status", [
      "trialing",
      "active",
      "past_due",
      "manual_contract",
      "pending",
    ])
    .maybeSingle();

  if (error) console.error("[v2 abonnement] abonnement :", error);
  if (!data) return null;

  const row = data as unknown as {
    id: string;
    status: StatutAbonnement;
    billing_interval: string | null;
    current_period_start: string | null;
    current_period_end: string | null;
    trial_end: string | null;
    cancel_at_period_end: boolean;
    plans: LignePlan | LignePlan[] | null;
  };

  const plan = Array.isArray(row.plans) ? row.plans[0] : row.plans;
  if (!plan) return null;

  return {
    id: row.id,
    plan: enPlan(plan),
    statut: row.status,
    intervalle: row.billing_interval,
    debutPeriode: row.current_period_start,
    finPeriode: row.current_period_end,
    finEssai: row.trial_end,
    resiliationEnFinDePeriode: row.cancel_at_period_end,
  };
}

/**
 * Le plan qui s'applique réellement.
 *
 * Sans abonnement, c'est le plan gratuit — et non « aucun plan ». Une
 * organisation sans droits ne pourrait rien faire, y compris s'abonner.
 */
export async function workspacePlan(workspaceId: string): Promise<Plan> {
  const abonnement = await workspaceSubscription(workspaceId);
  if (abonnement) return abonnement.plan;

  const supabase = await createClient();
  const { data } = await supabase
    .from("plans")
    .select(CHAMPS_PLAN)
    .eq("code", PLAN_PAR_DEFAUT)
    .maybeSingle();

  return enPlan(data as unknown as LignePlan);
}

/** Ce qu'un plan ouvre, tel qu'il est écrit en base. */
export async function planEntitlements(planCode: string): Promise<Droit[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("plan_entitlements")
    .select("is_enabled, limit_value, features(code, name, category, kind), plans!inner(code)")
    .eq("plans.code", planCode);

  if (error) console.error("[v2 abonnement] droits :", error);

  return ((data ?? []) as unknown as Array<{
    is_enabled: boolean;
    limit_value: number | null;
    features:
      | { code: string; name: string; category: string; kind: string }
      | Array<{ code: string; name: string; category: string; kind: string }>
      | null;
  }>)
    .map((row) => {
      const f = Array.isArray(row.features) ? row.features[0] : row.features;
      if (!f) return null;
      return {
        code: f.code,
        nom: f.name,
        categorie: f.category,
        nature: f.kind as "boolean" | "limit",
        actif: row.is_enabled,
        limite: row.limit_value,
      };
    })
    .filter((d): d is Droit => d !== null);
}

export async function workspaceEntitlements(
  workspaceId: string,
): Promise<Droit[]> {
  const plan = await workspacePlan(workspaceId);
  return planEntitlements(plan.code);
}

/** La fonctionnalité est-elle ouverte ? */
export async function hasFeature(
  workspaceId: string,
  featureCode: string,
): Promise<boolean> {
  const droits = await workspaceEntitlements(workspaceId);
  return droits.some((d) => d.code === featureCode && d.actif);
}

/** La limite, ou `null` pour illimité — et `0` quand le plan ne l'ouvre pas. */
export async function getFeatureLimit(
  workspaceId: string,
  featureCode: string,
): Promise<number | null> {
  const droits = await workspaceEntitlements(workspaceId);
  const droit = droits.find((d) => d.code === featureCode);
  if (!droit || !droit.actif) return 0;
  return droit.limite;
}

/**
 * Peut-on encore consommer ?
 *
 * `true` quand la limite est illimitée. Le calcul de l'usage vit dans
 * `usage.ts` : il se COMPTE sur les données réelles plutôt que de s'incrémenter
 * dans un compteur qu'un incident laisserait faux.
 */
export async function canConsume(
  workspaceId: string,
  featureCode: string,
  quantite = 1,
): Promise<boolean> {
  const limite = await getFeatureLimit(workspaceId, featureCode);
  if (limite === null) return true;
  if (limite === 0) return false;

  const { featureUsage } = await import("./usage");
  const utilise = await featureUsage(workspaceId, featureCode);
  return utilise + quantite <= limite;
}

/** Les limites du plan confrontées à l'usage réel — l'écran Abonnement. */
export async function workspaceConsumption(
  workspaceId: string,
): Promise<Consommation[]> {
  const droits = await workspaceEntitlements(workspaceId);
  const limites = droits.filter((d) => d.nature === "limit" && d.actif);

  const { featureUsage } = await import("./usage");

  return Promise.all(
    limites.map(async (d) => {
      const utilise = await featureUsage(workspaceId, d.code);
      return {
        code: d.code,
        nom: d.nom,
        limite: d.limite,
        utilise,
        part:
          d.limite === null || d.limite === 0
            ? null
            : Math.round((utilise / d.limite) * 100),
        depasse: d.limite !== null && utilise > d.limite,
      };
    }),
  );
}
