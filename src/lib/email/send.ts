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
  const from = process.env.EMAIL_FROM ?? "Sanza <onboarding@resend.dev>";

  // Garde-fou bruyant : avec l'adresse de test, TOUT envoi à un tiers échoue —
  // invitations comprises. Le défaut est autrement invisible en production
  // (l'invitation est créée, l'écran affiche un succès) et ne se découvre
  // qu'au moment où un investisseur signale n'avoir jamais rien reçu.
  if (from.includes("resend.dev")) {
    console.error(
      "[email] EMAIL_FROM utilise l'adresse de test Resend (%s) : seuls les " +
        "envois vers le propriétaire du compte aboutiront. Configurer " +
        "EMAIL_FROM sur le domaine vérifié, ex. « Sanza <noreply@sanza.africa> ».",
      from,
    );
  }

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
