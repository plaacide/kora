"use server";

import * as z from "zod";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, clientIp } from "@/lib/security/rate-limit";
import { sendEmail } from "@/lib/email/send";
import { getLocale } from "next-intl/server";

const schema = z.object({
  email: z.email({ error: "emailInvalid" }).trim(),
  org: z.string().trim().max(140).optional(),
  size: z.string().trim().max(30).optional(),
});

export interface SaeDemoState {
  ok?: boolean;
  errorKey?: string;
  fieldErrors?: Record<string, string[]>;
}

/**
 * Demande de démo d'une structure d'accompagnement.
 *
 * Vente assistée : l'enjeu n'est pas d'enregistrer la ligne, c'est que
 * quelqu'un rappelle. D'où la notification interne — vers SALES_NOTIFY_EMAIL,
 * une adresse qui REÇOIT (noreply@ n'a pas de boîte). Son absence ne fait pas
 * échouer la demande : la ligne est en base, mais on la journalise fort,
 * parce qu'une demande de démo qu'on ne voit pas est un client perdu.
 */
export async function requestSaeDemo(
  _prev: SaeDemoState | undefined,
  formData: FormData,
): Promise<SaeDemoState> {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    org: formData.get("org") || undefined,
    size: formData.get("size") || undefined,
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
  if (!rateLimit(`sae-demo:${ip}`, 5, 15 * 60 * 1000).ok) {
    return { errorKey: "tooManyAttempts" };
  }

  const locale = (await getLocale()) === "en" ? "en" : "fr";
  const supabase = await createClient();

  const { error } = await supabase.rpc("request_sae_demo", {
    p_email: parsed.data.email,
    p_org_name: parsed.data.org ?? null,
    p_cohort_size: parsed.data.size ?? null,
    p_locale: locale,
  });

  if (error) {
    console.error("[sae-demo] enregistrement échoué", error);
    return { errorKey: "generic" };
  }

  const notify = process.env.SALES_NOTIFY_EMAIL;
  if (notify) {
    const sent = await sendEmail({
      to: notify,
      subject: `Demande de démo Portfolio — ${parsed.data.org ?? parsed.data.email}`,
      html: `<p>Nouvelle demande de démo SAE :</p>
<ul>
<li>Email : ${escapeHtml(parsed.data.email)}</li>
<li>Structure : ${escapeHtml(parsed.data.org ?? "non renseignée")}</li>
<li>Taille de cohorte : ${escapeHtml(parsed.data.size ?? "non renseignée")}</li>
</ul>
<p>À recontacter sous 48 h.</p>`,
    });
    if (!sent.ok && !sent.skipped) {
      console.error("[sae-demo] notification interne non envoyée", sent.error);
    }
  } else {
    console.error(
      "[sae-demo] SALES_NOTIFY_EMAIL absent : demande enregistrée en base " +
        "mais PERSONNE n'est prévenu. Configurer la variable dans Coolify.",
    );
  }

  return { ok: true };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
