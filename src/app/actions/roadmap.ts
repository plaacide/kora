"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, clientIp } from "@/lib/security/rate-limit";

export async function suggestFeature(input: {
  title: string;
  description: string;
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();

  // Une page publique invite au spam : on borne.
  const ip = await clientIp();
  if (!rateLimit(`suggest:${ip}`, 5, 60 * 60 * 1000).ok) {
    return { ok: false, error: "rate_limited" };
  }

  const { error } = await supabase.rpc("suggest_feature", {
    p_title: input.title,
    p_description: input.description,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/roadmap");
  return { ok: true };
}

export async function toggleVote(
  itemId: string,
): Promise<{ ok: boolean; voted?: boolean; error?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("toggle_roadmap_vote", {
    p_item: itemId,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/roadmap");
  return { ok: true, voted: data as boolean };
}
