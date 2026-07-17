"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export const LEVELS = ["none", "watermark", "view", "download", "edit"] as const;
export type Level = (typeof LEVELS)[number];

/** Niveau suivant dans le cycle Aucun → Filigrané → Voir → Télécharger → Éditer → Aucun. */
export async function cycleLevel(current: Level): Promise<Level> {
  const i = LEVELS.indexOf(current);
  return LEVELS[(i + 1) % LEVELS.length];
}

export async function setPermission(input: {
  dealId: string;
  userId: string;
  folderId: string;
  level: Level;
  expiresAt?: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("set_permission", {
    p_deal: input.dealId,
    p_user: input.userId,
    p_folder: input.folderId,
    p_level: input.level,
    p_expires: input.expiresAt || null,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/permissions");
  return { ok: true };
}
