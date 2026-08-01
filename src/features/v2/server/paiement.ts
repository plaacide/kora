import "server-only";

import { billingProvider } from "@/features/v2/billing/providers";
import { createAdminClient } from "@/lib/supabase/admin";

import { previenirDuPaiement } from "./courriers";

/**
 * Vérifier soi-même qu'un paiement a été réglé, au lieu de l'attendre.
 *
 * POURQUOI CE SECOND CHEMIN EXISTE. Un webhook est une promesse faite par un
 * tiers, et elle se rompt : réseau coupé, déploiement en cours, panne chez le
 * prestataire — ou, comme observé le 1er août sur Genius Pay, un compteur
 * « webhooks envoyés : 0 » alors que la transaction est bien passée. Le client,
 * lui, a payé. Lui répondre « nous n'avons rien reçu » est intenable.
 *
 * On demande donc au prestataire, avec la référence qu'on a gardée : « cette
 * transaction est-elle réglée ? » Sa réponse fait foi.
 *
 * LES DEUX CHEMINS NE PEUVENT PAS ACTIVER DEUX FOIS, et c'est ce qui les rend
 * combinables : ils écrivent le MÊME identifiant d'événement,
 * `payment.success:<référence>`. L'unicité `(provider, external_event_id)` de
 * `billing_events` refuse le second, quel qu'il soit. Le webhook devient un
 * raccourci agréable au lieu d'une dépendance.
 *
 * ON NE CROIT JAMAIS LE NAVIGATEUR : ni la référence, ni le plan, ni le montant
 * ne viennent de l'URL de retour. La référence est relue en base, le statut est
 * demandé au prestataire. Un `?paiement=ok` fabriqué à la main n'ouvre rien.
 */

export interface ResultatVerification {
  /** `true` quand un plan vient d'être ouvert par cette vérification. */
  active: boolean;
  /** Ce qui s'est passé, pour l'écran et pour les journaux. */
  etat:
    | "aucune_attente"
    | "toujours_en_cours"
    | "echoue"
    | "deja_traite"
    | "plan_active"
    | "indisponible";
  reference?: string;
}

/** Les intentions plus vieilles que ceci ne sont plus rattrapées. */
const FENETRE_HEURES = 6;

export async function verifierPaiementEnAttente(
  orgId: string,
): Promise<ResultatVerification> {
  const prestataire = billingProvider();
  const admin = createAdminClient();

  // La dernière intention connue pour cet espace. On ne remonte pas plus loin
  // que quelques heures : une référence de la semaine dernière qui basculerait
  // aujourd'hui ouvrirait un plan que plus personne n'attend.
  const depuis = new Date(Date.now() - FENETRE_HEURES * 3600 * 1000).toISOString();

  const { data, error } = await admin
    .from("billing_events")
    .select("external_event_id, payload, created_at")
    .eq("workspace_id", orgId)
    .eq("event_type", "payment.pending")
    .eq("provider", prestataire.code)
    .gte("created_at", depuis)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[v2 paiement] intentions illisibles :", error);
    return { active: false, etat: "indisponible" };
  }

  const reference = data?.external_event_id;
  if (!reference) return { active: false, etat: "aucune_attente" };

  let transaction;
  try {
    transaction = await prestataire.facture(reference);
  } catch (erreur) {
    console.error("[v2 paiement] statut illisible chez le prestataire :", erreur);
    return { active: false, etat: "indisponible", reference };
  }

  if (!transaction) return { active: false, etat: "indisponible", reference };

  const statut = transaction.statut.toLowerCase();

  if (statut !== "completed" && statut !== "success" && statut !== "succeeded") {
    // `pending` est le cas normal du mobile money : l'opérateur peut mettre
    // plusieurs minutes, et le payeur revient avant lui.
    const echoue = ["failed", "cancelled", "expired", "refunded"].includes(statut);
    return {
      active: false,
      etat: echoue ? "echoue" : "toujours_en_cours",
      reference,
    };
  }

  const charge = (data?.payload ?? {}) as {
    plan_code?: string;
    billing_interval?: string;
  };

  const { data: resultat, error: erreurApplication } = await admin.rpc(
    "apply_billing_event",
    {
      p_provider: prestataire.code,
      // La MÊME clé que celle du webhook : le premier des deux arrivé gagne,
      // le second est refusé par l'unicité en base.
      p_event_id: `payment.success:${reference}`,
      p_type: "payment.succeeded",
      p_org: orgId,
      p_plan_code: charge.plan_code ?? null,
      p_interval: charge.billing_interval === "year" ? "year" : "month",
      p_payload: {
        source: "verification_au_retour",
        reference,
        montant: transaction.montant,
        devise: transaction.devise,
      },
    },
  );

  if (erreurApplication) {
    console.error("[v2 paiement] application impossible :", erreurApplication);
    return { active: false, etat: "indisponible", reference };
  }

  const dit = String(resultat);

  // Même règle que dans le webhook : seule une ouverture réelle déclenche le
  // courrier. Si le webhook nous a devancés, il l'a déjà envoyé.
  if (dit === "plan_active") {
    await previenirDuPaiement(orgId);
  }

  return {
    // « Déjà traité » veut dire que le webhook nous a devancés : le plan EST
    // ouvert, simplement pas par nous. Ce n'est pas un échec.
    active: dit === "plan_active" || dit === "deja_traite",
    etat: dit === "deja_traite" ? "deja_traite" : "plan_active",
    reference,
  };
}
