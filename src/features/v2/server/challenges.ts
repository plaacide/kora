import "server-only";

import type { AvancementEntreprise } from "@/features/v2/domain/challenges";
import { createClient } from "@/lib/supabase/server";

import { requireV2User } from "./session";

/**
 * Les Challenges d'une cohorte — écrans 09 et 09b.
 *
 * DEUX LECTURES, COMPOSÉES ICI, conformément à ADR-004 : les entêtes d'un
 * côté, l'avancement par entreprise de l'autre. La base rend des faits bruts —
 * combien de critères requis, combien de faits — et le domaine en déduit
 * « en retard », « en cours » et « à faire ». La règle se teste ainsi sans
 * base, et son ordre d'évaluation est écrit une seule fois.
 */

export interface EntrepriseSuivie extends AvancementEntreprise {
  org: string;
  nom: string;
  fige: boolean;
}

export interface ChallengeLu {
  id: string;
  titre: string;
  categorie: string | null;
  echeance: string | null;
  criteres: number;
  entreprises: readonly EntrepriseSuivie[];
}

interface RangeeChallenge {
  id: string;
  title: string;
  category: string | null;
  due_on: string | null;
  criteres: number | string;
  entreprises: number | string;
  faits_total: number | string;
  terminees: number | string;
}

interface RangeeAvancement {
  challenge_id: string;
  startup_org: string;
  startup_name: string | null;
  requis: number | string;
  faits: number | string;
  fige: boolean;
}

/** `count(*)` est un `bigint` : PostgREST le rend en CHAÎNE, comme `numeric`. */
function entier(valeur: number | string | null): number {
  if (valeur === null) return 0;
  const n = typeof valeur === "number" ? valeur : Number(valeur);
  return Number.isFinite(n) ? n : 0;
}

export async function listerChallenges(
  cohorteId: string,
): Promise<readonly ChallengeLu[]> {
  await requireV2User();
  const supabase = await createClient();

  const [entetes, avancements] = await Promise.all([
    supabase.rpc("cohort_challenges", { p_cohort: cohorteId }),
    supabase.rpc("cohort_challenge_progress", { p_cohort: cohorteId }),
  ]);

  if (entetes.error || avancements.error) {
    // ADR-001 : l'écran ne voit rien de Postgres. Mais sans cette trace, une
    // liste vide se lit comme « aucun Challenge » alors que c'est la lecture
    // qui a échoué.
    console.error(
      "[v2 challenges] lecture",
      entetes.error ?? avancements.error,
    );
    throw new Error("challenges_illisibles");
  }

  const parChallenge = new Map<string, EntrepriseSuivie[]>();
  for (const r of (avancements.data ?? []) as RangeeAvancement[]) {
    const liste = parChallenge.get(r.challenge_id) ?? [];
    liste.push({
      faits: entier(r.faits),
      fige: r.fige,
      nom: r.startup_name ?? "—",
      org: r.startup_org,
      requis: entier(r.requis),
    });
    parChallenge.set(r.challenge_id, liste);
  }

  return ((entetes.data ?? []) as RangeeChallenge[]).map((c) => ({
    categorie: c.category,
    criteres: entier(c.criteres),
    echeance: c.due_on,
    entreprises: parChallenge.get(c.id) ?? [],
    id: c.id,
    titre: c.title,
  }));
}

/** Un critère, et où en est UNE entreprise dessus — écran 15. */
export interface CritereSuivi {
  id: string;
  libelle: string;
  source: "manuel" | "connecte";
  requis: boolean;
  fait: boolean;
  /** « confirmé par l'entreprise » ou « validé automatiquement ». */
  origine: "confirme" | "auto" | null;
  atteintLe: string | null;
}

/**
 * Le détail d'un Challenge — écrans 14 et 15.
 *
 * Lecture DIRECTE, sans passer par une fonction énumérée : `challenge_criteria`
 * et `challenge_progress` sont des objets du PROGRAMME, pas de l'entreprise.
 * Leur RLS l'autorise déjà, et rien ici ne traverse la frontière — un critère
 * dit « états financiers disponibles », jamais quel document l'a satisfait.
 *
 * ⚠️ On ne joint PAS `organizations` : la RLS interdit au programme de lire la
 * fiche d'une organisation dont il n'est pas membre, et une jointure ferait
 * disparaître les lignes SANS erreur. Les noms viennent de
 * `cohort_challenge_progress()`, qui est `security definer`.
 */
export async function lireChallenge(challengeId: string): Promise<{
  titre: string;
  categorie: string | null;
  echeance: string | null;
  cohorteId: string;
} | null> {
  await requireV2User();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("challenges")
    .select("title, category, due_on, cohort_id")
    .eq("id", challengeId)
    .maybeSingle();

  if (error) {
    console.error("[v2 challenges] entête", error);
    return null;
  }
  if (!data) return null;

  return {
    categorie: data.category,
    cohorteId: data.cohort_id,
    echeance: data.due_on,
    titre: data.title,
  };
}

