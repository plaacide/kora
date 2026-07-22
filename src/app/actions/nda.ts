"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Result = { ok: boolean; error?: string };

/**
 * Règle le NDA d'une data room : l'exiger par défaut (`required`) et/ou son
 * modèle de texte (`template`). Champ absent = inchangé. Écriture auditée.
 */
export async function setDealNda(input: {
  dealId: string;
  required?: boolean;
  template?: string;
}): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_deal_nda", {
    p_deal: input.dealId,
    p_required: input.required ?? null,
    p_template: input.template ?? null,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/nda");
  revalidatePath("/invitations");
  return { ok: true };
}
