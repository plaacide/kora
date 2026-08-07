import "server-only";

import type { FaitsDealroom } from "@/features/v2/domain/dealroom";
import { createClient } from "@/lib/supabase/server";

import { requireV2User } from "./session";

/**
 * Les Dealrooms d'un programme — écrans 18 à 28.
 *
 * La base rend des FAITS BRUTS : combien d'entreprises, combien d'accords
 * manquants, combien de liens vivants. Le statut affiché — dont « prête à
 * publier », que la base ne connaît pas — se déduit dans le domaine.
 */

export interface DealroomLu extends FaitsDealroom {
  id: string;
  slug: string;
  nom: string;
  liensActifs: number;
  publieeLe: string | null;
  cohortes: number;
}

/** `count(*)` est un `bigint` : PostgREST le rend en CHAÎNE. */
function entier(valeur: number | string | null): number {
  if (valeur === null) return 0;
  const n = typeof valeur === "number" ? valeur : Number(valeur);
  return Number.isFinite(n) ? n : 0;
}

export async function listerDealrooms(): Promise<readonly DealroomLu[]> {
  await requireV2User();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("dealroom_list");
  if (error) {
    // ADR-001 : l'écran ne voit rien de Postgres. Mais sans cette trace, une
    // liste vide se lit comme « aucune Dealroom » alors que c'est la lecture
    // qui a échoué.
    console.error("[v2 dealrooms] dealroom_list", error);
    throw new Error("dealrooms_illisibles");
  }

  return (
    (data ?? []) as {
      id: string;
      slug: string;
      nom: string;
      statut: string;
      entreprises: number | string;
      en_attente: number | string;
      liens_actifs: number | string;
      publiee_le: string | null;
      cohortes: number | string;
    }[]
  ).map((d) => ({
    cohortes: entier(d.cohortes),
    enAttente: entier(d.en_attente),
    entreprises: entier(d.entreprises),
    id: d.id,
    liensActifs: entier(d.liens_actifs),
    nom: d.nom,
    publieeLe: d.publiee_le,
    slug: d.slug,
    statut: d.statut,
  }));
}

/** Une entreprise d'une Dealroom, et où en est son accord — écrans 25 et 26. */
export interface EntrepriseDealroom {
  org: string;
  nom: string;
  secteur: string | null;
  pays: string | null;
  accord: string;
  accordeLe: string | null;
  publiee: boolean;
}

export async function entreprisesDealroom(
  dealroomId: string,
): Promise<readonly EntrepriseDealroom[]> {
  await requireV2User();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("dealroom_companies", {
    p_dealroom: dealroomId,
  });
  if (error) {
    console.error("[v2 dealrooms] dealroom_companies", error);
    return [];
  }

  return (
    (data ?? []) as {
      startup_org: string;
      nom: string | null;
      secteur: string | null;
      pays: string | null;
      accord: string;
      accorde_le: string | null;
      publiee: boolean;
    }[]
  ).map((e) => ({
    accord: e.accord,
    accordeLe: e.accorde_le,
    nom: e.nom ?? "—",
    org: e.startup_org,
    pays: e.pays,
    publiee: e.publiee,
    secteur: e.secteur,
  }));
}
