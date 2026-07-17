"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function refresh() {
  revalidatePath("/checklist");
  revalidatePath("/readiness");
  revalidatePath("/dashboard");
  revalidatePath("/deal");
  revalidatePath("/data-room");
}

export async function setChecklistStatus(
  itemId: string,
  status: string,
): Promise<{ ok: boolean; readiness?: number; error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("set_checklist_status", {
    p_item: itemId,
    p_status: status,
  });
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true, readiness: data as number };
}

export async function linkChecklistDocument(
  itemId: string,
  docId: string | null,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("link_checklist_document", {
    p_item: itemId,
    p_doc: docId,
  });
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}

/** Applique la checklist à un deal créé avant son existence. */
export async function applyChecklist(
  dealId: string,
): Promise<{ ok: boolean; created?: number; error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("apply_checklist_template", {
    p_deal: dealId,
  });
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true, created: data as number };
}
