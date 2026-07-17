"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Result = { ok: boolean; error?: string };

export async function askQuestion(input: {
  dealId: string;
  body: string;
  documentId?: string | null;
}): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("ask_question", {
    p_deal: input.dealId,
    p_body: input.body,
    p_document: input.documentId ?? null,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/qa");
  return { ok: true };
}

export async function saveAnswer(
  questionId: string,
  body: string,
): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("save_answer", {
    p_question: questionId,
    p_body: body,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/qa");
  return { ok: true };
}

export async function setAnswerStatus(
  questionId: string,
  status: string,
): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_answer_status", {
    p_question: questionId,
    p_status: status,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/qa");
  return { ok: true };
}
