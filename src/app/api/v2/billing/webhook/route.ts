import { NextResponse } from "next/server";

import { billingProvider } from "@/features/v2/billing/providers";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Recevoir les notifications du prestataire de paiement.
 *
 * POURQUOI CETTE ROUTE RÉPOND 200 À PEU PRÈS TOUJOURS. Un prestataire qui
 * reçoit autre chose REJOUE, souvent pendant des jours, avec un intervalle qui
 * s'allonge. Répondre 500 à une notification qu'on ne saura jamais traiter —
 * signature invalide, événement inconnu — c'est s'infliger une avalanche pour
 * un problème que la répétition ne résoudra pas. On ne réserve l'échec qu'à ce
 * qui a une chance d'aboutir au coup suivant : une panne de base.
 *
 * ELLE NE FAIT CONFIANCE À RIEN DE CE QU'ELLE REÇOIT. La signature décide, et
 * l'organisation comme le plan viennent des métadonnées que NOUS avons posées à
 * la création du paiement. Sans cette règle, il suffirait de connaître l'adresse
 * pour s'offrir le plan le plus cher.
 */

// Le corps doit être lu BRUT : la signature porte sur les octets reçus, et
// toute re-sérialisation la casserait.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * L'état de la facturation, en lecture.
 *
 * POURQUOI CETTE ROUTE EXISTE. Un paiement a échoué en recette sans qu'on
 * puisse dire, depuis l'extérieur, si le correctif était déployé ou si une
 * variable manquait — deux causes très différentes, et aucun moyen de trancher
 * sans ouvrir les journaux du conteneur. Une minute de diagnostic vaut mieux
 * qu'un aller-retour.
 *
 * ELLE NE RÉVÈLE AUCUN SECRET : la PRÉSENCE d'une clé, jamais sa valeur, ni
 * même sa longueur. Savoir qu'un prestataire est configuré n'apprend rien à un
 * attaquant — c'est déjà visible à qui tente de payer.
 */
export async function GET() {
  const prestataire = billingProvider();

  return NextResponse.json({
    prestataire: prestataire.code,
    recurrent: prestataire.recurrent,
    cles: {
      api: Boolean(process.env.GENIUSPAY_API_KEY),
      secret: Boolean(process.env.GENIUSPAY_API_SECRET),
      webhook: Boolean(process.env.GENIUSPAY_WEBHOOK_SECRET),
    },
    // Déduit du préfixe de la clé, comme partout ailleurs : une seule source.
    environnement: process.env.GENIUSPAY_API_KEY?.includes("_live_")
      ? "live"
      : "sandbox",
    // Le marqueur qui dit si un déploiement est passé. Renseigné par Coolify
    // quand la variable existe ; « inconnu » sinon, ce qui reste honnête.
    version: process.env.SOURCE_COMMIT?.slice(0, 7) ?? "inconnu",
  });
}

export async function POST(request: Request) {
  const corps = await request.text();

  const entetes: Record<string, string> = {};
  request.headers.forEach((valeur, cle) => {
    entetes[cle] = valeur;
  });

  const prestataire = billingProvider();

  let evenement;
  try {
    evenement = await prestataire.lireWebhook({ corps, entetes });
  } catch (erreur) {
    console.error("[v2 facturation] lecture du webhook impossible :", erreur);
    return NextResponse.json({ recu: false }, { status: 200 });
  }

  if (!evenement) {
    // Signature absente, invalide, périmée, ou environnement qui ne correspond
    // pas. On le dit dans les logs et on s'arrête là.
    console.warn("[v2 facturation] notification rejetée : signature ou environnement");
    return NextResponse.json({ recu: false }, { status: 200 });
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("apply_billing_event", {
    p_provider: prestataire.code,
    p_event_id: evenement.externalEventId,
    p_type: evenement.type,
    p_org: evenement.workspaceId,
    p_plan_code: evenement.planCode,
    p_interval:
      (evenement.payload as { billing_interval?: string }).billing_interval === "yearly"
        ? "year"
        : "month",
    p_payload: evenement.payload,
  });

  if (error) {
    // Ici, et seulement ici, le rejeu a du sens : la base était indisponible,
    // elle ne le sera peut-être plus dans une minute.
    console.error("[v2 facturation] application de l’événement échouée :", error);
    return NextResponse.json({ recu: false }, { status: 500 });
  }

  console.info(
    `[v2 facturation] ${prestataire.code} ${evenement.type} → ${String(data)}`,
  );

  return NextResponse.json({ recu: true, resultat: data }, { status: 200 });
}
