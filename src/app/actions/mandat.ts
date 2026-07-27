"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Ce que l'entreprise autorise un programme à faire.
 *
 * Deux gestes distincts, volontairement séparés. Être LISTÉ montre des
 * chiffres que l'entreprise a publiés ; donner MANDAT laisse ouvrir sa data
 * room. Les fondre en un seul interrupteur ferait accorder le second en
 * croyant n'accorder que le premier.
 */

/**
 * Le mandat : l'entreprise délègue à un programme le droit d'ouvrir SA data
 * room à un investisseur, sans repasser par elle.
 *
 * C'est le geste le plus lourd du produit. Les gardes vivent toutes dans la
 * base (`grant_mandate`) : responsable de l'entreprise, programme réellement
 * dans une cohorte vivante, écriture au journal d'audit dans la même
 * transaction. Rien ici ne les redouble — une garde côté écran se contourne,
 * et la dédoubler donne l'illusion qu'elle protège.
 */

export interface MandatResultat {
  ok: boolean;
  error?: string;
}

export async function donnerMandat(
  dealId: string,
  programmeId: string,
): Promise<MandatResultat> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("grant_mandate", {
    p_deal: dealId,
    p_program: programmeId,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/permissions");
  return { ok: true };
}

export async function retirerMandat(
  dealId: string,
  programmeId: string,
): Promise<MandatResultat> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("revoke_mandate", {
    p_deal: dealId,
    p_program: programmeId,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/permissions");
  return { ok: true };
}

/**
 * L'entreprise accepte d'être listée dans le dealroom d'une cohorte.
 *
 * PAR COHORTE (§2), et la salle est DÉSIGNÉE par l'entreprise : c'est celle
 * depuis laquelle elle consent. Le programme ne choisit jamais à sa place —
 * une entreprise qui a trois salles ne veut pas forcément montrer la même.
 */
export async function accepterListage(
  cohorteId: string,
  dealId: string,
): Promise<MandatResultat> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("grant_listing_consent", {
    p_cohort: cohorteId,
    p_deal: dealId,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/permissions");
  return { ok: true };
}

export async function retirerListage(
  cohorteId: string,
): Promise<MandatResultat> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("revoke_listing_consent", {
    p_cohort: cohorteId,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/permissions");
  return { ok: true };
}
