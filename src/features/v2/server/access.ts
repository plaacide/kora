import "server-only";

import { perimetre, type NoeudDossier, type Perimetre } from "@/features/v2/domain/access";
import { createClient } from "@/lib/supabase/server";

/**
 * Les accès d'une opération — écrans 20 à 25.
 *
 * Un accès se pose sur un DOSSIER, jamais sur une pièce : c'est la règle que
 * toute la sécurité documentaire suit, et l'assistant de partage la reflète en
 * disant quels dossiers s'ouvriront.
 */

export interface AccessRow {
  id: string;
  email: string;
  /** Nom du compte s'il existe déjà ; sinon l'adresse porte seule. */
  name: string | null;
  level: string;
  status: string;
  ndaRequired: boolean;
  /** Date de signature du NDA, quand il a été signé. */
  ndaSignedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  /** Ce que cet accès ouvre réellement, dossiers et pièces comptés. */
  scope: Perimetre;
  /**
   * `true` quand le périmètre est celui que l'acceptation POSERA, faute de
   * droits encore écrits. Sans cette nuance, une invitation en attente
   * afficherait un accès déjà ouvert.
   */
  scopePending: boolean;
  lastActivityAt: string | null;
}

export interface ShareFolder {
  id: string;
  name: string;
  documentCount: number;
}

/**
 * Les accès accordés, du plus récent au plus ancien (écran 24).
 *
 * Le périmètre se lit à deux endroits selon l'état : une invitation acceptée
 * a des `permissions` écrites, c'est la vérité. Une invitation en attente n'en
 * a aucune — on montre alors ce que l'acceptation POSERA : les dossiers
 * choisis à l'envoi, ou tous les dossiers racine si aucun ne l'a été.
 */
export async function listAccesses(operationId: string): Promise<AccessRow[]> {
  const supabase = await createClient();

  const [{ data: invitations, error }, { data: folders }, { data: documents }] =
    await Promise.all([
      supabase
        .from("invitations")
        .select("id, email, level, status, nda_required, expires_at, created_at")
        .eq("deal_id", operationId)
        .order("created_at", { ascending: false }),
      supabase.from("folders").select("id, parent_id").eq("deal_id", operationId),
      supabase.from("documents").select("folder_id").eq("deal_id", operationId),
    ]);

  if (error || !invitations?.length) return [];

  const lignes = invitations as Array<{
    id: string;
    email: string;
    level: string;
    status: string;
    nda_required: boolean;
    expires_at: string | null;
    created_at: string;
  }>;

  const emails = [...new Set(lignes.map((row) => row.email.toLowerCase()))];

  const [
    { data: ndas },
    { data: profiles },
    { data: activite },
    { data: perimetres },
  ] = await Promise.all([
    supabase
      .from("ndas")
      .select("invitation_id, signed_at")
      .eq("deal_id", operationId),
    supabase.from("profiles").select("id, email, full_name").in("email", emails),
    supabase
      .from("audit_log")
      .select("actor_email, created_at")
      .eq("deal_id", operationId)
      .in("actor_email", emails)
      .order("created_at", { ascending: false })
      .limit(400),
    // Le périmètre choisi à l'envoi. Tant que la migration
    // `invitation_perimetre` n'est pas appliquée, la requête échoue et `data`
    // reste nul : on retombe alors sur « tous les dossiers racine », qui est
    // très exactement ce que la base fait dans ce cas.
    supabase
      .from("invitation_folders")
      .select("invitation_id, folder_id")
      .in("invitation_id", lignes.map((row) => row.id)),
  ]);

  const choisisParInvitation = new Map<string, string[]>();
  for (const row of (perimetres ?? []) as Array<{
    invitation_id: string;
    folder_id: string;
  }>) {
    const liste = choisisParInvitation.get(row.invitation_id);
    if (liste) liste.push(row.folder_id);
    else choisisParInvitation.set(row.invitation_id, [row.folder_id]);
  }

  const arbre: NoeudDossier[] = (
    (folders ?? []) as Array<{ id: string; parent_id: string | null }>
  ).map((folder) => ({ id: folder.id, parentId: folder.parent_id }));

  const racines = arbre.filter((folder) => !folder.parentId).map((folder) => folder.id);

  const parDossier = new Map<string, number>();
  for (const row of (documents ?? []) as Array<{ folder_id: string | null }>) {
    if (!row.folder_id) continue;
    parDossier.set(row.folder_id, (parDossier.get(row.folder_id) ?? 0) + 1);
  }

  const signatures = new Map<string, string>();
  for (const row of (ndas ?? []) as Array<{
    invitation_id: string;
    signed_at: string;
  }>) {
    signatures.set(row.invitation_id, row.signed_at);
  }

  const comptes = new Map<string, { id: string; name: string }>();
  for (const row of (profiles ?? []) as Array<{
    id: string;
    email: string | null;
    full_name: string;
  }>) {
    if (row.email) comptes.set(row.email.toLowerCase(), { id: row.id, name: row.full_name });
  }

  // Le journal arrive déjà trié : la première occurrence d'une adresse est sa
  // dernière trace.
  const derniereTrace = new Map<string, string>();
  for (const row of (activite ?? []) as Array<{
    actor_email: string | null;
    created_at: string;
  }>) {
    const cle = row.actor_email?.toLowerCase();
    if (cle && !derniereTrace.has(cle)) derniereTrace.set(cle, row.created_at);
  }

  // Les droits écrits, par utilisateur. Un droit à `none` est un retrait
  // explicite : il ne compte pas comme un accès.
  const identifiants = [...comptes.values()].map((compte) => compte.id);
  const droitsParUtilisateur = new Map<string, string[]>();

  if (identifiants.length > 0) {
    const { data: permissions } = await supabase
      .from("permissions")
      .select("user_id, folder_id, level")
      .eq("deal_id", operationId)
      .in("user_id", identifiants)
      .neq("level", "none");

    for (const row of (permissions ?? []) as Array<{
      user_id: string;
      folder_id: string;
    }>) {
      const liste = droitsParUtilisateur.get(row.user_id);
      if (liste) liste.push(row.folder_id);
      else droitsParUtilisateur.set(row.user_id, [row.folder_id]);
    }
  }

  return lignes.map((row) => {
    const cle = row.email.toLowerCase();
    const compte = comptes.get(cle);
    const droits = compte ? droitsParUtilisateur.get(compte.id) : undefined;

    // Tant que l'invitation n'est pas acceptée, aucun droit n'existe : le
    // périmètre affiché est celui que l'acceptation POSERA. Une fois acceptée,
    // en revanche, `accept_invitation` a écrit les droits — n'en trouver aucun
    // n'est pas une prévision, c'est une anomalie, et on la laisse voir plutôt
    // que de la couvrir avec un périmètre supposé.
    const prevision =
      (!droits || droits.length === 0) &&
      (row.status === "sent" || row.status === "nda_pending");

    return {
      id: row.id,
      email: row.email,
      name: compte?.name || null,
      level: row.level,
      status: row.status,
      ndaRequired: row.nda_required,
      ndaSignedAt: signatures.get(row.id) ?? null,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
      scope: perimetre(
        arbre,
        parDossier,
        prevision ? (choisisParInvitation.get(row.id) ?? racines) : (droits ?? []),
      ),
      scopePending: prevision,
      lastActivityAt: derniereTrace.get(cle) ?? null,
    };
  });
}

