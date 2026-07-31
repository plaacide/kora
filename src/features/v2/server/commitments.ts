import "server-only";

import type {
  Engagement,
  NiveauEngagement,
  Requalification,
} from "@/features/v2/domain/engagements";
import { nomActeur } from "@/features/v2/domain/journal";
import { createClient } from "@/lib/supabase/server";

/**
 * Les engagements de la levée — écrans 43 et 44.
 *
 * Une ligne par investisseur, portant son niveau, son montant et sa preuve.
 * L'historique, lui, ne vient pas de la table : il vient du JOURNAL. Une table
 * ne garde que l'état courant, or ce que la maquette 44 montre — « intérêt
 * indicatif (100 M) requalifié en engagement confirmé (120 M) » — est
 * précisément ce que l'état courant a effacé.
 */

export async function commitments(operationId: string): Promise<Engagement[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("raise_commitments")
    .select(
      "id, investor_id, niveau, montant, devise, date_engagement, preuve, commentaire, responsable, created_at, updated_at, raise_investors(nom, organisation)",
    )
    .eq("deal_id", operationId)
    .order("montant", { ascending: false });

  return ((data ?? []) as unknown as Array<{
    id: string;
    investor_id: string;
    niveau: NiveauEngagement;
    montant: number;
    devise: string | null;
    date_engagement: string;
    preuve: string | null;
    commentaire: string | null;
    responsable: string | null;
    created_at: string;
    updated_at: string;
    raise_investors:
      | { nom: string; organisation: string | null }
      | Array<{ nom: string; organisation: string | null }>
      | null;
  }>).map((row) => {
    const investisseur = Array.isArray(row.raise_investors)
      ? row.raise_investors[0]
      : row.raise_investors;

    return {
      id: row.id,
      investorId: row.investor_id,
      investisseur: investisseur?.nom ?? "Investisseur",
      organisation: investisseur?.organisation ?? null,
      niveau: row.niveau,
      montant: row.montant,
      devise: row.devise,
      date: row.date_engagement,
      preuve: row.preuve,
      commentaire: row.commentaire,
      responsable: row.responsable,
      modifieLe: row.updated_at,
      // La seconde près : deux écritures dans la même requête partagent
      // `now()`, donc une création n'est jamais « déjà modifiée ».
      requalifie: row.updated_at !== row.created_at,
    };
  });
}

/**
 * L'historique des requalifications — la seconde moitié de l'écran 44.
 *
 * Lu dans `audit_log`, où `save_raise_commitment` écrit l'avant ET l'après.
 * C'est la raison d'être de ce détail dans la RPC : sans les deux états, la
 * phrase « requalifié en » ne se reconstitue pas.
 */
export async function commitmentHistory(
  operationId: string,
): Promise<Requalification[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("audit_log")
    .select("id, action, actor_email, metadata, created_at")
    .eq("deal_id", operationId)
    .in("action", [
      "commitment.recorded",
      "commitment.requalified",
      "commitment.removed",
    ])
    .order("created_at", { ascending: false })
    .limit(30);

  const lignes = (data ?? []) as Array<{
    id: number;
    action: string;
    actor_email: string | null;
    metadata: Record<string, unknown> | null;
    created_at: string;
  }>;

  // Le nom de l'auteur : le journal ne garde que son adresse. « par a.diallo »
  // se lit, mais « par Amara Diallo » est ce que la maquette montre.
  const adresses = [
    ...new Set(
      lignes
        .map((row) => row.actor_email?.toLowerCase())
        .filter((email): email is string => Boolean(email)),
    ),
  ];
  const noms = new Map<string, string>();

  if (adresses.length > 0) {
    const { data: profils } = await supabase
      .from("profiles")
      .select("email, full_name")
      .in("email", adresses);

    for (const p of (profils ?? []) as Array<{
      email: string | null;
      full_name: string | null;
    }>) {
      if (p.email && p.full_name) noms.set(p.email.toLowerCase(), p.full_name);
    }
  }

  return lignes.map((row) => {
    const meta = row.metadata ?? {};
    const avantNiveau = meta.niveau_avant as NiveauEngagement | undefined;

    return {
      id: String(row.id),
      investisseur: (meta.investisseur as string | undefined) ?? "Investisseur",
      avant: avantNiveau
        ? {
            niveau: avantNiveau,
            montant: (meta.montant_avant as number | undefined) ?? 0,
          }
        : null,
      apres: {
        niveau: (meta.niveau as NiveauEngagement | undefined) ?? "interet",
        montant: (meta.montant as number | undefined) ?? 0,
      },
      preuve: (meta.preuve as string | undefined) ?? null,
      auteur: nomActeur(row.actor_email, noms.get(row.actor_email?.toLowerCase() ?? "")),
      at: row.created_at,
      retire: row.action === "commitment.removed",
    };
  });
}
