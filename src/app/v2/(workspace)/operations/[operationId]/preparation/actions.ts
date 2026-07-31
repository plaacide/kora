"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

/**
 * Les gestes de la préparation — écrans 11 et 12.
 *
 * Tout passe par des RPC `security definer` : elles vérifient le droit
 * d'écrire sur l'opération (`deal_org_for_write`), recalculent le score et
 * écrivent au journal. Une écriture directe sur `checklist_items` ferait
 * l'une des trois et oublierait les deux autres.
 */

type Resultat = { ok: boolean; error?: string };

function revalider(operationId: string): void {
  revalidatePath(`/v2/operations/${operationId}`, "layout");
}

/** Poser le référentiel sur une opération qui n'a pas encore d'exigences. */
export async function applyTemplateAction(operationId: string): Promise<Resultat> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("apply_checklist_template", {
    p_deal: operationId,
  });

  if (error) return { ok: false, error: error.message };

  revalider(operationId);
  return { ok: true };
}

/**
 * Ajouter une exigence à la main.
 *
 * Domaine et niveau sont des énumérations en base : un domaine inventé serait
 * refusé à l'insertion, pas rangé n'importe où. Les sources restent vides —
 * une exigence ajoutée à la main n'est réclamée par personne d'autre que le
 * fondateur, et c'est une information en soi.
 */
export async function addRequirementAction(input: {
  operationId: string;
  domain: string;
  level: string;
  label: string;
  description: string;
}): Promise<Resultat> {
  const label = input.label.trim();
  if (label.length < 2) return { ok: false, error: "Intitulé trop court." };

  const supabase = await createClient();

  const { error } = await supabase.rpc("add_checklist_item", {
    p_deal: input.operationId,
    p_domain: input.domain,
    p_label: label,
    p_description: input.description.trim(),
    p_level: input.level,
    p_sources: [],
  });

  if (error) {
    // La contrainte unique (deal, category, label) remonte en clair.
    return { ok: false, error: error.message };
  }

  revalider(input.operationId);
  return { ok: true };
}

/**
 * Changer le statut d'une exigence.
 *
 * Seules les trois valeurs de `checklist_status` sont acceptées. Un statut
 * inconnu échouerait côté base ; on le refuse ici pour dire pourquoi.
 */
export async function setRequirementStatusAction(input: {
  operationId: string;
  requirementId: string;
  status: string;
}): Promise<Resultat> {
  if (!["todo", "in_progress", "done", "not_applicable"].includes(input.status)) {
    return { ok: false, error: "Statut inconnu." };
  }

  const supabase = await createClient();

  const { error } = await supabase.rpc("set_checklist_status", {
    p_item: input.requirementId,
    p_status: input.status,
  });

  if (error) return { ok: false, error: error.message };

  revalider(input.operationId);
  return { ok: true };
}

/**
 * Rattacher une pièce déjà déposée, confirmée d'emblée.
 *
 * C'est un choix du fondateur, pas une proposition de la machine : le lien
 * naît donc confirmé, et l'exigence devient prête si elle ne l'était pas.
 */
export async function attachProofAction(input: {
  operationId: string;
  requirementId: string;
  documentId: string;
}): Promise<Resultat> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("attach_checklist_document", {
    p_item: input.requirementId,
    p_doc: input.documentId,
    p_confirmed: true,
  });

  if (error) return { ok: false, error: error.message };

  revalider(input.operationId);
  return { ok: true };
}

/** Retirer une preuve. Le statut se réaligne tout seul côté base. */
export async function detachProofAction(input: {
  operationId: string;
  requirementId: string;
  documentId: string;
}): Promise<Resultat> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("detach_checklist_document", {
    p_item: input.requirementId,
    p_doc: input.documentId,
  });

  if (error) return { ok: false, error: error.message };

  revalider(input.operationId);
  return { ok: true };
}

/**
 * PAS d'import de liste reçue ici (écran 13), et ce n'est pas un oubli.
 *
 * L'écran promet de lire un PDF, un DOCX ou un XLSX envoyé par une banque et
 * d'en extraire des exigences. Rien en base ni côté serveur ne fait cette
 * extraction, et une exigence importée doit en outre porter sa provenance
 * (« Demandé par Banque Atlantique ») : `checklist_items` n'a aucune colonne
 * pour ça — sa catégorie est une énumération de trois valeurs fermée.
 *
 * L'écran reste donc une maquette tant que les deux manquent. Le brancher à
 * moitié — ajouter les exigences en perdant leur source — produirait une liste
 * qu'on ne saurait plus relire.
 */
