"use server";

import { revalidatePath } from "next/cache";

import { billingProvider } from "@/features/v2/billing/providers";
import { createClient } from "@/lib/supabase/server";

/**
 * Les gestes d'abonnement — chapitres 14, 15 et 18.
 *
 * Aucune de ces actions ne nomme un prestataire : elles demandent celui qui est
 * actif. C'est ce qui permettra d'ajouter Genius Pay sans toucher un écran.
 *
 * Les règles de montée et de descente vivent en base, dans
 * `set_workspace_plan` : un changement de plan viendra aussi d'un webhook et
 * d'une activation administrative, et trois portes ne peuvent pas avoir chacune
 * leur serrure.
 */

type Resultat = { ok: boolean; error?: string };

const MESSAGES: Record<string, string> = {
  "droits insuffisants":
    "Seuls le propriétaire et les administrateurs gèrent l’abonnement.",
  "plan inconnu": "Ce plan n’existe pas ou n’est plus proposé.",
  "aucun abonnement en cours": "Aucun abonnement à résilier.",
};

function traduire(message: string): string {
  const cle = Object.keys(MESSAGES).find((m) => message.includes(m));
  return cle ? MESSAGES[cle] : message;
}

/**
 * Demander un plan.
 *
 * Avec un prestataire en ligne, cela ouvrira une session de paiement et le plan
 * s'activera au retour du webhook. En mode manuel, cela rend une référence de
 * virement : rien ne s'active tant qu'un humain n'a pas constaté le paiement.
 * Promettre l'accès avant d'avoir vu l'argent est exactement ce qu'un mode hors
 * ligne ne doit pas faire.
 */
export async function requestV2Plan(input: {
  organizationId: string;
  planCode: string;
  intervalle: "month" | "year";
}): Promise<Resultat & { reference?: string; url?: string; instruction?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: prix } = await supabase
    .from("plan_prices")
    .select("unit_amount, currency, plans!inner(code)")
    .eq("plans.code", input.planCode)
    .eq("billing_interval", input.intervalle)
    .maybeSingle();

  const tarif = prix as { unit_amount: number | null; currency: string } | null;

  const session = await billingProvider().ouvrirPaiement({
    workspaceId: input.organizationId,
    planCode: input.planCode,
    intervalle: input.intervalle,
    montant: tarif?.unit_amount ?? 0,
    devise: tarif?.currency ?? "XOF",
    email: user?.email ?? "",
  });

  return {
    ok: true,
    reference: session.reference,
    url: session.url ?? undefined,
    instruction: session.instruction,
  };
}

/**
 * Activer un plan après constat de paiement — ou par décision administrative.
 *
 * Le mode est écrit au journal de facturation : c'est lui qui expliquera, dans
 * six mois, pourquoi une organisation a le plan Close sans transaction chez
 * aucun prestataire.
 */
export async function activateV2Plan(input: {
  organizationId: string;
  planCode: string;
  intervalle: "month" | "year";
  mode: "manual_transfer" | "manual_invoice" | "admin_activation";
  reference?: string | null;
}): Promise<Resultat> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("set_workspace_plan", {
    p_org: input.organizationId,
    p_plan_code: input.planCode,
    p_interval: input.intervalle,
    p_mode: input.mode,
    p_reference: input.reference?.trim() || null,
    p_effective: "now",
  });

  if (error) {
    console.error("[v2 abonnement] set_workspace_plan échoué :", error);
    return { ok: false, error: traduire(error.message) };
  }

  revalidatePath("/v2/abonnement");
  return { ok: true };
}

/**
 * Résilier.
 *
 * À la fin de la période déjà payée par défaut : ce qui est réglé est dû, et
 * couper le jour de la demande reviendrait à garder l'argent sans le service.
 * Rien n'est supprimé — les §15 et §16 l'interdisent tous les deux.
 */
export async function cancelV2Subscription(input: {
  organizationId: string;
  immediat?: boolean;
  motif?: string | null;
}): Promise<Resultat> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("cancel_workspace_subscription", {
    p_org: input.organizationId,
    p_immediat: input.immediat ?? false,
    p_motif: input.motif?.trim() || null,
  });

  if (error) {
    console.error("[v2 abonnement] résiliation échouée :", error);
    return { ok: false, error: traduire(error.message) };
  }

  revalidatePath("/v2/abonnement");
  return { ok: true };
}
