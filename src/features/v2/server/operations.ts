import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import type { OperationCard } from "../domain/operation";
import {
  operationLifecycle,
  operationType,
  sharingState,
} from "../domain/operation";

/**
 * Lecture des opérations d'une organisation.
 *
 * Le modèle cible de `docs/v2/DATA-MODEL.md` prévoit une table `operations`
 * qui n'existe pas encore : la V1 range tout dans `deals`. On dérive donc ce
 * que les colonnes réelles permettent, et on omet le reste plutôt que de
 * l'inventer.
 *
 * `operationType`, `operationLifecycle` et `sharingState` vivent dans le
 * domaine (`../domain/operation`) plutôt qu'ici : ce sont des règles pures,
 * sans dépendance à Supabase — les y garder les rend testables sans mock.
 */

interface DealRow {
  id: string;
  name: string;
  objectif: string | null;
  readiness_score: number | null;
  archived_at: string | null;
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

export interface OperationBrève {
  id: string;
  nom: string;
  objectif: string | null;
  archivee: boolean;
}

/**
 * Les opérations de l'organisation, en version légère.
 *
 * SÉPARÉE DE `listOperations` À DESSEIN. Celle-ci alimente le sélecteur du
 * rail, présent sur CHAQUE écran d'opération : lui faire compter les pièces,
 * les invitations et la dernière activité de toutes les opérations à chaque
 * navigation coûterait quatre requêtes pour afficher trois noms.
 *
 * Les archivées viennent avec, marquées : une opération rangée reste
 * consultable, et ne plus pouvoir y revenir depuis le rail obligerait à
 * repasser par la liste complète.
 */
export async function listOperationNames(
  organizationId: string,
): Promise<OperationBrève[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("deals")
    .select("id, name, objectif, archived_at")
    .eq("org_id", organizationId)
    .order("archived_at", { ascending: true, nullsFirst: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[v2 opérations] liste du sélecteur :", error);
    return [];
  }

  return ((data ?? []) as Array<{
    id: string;
    name: string;
    objectif: string | null;
    archived_at: string | null;
  }>).map((row) => ({
    id: row.id,
    nom: row.name,
    objectif: row.objectif,
    archivee: Boolean(row.archived_at),
  }));
}
