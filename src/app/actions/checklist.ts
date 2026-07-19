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

/**
 * Rattache (ou détache) la preuve d'une exigence.
 *
 * Renvoie le readiness recalculé : rattacher une preuve fait désormais passer
 * la pièce à « fait », donc le score bouge — l'écran doit pouvoir le refléter
 * sans attendre le rechargement.
 */
export async function linkChecklistDocument(
  itemId: string,
  docId: string | null,
): Promise<{ ok: boolean; error?: string; readiness?: number }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("link_checklist_document", {
    p_item: itemId,
    p_doc: docId,
  });
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true, readiness: data as number };
}

/** Crée une exigence de DD personnalisée. */
export async function addChecklistItem(
  dealId: string,
  category: string,
  label: string,
  description: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("add_checklist_item", {
    p_deal: dealId,
    p_category: category,
    p_label: label,
    p_description: description,
  });
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}

export async function updateChecklistItem(
  itemId: string,
  label: string,
  description: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("update_checklist_item", {
    p_item: itemId,
    p_label: label,
    p_description: description,
  });
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}

export async function deleteChecklistItem(
  itemId: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_checklist_item", {
    p_item: itemId,
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
