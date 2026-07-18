import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Vérification de signature « Standard Webhooks », le format utilisé par le
 * Send Email Hook de Supabase.
 *
 * Écrite à la main plutôt qu'avec la bibliothèque `standardwebhooks` : c'est
 * une trentaine de lignes de HMAC, et une dépendance de moins à faire traverser
 * le traceur de la sortie standalone (cf. AGENTS.md, l'épisode pdfjs).
 *
 * Sans cette vérification, la route serait un envoyeur d'e-mails ouvert à
 * n'importe qui : on pourrait faire partir des messages signés de notre domaine
 * vers des adresses arbitraires, ce qui brûlerait notre réputation d'envoi.
 */

/** Fenêtre acceptée autour de l'horodatage, contre le rejeu d'une requête captée. */
const TOLERANCE_SECONDS = 5 * 60;

export function verifyWebhookSignature(input: {
  payload: string;
  headers: Headers;
  /** Secret Supabase, de la forme `v1,whsec_…`. */
  secret: string;
}): { ok: true } | { ok: false; reason: string } {
  const id = input.headers.get("webhook-id");
  const timestamp = input.headers.get("webhook-timestamp");
  const signature = input.headers.get("webhook-signature");

  if (!id || !timestamp || !signature) {
    return { ok: false, reason: "en-têtes de signature absents" };
  }

  const sentAt = Number(timestamp);
  if (!Number.isFinite(sentAt)) {
    return { ok: false, reason: "horodatage illisible" };
  }
  const drift = Math.abs(Math.floor(Date.now() / 1000) - sentAt);
  if (drift > TOLERANCE_SECONDS) {
    return { ok: false, reason: `horodatage hors fenêtre (${drift}s)` };
  }

  // Supabase préfixe le secret ; la partie utile est en base64.
  const raw = input.secret.replace(/^v1,/, "").replace(/^whsec_/, "");
  const key = Buffer.from(raw, "base64");

  const expected = createHmac("sha256", key)
    .update(`${id}.${timestamp}.${input.payload}`)
    .digest("base64");
  const expectedBuf = Buffer.from(expected);

  // L'en-tête peut porter plusieurs signatures (rotation de secret en cours).
  for (const part of signature.split(" ")) {
    const value = part.startsWith("v1,") ? part.slice(3) : part;
    const candidate = Buffer.from(value);
    if (
      candidate.length === expectedBuf.length &&
      timingSafeEqual(candidate, expectedBuf)
    ) {
      return { ok: true };
    }
  }

  return { ok: false, reason: "signature invalide" };
}
