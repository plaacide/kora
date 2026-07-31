"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

/**
 * Les gestes de la levée — écrans 36 et 45.
 *
 * Tout passe par des RPC `security definer` : elles vérifient le droit
 * d'écrire, tiennent l'invariant « une seule levée en cours par opération » et
 * journalisent. Une écriture directe sur `raises` ferait les trois de travers.
 */

type Resultat = { ok: boolean; error?: string };

function revalider(operationId: string): void {
  revalidatePath(`/v2/operations/${operationId}`, "layout");
}

/**
 * L'identifiant rendu par une RPC qui retourne une LIGNE.
 *
 * PostgREST enveloppe parfois ce retour dans un tableau, parfois non, selon la
 * façon dont la fonction est déclarée. Lire `data.id` sans regarder rendait
 * l'identifiant `undefined` — et l'assistant, privé de son brouillon, repartait
 * à la liste sans rien dire alors que la ligne existait bel et bien en base.
 */
function identifiant(data: unknown): string | undefined {
  const ligne = Array.isArray(data) ? data[0] : data;
  return (ligne as { id?: string } | null)?.id;
}

/**
 * Créer la levée si elle n'existe pas, sinon la mettre à jour.
 *
 * `save_raise` crée d'elle-même quand aucune levée n'est en cours : deux
 * appels séparés depuis l'écran laisseraient une fenêtre où une opération
 * aurait deux levées, ce que l'index unique refuserait à moitié du geste.
 */
export async function saveV2Raise(input: {
  operationId: string;
  name?: string | null;
  target?: number | null;
  secured?: number | null;
  currency?: string | null;
  stage?: string | null;
  instrument?: string | null;
  preMoney?: number | null;
  deadline?: string | null;
  audience?: string[] | null;
  description?: string | null;
}): Promise<Resultat> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("save_raise", {
    p_deal: input.operationId,
    p_montant_cible: input.target ?? null,
    p_montant_engage: input.secured ?? null,
    p_devise: input.currency ?? null,
    p_type_tour: input.instrument ?? null,
    p_stade: input.stage ?? null,
    p_valorisation_pre: input.preMoney ?? null,
    p_date_cloture: input.deadline || null,
    p_audience: input.audience ?? null,
    p_description: input.description ?? null,
    // Le nom passe par la RPC et non par une écriture directe : `raises`
    // porte un `revoke update from authenticated`, et l'écriture directe
    // était refusée SANS erreur — le nom saisi disparaissait en silence.
    p_name: input.name ?? null,
  });

  if (error) {
    console.error("[v2 lever] save_raise échoué :", error);
    return { ok: false, error: error.message };
  }

  revalider(input.operationId);
  return { ok: true };
}

/**
 * Clôturer la levée. Elle rejoint l'historique de financement.
 *
 * Rien n'est supprimé : les pièces, les accès et le journal restent. Une levée
 * clôturée qu'on ne pourrait plus relire ne prouverait plus qu'un tour a eu
 * lieu — c'est justement ce qu'un investisseur suivant demande.
 */
export async function closeV2Raise(input: {
  operationId: string;
  finalAmount?: number | null;
  note?: string | null;
}): Promise<Resultat> {
  const supabase = await createClient();

  // Le montant final et la note se posent AVANT la clôture : après, la levée
  // n'est plus « en cours » et `save_raise` ne la retrouverait pas.
  if (input.finalAmount != null || input.note?.trim()) {
    const { error } = await supabase.rpc("save_raise", {
      p_deal: input.operationId,
      p_montant_engage: input.finalAmount ?? null,
      p_description: input.note?.trim() || null,
    });

    if (error) {
      console.error("[v2 lever] récapitulatif non enregistré :", error);
      return { ok: false, error: error.message };
    }
  }

  const { error } = await supabase.rpc("close_raise", {
    p_deal: input.operationId,
  });

  if (error) {
    console.error("[v2 lever] close_raise échoué :", error);
    return { ok: false, error: error.message };
  }

  revalider(input.operationId);
  return { ok: true };
}

/** Ouvrir une levée sur une opération qui n'en a pas encore. */
export async function createV2Raise(input: {
  operationId: string;
  name?: string | null;
}): Promise<Resultat> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("create_raise", {
    p_deal: input.operationId,
    p_name: input.name?.trim() || null,
  });

  if (error) {
    console.error("[v2 lever] create_raise échoué :", error);
    return { ok: false, error: error.message };
  }

  revalider(input.operationId);
  return { ok: true };
}

/**
 * Ajouter ou modifier un investisseur du pipeline.
 *
 * `save_raise_investor` fait les deux : sans `id` elle crée, avec elle met à
 * jour. Un seul appel, donc pas de fenêtre où l'écran croirait avoir créé ce
 * qu'il vient de modifier.
 *
 */
