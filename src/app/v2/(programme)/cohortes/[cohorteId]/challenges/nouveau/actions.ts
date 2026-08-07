"use server";

import { redirect } from "next/navigation";

import { v2Routes } from "@/features/v2/navigation/routes";
import { createClient } from "@/lib/supabase/server";

const ROUTES = v2Routes.programme.cohortes;

function texte(formData: FormData, nom: string): string | null {
  const brut = formData.get(nom);
  if (typeof brut !== "string") return null;
  return brut.trim() || null;
}

/**
 * Créer un Challenge — écrans 11 et 12.
 *
 * LES CRITÈRES ARRIVENT EN LIGNES PARALLÈLES, et c'est ce qui permet à
 * l'écran de fonctionner sans JavaScript : un tableau de libellés, un de
 * sources, un de clés, et deux listes de rangs — ceux qui sont obligatoires,
 * ceux qu'on retire. `FormData.getAll` conserve l'ordre du document, donc le
 * rang d'une ligne est son indice.
 *
 * Une ligne au libellé VIDE est ignorée : c'est ainsi que les lignes vierges
 * du bas servent à ajouter un critère sans rien exiger de plus.
 *
 * ⚠️ ON NE FILTRE PAS LES CRITÈRES STRUCTURELS ICI. C'est `create_challenge`
 * qui refuse une liste qui en omettrait un, et c'est mieux ainsi : la règle
 * vaut pour tout appelant, pas seulement pour cet écran.
 */
export async function creerChallenge(formData: FormData) {
  const cohorteId = formData.get("cohorte");
  if (typeof cohorteId !== "string") redirect(ROUTES.list);

  const modele = texte(formData, "modele");
  const retour = modele
    ? `${ROUTES.challengeNouveau(cohorteId)}?modele=${modele}`
    : ROUTES.challengeNouveau(cohorteId);

  const titre = texte(formData, "titre");
  if (!titre) redirect(`${retour}${modele ? "&" : "?"}erreur=titre`);

  const libelles = formData.getAll("critere").map(String);
  const sources = formData.getAll("source").map(String);
  const cles = formData.getAll("cle").map(String);
  const obligatoires = new Set(formData.getAll("obligatoire").map(String));
  const retires = new Set(formData.getAll("retire").map(String));

  const criteres = libelles
    .map((libelle, rang) => ({
      catalog_key: cles[rang] || null,
      label: libelle.trim(),
      required: obligatoires.has(String(rang)),
      retire: retires.has(String(rang)),
      source: sources[rang] === "connecte" ? "connecte" : "manuel",
    }))
    .filter((c) => c.label !== "" && !c.retire)
    .map((c) => ({
      catalog_key: c.catalog_key,
      label: c.label,
      required: c.required,
      source: c.source,
    }));

  if (criteres.length === 0) {
    redirect(`${retour}${modele ? "&" : "?"}erreur=criteres`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_challenge", {
    p_category: texte(formData, "categorie"),
    p_cohort: cohorteId,
    p_criteria: criteres,
    p_due_on: texte(formData, "echeance"),
    p_template: modele,
    p_title: titre,
  });

  if (error) {
    // ADR-001 : l'écran reçoit un code fermé. Le retrait d'un critère
    // structurel a le sien, parce que c'est le seul refus que le programme
    // peut corriger lui-même.
    console.error("[v2 challenges] create_challenge", error);
    const code = error.message?.includes("structurel")
      ? "structurel"
      : "creation";
    redirect(`${retour}${modele ? "&" : "?"}erreur=${code}`);
  }

  // On enchaîne sur l'assignation : un Challenge sans entreprise ne demande
  // rien à personne, et c'est l'étape que la maquette nomme « Continuer ».
  redirect(`${ROUTES.challenge(cohorteId, String(data))}?assigner=1`);
}
