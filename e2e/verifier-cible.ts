/**
 * Le garde-fou : ces tests écrivent, ils ne doivent jamais viser la production.
 *
 * La suite crée des organisations, des opérations et des invitations pour
 * franchir de vraies limites de plan. Lancée par erreur contre
 * `bileqzpguyynkktndazs`, elle polluerait les données de clients réels — et
 * une invitation de test partirait par e-mail à une vraie adresse.
 *
 * On refuse donc de démarrer plutôt que de faire confiance à la mémoire de
 * celui qui lance la commande.
 */

/** La production. Identifiée par son référence de projet, pas par un drapeau. */
const PRODUCTION = "bileqzpguyynkktndazs";

/** Le staging, seule cible autorisée. */
const STAGING = "jourzsgjnutktsrgxkoo";

export function verifierCible(url: string | undefined): string {
  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL est absente. Renseignez .env.local avant de lancer les tests.",
    );
  }

  if (url.includes(PRODUCTION)) {
    throw new Error(
      "REFUS : ces tests visent la PRODUCTION. Ils écrivent en base et " +
        "enverraient de vrais e-mails. Pointez NEXT_PUBLIC_SUPABASE_URL sur le " +
        "projet de recette avant de recommencer.",
    );
  }

  if (!url.includes(STAGING)) {
    throw new Error(
      `REFUS : base inconnue (${url}). Seul le projet de recette ${STAGING} ` +
        "est autorisé — un projet non reconnu peut être une production déguisée.",
    );
  }

  return url;
}

/**
 * Les identifiants du compte de test.
 *
 * Ils viennent de l'environnement et de nulle part ailleurs : ni dans le code,
 * ni dans un fichier versionné, ni dans une conversation. `.env.test.local` est
 * ignoré par git et n'est écrit que par le fondateur.
 */
export function identifiants(): { email: string; motDePasse: string } {
  const email = process.env.E2E_EMAIL;
  const motDePasse = process.env.E2E_PASSWORD;

  if (!email || !motDePasse) {
    throw new Error(
      "Identifiants de test absents. Créez `.env.test.local` à la racine avec :\n" +
        "  E2E_EMAIL=…\n" +
        "  E2E_PASSWORD=…\n" +
        "Ce fichier est ignoré par git. Utilisez un compte de RECETTE dédié, " +
        "jamais un compte réel.",
    );
  }

  return { email, motDePasse };
}
