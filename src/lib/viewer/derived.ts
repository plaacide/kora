import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Cache des artefacts DÉRIVÉS d'un document (PDF converti, page rendue,
 * classeur extrait).
 *
 * Le problème qu'il règle : une version de document est immuable, mais on
 * refaisait tout le travail à chaque ouverture — retélécharger le fichier,
 * relancer LibreOffice, reparser le classeur. Un deck de 13 pages, c'était 13
 * conversions complètes du même fichier.
 *
 * Les dérivés vivent dans le même bucket privé que les originaux : aucun
 * client n'a de policy de lecture dessus, ils ne sont servis que par nos
 * routes, après contrôle des droits. Le cache ne crée donc aucun chemin
 * d'accès nouveau.
 *
 * `PIPELINE` versionne l'extraction : l'incrémenter invalide tout le cache
 * d'un coup, ce qui évite de servir de vieux artefacts après une correction.
 */

const BUCKET = "documents";

// v1 : PDF converti + pages rendues.
// v2 : extraction des tableurs avec mise en forme (styles, largeurs, fusions).
// v3 : + bordures, hauteurs de ligne, retour à la ligne, alignement vertical.
//
// À INCRÉMENTER dès que la forme des données extraites change : sinon on sert
// d'anciens artefacts à du code qui attend les nouveaux champs, et le défaut
// est invisible (une bordure manquante ne lève aucune erreur).
const PIPELINE = "v3";

function base(versionId: string): string {
  return `derived/${PIPELINE}/${versionId}`;
}

export function pdfKey(versionId: string): string {
  return `${base(versionId)}/converted.pdf`;
}

export function sheetKey(versionId: string): string {
  return `${base(versionId)}/workbook.json`;
}

/**
 * Page rendue. Uniquement pour les niveaux SANS filigrane : une page
 * filigranée porte l'e-mail du lecteur et la date, elle est propre à une
 * consultation et ne doit jamais être réutilisée pour quelqu'un d'autre.
 */
export function pageKey(versionId: string, page: number, scale: number): string {
  return `${base(versionId)}/p${page}@${scale}.png`;
}

/**
 * Métadonnées du document rendu (nombre de pages). Nécessaire pour servir une
 * page depuis le cache : sans elle on ne saurait pas combien de vignettes
 * afficher, et le lecteur verrait un document d'une seule page.
 */
export function metaKey(versionId: string): string {
  return `${base(versionId)}/meta.json`;
}

export async function readDerived(
  admin: SupabaseClient,
  key: string,
): Promise<Uint8Array | null> {
  const { data, error } = await admin.storage.from(BUCKET).download(key);
  if (error || !data) return null;
  return new Uint8Array(await data.arrayBuffer());
}

/**
 * Écrit un dérivé. Volontairement tolérant : un cache qui échoue ne doit
 * jamais faire échouer une consultation — au pire on recalculera.
 */
export async function writeDerived(
  admin: SupabaseClient,
  key: string,
  bytes: Uint8Array,
  contentType: string,
): Promise<void> {
  try {
    await admin.storage.from(BUCKET).upload(key, bytes, {
      contentType,
      upsert: true,
    });
  } catch (err) {
    console.error("[derived] écriture du cache échouée", key, err);
  }
}

/**
 * Cache mémoire, en plus du cache de stockage.
 *
 * Même servi depuis le cache, chaque ouverture payait un aller-retour réseau
 * vers Supabase. Un document consulté en boucle pendant une séance de due
 * diligence n'a aucune raison de le repayer.
 *
 * Borné en nombre ET en taille : le conteneur a 4 Go, un classeur extrait peut
 * peser plusieurs mégaoctets, et un cache non borné finit toujours par tuer le
 * process. Éviction FIFO, suffisante ici.
 */
const MEM_MAX_ENTRIES = 8;
const MEM_MAX_BYTES = 4_000_000;
const memory = new Map<string, unknown>();

function remember(key: string, value: unknown, size: number): void {
  if (size > MEM_MAX_BYTES) return;
  if (memory.size >= MEM_MAX_ENTRIES) {
    const oldest = memory.keys().next().value;
    if (oldest !== undefined) memory.delete(oldest);
  }
  memory.set(key, value);
}

export async function readDerivedJson<T>(
  admin: SupabaseClient,
  key: string,
): Promise<T | null> {
  const hit = memory.get(key);
  if (hit !== undefined) return hit as T;

  const bytes = await readDerived(admin, key);
  if (!bytes) return null;
  try {
    const parsed = JSON.parse(new TextDecoder().decode(bytes)) as T;
    remember(key, parsed, bytes.byteLength);
    return parsed;
  } catch {
    // Artefact corrompu : on l'ignore et on recalculera par-dessus.
    return null;
  }
}

export function writeDerivedJson(
  admin: SupabaseClient,
  key: string,
  value: unknown,
): Promise<void> {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  // On garde aussi en mémoire : le lecteur qui vient de déclencher le calcul
  // est justement celui qui va enchaîner les pages.
  remember(key, value, bytes.byteLength);
  return writeDerived(admin, key, bytes, "application/json");
}
