import type {
  BillingProvider,
  Client,
  EvenementRecu,
  FactureExterne,
  ResultatAbonnement,
  SessionPaiement,
} from "../provider";

/**
 * Le paiement hors ligne — virement, facture, activation administrative.
 *
 * Ce n'est pas un bouche-trou en attendant Genius Pay. Le §18 impose au produit
 * de savoir encaisser autrement qu'en ligne, et l'Afrique de l'Ouest le
 * confirme : un fonds vire par SWIFT, un programme signe un contrat annuel et
 * règle sur facture, une institution passe par un bon de commande. Aucun de ces
 * trois ne cliquera jamais sur « Payer ».
 *
 * CE PRESTATAIRE N'ENCAISSE RIEN, et c'est le point : il rend une référence et
 * une instruction, puis attend qu'un humain constate le paiement. L'activation
 * passe alors par `set_workspace_plan` en mode `manual_transfer` — la trace
 * reste dans `billing_events`, qui expliquera dans six mois pourquoi une
 * organisation a le plan Close sans transaction chez aucun prestataire.
 */
export class ManualProvider implements BillingProvider {
  readonly code = "manual";

  /**
   * Un virement ne se renouvelle pas tout seul.
   *
   * Le dire ici évite qu'un écran promette un prélèvement automatique : avec ce
   * prestataire, l'échéance produit une relance, pas un débit.
   */
  readonly recurrent = false;

  async creerClient(input: {
    workspaceId: string;
    email: string;
    nom: string;
  }): Promise<Client> {
    // Aucun compte à ouvrir ailleurs : le client, c'est l'organisation.
    return { externalId: null, workspaceId: input.workspaceId };
  }

  async ouvrirPaiement(input: {
    workspaceId: string;
    planCode: string;
    intervalle: "month" | "year";
    montant: number;
    devise: string;
    email: string;
  }): Promise<SessionPaiement> {
    // Une référence courte et lisible à l'oral : elle sera dictée au téléphone
    // et recopiée sur un ordre de virement. Les huit premiers caractères de
    // l'identifiant d'espace suffisent à la retrouver.
    const reference = `SANZA-${input.workspaceId.slice(0, 8).toUpperCase()}-${input.planCode
      .split("_")
      .at(-1)
      ?.toUpperCase()}`;

    return {
      url: null,
      reference,
      instruction:
        `Indiquez la référence ${reference} sur votre virement. ` +
        `Votre plan s’ouvre dès que nous constatons le paiement.`,
    };
  }

  async creerAbonnement(): Promise<ResultatAbonnement> {
    // `pending` et non `active` : promettre l'accès avant d'avoir vu l'argent
    // est exactement ce qu'un mode hors ligne ne doit pas faire.
    return {
      statut: "pending",
      externalSubscriptionId: null,
      immediat: false,
    };
  }

  async modifierAbonnement(): Promise<ResultatAbonnement> {
    return {
      statut: "pending",
      externalSubscriptionId: null,
      immediat: false,
    };
  }

  async annulerAbonnement(): Promise<void> {
    // Rien à révoquer ailleurs : la résiliation vit dans notre base.
  }

  async facture(): Promise<FactureExterne | null> {
    // Les factures manuelles sont émises hors du produit, souvent par le
    // comptable. Rendre `null` plutôt qu'un objet vide dit qu'on ne sait pas,
    // au lieu de laisser croire qu'il n'y a rien.
    return null;
  }

  async lireWebhook(): Promise<EvenementRecu | null> {
    // Personne ne nous notifie : c'est un humain qui constate.
    return null;
  }
}
