"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Demande d'accès à une data room, depuis une fiche de la vitrine.
 *
 * Le seul geste qu'un investisseur peut poser depuis une fiche. Il ne DONNE
 * aucun accès : il crée une demande `pending`, que le programme filtrera et
 * que l'entreprise tranchera (§5).
 */
export async function demanderAcces(input: {
  startupOrgId: string;
  instrument: "equity" | "dette" | "mezzanine";
  message?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "non authentifié" };

  // La salle visée est celle que l'ENTREPRISE a désignée dans son
  // consentement — jamais une salle choisie par l'investisseur ou par le
  // programme. Sans salle désignée, il n'y a rien à demander.
  const { data: consent } = await supabase
    .from("listing_consents")
    .select("deal_id, program_org_id")
    .eq("startup_org_id", input.startupOrgId)
    .is("revoked_at", null)
    .not("deal_id", "is", null)
    .limit(1)
    .maybeSingle();

  const c = consent as { deal_id: string; program_org_id: string } | null;
  if (!c) return { ok: false, error: "aucune data room désignée" };

  const { error } = await supabase.from("access_requests").insert({
    investor_user: user.id,
    program_org_id: c.program_org_id,
    startup_org_id: input.startupOrgId,
    deal_id: c.deal_id,
    // L'instrument vient de la LECTURE active : une demande née d'une lecture
    // dette ne dit pas la même chose qu'une demande equity, et l'entreprise
    // doit le savoir avant de répondre.
    instrument: input.instrument,
    message: input.message?.trim() || null,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * L'investisseur relance sa demande restée sans réponse.
 *
 * UNE SEULE FOIS — la base le fait respecter (`relaunch_access_request`), pas
 * l'écran. Une relance illimitée transformerait la file du programme en boîte
 * de réclamation et retirerait à l'expiration tout son sens.
 */
export async function relancerDemande(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("relaunch_access_request", {
    p_request: id,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
