"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import * as z from "zod";

const dealSchema = z.object({
  name: z.string().trim().min(2, { error: "dealNameRequired" }),
  type: z.string().trim().min(1).default("VC"),
  currency: z
    .enum(["XOF", "XAF", "NGN", "KES", "GHS", "USD", "EUR"])
    .default("XOF"),
  amount: z.coerce.number().nonnegative().optional(),
});

const folderSchema = z.object({
  deal_id: z.uuid(),
  parent_id: z.uuid().nullable().optional(),
  name: z.string().trim().min(1, { error: "folderNameRequired" }),
});

export type DealState =
  | { errorKey?: string; errorRaw?: string; fieldErrors?: Record<string, string[]> }
  | undefined;

export async function createDeal(
  _prev: DealState,
  formData: FormData,
): Promise<DealState> {
  const parsed = dealSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type") ?? "VC",
    currency: formData.get("currency") ?? "XOF",
    amount: formData.get("amount") || undefined,
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "_");
      (fieldErrors[key] ??= []).push(issue.message);
    }
    return { fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_deal", {
    p_name: parsed.data.name,
    p_type: parsed.data.type,
    p_currency: parsed.data.currency,
    p_amount: parsed.data.amount ?? null,
  });

  if (error) return { errorRaw: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/data-room");
  return {};
}

export async function createFolder(
  _prev: DealState,
  formData: FormData,
): Promise<DealState> {
  const parsed = folderSchema.safeParse({
    deal_id: formData.get("deal_id"),
    parent_id: formData.get("parent_id") || null,
    name: formData.get("name"),
  });

  if (!parsed.success) return { errorKey: "folderNameRequired" };

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_folder", {
    p_deal: parsed.data.deal_id,
    p_parent: parsed.data.parent_id ?? null,
    p_name: parsed.data.name,
  });

  if (error) return { errorRaw: error.message };

  revalidatePath("/data-room");
  return {};
}

/** Appelé après l'upload direct navigateur -> Storage. */
export async function registerDocument(input: {
  dealId: string;
  folderId: string;
  name: string;
  storageKey: string;
  size: number;
  mime: string;
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("register_document", {
    p_deal: input.dealId,
    p_folder: input.folderId,
    p_name: input.name,
    p_storage_key: input.storageKey,
    p_size: input.size,
    p_mime: input.mime,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/data-room");
  return { ok: true };
}
