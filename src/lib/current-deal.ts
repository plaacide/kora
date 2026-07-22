import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

export const DEAL_COOKIE = "KORA_DEAL";

export interface DealRef {
  id: string;
  name: string;
  org_id: string;
  type: string | null;
  readiness_score: number | null;
  /** 'levee' | 'diligence' — pilote l'écran de la salle. */
  objectif: string;
  /** Horodatage d'archivage, null si la salle est active. */
  archived_at: string | null;
}

/**
 * Deal courant, partagé par tous les écrans rattachés à un deal.
 *
 * Le choix vit dans un cookie plutôt que dans l'URL : sinon chaque lien
 * interne devrait propager `?deal=`, et un oubli ferait basculer
 * silencieusement l'utilisateur sur un autre deal — exactement le genre de
 * bug qu'on ne voit pas et qui expose le mauvais dossier.
 *
 * Le cookie n'est JAMAIS une autorisation : l'identifiant est revalidé contre
 * la liste des deals visibles sous RLS. Un cookie forgé ne donne accès à rien.
 */
export async function getCurrentDeal(
  supabase: SupabaseClient,
): Promise<{ deal: DealRef | null; deals: DealRef[] }> {
  const primary = await supabase
    .from("deals")
    .select("id, name, org_id, type, readiness_score, objectif, archived_at")
    .order("created_at", { ascending: false });

  // Repli si `archived_at` n'existe pas encore (migration non appliquée) : ce
  // helper est appelé sur CHAQUE page — il ne doit jamais casser l'app.
  let rows = primary.data as Array<Record<string, unknown>> | null;
  if (primary.error) {
    const repli = await supabase
      .from("deals")
      .select("id, name, org_id, type, readiness_score, objectif")
      .order("created_at", { ascending: false });
    rows = repli.data as Array<Record<string, unknown>> | null;
  }

  const deals = ((rows ?? []) as Array<Partial<DealRef>>).map((d) => ({
    ...d,
    objectif: d.objectif ?? "levee",
    archived_at: d.archived_at ?? null,
  })) as DealRef[];
  if (deals.length === 0) return { deal: null, deals };

  const store = await cookies();
  const wanted = store.get(DEAL_COOKIE)?.value;

  // Le cookie prime s'il pointe vers une salle visible (l'utilisateur a pu
  // ouvrir une salle archivée exprès). Sinon on retombe sur la salle active la
  // plus récente — archiver la salle courante la sort donc du flux.
  const deal =
    deals.find((d) => d.id === wanted) ??
    deals.find((d) => !d.archived_at) ??
    deals[0];
  return { deal, deals };
}

/**
 * Rôle de l'utilisateur DANS l'organisation du deal affiché.
 *
 * Un utilisateur peut appartenir à plusieurs organisations avec des rôles
 * différents (owner ici, invité là). Lire son rôle avec un `limit(1)` renvoyait
 * une adhésion arbitraire : il pouvait hériter à l'écran des droits d'une autre
 * organisation que celle du deal ouvert. Le rôle se lit donc toujours pour
 * `deal.org_id`. La RLS reste l'autorité — ceci ne fait qu'aligner l'UI.
 */
export async function getDealRole(
  supabase: SupabaseClient,
  orgId: string,
): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Filtrer sur l'utilisateur est indispensable : une organisation compte
  // plusieurs adhésions, et la RLS laisse un membre voir celles de ses
  // collègues. Sans ce filtre on lisait le rôle de quelqu'un d'autre.
  const { data } = await supabase
    .from("memberships")
    .select("role")
    .eq("org_id", orgId)
    .eq("user_id", user.id)
    .maybeSingle();
  return (data?.role as string) ?? null;
}

/**
 * Rôle à utiliser quand aucun deal n'existe encore : il n'y a pas d'org de deal
 * d'où le déduire, mais il faut savoir si l'utilisateur peut créer le premier.
 */
export async function getAnyRole(
  supabase: SupabaseClient,
): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("memberships")
    .select("role")
    .eq("user_id", user.id)
    // Tri déterministe : sans lui, l'organisation retenue est arbitraire
    // dès qu'une personne en a plusieurs — ce que le rôle SAE rend courant.
    .order("created_at")
    .limit(1)
    .maybeSingle();
  return (data?.role as string) ?? null;
}
