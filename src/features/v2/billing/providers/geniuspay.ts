import { createHmac, timingSafeEqual } from "node:crypto";

import type {
  BillingProvider,
  Client,
  EvenementRecu,
  FactureExterne,
  ResultatAbonnement,
  SessionPaiement,
} from "../provider";

/**
 * Genius Pay — mobile money et cartes, pour l'Afrique de l'Ouest.
 *
 * Documentation : https://pay.genius.ci/doc
 *
 * CE QUE CE PRESTATAIRE APPORTE ET QUE LE MODE MANUEL N'A PAS : le RÉCURRENT.
 * Wave, Orange Money, MTN, Moov et les cartes, avec des cycles de facturation
 * et un essai gratuit — ce qui permet enfin de tenir le §17 (essai de 14 jours
 * du plan Raise) sans qu'un humain relance chaque échéance.
 *
 * DEUX DOMAINES, NE PAS LES CONFONDRE. `geniuspay.ci` est le site et le serveur
 * MCP ; l'API marchande vit sur `pay.genius.ci`. Une erreur d'hôte donne un 403
 * qui ressemble à une clé refusée et coûte une heure.
 *
 * LES CLÉS NE SONT JAMAIS ÉCRITES ICI. Elles viennent de l'environnement, et
 * `X-API-Secret` ne doit jamais franchir la frontière du serveur — c'est écrit
 * en toutes lettres dans leur documentation. Ce fichier n'est donc importable
 * que depuis du code serveur.
 */

const BASE = process.env.GENIUSPAY_API_BASE ?? "https://pay.genius.ci/api/v1/merchant";

/** Leur minimum documenté. En dessous, l'API refuse. */
const MONTANT_MINIMUM_XOF = 200;

/** Fenêtre anti-rejeu du webhook, en secondes — la valeur de leur documentation. */
const FENETRE_SIGNATURE = 300;

/**
 * L'adresse publique où le payeur doit revenir.
 *
 * Rend `null` quand on l'ignore — en local, par exemple, où une URL de retour
 * pointant vers `localhost` renverrait le payeur vers une machine que le
 * prestataire ne peut pas atteindre. Mieux vaut alors ne rien promettre.
 */
function retour(): string | null {
  const brut =
    process.env.SANZA_PUBLIC_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);

  if (!brut) return null;

  const propre = brut.replace(/\/+$/, "");
  return propre.startsWith("http") ? propre : `https://${propre}`;
}

interface ReponsePaiement {
  id?: number;
  reference?: string;
  status?: string;
  checkout_url?: string;
  amount?: number;
  currency?: string;
  fees?: number;
  net_amount?: number;
}

interface ReponseAbonnement {
  uuid?: string;
  status?: string;
  trial_ends_at?: string | null;
}

function cles(): { publique: string; secrete: string } {
  const publique = process.env.GENIUSPAY_API_KEY;
  const secrete = process.env.GENIUSPAY_API_SECRET;

  if (!publique || !secrete) {
    // On refuse de partir plutôt que d'envoyer une requête anonyme : l'API
    // répondrait 401, et le message remonterait comme un incident réseau.
    throw new Error(
      "Genius Pay : GENIUSPAY_API_KEY et GENIUSPAY_API_SECRET sont absentes de " +
        "l’environnement. Le prestataire ne peut pas être appelé.",
    );
  }

  return { publique, secrete };
}

/**
 * Le mode réellement en vigueur, déduit du préfixe de la clé.
 *
 * `pk_sandbox_…` ou `pk_live_…`. On ne le lit pas d'une variable séparée : deux
 * sources pour un même fait finissent toujours par se contredire, et ce
 * jour-là on encaisse pour de vrai en croyant tester.
 */
function environnement(): "sandbox" | "live" {
  return process.env.GENIUSPAY_API_KEY?.includes("_live_") ? "live" : "sandbox";
}

/**
 * Sortir la charge utile de son enveloppe.
 *
 * LEUR DOCUMENTATION MENT SUR CE POINT, et il coûte cher. Elle montre une
 * réponse plate — `{"id":456,"reference":"MTX-…","checkout_url":…}` — alors que
 * l'API réelle rend `{"success":true,"message":"…","data":{…}}`. Lire à la
 * racine ne trouve rien, et le paiement échoue sur une réponse pourtant
 * parfaitement valide, avec un message qui n'aide personne.
 *
 * On accepte donc les deux formes : le jour où ils aplatissent, ou pour un
 * point d'entrée qui ne suivrait pas la convention, rien ne casse.
 */
export function charge<T>(reponse: unknown): T {
  if (reponse && typeof reponse === "object" && "data" in reponse) {
    const enveloppe = reponse as { data?: unknown };
    if (enveloppe.data && typeof enveloppe.data === "object") {
      return enveloppe.data as T;
    }
  }
  return reponse as T;
}

