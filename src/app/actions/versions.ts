"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addDocumentVersion(input: {
  docId: string;
  storageKey: string;
  size: number;
  mime: string;
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("add_document_version", {
    p_doc: input.docId,
    p_storage_key: input.storageKey,
    p_size: input.size,
    p_mime: input.mime,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/versions");
  revalidatePath("/data-room");
  return { ok: true };
}

export async function restoreVersion(
  docId: string,
  versionId: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("restore_document_version", {
    p_doc: docId,
    p_version: versionId,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/versions");
  revalidatePath("/data-room");
  return { ok: true };
}
