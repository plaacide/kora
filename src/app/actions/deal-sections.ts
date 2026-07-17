"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Result = { ok: boolean; error?: string };

/** La fiche de deal et le dashboard reflètent tous deux jalons et notes. */
function refresh() {
  revalidatePath("/deal");
  revalidatePath("/dashboard");
}

// --- Jalons ----------------------------------------------------------------

export async function addMilestone(
  dealId: string,
  label: string,
  due: string | null,
): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("add_milestone", {
    p_deal: dealId,
    p_label: label,
    p_due: due || null,
  });
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}

export async function toggleMilestone(id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("toggle_milestone", { p_id: id });
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}

export async function deleteMilestone(id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_milestone", { p_id: id });
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}

// --- Notes d'IC ------------------------------------------------------------

export async function addIcNote(dealId: string, body: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("add_ic_note", {
    p_deal: dealId,
    p_body: body,
  });
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}

export async function deleteIcNote(id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_ic_note", { p_id: id });
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}
