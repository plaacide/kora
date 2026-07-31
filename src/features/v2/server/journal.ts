import "server-only";

import { nomActeur, nomCourt, type EntreeJournal } from "@/features/v2/domain/journal";
import { createClient } from "@/lib/supabase/server";

/**
 * Le journal d'audit — écran 30, par opération et pour l'organisation.
 *
 * C'est la surface de PREUVE du produit : ce qu'un fondateur montre quand un
 * investisseur conteste avoir reçu une pièce, ou quand un auditeur demande qui
 * a vu quoi. Deux conséquences sur la façon de le lire :
 *
 *   · une action qu'on ne sait pas nommer est affichée telle quelle, jamais
 *     masquée. Un journal qui cache ce qu'il ne comprend pas ne prouve rien ;
 *   · l'ordre vient de la base et n'est jamais retrié côté application.
 */

/** Combien de lignes on remonte. Au-delà, l'export prend le relais. */
const LIMITE = 300;

interface LigneAudit {
  id: number;
  action: string;
  actor_email: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

/**
 * Ce sur quoi porte l'action, en une expression lisible.
 *
 * Pas de repli sur `label` pour un geste documentaire : c'est l'intitulé de
 * l'EXIGENCE, et « a retiré Extrait RCCM de moins de 3 mois » ferait croire
 * qu'on a supprimé l'exigence, pas la pièce.
 */
function cibleDe(row: LigneAudit): string {
  const meta = row.metadata ?? {};
  const nom = meta.document_name as string | undefined;
  if (nom) {
    const page = meta.page as number | undefined;
    return page ? `${nomCourt(nom)} — page ${page}` : nomCourt(nom);
  }

  const email = meta.email as string | undefined;
  if (email) return email;

  if (row.action.includes("document")) return "une pièce";

  const label = meta.label as string | undefined;
  return label ? nomCourt(label) : "";
}

/** Le journal d'une opération. */
export async function operationJournal(
  operationId: string,
): Promise<EntreeJournal[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("audit_log")
    .select("id, action, actor_email, created_at, metadata")
    .eq("deal_id", operationId)
    .order("created_at", { ascending: false })
    .limit(LIMITE);

  return enrichir(supabase, (data ?? []) as LigneAudit[]);
}

/** Le journal de toute l'organisation — l'écran Activité global. */
export async function organizationJournal(
  organizationId: string,
): Promise<EntreeJournal[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("audit_log")
    .select("id, action, actor_email, created_at, metadata")
    .eq("org_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(LIMITE);

  return enrichir(supabase, (data ?? []) as LigneAudit[]);
}

/**
 * Complète les lignes brutes avec le nom et le rôle de qui a agi.
 *
 * `audit_log` ne garde que l'adresse — c'est voulu, elle survit à la
 * suppression d'un compte. Le nom et le rôle se rajoutent à la lecture, et
 * leur absence n'efface jamais la ligne.
 */
async function enrichir(
  supabase: Awaited<ReturnType<typeof createClient>>,
  lignes: LigneAudit[],
): Promise<EntreeJournal[]> {
  const adresses = [
    ...new Set(
      lignes
        .map((row) => row.actor_email?.toLowerCase())
        .filter((email): email is string => Boolean(email)),
    ),
  ];

  const noms = new Map<string, string>();
  const roles = new Map<string, string>();

  if (adresses.length > 0) {
    const { data: profils } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .in("email", adresses);

    const parId = new Map<string, string>();
    for (const p of (profils ?? []) as Array<{
      id: string;
      email: string | null;
      full_name: string | null;
    }>) {
      if (!p.email) continue;
      const cle = p.email.toLowerCase();
      if (p.full_name) noms.set(cle, p.full_name);
      parId.set(p.id, cle);
    }

    if (parId.size > 0) {
      const { data: membres } = await supabase
        .from("memberships")
        .select("user_id, role")
        .in("user_id", [...parId.keys()]);

      for (const m of (membres ?? []) as Array<{
        user_id: string;
        role: string;
      }>) {
        const cle = parId.get(m.user_id);
        // Le rôle exact n'a pas sa place dans un journal — ce qui compte est
        // de distinguer un geste interne d'un geste d'invité.
        if (cle) roles.set(cle, m.role === "guest" ? "Invité" : "Équipe");
      }
    }
  }

  return lignes.map((row) => {
    const cle = row.actor_email?.toLowerCase() ?? "";
    return {
      id: row.id,
      actor: nomActeur(row.actor_email, noms.get(cle)),
      role: roles.get(cle) ?? "—",
      action: row.action,
      cible: cibleDe(row),
      at: row.created_at,
    };
  });
}
