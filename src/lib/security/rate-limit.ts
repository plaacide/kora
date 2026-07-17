import { headers } from "next/headers";

/**
 * Limiteur de débit en mémoire, par instance.
 *
 * PORTÉE RÉELLE — à ne pas surestimer :
 * - En serverless (Vercel), l'état vit dans une instance et disparaît au
 *   recyclage : un attaquant réparti sur plusieurs instances contourne ce
 *   compteur. C'est une défense EN PROFONDEUR, pas une garantie.
 * - La protection anti-brute-force qui fait foi est celle de Supabase Auth,
 *   appliquée côté serveur sur ses endpoints.
 * - Le jour où le trafic le justifie, remplacer par un store partagé
 *   (Upstash Redis) sans changer l'interface `rateLimit()`.
 *
 * Utile malgré tout : coût nul, et il coupe les tentatives naïves répétées
 * depuis une même source sur une instance chaude.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

function prune(now: number): void {
  for (const [key, bucket] of buckets) {
    if (now > bucket.resetAt) buckets.delete(key);
  }
}

export interface RateLimitResult {
  ok: boolean;
  /** Secondes avant réinitialisation de la fenêtre. */
  retryAfter: number;
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();

  // Garde-fou mémoire : purge si la map enfle.
  if (buckets.size > MAX_BUCKETS) prune(now);

  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }

  bucket.count += 1;

  if (bucket.count > limit) {
    return { ok: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  return { ok: true, retryAfter: 0 };
}

/** IP client derrière le proxy Vercel. */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  return (
    forwarded?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown"
  );
}