export async function saveV2Investor(input: {
  operationId: string;
  id?: string | null;
  nom: string;
  organisation?: string | null;
  email?: string | null;
  ticket?: number | null;
  etape?: string | null;
  engagement?: string | null;
  categorie?: string | null;
  fonction?: string | null;
  pays?: string | null;
  source?: string | null;
  responsable?: string | null;
  prochaineAction?: string | null;
  dateRelance?: string | null;
  notes?: string | null;
}): Promise<Resultat> {
  const nom = input.nom.trim();
  if (nom.length < 2) return { ok: false, error: "Indiquez un nom." };

  const supabase = await createClient();

  const { error } = await supabase.rpc("save_raise_investor", {
    p_deal: input.operationId,
    p_id: input.id ?? null,
    p_nom: nom,
    p_organisation: input.organisation?.trim() || null,
    p_email: input.email?.trim().toLowerCase() || null,
    p_ticket: input.ticket ?? null,
    p_etape: input.etape ?? null,
    p_engagement: input.engagement ?? null,
    // Les textes libres partent tels quels, vide compris : sans cela, effacer
    // une note serait impossible — la valeur vide se ferait remplacer par
    // l'ancienne à chaque enregistrement.
    p_categorie: input.categorie?.trim() || null,
    p_fonction: input.fonction?.trim() || null,
    p_pays: input.pays?.trim() || null,
    p_source: input.source?.trim() || null,
    p_responsable: input.responsable?.trim() || null,
    p_prochaine_action: input.prochaineAction?.trim() || null,
    p_date_relance: input.dateRelance || null,
    p_notes: input.notes?.trim() || null,
  });

  if (error) {
    console.error("[v2 lever] save_raise_investor échoué :", error);
    return { ok: false, error: error.message };
  }

  revalider(input.operationId);
  return { ok: true };
}

/**
 * Retirer une relation du pipeline.
 *
 * À ne pas confondre avec l'étape `refuse` : celle-ci garde la trace d'une
 * relation qui n'a pas abouti — un investisseur approché qui a dit non fait
 * partie de l'histoire du tour. La suppression est pour les erreurs de
 * saisie : un doublon, un nom mal orthographié recréé à côté.
 *
 * `delete_raise_investor` vérifie le droit d'écrire et journalise. Une
 * suppression directe serait refusée sans erreur — `raise_investors` porte un
 * `revoke delete from authenticated`.
 */
export async function deleteV2Investor(input: {
  operationId: string;
  id: string;
}): Promise<Resultat> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("delete_raise_investor", {
    p_id: input.id,
  });

  if (error) {
    console.error("[v2 lever] delete_raise_investor échoué :", error);
    return { ok: false, error: error.message };
  }

  revalider(input.operationId);
  return { ok: true };
}

/**
 * Enregistrer ou requalifier un engagement — écran 43.
 *
 * Le même appel pour les deux : le fondateur ne crée pas un second engagement
 * quand un intérêt devient un soft-commit, il requalifie le même. La RPC
 * recalcule ensuite le montant sécurisé de la levée — c'est pour cela qu'on ne
 * saisit plus ce montant à la main.
 */
export async function saveV2Commitment(input: {
  operationId: string;
  investorId: string;
  niveau: "interet" | "soft_commit" | "confirme";
  montant: number;
  devise?: string | null;
  date?: string | null;
  preuve?: string | null;
  commentaire?: string | null;
  responsable?: string | null;
}): Promise<Resultat> {
  if (!input.investorId) return { ok: false, error: "Choisissez un investisseur." };
  if (!Number.isFinite(input.montant) || input.montant < 0) {
    return { ok: false, error: "Indiquez un montant." };
  }

  const supabase = await createClient();

  const { error } = await supabase.rpc("save_raise_commitment", {
    p_investor: input.investorId,
    p_niveau: input.niveau,
    p_montant: Math.round(input.montant),
    p_devise: input.devise?.trim() || null,
    p_date: input.date || null,
    p_preuve: input.preuve?.trim() || null,
    p_commentaire: input.commentaire?.trim() || null,
    p_responsable: input.responsable?.trim() || null,
  });

  if (error) {
    console.error("[v2 lever] save_raise_commitment échoué :", error);
    return { ok: false, error: error.message };
  }

  revalider(input.operationId);
  return { ok: true };
}

/** Retirer un engagement. Le montant sécurisé retombe aussitôt. */
export async function deleteV2Commitment(input: {
  operationId: string;
  id: string;
}): Promise<Resultat> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("delete_raise_commitment", {
    p_id: input.id,
  });

  if (error) {
    console.error("[v2 lever] delete_raise_commitment échoué :", error);
    return { ok: false, error: error.message };
  }

  revalider(input.operationId);
  return { ok: true };
}

