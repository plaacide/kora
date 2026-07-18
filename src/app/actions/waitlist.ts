"use server";

import * as z from "zod";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, clientIp } from "@/lib/security/rate-limit";
import { sendEmail } from "@/lib/email/send";
import { waitlistEmail } from "@/lib/email/templates";
import { getLocale } from "next-intl/server";

const schema = z.object({
  email: z.email({ error: "emailInvalid" }).trim(),
  company: z.string().trim().max(120).optional(),
  ticket: z.string().trim().max(60).optional(),
});

export interface WaitlistState {
  ok?: boolean;
  errorKey?: string;
  fieldErrors?: Record<string, string[]>;
}

/**
 * Inscription d'un investisseur à la liste d'attente.
 *
 * Seul formulaire de Sanza ouvert à des visiteurs non authentifiés : il est
 * donc la porte d'entrée naturelle pour un robot. D'où la limitation par IP,
 * en plus des garde-fous en base.
 */
export async function joinWaitlist(
  _prev: WaitlistState | undefined,
  formData: FormData,
): Promise<WaitlistState> {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    company: formData.get("company") || undefined,
    ticket: formData.get("ticket") || undefined,
  });

  if (!parsed.success) {
    const out: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "_");
      (out[key] ??= []).push(issue.message);
    }
    return { fieldErrors: out };
  }

  const ip = await clientIp();
  if (!rateLimit(`waitlist:${ip}`, 5, 15 * 60 * 1000).ok) {
    return { errorKey: "tooManyAttempts" };
  }

  const locale = (await getLocale()) === "en" ? "en" : "fr";
  const supabase = await createClient();

  const { error } = await supabase.rpc("join_investor_waitlist", {
    p_email: parsed.data.email,
    p_company: parsed.data.company ?? null,
    p_ticket: parsed.data.ticket ?? null,
    p_locale: locale,
  });

  if (error) {
    console.error("[waitlist] inscription échouée", error);
    return { errorKey: "generic" };
  }

  // L'e-mail de confirmation ne conditionne PAS le succès : l'inscription est
  // enregistrée, et un fournisseur d'envoi indisponible ne doit pas faire
  // croire au visiteur que sa demande a échoué.
  const mail = waitlistEmail({ locale });
  const sent = await sendEmail({
    to: parsed.data.email,
    subject: mail.subject,
    html: mail.html,
  });
  if (!sent.ok && !sent.skipped) {
    console.error("[waitlist] e-mail de confirmation non envoyé", sent.error);
  }

  return { ok: true };
}
