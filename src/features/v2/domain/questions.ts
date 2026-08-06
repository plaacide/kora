/**
 * Les règles du fil d'une cohorte — écran 08.
 *
 * L'écran le dit deux fois et c'est tout le sujet : « une question attend une
 * réponse, une suggestion n'en attend pas ». Ce n'est pas un chat. Ces règles
 * ne font qu'une chose — rendre cette différence visible sans avoir à lire le
 * libellé du statut.
 */

export type TypeFil = "question" | "suggestion";
export type StatutFil = "open" | "answered" | "read";

export interface FilBrut {
  type: TypeFil | string;
  statut: StatutFil | string;
  creeLe: string;
  reponduLe: string | null;
}

export type TonBadge = "amber" | "green" | "neutral";

export interface Badge {
  texte: string;
  ton: TonBadge;
}

/**
 * Le badge se décide par le TYPE d'abord, le statut ensuite.
 *
 * Une suggestion n'est jamais « en attente », quel que soit son statut en
 * base : elle n'attend rien. La lire comme une question non répondue ferait
 * porter à l'entreprise une dette qu'on lui a explicitement épargnée — et
 * gonflerait le compteur « sans réponse » de l'accueil avec des messages qui
 * n'en appellent aucune.
 */
export function badge(fil: FilBrut): Badge {
  if (fil.type === "suggestion") {
    return { texte: "Suggestion", ton: "neutral" };
  }
  if (fil.statut === "answered" || fil.reponduLe) {
    return { texte: "Répondu", ton: "green" };
  }
  return { texte: "En attente", ton: "amber" };
}

/** « à l'instant », « il y a 3 h », « hier », « il y a 4 jours ». */
export function ecart(date: string, maintenant: Date): string {
  const ms = maintenant.getTime() - new Date(date).getTime();
  const heures = Math.floor(ms / 3_600_000);
  if (heures < 1) return "à l’instant";
  if (heures < 24) return `il y a ${heures} h`;
  const jours = Math.floor(heures / 24);
  if (jours === 1) return "hier";
  return `il y a ${jours} jours`;
}

/**
 * La date affichée est celle du DERNIER fait, pas celle de l'envoi.
 *
 * « envoyée il y a 2 jours » sur un message répondu hier dirait le contraire
 * de ce qui s'est passé : le programme croirait attendre encore. Un fil
 * répondu porte donc la date de la réponse, et le mot qui va avec.
 */
export function quand(fil: FilBrut, maintenant: Date): string {
  if (fil.type === "suggestion") return ecart(fil.creeLe, maintenant);
  if (fil.reponduLe) return `répondu ${ecart(fil.reponduLe, maintenant)}`;
  return `envoyée ${ecart(fil.creeLe, maintenant)}`;
}

/**
 * Le nombre de questions qui attendent VRAIMENT une réponse.
 *
 * Sert au compteur « Questions sans réponse » de la vue d'ensemble. Les
 * suggestions en sont exclues par construction — voir `badge()`.
 */
export function sansReponse(fils: readonly FilBrut[]): number {
  return fils.filter((f) => badge(f).ton === "amber").length;
}

/** « CoolBricks » → « CB ». Deux lettres, jamais plus. */
export function initiales(nom: string): string {
  const mots = nom.trim().split(/\s+/).filter(Boolean);
  return (
    mots
      .slice(0, 2)
      .map((m) => m[0]?.toUpperCase() ?? "")
      .join("") || "—"
  );
}
