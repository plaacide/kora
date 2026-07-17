"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type Result = { ok: boolean; error?: string };

function refresh() {
  revalidatePath("/dashboard");
  revalidatePath("/pipeline");
  revalidatePath("/data-room");
  revalidatePath("/deal");
}

// --- Deals -----------------------------------------------------------------

export async function updateDeal(input: {
  dealId: string;
  name?: string;
  type?: string;
  currency?: string;
  amount?: number | null;
  stage?: string;
  readiness?: number | null;
}): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("update_deal", {
    p_deal: input.dealId,
    p_name: input.name ?? null,
    p_type: input.type ?? null,
    p_currency: input.currency ?? null,
    p_amount: input.amount ?? null,
    p_stage: input.stage ?? null,
    p_readiness: input.readiness ?? null,
  });
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}

export async function setDealStage(
  dealId: string,
  stage: string,
): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_deal_stage", {
    p_deal: dealId,
    p_stage: stage,
  });
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}

export async function deleteDeal(dealId: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_deal", { p_deal: dealId });
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}

// --- Dossiers --------------------------------------------------------------

export async function renameFolder(
  folderId: string,
  name: string,
): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("rename_folder", {
    p_folder: folderId,
    p_name: name,
  });
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}

export async function deleteFolder(folderId: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_folder", { p_folder: folderId });
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}

// --- Documents -------------------------------------------------------------

export async function renameDocument(
  docId: string,
  name: string,
): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("rename_document", {
    p_doc: docId,
    p_name: name,
  });
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}

export async function moveDocument(
  docId: string,
  folderId: string,
): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("move_document", {
    p_doc: docId,
    p_folder: folderId,
  });
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}

/**
 * Supprime le document ET ses fichiers dans le bucket.
 *
 * L'ordre compte : on lit d'abord les clés de stockage (sous RLS, donc
 * seulement si l'utilisateur y a droit), puis on supprime en base — ce qui
 * vérifie les droits et audite —, et seulement ensuite on purge le bucket
 * avec la clé privilégiée. Si la purge échoue, la base reste cohérente et
 * il ne reste qu'un objet orphelin, jamais l'inverse.
 */
export async function deleteDocument(docId: string): Promise<Result> {
  const supabase = await createClient();

  const { data: versions } = await supabase
    .from("document_versions")
    .select("storage_key")
    .eq("document_id", docId);

  const { error } = await supabase.rpc("delete_document", { p_doc: docId });
  if (error) return { ok: false, error: error.message };

  const keys = (versions ?? []).map((v) => v.storage_key).filter(Boolean);
  if (keys.length) {
    try {
      await createAdminClient().storage.from("documents").remove(keys);
    } catch {
      // Objet orphelin : la suppression métier reste valide et auditée.
    }
  }

  refresh();
  return { ok: true };
}
