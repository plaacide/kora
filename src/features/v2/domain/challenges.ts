/**
 * Les règles d'un Challenge — écrans 09, 09b, 13, 14, 15, 42.
 *
 * Rien de tout cela n'est stocké. `challenge_progress` ne connaît que
 * `a_faire` et `fait` ; « en retard » et « en cours » se DÉDUISENT de
 * l'échéance et du compte. Deux sources pour un même état finiraient par se
 * contredire — et c'est toujours la source affichée qui a l'air d'avoir
 * raison.
 */

export type EtatSuivi = "Terminé" | "En retard" | "En cours" | "À faire";

/** Ce qu'une entreprise a fait d'un Challenge. */
export interface AvancementEntreprise {
  faits: number;
  requis: number;
}

/**
 * L'ORDRE D'ÉVALUATION EST LA RÈGLE, pas un détail d'écriture.
 *
 * « Terminé » passe avant « en retard » : une entreprise qui a tout fourni la
 * veille de l'échéance n'est pas en retard le lendemain. L'inverse
 * afficherait un reproche à quelqu'un qui n'a plus rien à faire — et le
 * programme rappellerait une entreprise pour rien.
 *
 * Un Challenge SANS critère requis est terminé d'emblée : 0 sur 0, il n'y a
 * rien à attendre. Le cas paraît théorique ; il ne l'est pas, puisqu'un
 * Challenge peut n'être fait que de critères facultatifs.
 */
export function etatSuivi(
  avancement: AvancementEntreprise,
  echeance: string | null,
  maintenant: Date,
): EtatSuivi {
  if (avancement.faits >= avancement.requis) return "Terminé";
  if (echeance && depassee(echeance, maintenant)) return "En retard";
  if (avancement.faits > 0) return "En cours";
  return "À faire";
}

/**
 * Une échéance se compare à la FIN de son jour, pas à son début.
 *
 * Une échéance au 15 octobre laisse le 15 octobre entier. La comparer à
 * minuit rendrait tout le monde en retard dès le matin du jour dit — c'est le
 * défaut déjà corrigé côté invitations par `fin_de_journee()`.
 */
export function depassee(echeance: string, maintenant: Date): boolean {
  const fin = new Date(`${echeance}T23:59:59.999Z`);
  return maintenant.getTime() > fin.getTime();
}

/** Combien de jours restent — négatif si l'échéance est passée. */
export function joursRestants(
  echeance: string,
  maintenant: Date,
): number {
  const fin = new Date(`${echeance}T23:59:59.999Z`);
  return Math.ceil((fin.getTime() - maintenant.getTime()) / 86_400_000);
}

export interface Repartition {
  terminees: number;
  enCours: number;
  enRetard: number;
  aFaire: number;
}

/** Les quatre compteurs de l'écran 09b, dans l'ordre où il les affiche. */
export function repartition(
  entreprises: readonly AvancementEntreprise[],
  echeance: string | null,
  maintenant: Date,
): Repartition {
  const compte: Repartition = {
    aFaire: 0,
    enCours: 0,
    enRetard: 0,
    terminees: 0,
  };
  for (const e of entreprises) {
    switch (etatSuivi(e, echeance, maintenant)) {
      case "Terminé":
        compte.terminees += 1;
        break;
      case "En retard":
        compte.enRetard += 1;
        break;
      case "En cours":
        compte.enCours += 1;
        break;
      default:
        compte.aFaire += 1;
    }
  }
  return compte;
}

/**
 * L'avancement d'un Challenge, en pourcentage.
 *
 * Sur les CRITÈRES REQUIS de toutes les entreprises, pas sur les entreprises
 * terminées. « 48 % » à l'écran 09b décrit un effort en cours ; compter les
 * seules entreprises finies afficherait 0 % tant qu'aucune n'a tout bouclé,
 * alors que sept sur huit sont à un critère près.
 *
 * Rend `null` quand il n'y a rien à mesurer — l'écran n'affiche alors pas la
 * barre, plutôt qu'une barre vide qui se lit comme un échec.
 */
export function avancement(
  entreprises: readonly AvancementEntreprise[],
): number | null {
  const requis = entreprises.reduce((t, e) => t + e.requis, 0);
  if (requis === 0) return null;
  const faits = entreprises.reduce((t, e) => t + Math.min(e.faits, e.requis), 0);
  return Math.round((faits / requis) * 100);
}

/** « 2026-10-15 » → « 15 octobre ». Sans l'année, comme les écrans. */
const JOUR = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" });

export function echeanceCourte(echeance: string | null): string {
  if (!echeance) return "sans échéance";
  return JOUR.format(new Date(`${echeance}T12:00:00Z`));
}

/**
 * Le tri du détail d'un Challenge — écran 14 : « les retards d'abord ».
 *
 * L'écran ne trie pas par nom mais par urgence : c'est une liste de rappels,
 * et un rappel se lit du plus pressant au moins pressant. À égalité d'état,
 * le nom départage — sans quoi deux entreprises identiques changeraient
 * d'ordre d'un chargement à l'autre.
 */
const RANG: Record<EtatSuivi, number> = {
  "À faire": 1,
  "En cours": 2,
  "En retard": 0,
  Terminé: 3,
};

export function ordreDeSuivi<T extends AvancementEntreprise & { nom: string }>(
  entreprises: readonly T[],
  echeance: string | null,
  maintenant: Date,
): readonly T[] {
  return [...entreprises].sort((a, b) => {
    const ra = RANG[etatSuivi(a, echeance, maintenant)];
    const rb = RANG[etatSuivi(b, echeance, maintenant)];
    return ra - rb || a.nom.localeCompare(b.nom);
  });
}
