"use server";

import { revalidatePath } from "next/cache";

import { createInvitation } from "@/app/actions/invitations";
import {
  codeDepuisPostgres,
  echec,
  type Resultat,
} from "@/features/v2/domain/erreurs";
import type { Level } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";

/**
 * Création d'un accès — dernière étape de l'assistant de partage.
 *
 * PORTÉE : depuis la migration `20260731230000_invitation_perimetre`,
 * l'invitation porte les dossiers qu'elle ouvre (`invitation_folders`) et
 * `accept_invitation` n'accorde que ceux-là. Sans périmètre enregistré, le
 * comportement d'origine s'applique — tous les dossiers racine — ce qui garde
 * la V1 et les invitations déjà envoyées intactes.
 */
export async function createV2Access(input: {
  operationId: string;
  email: string;
  level: string;
  ndaRequired: boolean;
  /** Échéance ISO. `null` laisse la base poser ses quatre-vingt-dix jours. */
  expiresAt: string | null;
  /** Dossiers choisis. `null` = toute la data room, présente et à venir. */
  folderIds: string[] | null;
}): Promise<Resultat<{ link?: string; emailFailed?: boolean }>> {
  const email = input.email.trim().toLowerCase();
  if (!email) return echec("acces.destinataire_requis");

  // On délègue à l'action V1 : créer la ligne ne suffit pas, il faut fabriquer
  // le lien nominatif et l'envoyer. Un accès qui existe en base mais dont
  // personne n'a reçu l'adresse n'a ouvert aucune porte.
  const result = await createInvitation({
    dealId: input.operationId,
    email,
    ndaRequired: input.ndaRequired,
    level: input.level as Level,
    expiresAt: input.expiresAt,
    folderIds: input.folderIds,
  });

  if (!result.ok) {
    console.error("[v2 access] create_invitation échoué :", result.error);
    // `brut` porte le message de la base ; `error` a déjà été mis en français
    // pour la V1 et ne se laisse plus reconnaître.
    return echec(codeDepuisPostgres(result.brut ?? ""));
  }

  revalidatePath(`/v2/operations/${input.operationId}`, "layout");

  // L'envoi peut échouer sans que l'invitation soit perdue. On remonte le lien
  // pour qu'il soit transmis à la main plutôt que d'annoncer un envoi qui n'a
  // pas eu lieu.
  const emailFailed = Boolean(result.emailSkipped || result.emailError);
  return { ok: true, emailFailed, link: emailFailed ? result.link : undefined };
}

/**
 * Refermer un accès.
 *
 * Passe par `revoke_invitation` et non par une écriture directe : `invitations`
 * n'a pas de politique UPDATE, une écriture directe serait refusée en silence
 * — zéro ligne touchée, aucune erreur — et le bouton semblerait fonctionner.
 *
 * La RPC fait les trois gestes ensemble : statut, suppression des permissions
 * sur cette opération, journal. Elle rend le nombre de dossiers refermés, qui
 * est ce que le fondateur veut lire pour être sûr.
 */
export async function revokeV2Access(input: {
  operationId: string;
  invitationId: string;
}): Promise<Resultat<{ removed?: number }>> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("revoke_invitation", {
    p_invitation: input.invitationId,
  });

  if (error) {
    console.error("[v2 access] revoke_invitation échoué :", error);
    return echec(codeDepuisPostgres(error.message));
  }

  revalidatePath(`/v2/operations/${input.operationId}`, "layout");
  return { ok: true, removed: typeof data === "number" ? data : 0 };
}
