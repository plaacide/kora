import "server-only";

import { createClient } from "@/lib/supabase/server";

/**
 * L'usage réel d'un espace de travail — chapitre 8.8.
 *
 * IL SE COMPTE, IL NE S'INCRÉMENTE PAS. Le document prévoit une table
 * `usage_counters`, et elle existe : elle servira aux compteurs qui ne peuvent
 * pas se recalculer — signatures émises, rapports générés. Mais tout ce qui
 * peut être RECOMPTÉ l'est, parce qu'un compteur incrémental finit toujours par
 * mentir : un incident au mauvais moment, une suppression hors application, et
 * l'organisation se voit refuser une opération à laquelle elle a droit.
 *
 * LES VISITEURS EXTERNES NE SONT JAMAIS FACTURÉS (§7.3), et c'est visible ici :
 * `internal_users` exclut les `guest`. Un investisseur invité sur une data room
 * ne coûte rien.
 */

/** Un octet n'est pas un gigaoctet : la limite du plan est exprimée en Go. */
const OCTETS_PAR_GO = 1024 * 1024 * 1024;

export async function featureUsage(
  workspaceId: string,
  featureCode: string,
): Promise<number> {
  const supabase = await createClient();

  switch (featureCode) {
    case "internal_users": {
      // Les collaborateurs, pas les invités : c'est la règle §7.3.
      const { count } = await supabase
        .from("memberships")
        .select("id", { count: "exact", head: true })
        .eq("org_id", workspaceId)
        .neq("role", "guest");
      return count ?? 0;
    }

    case "active_deals": {
      // « Active » veut dire NON ARCHIVÉE : `deals` n'a pas de colonne d'état,
      // c'est `archived_at` qui fait foi. Une opération clôturée mais non
      // archivée occupe toujours sa place.
      const { count } = await supabase
        .from("deals")
        .select("id", { count: "exact", head: true })
        .eq("org_id", workspaceId)
        .is("archived_at", null);
      return count ?? 0;
    }

    case "external_visitors": {
      // Les personnes réellement invitées, pas les invitations : une même
      // adresse invitée sur trois opérations reste une personne.
      const { data } = await supabase
        .from("invitations")
        .select("email, deals!inner(org_id)")
        .eq("deals.org_id", workspaceId)
        .neq("status", "revoked");

      const adresses = new Set(
        ((data ?? []) as Array<{ email: string }>).map((r) =>
          r.email.toLowerCase(),
        ),
      );
      return adresses.size;
    }

    case "storage_gb": {
      // Trois requêtes sur des colonnes directes plutôt qu'une jointure
      // imbriquée : filtrer sur `documents.deal_id` à travers un embed ne
      // filtre PAS côté PostgREST, et la somme retombait silencieusement à
      // zéro. Un chiffre faux vaut moins qu'une requête de plus.
      const { data: operations } = await supabase
        .from("deals")
        .select("id")
        .eq("org_id", workspaceId);

      const ids = ((operations ?? []) as Array<{ id: string }>).map((d) => d.id);
      if (ids.length === 0) return 0;

      const { data: pieces } = await supabase
        .from("documents")
        .select("id")
        .in("deal_id", ids);

      const docs = ((pieces ?? []) as Array<{ id: string }>).map((d) => d.id);
      if (docs.length === 0) return 0;

      const { data } = await supabase
        .from("document_versions")
        .select("size_bytes")
        .in("document_id", docs);

      const octets = ((data ?? []) as Array<{ size_bytes: number | null }>)
        .reduce((total, v) => total + (v.size_bytes ?? 0), 0);

      // Deux décimales, pas d'arrondi au gigaoctet supérieur : 22 Mo affichés
      // « 1 Go sur 1 » annonceraient une limite atteinte alors qu'il reste 98 %
      // de l'espace.
      return Math.round((octets / OCTETS_PAR_GO) * 100) / 100;
    }

    case "active_companies":
    case "deals_per_year": {
      // Notions de programme et de financeur : les tables qui les portent
      // n'existent pas encore. Zéro est la vérité, pas un défaut de lecture.
      return 0;
    }

    default: {
      // Les compteurs qui ne se recalculent pas vivent dans la table prévue.
      const { data } = await supabase
        .from("usage_counters")
        .select("used_value")
        .eq("workspace_id", workspaceId)
        .eq("feature_code", featureCode)
        .order("period_end", { ascending: false })
        .limit(1)
        .maybeSingle();

      return (data as { used_value: number } | null)?.used_value ?? 0;
    }
  }
}
