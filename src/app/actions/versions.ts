"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { prechaufferVersion } from "@/lib/viewer/precompute";

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

  // Même préchauffage qu'au premier dépôt : une nouvelle version est un
  // fichier neuf, son cache est vide. Sans cela, remplacer un document
  // ramenait la première lecture à la lenteur d'origine.
  after(async () => {
    const { data: v } = await createAdminClient()
      .from("document_versions")
      .select("id")
      .eq("storage_key", input.storageKey)
      .maybeSingle();
    if (v?.id) await prechaufferVersion(v.id as string);
  });

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
