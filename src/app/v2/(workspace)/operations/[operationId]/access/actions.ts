"use server";

import { revalidatePath } from "next/cache";

import { createInvitation } from "@/app/actions/invitations";
import type { Level } from "@/lib/permissions";

/**
 * Création d'un accès — dernière étape de l'assistant de partage.
 *
 * ⚠️ PORTÉE : `accept_invitation` accorde les droits sur TOUS les dossiers
 * racine de l'opération, au niveau porté par l'invitation. La base n'a
 * aujourd'hui aucun endroit où retenir « cette invitation n'ouvre que ces
 * dossiers-là » — il faudrait une table de liaison et modifier
 * `accept_invitation`, donc toucher la V1 en production.
 *
 * L'assistant le dit donc en clair plutôt que de faire choisir des dossiers
 * qui seraient ignorés à l'acceptation. Restreindre reste possible APRÈS,
 * depuis le tableau des accès, une fois l'invité inscrit : `set_permission`
 * travaille sur un utilisateur existant.
 */
export async function createV2Access(input: {
  operationId: string;
  email: string;
  level: string;
  ndaRequired: boolean;
  /** Échéance ISO. `null` laisse la base poser ses quatre-vingt-dix jours. */
  expiresAt: string | null;
}): Promise<{ ok: boolean; error?: string; link?: string; emailFailed?: boolean }> {
  const email = input.email.trim().toLowerCase();
  if (!email) return { ok: false, error: "Indiquez l’adresse du destinataire." };

  // On délègue à l'action V1 : créer la ligne ne suffit pas, il faut fabriquer
  // le lien nominatif et l'envoyer. Un accès qui existe en base mais dont
  // personne n'a reçu l'adresse n'a ouvert aucune porte.
  const result = await createInvitation({
    dealId: input.operationId,
    email,
    ndaRequired: input.ndaRequired,
    level: input.level as Level,
    expiresAt: input.expiresAt,
  });

  if (!result.ok) {
    console.error("[v2 access] create_invitation échoué :", result.error);
    return { ok: false, error: result.error };
  }

  revalidatePath(`/v2/operations/${input.operationId}`, "layout");

  // L'envoi peut échouer sans que l'invitation soit perdue. On remonte le lien
  // pour qu'il soit transmis à la main plutôt que d'annoncer un envoi qui n'a
  // pas eu lieu.
  const emailFailed = Boolean(result.emailSkipped || result.emailError);
  return { ok: true, emailFailed, link: emailFailed ? result.link : undefined };
}

/**
 * PAS de révocation ici, et ce n'est pas un oubli.
 *
 * Aucune RPC ne révoque une invitation, et `invitations` n'a pas de politique
 * UPDATE : une écriture directe serait refusée en silence — zéro ligne
 * touchée, aucune erreur — et le bouton semblerait fonctionner. Livrer cela
 * serait pire que de ne rien livrer : le fondateur croirait un accès fermé
 * alors qu'il resterait ouvert.
 *
 * La révocation demande donc une migration : une fonction `revoke_invitation`
 * qui passe le statut, retire les `permissions` associées et écrit au
 * journal. C'est un geste de sécurité, il doit être tracé.
 */
