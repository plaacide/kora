import { Resend } from "resend";

/**
 * Abstraction d'envoi d'email — même principe que PaymentProvider :
 * le fournisseur est un détail remplaçable, pas une dépendance structurante.
 *
 * Dégradation gracieuse : sans RESEND_API_KEY, on ne casse rien. L'invitation
 * est créée et le lien reste transmissible à la main.
 */

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
}

export interface SendResult {
  ok: boolean;
  /** true = aucun fournisseur configuré, l'appelant doit proposer le lien. */
  skipped?: boolean;
  error?: string;
}

export async function sendEmail(message: EmailMessage): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, skipped: true };

  // Sans domaine vérifié, Resend n'autorise que onboarding@resend.dev,
  // qui ne peut écrire qu'au propriétaire du compte.
  const from = process.env.EMAIL_FROM ?? "Kora <onboarding@resend.dev>";

  try {
    const resend = new Resend(key);
    const { error } = await resend.emails.send({
      from,
      to: message.to,
      subject: message.subject,
      html: message.html,
    });

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "send_failed" };
  }
}
