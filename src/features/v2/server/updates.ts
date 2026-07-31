import "server-only";

import type {
  Financeur,
  IndicateurRetenu,
  Instrument,
} from "@/features/v2/domain/updates";
import { nomActeur } from "@/features/v2/domain/journal";
import { createClient } from "@/lib/supabase/server";

/**
 * Les mises à jour aux financeurs — écrans 46 à 50.
 *
 * Deux lectures, et la frontière entre elles n'est pas cosmétique : la LISTE
 * ne montre que ce qui tient dans un tableau, le DÉTAIL charge le contenu figé
 * et les consultations. Charger les indicateurs de quinze mises à jour pour en
 * afficher la période serait payer cher un chiffre qu'on n'affiche pas.
 */

export interface MiseAJourResume {
  id: string;
  periode: string;
  instrument: Instrument;
  financeur: Financeur;
  /** Les noms des destinataires, pour la colonne du tableau. */
  destinataires: string[];
  statut: "brouillon" | "publiee";
  version: number;
  publieeLe: string | null;
  /** Somme des consultations de tous les destinataires. */
  consultations: number;
}

export async function updates(
  operationId: string,
): Promise<MiseAJourResume[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("raise_updates")
    .select(
      "id, periode, instrument, financeur, statut, version, published_at, created_at, raise_update_recipients(vues, raise_investors(nom, organisation))",
    )
    .eq("deal_id", operationId)
    .order("created_at", { ascending: false });

  if (error) console.error("[v2 updates] liste :", error);

  return ((data ?? []) as unknown as Array<{
    id: string;
    periode: string;
    instrument: Instrument;
    financeur: Financeur;
    statut: "brouillon" | "publiee";
    version: number;
    published_at: string | null;
    raise_update_recipients: Array<{
      vues: number;
      raise_investors:
        | { nom: string; organisation: string | null }
        | Array<{ nom: string; organisation: string | null }>
        | null;
    }> | null;
  }>).map((row) => {
    const destinataires = row.raise_update_recipients ?? [];

    return {
      id: row.id,
      periode: row.periode,
      instrument: row.instrument,
      financeur: row.financeur,
      destinataires: destinataires.map((r) => {
        const i = Array.isArray(r.raise_investors)
          ? r.raise_investors[0]
          : r.raise_investors;
        return i?.organisation || i?.nom || "Destinataire";
      }),
      statut: row.statut,
      version: row.version,
      publieeLe: row.published_at,
      consultations: destinataires.reduce((somme, r) => somme + r.vues, 0),
    };
  });
}

export interface Destinataire {
  investorId: string;
  nom: string;
  organisation: string | null;
  email: string | null;
  vues: number;
  derniereVue: string | null;
  /** `false` quand l'adresse ne correspond à aucun compte : il ne verra rien. */
  joignable: boolean;
}

export interface MiseAJour {
  id: string;
  periode: string;
  instrument: Instrument;
  financeur: Financeur;
  resume: string | null;
  demande: string | null;
  indicateurs: IndicateurRetenu[];
  documentId: string | null;
  documentNom: string | null;
  statut: "brouillon" | "publiee";
  version: number;
  /** L'identifiant de la version corrigée, s'il s'agit d'une V2 ou plus. */
  corrige: string | null;
  publieeLe: string | null;
  publieePar: string | null;
  destinataires: Destinataire[];
}

export async function update(
  operationId: string,
  updateId: string,
): Promise<MiseAJour | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("raise_updates")
    .select(
      "id, periode, instrument, financeur, resume, demande, indicateurs, document_id, statut, version, corrige, published_at, published_by, documents(name), raise_update_recipients(investor_id, user_id, vues, derniere_vue, raise_investors(nom, organisation, email))",
    )
    .eq("deal_id", operationId)
    .eq("id", updateId)
    .maybeSingle();

  if (!data) return null;

  const row = data as unknown as {
    id: string;
    periode: string;
    instrument: Instrument;
    financeur: Financeur;
    resume: string | null;
    demande: string | null;
    indicateurs: IndicateurRetenu[] | null;
    document_id: string | null;
    statut: "brouillon" | "publiee";
    version: number;
    corrige: string | null;
    published_at: string | null;
    published_by: string | null;
    documents: { name: string } | Array<{ name: string }> | null;
    raise_update_recipients: Array<{
      investor_id: string;
      user_id: string | null;
      vues: number;
      derniere_vue: string | null;
      raise_investors:
        | { nom: string; organisation: string | null; email: string | null }
        | Array<{ nom: string; organisation: string | null; email: string | null }>
        | null;
    }> | null;
  };

  let publieePar: string | null = null;
  if (row.published_by) {
    const { data: profil } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", row.published_by)
      .maybeSingle();

    const p = profil as { full_name: string | null; email: string | null } | null;
    if (p) publieePar = nomActeur(p.email, p.full_name);
  }

  const doc = Array.isArray(row.documents) ? row.documents[0] : row.documents;

  return {
    id: row.id,
    periode: row.periode,
    instrument: row.instrument,
    financeur: row.financeur,
    resume: row.resume,
    demande: row.demande,
    indicateurs: row.indicateurs ?? [],
    documentId: row.document_id,
    documentNom: doc?.name ?? null,
    statut: row.statut,
    version: row.version,
    corrige: row.corrige,
    publieeLe: row.published_at,
    publieePar,
    destinataires: (row.raise_update_recipients ?? []).map((r) => {
      const i = Array.isArray(r.raise_investors)
        ? r.raise_investors[0]
        : r.raise_investors;

      return {
        investorId: r.investor_id,
        nom: i?.nom ?? "Destinataire",
        organisation: i?.organisation ?? null,
        email: i?.email ?? null,
        vues: r.vues,
        derniereVue: r.derniere_vue,
        // Un destinataire sans compte ne verra rien dans l'application. Le
        // taire donnerait l'illusion d'un envoi qui n'atteint personne.
        joignable: r.user_id !== null,
      };
    }),
  };
}