/**
 * Au-delà, on renonce et on le dit.
 *
 * MESURÉ, PAS SUPPOSÉ : le 1er août, leur API a mis entre 12 et 21 secondes à
 * répondre — y compris sur une simple lecture de compte, ce qui désigne leur
 * infrastructure et non le travail demandé. Le même appel prenait 0,7 seconde
 * le matin.
 *
 * Sans limite, `fetch` attend indéfiniment : l'utilisateur reste devant un
 * bouton figé, puis la plateforme coupe la requête avec une erreur qui ne dit
 * rien. Trente secondes laissent passer une journée lente sans laisser
 * quelqu'un devant un écran mort.
 */
const DELAI_MAX_MS = 30_000;

export class LenteurPrestataire extends Error {
  constructor(chemin: string) {
    super(`Genius Pay n’a pas répondu en ${DELAI_MAX_MS / 1000} s sur ${chemin}.`);
    this.name = "LenteurPrestataire";
  }
}

async function appeler<T>(
  chemin: string,
  init?: { methode?: string; corps?: unknown },
): Promise<T> {
  const { publique, secrete } = cles();

  let reponse: Response;
  try {
    reponse = await fetch(`${BASE}${chemin}`, {
      method: init?.methode ?? "GET",
      headers: {
        "X-API-Key": publique,
        "X-API-Secret": secrete,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: init?.corps ? JSON.stringify(init.corps) : undefined,
      // Une facturation ne doit jamais être servie par un cache.
      cache: "no-store",
      signal: AbortSignal.timeout(DELAI_MAX_MS),
    });
  } catch (erreur) {
    // Une coupure au-delà du délai n'est pas une panne de notre côté : on la
    // distingue pour pouvoir en parler autrement à l'utilisateur.
    if (erreur instanceof Error && erreur.name === "TimeoutError") {
      throw new LenteurPrestataire(chemin);
    }
    throw erreur;
  }

  if (!reponse.ok) {
    const detail = await reponse.text().catch(() => "");
    throw new Error(
      `Genius Pay a refusé ${init?.methode ?? "GET"} ${chemin} ` +
        `(${reponse.status}) : ${detail.slice(0, 300)}`,
    );
  }

  return charge<T>(await reponse.json());
}

/**
 * Vérifier la signature d'une notification.
 *
 * `HMAC-SHA256(timestamp + "." + corps, secret)`, sur le corps BRUT. Le
 * re-sérialiser après analyse changerait un espace ou l'ordre des clés, et la
 * signature ne vérifierait plus — c'est l'erreur classique, et elle se traduit
 * par « les webhooks ne marchent pas » sans autre indice.
 *
 * Exportée pour être testée : c'est le seul rempart entre un inconnu et
 * l'activation gratuite d'un plan payant.
 */
export function signatureValide(input: {
  corps: string;
  signature: string | undefined;
  timestamp: string | undefined;
  secret: string;
  maintenant?: number;
}): boolean {
  if (!input.signature || !input.timestamp) return false;

  const envoye = Number(input.timestamp);
  if (!Number.isFinite(envoye)) return false;

  const maintenant = input.maintenant ?? Math.floor(Date.now() / 1000);

  // Rejeu : une notification capturée hier ne doit pas ouvrir un plan aujourd'hui.
  // La borne joue dans les DEUX sens — une horloge en avance est aussi suspecte.
  if (Math.abs(maintenant - envoye) > FENETRE_SIGNATURE) return false;

  const attendue = createHmac("sha256", input.secret)
    .update(`${input.timestamp}.${input.corps}`)
    .digest("hex");

  const a = Buffer.from(attendue, "utf8");
  const b = Buffer.from(input.signature, "utf8");

  // Longueurs différentes : `timingSafeEqual` lèverait. On répond faux, mais
  // seulement après avoir calculé le HMAC, pour ne pas révéler par le temps de
  // réponse que la signature était mal formée.
  if (a.length !== b.length) return false;

  return timingSafeEqual(a, b);
}

/**
 * Traduire le vocabulaire de Genius Pay dans le nôtre.
 *
 * Exportée pour être testée. Ce qui n'est pas reconnu devient `unknown` et non
 * une erreur : un prestataire ajoute des événements sans prévenir, et une
 * notification inconnue ne doit pas faire échouer la réception — elle doit être
 * reçue, tracée, et ignorée.
 */
export function traduireEvenement(nom: string): EvenementRecu["type"] {
  switch (nom) {
    case "payment.success":
      return "payment.succeeded";
    case "subscription.payment_succeeded":
      return "subscription.renewed";
    case "subscription.cancelled":
      return "subscription.cancelled";
    case "payment.failed":
    case "payment.expired":
    case "payment.cancelled":
    case "payment.refunded":
    case "subscription.payment_failed":
    case "subscription.past_due":
      return "payment.failed";
    // `payment.initiated` reste volontairement `unknown` : il annonce une
    // intention, pas un encaissement. Le reconnaître donnerait envie d'en
    // faire quelque chose, et il n'y a rien à en faire.
    default:
      return "unknown";
  }
}

export class GeniusPayProvider implements BillingProvider {
  readonly code = "geniuspay";

  /**
   * Ils exposent bien une API d'abonnements — cycles, essai, annulation.
   *
   * RÉSERVE HONNÊTE : leur documentation ne dit pas si le renouvellement est un
   * prélèvement réellement automatique ou une relance à valider par le client.
   * En mobile money, la seconde réponse est la plus fréquente : Wave et Orange
   * demandent souvent une confirmation à chaque débit. Tant que ce point n'est
   * pas confirmé par écrit, ne pas promettre « sans rien faire » sur un écran.
   */
  readonly recurrent = true;

  async creerClient(input: {
    workspaceId: string;
    email: string;
    nom: string;
  }): Promise<Client> {
    // Genius Pay n'a pas de répertoire clients : le payeur est décrit à chaque
    // paiement. Rien à créer ailleurs, donc rien à retenir.
    return { externalId: null, workspaceId: input.workspaceId };
  }

  async ouvrirPaiement(input: {
    workspaceId: string;
    planCode: string;
    intervalle: "month" | "year";
    montant: number;
    devise: string;
    email: string;
    telephone?: string | null;
    moyen?: string | null;
  }): Promise<SessionPaiement> {
    if (input.montant < MONTANT_MINIMUM_XOF) {
      throw new Error(
        `Genius Pay refuse les montants sous ${MONTANT_MINIMUM_XOF} XOF ` +
          `(demandé : ${input.montant}).`,
      );
    }

    const paiement = await appeler<ReponsePaiement>("/payments", {
      methode: "POST",
      corps: {
        amount: input.montant,
        currency: input.devise,
        description: `Sanza — plan ${input.planCode} (${
          input.intervalle === "year" ? "annuel" : "mensuel"
        })`,
        customer: {
          email: input.email,
          ...(input.telephone ? { phone: input.telephone } : {}),
        },
        // `payment_method` n'est envoyé QUE si le payeur a tranché. Omis, il
        // déclenche la page de choix de Genius Pay — ce qu'on veut pour le
        // mobile money, où imposer Wave à quelqu'un qui a Orange Money est le
        // meilleur moyen de perdre un paiement déjà décidé.
        ...(input.moyen ? { payment_method: input.moyen } : {}),
        // OÙ REVENIR APRÈS AVOIR PAYÉ. Sans ces deux URL, Genius Pay laisse le
        // payeur sur SA page : on a réglé, et on reste devant un écran qui
        // n'est pas le sien, sans savoir si ça a marché. Leur réponse les rend
        // à `null` quand on ne les fournit pas — le premier paiement réel s'est
        // terminé ainsi, et c'est ce qui donne l'impression que rien ne s'est
        // passé alors que tout avait fonctionné.
        ...(retour()
          ? {
              success_url: `${retour()}/v2/abonnement?paiement=ok`,
              error_url: `${retour()}/v2/abonnement?paiement=echec`,
            }
          : {}),
        metadata: {
          workspace_id: input.workspaceId,
          plan_code: input.planCode,
          billing_interval: input.intervalle,
        },
      },
    });

    if (!paiement.reference) {
      // Les CLÉS de la réponse, jamais les valeurs : elles disent en un coup
      // d'œil si le format a changé, sans risquer de tracer une donnée client.
      throw new Error(
        "Genius Pay n’a pas rendu de référence de paiement. " +
          `Champs reçus : ${Object.keys(paiement ?? {}).join(", ") || "aucun"}.`,
      );
    }

    return {
      url: paiement.checkout_url ?? null,
      reference: paiement.reference,
      instruction: paiement.checkout_url
        ? "Réglez sur la page sécurisée de Genius Pay. Votre plan s’ouvre dès la confirmation."
        : `Conservez la référence ${paiement.reference}.`,
    };
  }

  async creerAbonnement(input: {
    workspaceId: string;
    planCode: string;
    intervalle: "month" | "year";
    montant?: number;
    devise?: string;
    telephone?: string | null;
    joursDEssai?: number;
  }): Promise<ResultatAbonnement> {
    if (!input.telephone) {
      // Leur API impose `customer.phone`. Le dire franchement vaut mieux qu'un
      // 422 traduit en « une erreur est survenue » : c'est une donnée que nous
      // ne collectons pas encore, pas une panne.
      throw new Error(
        "Genius Pay exige un numéro de téléphone pour ouvrir un abonnement. " +
          "Sanza ne le collecte pas encore.",
      );
    }

    const abonnement = await appeler<ReponseAbonnement>("/subscriptions", {
      methode: "POST",
      corps: {
        customer: { phone: input.telephone },
        plan_name: input.planCode,
        amount: input.montant,
        currency: input.devise ?? "XOF",
        billing_cycle: input.intervalle === "year" ? "yearly" : "monthly",
        ...(input.joursDEssai ? { trial_days: input.joursDEssai } : {}),
        metadata: {
          workspace_id: input.workspaceId,
          plan_code: input.planCode,
        },
      },
    });

    // Un abonnement en essai est SERVI, même si rien n'a encore été débité :
    // c'est tout l'objet du §17.
    const enEssai = Boolean(input.joursDEssai) || abonnement.status === "trialing";

    return {
      statut: enEssai ? "trialing" : abonnement.status === "active" ? "active" : "pending",
      externalSubscriptionId: abonnement.uuid ?? null,
      immediat: enEssai || abonnement.status === "active",
    };
  }

  async modifierAbonnement(input: {
    externalSubscriptionId: string;
    planCode: string;
  }): Promise<ResultatAbonnement> {
    const abonnement = await appeler<ReponseAbonnement>(
      `/subscriptions/${encodeURIComponent(input.externalSubscriptionId)}`,
      { methode: "POST", corps: { plan_name: input.planCode } },
    );

    return {
      statut: abonnement.status === "active" ? "active" : "pending",
      externalSubscriptionId: abonnement.uuid ?? input.externalSubscriptionId,
      immediat: abonnement.status === "active",
    };
  }

  async annulerAbonnement(input: {
    externalSubscriptionId: string;
    immediat: boolean;
  }): Promise<void> {
    await appeler(
      `/subscriptions/${encodeURIComponent(input.externalSubscriptionId)}/cancel`,
      {
        methode: "POST",
        // §15 : ce qui est payé reste dû. Couper au milieu d'une période déjà
        // réglée reviendrait à garder l'argent sans rendre le service.
        corps: { immediate: input.immediat, reason: "Résiliation demandée depuis Sanza" },
      },
    );
  }

  async facture(reference: string): Promise<FactureExterne | null> {
    try {
      const paiement = await appeler<ReponsePaiement>(
        `/payments/${encodeURIComponent(reference)}`,
      );

      if (!paiement.reference) return null;

      return {
        reference: paiement.reference,
        montant: paiement.amount ?? 0,
        devise: paiement.currency ?? "XOF",
        statut: paiement.status ?? "unknown",
        url: paiement.checkout_url ?? null,
      };
    } catch {
      // Une référence inconnue n'est pas un incident : elle peut venir d'un
      // paiement manuel, ou d'un autre prestataire.
      return null;
    }
  }

  async lireWebhook(input: {
    corps: string;
    entetes: Record<string, string>;
  }): Promise<EvenementRecu | null> {
    const secret = process.env.GENIUSPAY_WEBHOOK_SECRET;
    if (!secret) return null;

    const entetes = Object.fromEntries(
      Object.entries(input.entetes).map(([cle, valeur]) => [cle.toLowerCase(), valeur]),
    );

    const valide = signatureValide({
      corps: input.corps,
      signature: entetes["x-webhook-signature"],
      timestamp: entetes["x-webhook-timestamp"],
      secret,
    });

    if (!valide) return null;

    // UN ÉVÉNEMENT DE BAC À SABLE NE DOIT JAMAIS OUVRIR UN PLAN RÉEL, et
    // l'inverse est tout aussi vrai. Sans ce contrôle, quiconque connaît
    // l'adresse du webhook et dispose d'un compte d'essai chez eux pourrait
    // s'offrir le plan le plus cher.
    const environnementRecu = entetes["x-webhook-environment"];
    if (environnementRecu && environnementRecu !== environnement()) return null;

    let charge: Record<string, unknown>;
    try {
      charge = JSON.parse(input.corps) as Record<string, unknown>;
    } catch {
      return null;
    }

    const nom = entetes["x-webhook-event"] ?? String(charge.event ?? "");
    const donnees = (charge.data ?? charge) as Record<string, unknown>;
    const metadata = (donnees.metadata ?? {}) as Record<string, unknown>;
    const reference = String(donnees.reference ?? donnees.uuid ?? "");

    return {
      type: traduireEvenement(nom),
      // Ils n'envoient pas d'identifiant d'événement. La paire nom + référence
      // est ce qui s'en rapproche le plus : elle rend un rejeu inoffensif, la
      // contrainte d'unicité de `billing_events` refusant le doublon. À revoir
      // s'ils publient un jour un vrai identifiant.
      externalEventId: `${nom}:${reference}`,
      workspaceId: (metadata.workspace_id as string) ?? null,
      planCode: (metadata.plan_code as string) ?? null,
      payload: charge,
    };
  }
}
