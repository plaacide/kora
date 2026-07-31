import type { BillingProvider } from "../provider";
import { ManualProvider } from "./manual";

/**
 * Le choix du prestataire — un seul endroit.
 *
 * Aucun écran, aucune action serveur ne nomme jamais un prestataire : ils
 * demandent celui qui est actif. Le jour où Genius Pay arrive, il s'ajoute
 * ici et rien d'autre ne bouge — c'est tout l'objet du §18.
 *
 * `SANZA_BILLING_PROVIDER` choisit à l'exécution. Sans variable, c'est le mode
 * manuel : il fonctionne toujours, ne dépend de personne, et n'encaisse rien
 * par erreur.
 */
const PRESTATAIRES: Record<string, () => BillingProvider> = {
  manual: () => new ManualProvider(),
};

export function billingProvider(): BillingProvider {
  const choisi = process.env.SANZA_BILLING_PROVIDER ?? "manual";
  const fabrique = PRESTATAIRES[choisi];

  if (!fabrique) {
    // On ne retombe PAS silencieusement sur le mode manuel : une faute de
    // frappe dans la configuration passerait inaperçue jusqu'au jour où un
    // client ne pourrait pas payer.
    throw new Error(
      `Prestataire de paiement inconnu : « ${choisi} ». ` +
        `Disponibles : ${Object.keys(PRESTATAIRES).join(", ")}.`,
    );
  }

  return fabrique();
}

export { ManualProvider };