/** Les critères d'un Challenge pour une entreprise donnée — écran 15. */
export async function criteresSuivis(
  challengeId: string,
  startupOrg: string,
): Promise<readonly CritereSuivi[]> {
  await requireV2User();
  const supabase = await createClient();

  const [criteres, progres] = await Promise.all([
    supabase
      .from("challenge_criteria")
      .select("id, label, source, required, position")
      .eq("challenge_id", challengeId)
      .order("position"),
    supabase
      .from("challenge_progress")
      .select("criterion_id, status, origin, reached_at")
      .eq("challenge_id", challengeId)
      .eq("startup_org_id", startupOrg),
  ]);

  if (criteres.error || progres.error) {
    console.error("[v2 challenges] critères", criteres.error ?? progres.error);
    return [];
  }

  const etat = new Map(
    (progres.data ?? []).map((p) => [p.criterion_id, p] as const),
  );

  return (criteres.data ?? []).map((c) => {
    const p = etat.get(c.id);
    return {
      atteintLe: p?.reached_at ?? null,
      fait: p?.status === "fait",
      id: c.id,
      libelle: c.label,
      origine: (p?.origin as "confirme" | "auto" | null) ?? null,
      requis: c.required,
      source: c.source as "manuel" | "connecte",
    };
  });
}

/** Un modèle de la bibliothèque — écrans 10 et 16. */
export interface ModeleLu {
  id: string;
  sanza: boolean;
  titre: string;
  categorie: string | null;
  duree: string | null;
  description: string | null;
  criteres: number;
  connectes: number;
  /** Dans combien de VOS cohortes ce modèle a déjà servi. */
  utilisations: number;
}

export interface CritereModele {
  libelle: string;
  source: "manuel" | "connecte";
  catalogKey: string | null;
  requis: boolean;
  /** Un critère structurel d'un modèle Sanza ne peut pas être retiré. */
  structurel: boolean;
}

/**
 * La bibliothèque — modèles Sanza et modèles du programme, en une lecture.
 *
 * Les deux onglets montrent les mêmes cartes ; `sanza` dit lequel est lequel.
 * Deux fonctions auraient dupliqué la règle de visibilité.
 */
export async function lireBibliotheque(): Promise<readonly ModeleLu[]> {
  await requireV2User();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("challenge_library");
  if (error) {
    console.error("[v2 challenges] bibliothèque", error);
    return [];
  }

  return (
    (data ?? []) as {
      id: string;
      sanza: boolean;
      title: string;
      category: string | null;
      duration: string | null;
      description: string | null;
      criteres: number | string;
      connectes: number | string;
      utilisations: number | string;
    }[]
  ).map((m) => ({
    categorie: m.category,
    connectes: entier(m.connectes),
    criteres: entier(m.criteres),
    description: m.description,
    duree: m.duration,
    id: m.id,
    sanza: m.sanza,
    titre: m.title,
    utilisations: entier(m.utilisations),
  }));
}

/** Les critères d'un modèle — l'aperçu de l'écran 10, le départ de l'écran 12. */
export async function criteresModele(
  templateId: string,
): Promise<readonly CritereModele[]> {
  await requireV2User();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("challenge_template_detail", {
    p_template: templateId,
  });
  if (error) {
    console.error("[v2 challenges] critères du modèle", error);
    return [];
  }

  return (
    (data ?? []) as {
      label: string;
      source: string;
      catalog_key: string | null;
      required: boolean;
      structural: boolean;
    }[]
  ).map((c) => ({
    catalogKey: c.catalog_key,
    libelle: c.label,
    requis: c.required,
    source: c.source as "manuel" | "connecte",
    structurel: c.structural,
  }));
}

/** Le Challenge vu par l'entreprise — écran 42. */
export interface ChallengeCoteEntreprise {
  titre: string;
  categorie: string | null;
  echeance: string | null;
  programme: string;
  startupOrg: string;
}

/**
 * Ce qu'une entreprise voit du Challenge qu'on lui a confié.
 *
 * ⚠️ PAR FONCTION ÉNUMÉRÉE, et pour la raison inverse de d'habitude : ici
 * c'est L'ENTREPRISE qui n'a pas le droit de lire la fiche du programme. Une
 * jointure vers `organizations` rendrait zéro ligne, sans erreur, et l'écran
 * afficherait « Proposé par — ».
 */
export async function lireChallengeEntreprise(
  challengeId: string,
): Promise<ChallengeCoteEntreprise | null> {
  await requireV2User();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("challenge_for_startup", {
    p_challenge: challengeId,
  });

  if (error) {
    console.error("[v2 challenges] côté entreprise", error);
    return null;
  }

  const ligne = (
    data as {
      title: string;
      category: string | null;
      due_on: string | null;
      programme: string | null;
      startup_org: string;
    }[]
  )?.[0];
  if (!ligne) return null;

  return {
    categorie: ligne.category,
    echeance: ligne.due_on,
    programme: ligne.programme ?? "votre programme",
    startupOrg: ligne.startup_org,
    titre: ligne.title,
  };
}

/**
 * Remet à jour les critères connectés avant d'afficher.
 *
 * La fonction est MONOTONE — elle ne fait qu'ajouter, et deux passages
 * donnent le même résultat qu'un seul. On peut donc l'appeler à l'ouverture
 * d'un écran sans y réfléchir, et sans craindre de défaire quoi que ce soit.
 *
 * L'échec n'interrompt PAS l'affichage : un critère connecté qui n'a pas pu
 * être réévalué vaut mieux qu'un écran qui ne s'ouvre pas.
 */
export async function rafraichirChallenge(challengeId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("refresh_challenge_progress", {
    p_challenge: challengeId,
  });
  if (error) console.error("[v2 challenges] refresh", error);
}