/**
 * Enregistrer un brouillon de mise à jour — étapes 1 à 3 de l'assistant.
 *
 * Appelé à chaque passage d'étape : fermer l'onglet à l'étape 3 ne doit pas
 * perdre les deux premières. Retourne l'identifiant, car la première étape
 * crée le brouillon et les suivantes ont besoin de savoir lequel.
 */
export async function saveV2Update(input: {
  operationId: string;
  id?: string | null;
  instrument?: string | null;
  financeur?: string | null;
  periode?: string | null;
  resume?: string | null;
  demande?: string | null;
  indicateurs?: unknown[] | null;
  documentId?: string | null;
  destinataires?: string[] | null;
}): Promise<Resultat & { id?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("save_raise_update", {
    p_deal: input.operationId,
    p_id: input.id ?? null,
    p_instrument: input.instrument ?? null,
    p_financeur: input.financeur ?? null,
    p_periode: input.periode?.trim() || null,
    p_resume: input.resume ?? null,
    p_demande: input.demande ?? null,
    p_indicateurs: input.indicateurs ?? null,
    p_document: input.documentId ?? null,
    p_destinataires: input.destinataires ?? null,
  });

  if (error) {
    console.error("[v2 lever] save_raise_update échoué :", error);
    return { ok: false, error: error.message };
  }

  revalider(input.operationId);
  return { ok: true, id: identifiant(data) };
}

/**
 * Publier — écran 49.
 *
 * La RPC refuse une mise à jour sans destinataire et fige le contenu. Rien de
 * cela n'est vérifié ici : un contrôle posé uniquement dans le bouton se perd
 * au premier appel qui ne passe pas par le bouton.
 */
export async function publishV2Update(input: {
  operationId: string;
  id: string;
}): Promise<Resultat> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("publish_raise_update", { p_id: input.id });

  if (error) {
    console.error("[v2 lever] publish_raise_update échoué :", error);
    return { ok: false, error: error.message };
  }

  revalider(input.operationId);
  return { ok: true };
}

/** Créer une correction (V2) d'une mise à jour publiée — écran 50. */
export async function correctV2Update(input: {
  operationId: string;
  id: string;
}): Promise<Resultat & { id?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("correct_raise_update", {
    p_id: input.id,
  });

  if (error) {
    console.error("[v2 lever] correct_raise_update échoué :", error);
    return { ok: false, error: error.message };
  }

  revalider(input.operationId);
  return { ok: true, id: identifiant(data) };
}

/** Supprimer un brouillon. Une mise à jour publiée ne se supprime pas. */
export async function deleteV2Update(input: {
  operationId: string;
  id: string;
}): Promise<Resultat> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("delete_raise_update", { p_id: input.id });

  if (error) {
    console.error("[v2 lever] delete_raise_update échoué :", error);
    return { ok: false, error: error.message };
  }

  revalider(input.operationId);
  return { ok: true };
}

/**
 * Consigner une interaction — écran 42.
 *
 * Sanza n'envoie ni ne détecte d'e-mail : cette action ÉCRIT ce que l'équipe a
 * vécu, elle ne l'observe pas. La RPC remonte au passage la prochaine action
 * sur l'investisseur, pour ne pas saisir deux fois la même décision.
 */
export async function saveV2Interaction(input: {
  operationId: string;
  investorId: string;
  id?: string | null;
  type: "email" | "appel" | "reunion" | "evenement" | "note" | "autre";
  date?: string | null;
  responsable?: string | null;
  participants?: string | null;
  resume?: string | null;
  resultat?: string | null;
  prochaineAction?: string | null;
  dateRelance?: string | null;
}): Promise<Resultat> {
  if (!input.investorId) {
    return { ok: false, error: "Choisissez un investisseur." };
  }

  const supabase = await createClient();

  const { error } = await supabase.rpc("save_raise_interaction", {
    p_investor: input.investorId,
    p_id: input.id ?? null,
    p_type: input.type,
    p_date: input.date || null,
    // Les textes partent vides compris : sans cela, effacer un participant
    // serait impossible — la valeur vide se ferait remplacer par l'ancienne.
    p_responsable: input.responsable?.trim() || null,
    p_participants: input.participants?.trim() || null,
    p_resume: input.resume?.trim() || null,
    p_resultat: input.resultat?.trim() || null,
    p_prochaine_action: input.prochaineAction?.trim() || null,
    p_date_relance: input.dateRelance || null,
  });

  if (error) {
    console.error("[v2 lever] save_raise_interaction échoué :", error);
    return { ok: false, error: error.message };
  }

  revalider(input.operationId);
  return { ok: true };
}

/** Retirer une interaction consignée par erreur. */
export async function deleteV2Interaction(input: {
  operationId: string;
  id: string;
}): Promise<Resultat> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("delete_raise_interaction", {
    p_id: input.id,
  });

  if (error) {
    console.error("[v2 lever] delete_raise_interaction échoué :", error);
    return { ok: false, error: error.message };
  }

  revalider(input.operationId);
  return { ok: true };
}
