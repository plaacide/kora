import "server-only";

import { createClient } from "@/lib/supabase/server";

/**
 * La fiche d'une relation — écran 41.
 *
 * Sept onglets, mais une seule question : où en est-on avec cette personne.
 * Le panneau latéral servait à la MODIFIER ; la fiche sert à la COMPRENDRE, et
 * les deux gestes n'appellent pas la même mise en page — l'un est un
 * formulaire, l'autre un dossier.
 *
 * Tout ce qui suit est lu, jamais estimé. C'est le point sensible de cet
 * écran : les signaux documentaires ressemblent à une intention d'investir, et
 * n'en sont pas.
 */

/**
 * Un événement de consultation.
 *
 * `document.page_viewed` est la seule trace de lecture du produit : une ligne
 * par page ouverte, avec le nom de la pièce.
 */
export interface ConsultationPiece {
  documentId: string;
  nom: string;
  pages: number;
  premiere: string;
  derniere: string;
}

export interface SignauxDocumentaires {
  /**
   * Bursts de consultation séparés de plus de trente minutes.
   *
   * Le produit n'enregistre pas de « session » : une visite se DÉDUIT du
   * rythme des pages. La règle est dite à l'écran, sans quoi le chiffre
   * paraîtrait mesuré alors qu'il est reconstruit.
   */
  visites: number;
  piecesConsultees: number;
  /** Pièces de l'opération, pour donner l'échelle — « 5 / 18 ». */
  piecesTotales: number;
  pagesVues: number;
  derniereVisite: string | null;
  pieces: ConsultationPiece[];
}

const TRENTE_MINUTES = 30 * 60 * 1000;

/**
 * Les signaux documentaires d'une adresse sur une opération.
 *
 * `temps total` de la maquette n'y est pas : aucune durée n'est enregistrée —
 * une page vue n'a pas de fin. Afficher « 41 min » supposerait de l'inventer,
 * sur un écran dont tout l'enjeu est qu'on puisse s'y fier. « Pages vues » dit
 * ce qu'on sait.
 */
export async function documentarySignals(
  operationId: string,
  email: string | null,
): Promise<SignauxDocumentaires> {
  const vide: SignauxDocumentaires = {
    visites: 0,
    piecesConsultees: 0,
    piecesTotales: 0,
    pagesVues: 0,
    derniereVisite: null,
    pieces: [],
  };

  if (!email) return vide;

  const supabase = await createClient();

  const [{ data, error }, { count }] = await Promise.all([
    supabase
      .from("audit_log")
      .select("target_id, metadata, created_at")
      .eq("deal_id", operationId)
      .eq("action", "document.page_viewed")
      .eq("actor_email", email.toLowerCase())
      .order("created_at", { ascending: false })
      .limit(2000),
    supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("deal_id", operationId),
  ]);

  if (error) console.error("[v2 fiche] signaux :", error);

  const lignes = (data ?? []) as Array<{
    target_id: string | null;
    metadata: { name?: string } | null;
    created_at: string;
  }>;

  if (lignes.length === 0) return { ...vide, piecesTotales: count ?? 0 };

  const parPiece = new Map<string, ConsultationPiece>();

  for (const l of lignes) {
    const id = l.target_id ?? "inconnu";
    const existante = parPiece.get(id);

    if (existante) {
      existante.pages += 1;
      // La lecture est triée du plus récent au plus ancien : chaque ligne
      // suivante recule donc la première consultation.
      existante.premiere = l.created_at;
    } else {
      parPiece.set(id, {
        documentId: id,
        nom: l.metadata?.name ?? "Pièce retirée",
        pages: 1,
        premiere: l.created_at,
        derniere: l.created_at,
      });
    }
  }

  // Les visites : on remonte le temps et on compte les ruptures.
  const horodatages = lignes
    .map((l) => new Date(l.created_at).getTime())
    .sort((a, b) => a - b);

  let visites = 1;
  for (let i = 1; i < horodatages.length; i += 1) {
    if (horodatages[i] - horodatages[i - 1] > TRENTE_MINUTES) visites += 1;
  }

  return {
    visites,
    piecesConsultees: parPiece.size,
    piecesTotales: count ?? 0,
    pagesVues: lignes.length,
    derniereVisite: lignes[0].created_at,
    pieces: [...parPiece.values()].sort((a, b) =>
      b.derniere.localeCompare(a.derniere),
    ),
  };
}
