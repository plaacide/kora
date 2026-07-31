import "server-only";

import { nomActeur } from "@/features/v2/domain/journal";
import { createClient } from "@/lib/supabase/server";

/**
 * L'état de sécurité du compte — écran 34.
 *
 * L'écran annonçait « Non configurée », « Non générés » et trois sessions
 * actives, sans rien demander à personne. Ce qui suit est lu pour de bon :
 * les facteurs viennent de Supabase, le journal d'`audit_log`.
 */

export interface EtatSecurite {
  /** Un facteur TOTP vérifié existe : la double authentification est active. */
  totpActif: boolean;
  /** Facteurs commencés mais jamais vérifiés — ils encombrent sans protéger. */
  totpEnAttente: number;
  /**
   * `aal2` quand la session courante a franchi la seconde étape. Une session
   * `aal1` sur un compte protégé n'a pas fini de s'authentifier.
   */
  niveau: string | null;
  email: string | null;
}

export async function securityState(): Promise<EtatSecurite> {
  const supabase = await createClient();

  const [{ data: facteurs }, { data: aal }, { data: session }] =
    await Promise.all([
      supabase.auth.mfa.listFactors(),
      supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
      supabase.auth.getUser(),
    ]);

  const totp = facteurs?.totp ?? [];

  return {
    totpActif: totp.some((f) => f.status === "verified"),
    totpEnAttente: totp.filter((f) => f.status !== "verified").length,
    niveau: aal?.currentLevel ?? null,
    email: session.user?.email ?? null,
  };
}

export interface EvenementSecurite {
  id: string;
  action: string;
  libelle: string;
  auteur: string;
  at: string;
}

const LIBELLES: Record<string, string> = {
  "security.mfa_enabled": "Double authentification activée",
  "security.mfa_disabled": "Double authentification désactivée",
  "security.sessions_revoked": "Autres appareils déconnectés",
  "member.invited": "Collaborateur invité",
  "member.joined": "Collaborateur a rejoint l’équipe",
  "member.removed": "Collaborateur retiré",
  "member.role_changed": "Rôle modifié",
  "member.invitation_revoked": "Invitation révoquée",
};

/**
 * Le journal de sécurité — distinct de l'activité documentaire.
 *
 * La maquette insiste sur cette séparation, et elle a raison : « Amara a
 * consulté le bilan » et « la double authentification a été désactivée » ne se
 * lisent pas dans la même minute, ni pour la même raison. Même table, deux
 * lectures — dupliquer le journal aurait créé deux vérités.
 */
export async function securityJournal(
  organizationId: string,
): Promise<EvenementSecurite[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("audit_log")
    .select("id, action, actor_email, metadata, created_at")
    .eq("org_id", organizationId)
    .in("action", Object.keys(LIBELLES))
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) console.error("[v2 sécurité] journal :", error);

  const lignes = (data ?? []) as Array<{
    id: number;
    action: string;
    actor_email: string | null;
    metadata: Record<string, unknown> | null;
    created_at: string;
  }>;

  const adresses = [
    ...new Set(
      lignes
        .map((r) => r.actor_email?.toLowerCase())
        .filter((e): e is string => Boolean(e)),
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

  return lignes.map((r) => {
    const meta = r.metadata ?? {};
    const cible = (meta.membre ?? meta.email) as string | undefined;

    return {
      id: String(r.id),
      action: r.action,
      libelle: cible
        ? `${LIBELLES[r.action]} — ${cible}`
        : (LIBELLES[r.action] ?? r.action),
      auteur: nomActeur(
        r.actor_email,
        noms.get(r.actor_email?.toLowerCase() ?? ""),
      ),
      at: r.created_at,
    };
  });
}
