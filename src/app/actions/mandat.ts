"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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
