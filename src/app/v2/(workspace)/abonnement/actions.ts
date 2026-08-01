"use server";

import { revalidatePath } from "next/cache";

import type { MoyenDePaiement } from "@/features/v2/billing/moyens";
import { moyen, normaliserTelephone, refusDeSaisie } from "@/features/v2/billing/moyens";
import { billingProvider } from "@/features/v2/billing/providers";
import { createAdminClient } from "@/lib/supabase/admin";
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
  moyen: MoyenDePaiement;
  telephone?: string;
}): Promise<Resultat & { reference?: string; url?: string; instruction?: string }> {
  // Le contrôle de saisie est REFAIT ici. Celui de l'écran sert au confort de
  // qui remplit le formulaire ; celui-ci sert à la sûreté, parce qu'une action
  // serveur s'appelle aussi sans passer par l'écran.
  const refus = refusDeSaisie({
    moyen: input.moyen,
    telephone: input.telephone ?? "",
  });
  if (refus) return { ok: false, error: refus };

  const choisi = moyen(input.moyen);
  if (!choisi) return { ok: false, error: "Moyen de paiement inconnu." };

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: prix, error: erreurPrix } = await supabase
    .from("plan_prices")
    .select("unit_amount, currency, plans!inner(code)")
    .eq("plans.code", input.planCode)
    .eq("billing_interval", input.intervalle)
    .maybeSingle();

  if (erreurPrix) {
    console.error("[v2 abonnement] tarif illisible :", erreurPrix);
    return { ok: false, error: "Le tarif de ce plan n’a pas pu être lu." };
  }

  const tarif = prix as { unit_amount: number | null; currency: string } | null;

  if (!tarif?.unit_amount) {
    // Ouvrir un paiement à zéro rendrait une référence que personne ne pourrait
    // honorer — et Genius Pay refuse sous 200 XOF de toute façon.
    return {
      ok: false,
      error: "Ce plan n’a pas de tarif public. Écrivez-nous pour l’activer.",
    };
  }

  try {
    const session = await billingProvider().ouvrirPaiement({
      workspaceId: input.organizationId,
      planCode: input.planCode,
      intervalle: input.intervalle,
      montant: tarif.unit_amount,
      devise: tarif.currency ?? "XOF",
      email: user?.email ?? "",
      telephone: input.telephone ? normaliserTelephone(input.telephone) : null,
      moyen: choisi.paymentMethod,
    });

    // RETENIR L'INTENTION, sinon on ne saura pas quoi vérifier au retour.
    // Le prestataire connaît la référence ; nous devons pouvoir la lui
    // rappeler quand le payeur revient — c'est ce qui rend le paiement
    // vérifiable sans dépendre d'une notification qui peut ne jamais venir.
    //
    // SON PROPRE `try`, ET C'EST TOUT LE SUJET. La première écriture partageait
    // le `try` du paiement : une clé de service absente y levait, et le client
    // voyait « le paiement n'a pas pu être ouvert » alors que la transaction
    // était DÉJÀ créée chez le prestataire. Prendre une note ne doit jamais
    // empêcher d'encaisser — au pire on rattrape à la main, au mieux personne
    // ne s'en aperçoit.
    try {
      const admin = createAdminClient();
      const { error: erreurTrace } = await admin.from("billing_events").insert({
        workspace_id: input.organizationId,
        event_type: "payment.pending",
        provider: billingProvider().code,
        external_event_id: session.reference,
        payload: {
          plan_code: input.planCode,
          billing_interval: input.intervalle,
          moyen: input.moyen,
        },
      });

      if (erreurTrace) {
        console.error("[v2 abonnement] intention non tracée :", erreurTrace);
      }
    } catch (erreurTrace) {
      console.error("[v2 abonnement] intention non tracée :", erreurTrace);
    }

    return {
      ok: true,
      reference: session.reference,
      url: session.url ?? undefined,
      instruction: session.instruction,
    };
  } catch (erreur) {
    // Le message du prestataire peut contenir sa réponse brute : on le trace,
    // on ne le montre pas.
    console.error("[v2 abonnement] ouverture de paiement échouée :", erreur);
    return {
      ok: false,
      error:
        "Le paiement n’a pas pu être ouvert. Réessayez dans un instant, ou écrivez-nous.",
    };
  }
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
