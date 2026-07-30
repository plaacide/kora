import "server-only";

import { createClient } from "@/lib/supabase/server";

/**
 * L'activité des invités, telle que l'accueil la montre (maquettes 73 et 74).
 *
 * Deux sources distinctes, et c'est voulu :
 *   · `audit_log` compte les CONSULTATIONS — une ligne par page servie, écrite
 *     par la visionneuse elle-même, donc infalsifiable côté client ;
 *   · `page_dwell` mesure le TEMPS passé, envoyé par le navigateur.
 * Compter les consultations depuis `page_dwell` sous-estimerait tout lecteur
 * ayant fermé son onglet avant l'envoi.
 */

const VIEW_ACTIONS = ["document.page_viewed", "document.downloaded"];

export interface DailyViews {
  day: string;
  value: number;
}

export interface Reading {
  actorName: string;
  actorEmail: string;
  documentName: string;
  operationName: string;
  totalMs: number;
  lastReadAt: string;
}

function frenchDay(date: Date): string {
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

/**
 * Consultations par jour sur la fenêtre demandée.
 *
 * Les jours sans consultation valent zéro plutôt que d'être absents : une
 * courbe qui saute les jours creux monte tout droit et ment sur la tendance.
 */
export async function dailyViews(
  organizationId: string,
  days = 30,
): Promise<DailyViews[]> {
  const supabase = await createClient();

  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (days - 1));

  const { data, error } = await supabase
    .from("audit_log")
    .select("created_at")
    .eq("org_id", organizationId)
    .in("action", VIEW_ACTIONS)
    .gte("created_at", since.toISOString());

  const counts = new Map<string, number>();
  if (!error) {
    for (const row of (data ?? []) as Array<{ created_at: string }>) {
      const key = new Date(row.created_at).toDateString();
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(since);
    date.setDate(since.getDate() + index);
    return { day: frenchDay(date), value: counts.get(date.toDateString()) ?? 0 };
  });
}

interface DwellRow {
  ms: number;
  created_at: string;
  actor_id: string;
  documents: { name: string } | Array<{ name: string }> | null;
  deals: { name: string } | Array<{ name: string }> | null;
}

function first<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

/**
 * Les lectures récentes, cumulées par personne et par document.
 *
 * `page_dwell` enregistre une ligne par page et par tranche : sans
 * regroupement, le tableau afficherait dix fois le même document pour une
 * seule lecture.
 */
export async function recentReadings(
  organizationId: string,
  limit = 20,
): Promise<Reading[]> {
  const supabase = await createClient();

  const { data: deals } = await supabase
    .from("deals")
    .select("id")
    .eq("org_id", organizationId);

  const dealIds = ((deals ?? []) as Array<{ id: string }>).map((row) => row.id);
  if (dealIds.length === 0) return [];

  const { data, error } = await supabase
    .from("page_dwell")
    .select("ms, created_at, actor_id, documents(name), deals(name)")
    .in("deal_id", dealIds)
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) return [];

  const rows = (data ?? []) as unknown as DwellRow[];
  if (rows.length === 0) return [];

  const names = await namesByProfile(
    supabase,
    rows.map((row) => row.actor_id),
  );

  const grouped = new Map<string, Reading>();
  for (const row of rows) {
    const documentName = first(row.documents)?.name ?? "Document supprimé";
    const key = `${row.actor_id}|${documentName}`;
    const existing = grouped.get(key);

    if (existing) {
      existing.totalMs += row.ms;
      continue;
    }

    const profile = names.get(row.actor_id);
    grouped.set(key, {
      actorName: profile?.name ?? "Invité",
      actorEmail: profile?.email ?? "",
      documentName,
      operationName: first(row.deals)?.name ?? "—",
      totalMs: row.ms,
      // Les lignes arrivent déjà triées : la première rencontrée est la plus
      // récente de ce couple personne/document.
      lastReadAt: row.created_at,
    });
  }

  return [...grouped.values()]
    .sort((a, b) => b.lastReadAt.localeCompare(a.lastReadAt))
    .slice(0, limit);
}

async function namesByProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ids: readonly string[],
): Promise<Map<string, { name: string; email: string }>> {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return new Map();

  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", unique);

  return new Map(
    (
      (data ?? []) as Array<{
        id: string;
        full_name: string | null;
        email: string | null;
      }>
    ).map((row) => [
      row.id,
      {
        name: row.full_name?.trim() || row.email?.split("@")[0] || "Invité",
        email: row.email ?? "",
      },
    ]),
  );
}

/** Nombre d'opérations actives, pour la phrase d'accroche de l'accueil. */
export async function activeOperationCount(
  organizationId: string,
): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("deals")
    .select("id", { count: "exact", head: true })
    .eq("org_id", organizationId)
    .is("archived_at", null);

  return count ?? 0;
}
