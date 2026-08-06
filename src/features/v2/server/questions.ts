import "server-only";

import type { FilBrut } from "@/features/v2/domain/questions";
import { createClient } from "@/lib/supabase/server";

import { requireV2User } from "./session";

/**
 * Le fil d'une cohorte — écran 08.
 *
 * La lecture passe par `cohort_threads()`, à colonnes énumérées comme
 * `sae_portfolio()` : ce qui n'est pas nommé ne sort pas. On rend le nom de
 * l'entreprise, jamais son adresse ni rien de son dossier.
 */

export interface MessageLu extends FilBrut {
  id: string;
  startupOrg: string;
  nom: string;
  corps: string;
  reponse: string | null;
}

interface RangeeFil {
  id: string;
  startup_org: string;
  startup_name: string | null;
  type: string;
  body: string;
  status: string;
  answered_body: string | null;
  answered_at: string | null;
  created_at: string;
}

export async function lireFil(
  cohorteId: string,
): Promise<readonly MessageLu[]> {
  await requireV2User();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("cohort_threads", {
    p_cohort: cohorteId,
  });

  if (error) {
    // ADR-001 : le détail part au journal, l'écran n'en voit rien. Mais sans
    // cette trace, un fil vide se lit comme « aucun message » alors que c'est
    // la lecture qui a échoué.
    console.error("[v2 questions] cohort_threads", error);
    throw new Error("fil_illisible");
  }

  return ((data ?? []) as RangeeFil[]).map((r) => ({
    id: r.id,
    startupOrg: r.startup_org,
    nom: r.startup_name ?? "—",
    type: r.type,
    statut: r.status,
    corps: r.body,
    reponse: r.answered_body,
    creeLe: r.created_at,
    reponduLe: r.answered_at,
  }));
}

/** Une entreprise de la cohorte — pour le sélecteur du formulaire. */
export interface DestinataireLu {
  org: string;
  nom: string;
}

/**
 * À qui l'on peut écrire dans cette cohorte.
 *
 * Le sélecteur ne propose QUE des membres : `create_program_thread` refuse une
 * entreprise hors cohorte, et un écran qui propose ce que la base refuse
 * fabrique une erreur au clic.
 *
 * ⚠️ PAS DE JOINTURE DIRECTE ICI. `cohort_members ⋈ organizations` rend ZÉRO
 * ligne : la RLS interdit au programme de lire la fiche d'une organisation
 * dont il n'est pas membre, et un `!inner` écarte alors la ligne entière, sans
 * erreur. Le formulaire annonçait « aucune entreprise » pendant que la
 * navigation en comptait deux. C'est la RLS qui avait raison — d'où la
 * fonction énumérée, qui rend le nom et rien d'autre.
 */
export async function destinataires(
  cohorteId: string,
): Promise<readonly DestinataireLu[]> {
  await requireV2User();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("cohort_companies", {
    p_cohort: cohorteId,
  });

  if (error) {
    console.error("[v2 questions] cohort_companies", error);
    return [];
  }

  return ((data ?? []) as { name: string | null; org: string }[]).map((r) => ({
    nom: r.name ?? "—",
    org: r.org,
  }));
}
