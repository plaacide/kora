/**
 * Règles de déclenchement de l'enquête produit (§2 du handoff).
 *
 * Isolées dans un module neutre, sans React ni DOM : ce sont des règles
 * PRODUIT, elles doivent se lire et se vérifier sans dérouler un composant.
 * Les valeurs sont des constantes nommées, jamais des littéraux au fil du code
 * — la §2 l'exige, et un « 30 » perdu dans une condition ne se retrouve pas.
 */

/** Minutes d'usage ACTIF cumulé avant la première proposition. */
export const SEUIL_MINUTES = 30;

/** Délai avant de reproposer après un « Plus tard ». */
export const JOURS_AVANT_RELANCE = 7;

/** Nouvelle tentative après un état de blocage. */
export const REESSAI_MS = 60_000;

/** Fréquence du ping d'usage. Doit rester sous le plafond de 2 min du serveur. */
export const PING_MS = 60_000;

/**
 * Écrans où l'enquête peut apparaître : la salle et le tableau de bord.
 *
 * Une LISTE BLANCHE, pas une liste noire. Une liste noire laisserait passer
 * chaque écran ajouté plus tard sans qu'on y pense — l'enquête finirait par
 * s'inviter sur une page de paiement ou d'erreur. Ce qui n'est pas nommé ici
 * ne reçoit rien.
 */
const ROUTES_AUTORISEES = [
  "/dashboard",
  "/deal",
  "/data-room",
  "/permissions",
  "/qa",
  "/audit",
  "/checklist",
  "/espaces",
  "/contacts",
] as const;

/**
 * `/visionneuse` en est ABSENTE volontairement : la §2 la cite parmi les états
 * de blocage. Lire un document est une tâche continue, l'interrompre pour une
 * enquête serait exactement ce que la règle interdit.
 */
export function routeAutorisee(pathname: string): boolean {
  return ROUTES_AUTORISEES.some(
    (r) => pathname === r || pathname.startsWith(`${r}/`),
  );
}

/**
 * Conditions d'éligibilité — toutes requises. Ne regarde QUE l'état persistant
 * du profil ; les états de blocage, eux, sont volatils et vivent côté écran.
 */
export function eligible(input: {
  minutes: number;
  dejaRepondu: boolean;
  refuseDefinitivement: boolean;
  dernierePropositionMs: number | null;
  maintenantMs: number;
}): boolean {
  if (input.minutes < SEUIL_MINUTES) return false;
  if (input.dejaRepondu) return false;
  if (input.refuseDefinitivement) return false;
  if (input.dernierePropositionMs !== null) {
    const joursEcoules =
      (input.maintenantMs - input.dernierePropositionMs) / 86_400_000;
    if (joursEcoules < JOURS_AVANT_RELANCE) return false;
  }
  return true;
}
