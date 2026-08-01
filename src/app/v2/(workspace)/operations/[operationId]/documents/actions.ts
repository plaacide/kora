"use server";

import { revalidatePath } from "next/cache";


import { writeSuggestions } from "@/features/v2/server/documents";
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
/**
 * Écrit les suggestions du lot qui vient d'être déposé, non confirmées.
 *
 * Appelée par le client une fois TOUT le lot enregistré, pas fichier par
 * fichier : la suggestion tient compte des autres pièces du lot — deux
 * fichiers ne doivent pas revendiquer la même exigence.
 */
export async function suggestV2Associations(input: {
  operationId: string;
  documentIds: string[];
}): Promise<{ ok: boolean; written: number }> {
  const written = await writeSuggestions(input.operationId, input.documentIds);
  return { ok: true, written };
}

/**
 * Écarter une suggestion sans rien rattacher.
 *
 * Refuser une proposition de la machine et détacher une preuve validée sont
 * deux gestes différents : le journal les distingue, faute de quoi on ne
 * saurait jamais si l'algorithme propose juste.
 */
export async function dismissV2Suggestion(input: {
  operationId: string;
  requirementId: string;
  documentId: string;
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("dismiss_checklist_suggestion", {
    p_item: input.requirementId,
    p_doc: input.documentId,
  });

  if (error) {
    console.error("[v2 documents] dismiss_checklist_suggestion failed", error);
    return { ok: false, error: error.message };
  }

  revalidatePath(`/v2/operations/${input.operationId}`, "layout");
  return { ok: true };
}

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
      p_confirmed: true,
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

/**
 * Masquer une pièce aux invités, ou la remontrer.
 *
 * Le masquage vaut pour TOUS les invités, présents et à venir : c'est une
 * propriété de la pièce, pas de l'invitation. Un masquage par invité serait un
 * état qu'aucun écran ne montre en entier — donc un état qu'on oublie, et une
 * pièce qu'on croit cachée alors qu'elle ne l'est que pour l'un d'eux.
 */
export async function setV2DocumentHidden(input: {
  operationId: string;
  documentId: string;
  hidden: boolean;
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("set_document_hidden", {
    p_doc: input.documentId,
    p_hidden: input.hidden,
  });

  if (error) {
    console.error("[v2 documents] set_document_hidden failed", error);
    return { ok: false, error: error.message };
  }

  revalidatePath(`/v2/operations/${input.operationId}`, "layout");
  return { ok: true };
}

/**
 * Renommer une pièce.
 *
 * Le nom d'origine du fichier est rarement celui qu'on veut montrer à un
 * investisseur : « S0 Donnees etudiants 2026 01 23 v4.xlsx » devient
 * « Tableau de bord — janvier 2026 ». Renommer ne touche NI le fichier stocké
 * ni ses versions : seule l'étiquette change.
 */
export async function renameV2Document(input: {
  operationId: string;
  documentId: string;
  name: string;
}): Promise<{ ok: boolean; error?: string }> {
  const nom = input.name.trim();
  if (!nom) return { ok: false, error: "Le nom ne peut pas être vide." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("rename_document", {
    p_doc: input.documentId,
    p_name: nom,
  });

  if (error) {
    console.error("[v2 documents] rename_document failed", error);
    return { ok: false, error: error.message };
  }

  revalidatePath(`/v2/operations/${input.operationId}`, "layout");
  return { ok: true };
}

/**
 * Déplacer une pièce vers un dossier — ou vers la racine.
 *
 * CE GESTE CHANGE QUI PEUT VOIR LA PIÈCE, et c'est sa conséquence la plus
 * importante : les partages se font par dossier. Sortir une pièce d'un dossier
 * partagé la retire de la vue des invités ; l'y placer la leur ouvre. L'écran
 * doit le dire avant, pas après.
 */
export async function moveV2Document(input: {
  operationId: string;
  documentId: string;
  folderId: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("move_document", {
    p_doc: input.documentId,
    p_folder: input.folderId,
  });

  if (error) {
    console.error("[v2 documents] move_document failed", error);
    return { ok: false, error: error.message };
  }

  revalidatePath(`/v2/operations/${input.operationId}`, "layout");
  return { ok: true };
}

/** Marquer une pièce comme essentielle — elle remonte dans la préparation. */
export async function setV2DocumentKey(input: {
  operationId: string;
  documentId: string;
  key: boolean;
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_document_key", {
    p_doc: input.documentId,
    p_key: input.key,
  });

  if (error) {
    console.error("[v2 documents] set_document_key failed", error);
    return { ok: false, error: error.message };
  }

  revalidatePath(`/v2/operations/${input.operationId}`, "layout");
  return { ok: true };
}

/**
 * Supprimer une pièce.
 *
 * `delete_document` retire la ligne et ses versions. LE FICHIER STOCKÉ, LUI,
 * RESTE : aucune cascade en base ne touche un objet de stockage. C'est ce qui a
 * permis de reconstruire une opération entière le 1er août — et c'est aussi ce
 * qui fait qu'un client croit avoir effacé alors que le fichier survit. Le
 * dire ici tant que le nettoyage du bucket n'est pas écrit.
 */
export async function deleteV2Document(input: {
  operationId: string;
  documentId: string;
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_document", {
    p_doc: input.documentId,
  });

  if (error) {
    console.error("[v2 documents] delete_document failed", error);
    return { ok: false, error: error.message };
  }

  revalidatePath(`/v2/operations/${input.operationId}`, "layout");
  return { ok: true };
}

/** Créer un dossier — à la racine, ou sous un autre. */
export async function createV2Folder(input: {
  operationId: string;
  parentId: string | null;
  name: string;
}): Promise<{ ok: boolean; error?: string }> {
  const nom = input.name.trim();
  if (!nom) return { ok: false, error: "Donnez un nom au dossier." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_folder", {
    p_deal: input.operationId,
    p_parent: input.parentId,
    p_name: nom,
  });

  if (error) {
    console.error("[v2 documents] create_folder failed", error);
    return { ok: false, error: error.message };
  }

  revalidatePath(`/v2/operations/${input.operationId}`, "layout");
  return { ok: true };
}

/** Renommer un dossier. Les partages le suivent : ils portent sur le dossier. */
export async function renameV2Folder(input: {
  operationId: string;
  folderId: string;
  name: string;
}): Promise<{ ok: boolean; error?: string }> {
  const nom = input.name.trim();
  if (!nom) return { ok: false, error: "Le nom ne peut pas être vide." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("rename_folder", {
    p_folder: input.folderId,
    p_name: nom,
  });

  if (error) {
    console.error("[v2 documents] rename_folder failed", error);
    return { ok: false, error: error.message };
  }

  revalidatePath(`/v2/operations/${input.operationId}`, "layout");
  return { ok: true };
}

/**
 * Supprimer un dossier.
 *
 * `p_cascade` décide du sort des pièces : à `false`, la base REFUSE si le
 * dossier n'est pas vide — c'est le comportement qu'on veut par défaut, pour
 * qu'une suppression de dossier n'emporte jamais des pièces par surprise.
 */
export async function deleteV2Folder(input: {
  operationId: string;
  folderId: string;
  cascade: boolean;
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_folder", {
    p_folder: input.folderId,
    p_cascade: input.cascade,
  });

  if (error) {
    console.error("[v2 documents] delete_folder failed", error);
    return { ok: false, error: error.message };
  }

  revalidatePath(`/v2/operations/${input.operationId}`, "layout");
  return { ok: true };
}
