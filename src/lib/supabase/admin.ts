import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Client privilégié — SERVEUR UNIQUEMENT.
 *
 * Contourne la RLS. C'est le seul composant autorisé à lire le bucket
 * `documents` (aucun client n'a de policy SELECT dessus). Ne jamais importer
 * ce module depuis un composant client.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !secret) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY manquante — le viewer ne peut pas lire les documents.",
    );
  }

  return createSupabaseClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
