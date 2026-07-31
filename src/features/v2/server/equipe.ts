import "server-only";

import {
  estInterne,
  initiales,
  trier,
  type Membre,
  type RoleInterne,
} from "@/features/v2/domain/equipe";
import { createClient } from "@/lib/supabase/server";

/**
 * L'équipe interne — écran 33.
 *
 * `memberships` porte le rôle, `profiles` le nom et l'adresse, `audit_log` la
 * dernière trace. Trois tables parce que ce sont trois choses : appartenir,
 * s'appeler, avoir agi.
 *
 * Les `guest` sont écartés ici et non à l'affichage. Un invité externe qui
 * apparaîtrait une seconde avant d'être filtré serait déjà une fuite : la
 * maquette dit qu'ils « ne figurent jamais » dans cet écran.
 */
export async function teamMembers(organizationId: string): Promise<Membre[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("memberships")
    .select("id, user_id, role, profiles(full_name, email)")
    .eq("org_id", organizationId);

  if (error) console.error("[v2 équipe] memberships :", error);

  const lignes = ((data ?? []) as unknown as Array<{
    id: string;
    user_id: string;
    role: string;
    profiles:
      | { full_name: string | null; email: string | null }
      | Array<{ full_name: string | null; email: string | null }>
      | null;
  }>).filter((row) => estInterne(row.role));

  // La dernière activité : une seule requête pour toute l'équipe, et on garde
  // la plus récente par personne. Une requête par membre coûterait autant
  // d'allers-retours qu'il y a de collaborateurs, pour une colonne.
  const derniere = new Map<string, string>();

  const adresses = lignes
    .map((row) => {
      const p = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      return p?.email?.toLowerCase();
    })
    .filter((email): email is string => Boolean(email));

  if (adresses.length > 0) {
    const { data: traces } = await supabase
      .from("audit_log")
      .select("actor_email, created_at")
      .eq("org_id", organizationId)
      .in("actor_email", adresses)
      .order("created_at", { ascending: false })
      .limit(400);

    for (const t of (traces ?? []) as Array<{
      actor_email: string | null;
      created_at: string;
    }>) {
      const cle = t.actor_email?.toLowerCase();
      if (cle && !derniere.has(cle)) derniere.set(cle, t.created_at);
    }
  }

  const membres: Membre[] = lignes.map((row) => {
    const p = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    const email = p?.email ?? null;
    const nom = p?.full_name?.trim() || email?.split("@")[0] || "Collaborateur";

    return {
      id: row.id,
      userId: row.user_id,
      nom,
      email,
      initiales: initiales(nom, email),
      role: row.role as RoleInterne,
      derniereActivite: email ? (derniere.get(email.toLowerCase()) ?? null) : null,
      cestMoi: row.user_id === user?.id,
    };
  });

  return trier(membres);
}

/** Le rôle de la personne connectée : lui seul décide de ce qu'elle peut gérer. */
export async function myRole(
  organizationId: string,
): Promise<RoleInterne | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("memberships")
    .select("role")
    .eq("org_id", organizationId)
    .eq("user_id", user.id)
    .maybeSingle();

  const role = (data as { role: string } | null)?.role;
  return role && estInterne(role) ? (role as RoleInterne) : null;
}
