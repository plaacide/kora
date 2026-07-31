"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

/**
 * Les gestes de la levée — écrans 36 et 45.
 *
 * Tout passe par des RPC `security definer` : elles vérifient le droit
 * d'écrire, tiennent l'invariant « une seule levée en cours par opération » et
 * journalisent. Une écriture directe sur `raises` ferait les trois de travers.
 */

type Resultat = { ok: boolean; error?: string };

function revalider(operationId: string): void {
  revalidatePath(`/v2/operations/${operationId}`, "layout");
}

/**
 * Créer la levée si elle n'existe pas, sinon la mettre à jour.
 *
 * `save_raise` crée d'elle-même quand aucune levée n'est en cours : deux
 * appels séparés depuis l'écran laisseraient une fenêtre où une opération
 * aurait deux levées, ce que l'index unique refuserait à moitié du geste.
 */
export async function saveV2Raise(input: {
  operationId: string;
  name?: string | null;
  target?: number | null;
  secured?: number | null;
  currency?: string | null;
  stage?: string | null;
  instrument?: string | null;
  preMoney?: number | null;
  deadline?: string | null;
  audience?: string[] | null;
  description?: string | null;
}): Promise<Resultat> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("save_raise", {
    p_deal: input.operationId,
    p_montant_cible: input.target ?? null,
    p_montant_engage: input.secured ?? null,
    p_devise: input.currency ?? null,
    p_type_tour: input.instrument ?? null,
    p_stade: input.stage ?? null,
    p_valorisation_pre: input.preMoney ?? null,
    p_date_cloture: input.deadline || null,
    p_audience: input.audience ?? null,
    p_description: input.description ?? null,
    // Le nom passe par la RPC et non par une écriture directe : `raises`
    // porte un `revoke update from authenticated`, et l'écriture directe
    // était refusée SANS erreur — le nom saisi disparaissait en silence.
    p_name: input.name ?? null,
  });

  if (error) {
    console.error("[v2 lever] save_raise échoué :", error);
    return { ok: false, error: error.message };
  }

  revalider(input.operationId);
  return { ok: true };
}

/**
 * Clôturer la levée. Elle rejoint l'historique de financement.
 *
 * Rien n'est supprimé : les pièces, les accès et le journal restent. Une levée
 * clôturée qu'on ne pourrait plus relire ne prouverait plus qu'un tour a eu
 * lieu — c'est justement ce qu'un investisseur suivant demande.
 */
export async function closeV2Raise(input: {
  operationId: string;
  finalAmount?: number | null;
  note?: string | null;
}): Promise<Resultat> {
  const supabase = await createClient();

  // Le montant final et la note se posent AVANT la clôture : après, la levée
  // n'est plus « en cours » et `save_raise` ne la retrouverait pas.
  if (input.finalAmount != null || input.note?.trim()) {
    const { error } = await supabase.rpc("save_raise", {
      p_deal: input.operationId,
      p_montant_engage: input.finalAmount ?? null,
      p_description: input.note?.trim() || null,
    });

    if (error) {
      console.error("[v2 lever] récapitulatif non enregistré :", error);
      return { ok: false, error: error.message };
    }
  }

  const { error } = await supabase.rpc("close_raise", {
    p_deal: input.operationId,
  });

  if (error) {
    console.error("[v2 lever] close_raise échoué :", error);
    return { ok: false, error: error.message };
  }

  revalider(input.operationId);
  return { ok: true };
}

/** Ouvrir une levée sur une opération qui n'en a pas encore. */
export async function createV2Raise(input: {
  operationId: string;
  name?: string | null;
}): Promise<Resultat> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("create_raise", {
    p_deal: input.operationId,
    p_name: input.name?.trim() || null,
  });

  if (error) {
    console.error("[v2 lever] create_raise échoué :", error);
    return { ok: false, error: error.message };
  }

  revalider(input.operationId);
  return { ok: true };
}
