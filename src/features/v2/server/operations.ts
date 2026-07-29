import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import type {
  OperationCard,
  OperationLifecycle,
  OperationSharingState,
  OperationType,
} from "../domain/operation";

/**
 * Lecture des opérations d'une organisation.
 *
 * Le modèle cible de `docs/v2/DATA-MODEL.md` prévoit une table `operations`
 * qui n'existe pas encore : la V1 range tout dans `deals`. On dérive donc ce
 * que les colonnes réelles permettent, et on omet le reste plutôt que de
 * l'inventer.
 */

interface DealRow {
  id: string;
  name: string;
  objectif: string | null;
  readiness_score: number | null;
  archived_at: string | null;
}

/**
 * Les comptes créés avant l'élargissement de `objectif` portent tous `levee`,
 * y compris ceux qui avaient répondu « financement bancaire » ou « institution
 * ou bailleur » : leur réponse n'a pas été enregistrée et ne se devine pas.
 */
const OPERATION_TYPES_BY_OBJECTIF: Record<string, OperationType> = {
  levee: "equity",
  dette: "bank_debt",
  dfi: "dfi_or_grant",
  diligence: "due_diligence",
};

function operationType(objectif: string | null): OperationType {
  if (!objectif) return "undecided";
  return OPERATION_TYPES_BY_OBJECTIF[objectif] ?? "undecided";
}

/** `draft` et `closed` n'ont pas de source : seul l'archivage est enregistré. */
function operationLifecycle(archivedAt: string | null): OperationLifecycle {
  return archivedAt ? "archived" : "active";
}

function sharingState(guestCount: number): OperationSharingState {
  return guestCount > 0 ? "shared" : "private";
}

/**
 * Dernière activité par opération, une requête par opération.
 *
 * Une requête unique bornée par `limit` serait plus économe, mais une
 * opération très active masquerait les autres et on afficherait « aucune
 * activité » à tort. Une organisation fondatrice en compte une poignée.
 */
async function lastActivityByOperation(
  supabase: SupabaseClient,
  ids: readonly string[],
): Promise<Map<string, string | null>> {
  const entries = await Promise.all(
    ids.map(async (id) => {
      const { data } = await supabase
        .from("audit_log")
        .select("created_at")
        .eq("deal_id", id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      return [id, (data?.created_at as string | undefined) ?? null] as const;
    }),
  );

  return new Map(entries);
}

function countByDeal(rows: Array<{ deal_id: string }> | null): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of rows ?? []) {
    counts.set(row.deal_id, (counts.get(row.deal_id) ?? 0) + 1);
  }
  return counts;
}

export async function listOperations(
  organizationId: string,
): Promise<OperationCard[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("deals")
    .select("id, name, objectif, readiness_score, archived_at")
    .eq("org_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rows = (data ?? []) as DealRow[];
  if (rows.length === 0) return [];

  const ids = rows.map((row) => row.id);
  const [documents, invitations, lastActivity] = await Promise.all([
    supabase.from("documents").select("deal_id").in("deal_id", ids),
    supabase
      .from("invitations")
      .select("deal_id")
      .in("deal_id", ids)
      .neq("status", "revoked"),
    lastActivityByOperation(supabase, ids),
  ]);

  const documentCounts = countByDeal(
    documents.data as Array<{ deal_id: string }> | null,
  );
  const guestCounts = countByDeal(
    invitations.data as Array<{ deal_id: string }> | null,
  );

  const operations = rows.map((row) => {
    const guestCount = guestCounts.get(row.id) ?? 0;

    return {
      id: row.id,
      name: row.name,
      type: operationType(row.objectif),
      lifecycle: operationLifecycle(row.archived_at),
      sharingState: sharingState(guestCount),
      preparation: row.readiness_score ?? 0,
      documentCount: documentCounts.get(row.id) ?? 0,
      guestCount,
      lastActivityAt: lastActivity.get(row.id) ?? null,
    } satisfies OperationCard;
  });

  // Les opérations archivées ferment la liste sans la quitter : le fondateur
  // doit pouvoir les rouvrir en lecture.
  return operations.sort((a, b) => {
    if (a.lifecycle === b.lifecycle) return 0;
    return a.lifecycle === "archived" ? 1 : -1;
  });
}
