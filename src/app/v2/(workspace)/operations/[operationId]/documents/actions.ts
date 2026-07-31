"use server";

import { revalidatePath } from "next/cache";


import { createClient } from "@/lib/supabase/server";

/**
 * Enregistre une pièce déjà téléversée dans le bucket privé.
 *
 * Le fichier part du navigateur DIRECTEMENT vers Supabase Storage — il ne
 * transite pas par le serveur Next. Une pièce de vingt mégaoctets n'a rien à
 * faire dans la mémoire d'un serveur de rendu, et la policy `kora_docs_insert`
 * vérifie déjà l'appartenance à l'organisation à partir du premier segment de
 * la clé.
 *
 * Ne reste donc ici que la métadonnée, confiée à `register_document` : c'est
 * elle qui pose la première version, l'index, et écrit au journal d'audit.
 */
export async function registerV2Document(input: {
  operationId: string;
  /** `null` dépose à la racine de la data room — réservée à l'équipe. */
  folderId: string | null;
  name: string;
  storageKey: string;
  size: number;
  mime: string;
}): Promise<{ ok: boolean; error?: string; documentId?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("register_document", {
    p_deal: input.operationId,
    p_folder: input.folderId,
    p_name: input.name,
    p_storage_key: input.storageKey,
    p_size: input.size,
    p_mime: input.mime || null,
  });

  if (error) {
    console.error("[v2 documents] register_document failed", error);
    return { ok: false, error: error.message };
  }

  // PAS de `revalidatePath` ici, et c'est délibéré (voir plus bas).
  //
  // Cette action est appelée une fois PAR PIÈCE. Revalider à chaque appel
  // re-rendait la page au milieu du lot : un dossier passant de vide à rempli
  // change de branche, le composant de dépôt était démonté, et le compte rendu
  // disparaissait — y compris la ligne disant qu'une pièce avait échoué.
  //
  // C'est le client qui rafraîchit, une fois le lot entier terminé et
  // seulement s'il est entièrement passé. Lui seul sait où finit le lot.
  //
  // L'identifiant repart vers le client : c'est lui qui enchaînera sur la
  // confirmation des associations, et il a besoin de savoir QUELLES pièces
  // viennent d'être déposées.
  return { ok: true, documentId: (data as { id?: string } | null)?.id };
}

/**
 * Remet une version antérieure en version active.
 *
 * `restore_document_version` ne supprime rien : la version restaurée redevient
 * courante, et celles qui la suivaient restent dans l'historique. Revenir à la
 * v1 puis repartir à la v3 reste donc possible — un fondateur qui restaure par
 * erreur ne perd pas son travail.
 */
export async function restoreV2Version(input: {
  operationId: string;
  documentId: string;
  versionId: string;
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("restore_document_version", {
    p_doc: input.documentId,
    p_version: input.versionId,
  });

  if (error) {
    console.error("[v2 documents] restore_document_version failed", error);
    return { ok: false, error: error.message };
  }

  // Ici la revalidation est juste : une restauration est un geste unique, pas
  // une étape dans un lot.
  revalidatePath(`/v2/operations/${input.operationId}`, "layout");
  return { ok: true };
}

/**
 * Enregistre une nouvelle version d'une pièce existante.
 *
 * `add_document_version` empile — elle ne remplace pas le fichier précédent
 * dans le bucket. L'ancienne version reste téléchargeable pour qui a le droit,
 * ce qui est le propre d'un historique : une data room dont on peut réécrire
 * le passé ne prouve rien.
 */
export async function addV2Version(input: {
  operationId: string;
  documentId: string;
  storageKey: string;
  size: number;
  mime: string;
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("add_document_version", {
    p_doc: input.documentId,
    p_storage_key: input.storageKey,
    p_size: input.size,
    p_mime: input.mime || null,
  });

  if (error) {
    console.error("[v2 documents] add_document_version failed", error);
    return { ok: false, error: error.message };
  }

  revalidatePath(`/v2/operations/${input.operationId}`, "layout");
  return { ok: true };
}

/**
 * Confirme les associations retenues par le fondateur (écran 17).
 *
 * Rien n'est associé sans ce geste : les suggestions restent des propositions
 * jusqu'ici. Les paires refusées ne sont simplement pas transmises — il n'y a
 * pas de trace d'un refus, parce qu'une exigence non satisfaite reste une
 * exigence non satisfaite, ce que le plan de préparation dit déjà.
 */
export async function confirmV2Associations(input: {
  operationId: string;
  pairs: Array<{ documentId: string; requirementId: string }>;
}): Promise<{ ok: boolean; confirmed: number; error?: string }> {
  if (input.pairs.length === 0) return { ok: true, confirmed: 0 };

  const supabase = await createClient();
  let confirmed = 0;

  for (const pair of input.pairs) {
    const { error } = await supabase.rpc("attach_checklist_document", {
      p_item: pair.requirementId,
      p_doc: pair.documentId,
    });

    if (error) {
      console.error("[v2 documents] attach_checklist_document failed", error);
      // On rend ce qui a été fait plutôt que d'annuler le reste : les
      // associations déjà posées sont justes, et les refaire n'apporterait
      // rien.
      return { ok: false, confirmed, error: error.message };
    }
    confirmed += 1;
  }

  revalidatePath(`/v2/operations/${input.operationId}`, "layout");
  return { ok: true, confirmed };
}