/**
 * Les dossiers qu'une invitation ouvre, ou `null` si elle les ouvre tous.
 *
 * `null` et « la liste de tous les dossiers » ne se valent pas : le premier
 * suit la data room quand elle grandit, le second l'a figée.
 */
export async function invitationScope(
  invitationId: string,
): Promise<string[] | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("invitation_folders")
    .select("folder_id")
    .eq("invitation_id", invitationId);

  const ids = ((data ?? []) as Array<{ folder_id: string }>).map((row) => row.folder_id);

  return ids.length > 0 ? ids : null;
}

/**
 * Combien d'accès sont réellement ouverts — pour le bandeau de l'en-tête.
 *
 * Requête volontairement étroite : elle tourne sur CHAQUE écran d'une
 * opération, elle n'a pas à reconstituer les périmètres.
 */
export async function countActiveAccesses(operationId: string): Promise<number> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("invitations")
    .select("expires_at")
    .eq("deal_id", operationId)
    .eq("status", "accepted");

  const maintenant = Date.now();
  return ((data ?? []) as Array<{ expires_at: string | null }>).filter(
    (row) => !row.expires_at || new Date(row.expires_at).getTime() > maintenant,
  ).length;
}

/**
 * Les dossiers qu'on peut ouvrir, avec ce qu'ils contiennent.
 *
 * Seuls les dossiers RACINE sont proposés : un accès accordé sur un dossier
 * vaut pour ses sous-dossiers (`effective_permission` remonte l'arborescence),
 * et faire choisir les deux niveaux laisserait croire qu'on peut ouvrir un
 * parent en fermant un enfant.
 */
export async function shareableFolders(
  operationId: string,
): Promise<ShareFolder[]> {
  const supabase = await createClient();

  const [{ data: folders }, { data: documents }] = await Promise.all([
    supabase
      .from("folders")
      .select("id, name, parent_id, position")
      .eq("deal_id", operationId)
      .order("position"),
    supabase.from("documents").select("folder_id").eq("deal_id", operationId),
  ]);

  const arbre: NoeudDossier[] = (
    (folders ?? []) as Array<{ id: string; parent_id: string | null }>
  ).map((folder) => ({ id: folder.id, parentId: folder.parent_id }));

  const parDossier = new Map<string, number>();
  for (const row of (documents ?? []) as Array<{ folder_id: string | null }>) {
    if (!row.folder_id) continue;
    parDossier.set(row.folder_id, (parDossier.get(row.folder_id) ?? 0) + 1);
  }

  // Le compte annoncé inclut les sous-dossiers : ouvrir « Financier » ouvre
  // aussi « Financier / 2025 », et le fondateur doit le voir avant d'envoyer.
  return (
    (folders ?? []) as Array<{ id: string; name: string; parent_id: string | null }>
  )
    .filter((folder) => !folder.parent_id)
    .map((folder) => ({
      id: folder.id,
      name: folder.name,
      documentCount: perimetre(arbre, parDossier, [folder.id]).documents,
    }));
}
