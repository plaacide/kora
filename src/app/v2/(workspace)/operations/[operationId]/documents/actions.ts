"use server";


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
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("register_document", {
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

  // PAS de `revalidatePath` ici, et c'est délibéré.
  //
  // Cette action est appelée une fois PAR PIÈCE. Revalider à chaque appel
  // re-rendait la page au milieu du lot : un dossier passant de vide à rempli
  // change de branche, le composant de dépôt était démonté, et le compte rendu
  // disparaissait — y compris la ligne disant qu'une pièce avait échoué.
  //
  // C'est le client qui rafraîchit, une fois le lot entier terminé et
  // seulement s'il est entièrement passé. Lui seul sait où finit le lot.
  return { ok: true };
}
