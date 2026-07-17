"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Level } from "@/lib/permissions";

// Ce module ne doit exporter QUE des fonctions async (contrainte "use server").
// Les constantes vivent dans @/lib/permissions.

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
