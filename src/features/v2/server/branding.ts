import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Les images de marque — logo aujourd'hui, bannière et logos partenaires demain.
 *
 * DEUX BUCKETS, DEUX RÉGIMES. `documents` est privé et servi par URL signée :
 * il porte les pièces d'un dossier. `branding` est public : il porte ce qu'une
 * Dealroom affiche, et l'arbitrage d'ADR-005 a tranché que la Dealroom s'ouvre
 * SANS COMPTE. Signer les images d'une page que n'importe qui peut ouvrir ne
 * protégerait rien. Ce qui protège ici, c'est le chemin : il commence par
 * l'identifiant de l'organisation, un UUID.
 *
 * LE NOM DU FICHIER DÉPOSÉ N'ENTRE JAMAIS DANS LA CLÉ. On la fabrique de bout
 * en bout — l'extension vient de la table ci-dessous, pas de ce que le
 * navigateur annonce. Le piège des clés non-ASCII (`cleStockage`) ne peut donc
 * pas se poser : aucun caractère venu de l'utilisateur ne s'y trouve.
 */

/** Ce que le bucket accepte, et l'extension qu'on donne à chacun. */
const EXTENSIONS: Readonly<Record<string, string>> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/svg+xml": "svg",
  "image/webp": "webp",
};

/** 2 Mo — la même limite que celle posée sur le bucket. */
const TAILLE_MAX = 2 * 1024 * 1024;

const BUCKET = "branding";

export type EchecImage = "type" | "taille" | "depot";

/** Ce que l'appelant doit distinguer : refusé, ou raté. */
export interface ResultatImage {
  cle: string | null;
  echec: EchecImage | null;
}

/**
 * Dépose une image de marque et rend sa clé.
 *
 * `precedente` est supprimée APRÈS un dépôt réussi, jamais avant : rater le
 * nouveau fichier ne doit pas coûter celui qui marchait.
 */
export async function deposerImageDeMarque(
  orgId: string,
  role: "logo" | "banniere",
  fichier: File,
  precedente?: string | null,
): Promise<ResultatImage> {
  const extension = EXTENSIONS[fichier.type];
  if (!extension) return { cle: null, echec: "type" };
  if (fichier.size > TAILLE_MAX) return { cle: null, echec: "taille" };

  // Le suffixe aléatoire sert le cache autant que la discrétion : un logo
  // remplacé change d'adresse, donc s'affiche tout de suite.
  const cle = `${orgId}/${role}-${crypto.randomUUID().slice(0, 8)}.${extension}`;
  const admin = createAdminClient();

  const { error } = await admin.storage
    .from(BUCKET)
    .upload(cle, fichier, { contentType: fichier.type, upsert: false });

  if (error) {
    console.error("[v2 branding] dépôt", error);
    return { cle: null, echec: "depot" };
  }

  if (precedente && precedente !== cle) {
    // L'ancienne image ne bloque rien si elle survit : on journalise et on
    // continue plutôt que de faire échouer un dépôt qui, lui, a réussi.
    const { error: menage } = await admin.storage
      .from(BUCKET)
      .remove([precedente]);
    if (menage) console.error("[v2 branding] ménage", menage);
  }

  return { cle, echec: null };
}

/** L'adresse publique d'une image de marque. `null` si rien n'est déposé. */
export function urlImageDeMarque(cle: string | null | undefined): string | null {
  if (!cle) return null;
  return createAdminClient().storage.from(BUCKET).getPublicUrl(cle).data
    .publicUrl;
}
