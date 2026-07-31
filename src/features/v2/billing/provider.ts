import type { StatutAbonnement } from "./types";

/**
 * L'abstraction de paiement — chapitre 18 de l'architecture pricing.
 *
 * « NE PAS DÉPENDRE EXCLUSIVEMENT D'UN SEUL PRESTATAIRE DE PAIEMENT. » La
 * consigne n'est pas de la prudence d'architecte : en Afrique de l'Ouest, le
 * moyen de paiement change avec le pays et avec le client. Un fonds à Paris
 * vire par SWIFT, une PME à Abidjan paie en mobile money, un programme
 * signe un contrat annuel et règle sur facture. Coder l'un des trois dans les
 * écrans reviendrait à refaire les écrans pour le deuxième.
 *
 * Chaque implémentation vit dans `providers/`. Aucune ne connaît les écrans, et
 * aucun écran ne connaît de prestataire.
 */

export type ModePaiement =
  | "manual_transfer"
  | "manual_invoice"
  | "admin_activation"
  | "online";

export interface Client {
  /** L'identifiant chez le prestataire. Vide pour les modes manuels. */
  externalId: string | null;
  workspaceId: string;
}

export interface SessionPaiement {
  /**
   * Où envoyer le client pour payer. `null` quand il n'y a rien à ouvrir —
   * un virement se fait dans sa banque, pas dans notre application.
   */
  url: string | null;
  /** La référence à rappeler : numéro de virement, identifiant de session. */
  reference: string;
  /** Ce que le client doit faire ensuite, en une phrase. */
  instruction: string;
}

export interface ResultatAbonnement {
  statut: StatutAbonnement;
  externalSubscriptionId: string | null;
  /** `true` quand le plan est ouvert tout de suite. */
  immediat: boolean;
}

export interface FactureExterne {
  reference: string;
  montant: number;
  devise: string;
  statut: string;
  url: string | null;
}

/**
 * Ce qu'un webhook a voulu dire, une fois traduit.
 *
 * Chaque prestataire a son vocabulaire ; l'application n'en connaît qu'un.
 * `externalEventId` sert à l'idempotence : la contrainte d'unicité sur
 * `billing_events` refuse la seconde tentative, et un prestataire REJOUE ses
 * notifications — une facture payée deux fois est un litige.
 */
export interface EvenementRecu {
  type:
    | "payment.succeeded"
    | "payment.failed"
    | "subscription.renewed"
    | "subscription.cancelled"
    | "unknown";
  externalEventId: string;
  workspaceId: string | null;
  planCode: string | null;
  payload: Record<string, unknown>;
}

/**
 * Le contrat que tout prestataire doit remplir — §18.
 *
 * Les méthodes sont celles du document, aux noms près : `getInvoice` devient
 * `facture`, etc. Le français ici n'est pas de la coquetterie — tout le
 * domaine du produit est écrit dans cette langue, et mélanger les deux dans un
 * même fichier est ce qui fait qu'on ne trouve plus rien.
 */
export interface BillingProvider {
  /** Le nom qui sera écrit dans `billing_events.provider`. */
  readonly code: string;

  /** Le prestataire peut-il porter des abonnements RÉCURRENTS ? */
  readonly recurrent: boolean;

  creerClient(input: {
    workspaceId: string;
    email: string;
    nom: string;
  }): Promise<Client>;

  ouvrirPaiement(input: {
    workspaceId: string;
    planCode: string;
    intervalle: "month" | "year";
    montant: number;
    devise: string;
    email: string;
    /**
     * Le mobile money identifie un payeur par son NUMÉRO, pas par son e-mail.
     * Optionnel parce qu'un virement et une carte s'en passent : les
     * prestataires qui n'en ont pas besoin l'ignorent, et le contrat du §18
     * ne se plie pas à celui qui l'exige.
     */
    telephone?: string | null;
    /**
     * Ce que le payeur a choisi, dans le vocabulaire du prestataire.
     * `null` ou absent laisse celui-ci proposer sa propre page de choix.
     */
    moyen?: string | null;
  }): Promise<SessionPaiement>;

  creerAbonnement(input: {
    workspaceId: string;
    planCode: string;
    intervalle: "month" | "year";
    montant?: number;
    devise?: string;
    telephone?: string | null;
    /** §17 : l'essai de 14 jours du plan Raise. */
    joursDEssai?: number;
  }): Promise<ResultatAbonnement>;

  modifierAbonnement(input: {
    externalSubscriptionId: string;
    planCode: string;
  }): Promise<ResultatAbonnement>;

  annulerAbonnement(input: {
    externalSubscriptionId: string;
    immediat: boolean;
  }): Promise<void>;

  facture(reference: string): Promise<FactureExterne | null>;

  /**
   * Traduire une notification entrante.
   *
   * Rend `null` quand la signature ne vérifie pas — et NON une exception :
   * l'appelant doit répondre 200 à un envoi non signé plutôt que d'inviter le
   * prestataire à le rejouer indéfiniment.
   */
  lireWebhook(input: {
    corps: string;
    entetes: Record<string, string>;
  }): Promise<EvenementRecu | null>;
}
