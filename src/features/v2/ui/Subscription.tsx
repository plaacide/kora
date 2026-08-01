import Link from "next/link";

import {
  joursRestants,
  libelleStatut,
  prixAffiche,
  quantite,
} from "@/features/v2/billing/format";
import type {
  Abonnement,
  Consommation,
  Droit,
  Plan,
} from "@/features/v2/billing/types";
import { dateJournal } from "@/features/v2/domain/journal";

import { ChangerDePlan } from "./ChangerDePlan";
import { Icon } from "./Icon";
import { MessageTemporaire } from "./MessageTemporaire";
import { Resilier } from "./Resilier";

/** Ce qui compte dans la limite, et ce qui n'y compte pas — maquette 68. */
export interface OperationComptee {
  id: string;
  nom: string;
  detail: string;
  comptee: boolean;
}

/**
 * L'écran Abonnement — chapitre 12.1 de l'architecture pricing, maquette 68.
 *
 * Il affichait quatre opérations et quatre plans écrits en dur. Il montre
 * maintenant le plan réel de l'organisation, ce qu'il ouvre, ce qui en est
 * consommé, et lesquelles de ses opérations comptent.
 *
 * LE DÉPASSEMENT SE DIT, IL NE SE CACHE PAS. Une organisation au-dessus de sa
 * limite doit le voir ici plutôt que de le découvrir au moment où un geste lui
 * est refusé. Rien n'est bloqué depuis cet écran : couper rétroactivement un
 * usage déjà en place punirait quelqu'un pour une décision qu'il n'a pas prise.
 */
export function SubscriptionScreen({
  abonnement,
  catalogue,
  consommation,
  droits,
  onPayer,
  onReprendre,
  onResilier,
  onRevenirAuGratuit,
  retourDePaiement,
  operations,
  plan,
}: {
  /** `null` quand aucun abonnement n'existe — le plan gratuit s'applique. */
  abonnement: Abonnement | null;
  catalogue: readonly Plan[];
  consommation: readonly Consommation[];
  droits: readonly Droit[];
  /** L'action serveur qui ouvre le paiement. */
  onPayer: (choix: {
    planCode: string;
    intervalle: "month" | "year";
  }) => Promise<{ ok: boolean; error?: string; url?: string; instruction?: string }>;
  /** L'action serveur qui arrête l'abonnement, en fin de période payée. */
  onResilier: (motif: string) => Promise<{ ok: boolean; error?: string }>;
  /** Revenir sur une résiliation annoncée, tant que le terme n'est pas passé. */
  onReprendre: () => Promise<{ ok: boolean; error?: string }>;
  /** Redescendre vers le plan gratuit : une annonce, pas un paiement. */
  onRevenirAuGratuit: (planCode: string) => Promise<{ ok: boolean; error?: string }>;
  operations: readonly OperationComptee[];
  plan: Plan;
  /** Ce qu'a donné la vérification au retour du prestataire, s'il y en a eu. */
  retourDePaiement?: string | null;
}) {
  const statut = abonnement
    ? libelleStatut(abonnement.statut)
    : { label: "Plan gratuit", tone: "neutral" };
  const restant = joursRestants(abonnement?.finEssai ?? null, new Date());
  const prix = prixAffiche(plan, "month");
  const depassements = consommation.filter((c) => c.depasse);

  // Le document interdit d'afficher les neuf plans ensemble : on ne montre que
  // le segment de l'organisation.
  const memeSegment = catalogue.filter(
    (p) => p.segment === plan.segment && p.code !== plan.code,
  );

  // Ce qu'on dit à quelqu'un qui revient de la page de paiement. Chaque état
  // mérite sa phrase : « toujours en cours » n'est PAS un échec — en mobile
  // money l'opérateur met parfois plusieurs minutes, et le payeur revient
  // avant lui. Lui annoncer un échec le ferait payer deux fois.
  const RETOURS: Record<string, { texte: string; bon: boolean }> = {
    plan_active: { texte: "Paiement confirmé. Votre plan est ouvert.", bon: true },
    deja_traite: { texte: "Paiement confirmé. Votre plan est ouvert.", bon: true },
    toujours_en_cours: {
      texte:
        "Votre paiement est en cours de validation par votre opérateur. " +
        "Cela prend parfois quelques minutes — rafraîchissez cette page, " +
        "il n’y a rien d’autre à faire et surtout rien à repayer.",
      bon: false,
    },
    echoue: {
      texte: "Le paiement n’a pas abouti. Rien ne vous a été débité.",
      bon: false,
    },
    indisponible: {
      texte:
        "Nous n’avons pas pu joindre notre prestataire à l’instant. Si vous " +
        "avez payé, votre plan s’ouvrira dès que nous aurons sa confirmation.",
      bon: false,
    },
    aucune_attente: { texte: "", bon: false },
  };

  const retour = retourDePaiement ? RETOURS[retourDePaiement] : null;

  return (
    <div className="v2-narrow-page">
      {retour?.texte && (
        <MessageTemporaire bon={retour.bon} texte={retour.texte} />
      )}

      {/* Le plan actuel — écran 76. Le nom porte le badge d'état à côté de lui
          et non à l'autre bout de la carte : « Raise » et « Actif » sont une
          seule information, les séparer oblige l'œil à faire l'aller-retour.
          Le prix se lit à droite, aligné en chiffres tabulaires. */}
      <section className="v2-plan-card">
        <div className="v2-plan-head">
          <div>
            <h2>
              {plan.nom}
              <span className="v2-status" data-tone={statut.tone}>
                <i className="v2-dot" />
                {statut.label}
              </span>
            </h2>
            {plan.description && <p>{plan.description}</p>}
          </div>
          <div className="v2-plan-head-prix">
            <strong>{prix.principal}</strong>
            {prix.detail && <span>{prix.detail}</span>}
          </div>
        </div>

        {abonnement && abonnement.statut !== "trialing" && (
          <div className="v2-plan-foot">
            {abonnement.finPeriode && (
              <div className="v2-kv">
                <b>
                  {abonnement.resiliationEnFinDePeriode
                    ? "Se termine le"
                    : "Renouvellement"}
                </b>
                <span>{dateJournal(abonnement.finPeriode)}</span>
              </div>
            )}
            <div className="v2-kv">
              <b>Moyen de paiement</b>
              <span>
                {/* Ce que nous savons vraiment : que le paiement passe par le
                    prestataire. Nous ne conservons ni le moyen ni le numéro —
                    afficher « Mobile money » sans le savoir serait inventer. */}
                Réglé via Genius Pay
              </span>
            </div>
          </div>
        )}

        {abonnement?.statut === "trialing" && restant !== null && (
          <p className="v2-panel-callout">
            <Icon name="clock" />
            {restant === 0
              ? "Votre essai se termine aujourd’hui."
              : `Il reste ${restant} jour${restant > 1 ? "s" : ""} d’essai.`}{" "}
            Aucune carte n’a été demandée. À la fin, l’espace revient au plan
            Ready — vos données restent, les fonctions du plan {plan.nom} se
            referment.
          </p>
        )}

      </section>

      {depassements.length > 0 && (
        <section className="v2-plan-card">
          <p className="v2-panel-note">
            <Icon name="shield" />
            {depassements.length === 1
              ? `Vous dépassez la limite « ${depassements[0].nom} » de votre plan.`
              : `Vous dépassez ${depassements.length} limites de votre plan.`}{" "}
            Rien n’est bloqué : c’est signalé pour que vous choisissiez — passer
            à un plan supérieur, ou ramener l’usage sous la limite.
          </p>
        </section>
      )}

      <section className="v2-plan-card">
        <div className="v2-nav-label">Usage</div>
        {consommation.length === 0 ? (
          <p className="v2-field-helper">
            Ce plan ne pose aucune limite chiffrée.
          </p>
        ) : (
          <div className="v2-usage-list">
            {consommation.map((c) => (
              <div data-depasse={c.depasse} key={c.code}>
                <div>
                  <strong>{c.nom}</strong>
                  <span>
                    {quantite(c.code, c.utilise)}
                    {c.limite === null
                      ? " · illimité"
                      : ` sur ${quantite(c.code, c.limite)}`}
                  </span>
                </div>
                {c.part !== null && (
                  <div className="v2-usage-bar">
                    <span style={{ width: `${Math.min(100, c.part)}%` }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <p className="v2-roles-note">
          <Icon name="users" />
          Les visiteurs externes — investisseurs, banques, auditeurs — ne sont
          jamais facturés. Vous payez pour votre espace, pas pour ceux qui le
          consultent.
        </p>
      </section>

      {operations.length > 0 && (
        <section className="v2-plan-card">
          <div className="v2-nav-label">Opérations</div>
          <div className="v2-counted-list">
            {operations.map((o) => (
              <div key={o.id}>
                <strong>{o.nom}</strong>
                <span>{o.detail}</span>
                <span
                  className="v2-status"
                  data-tone={o.comptee ? undefined : "green"}
                >
                  {o.comptee ? "comptée" : "hors décompte"}
                </span>
              </div>
            ))}
          </div>
          <p className="v2-roles-note">
            <Icon name="folder" />
            Archivez une opération terminée pour en commencer une nouvelle —
            l’archivage est réversible et ne supprime rien.
          </p>
        </section>
      )}

      <section className="v2-plan-card">
        <div className="v2-nav-label">Ce que votre plan ouvre</div>
        <ul className="v2-plan-features">
          {droits
            .filter((d) => d.nature === "boolean" && d.actif)
            .map((d) => (
              <li key={d.code}>
                <Icon name="check" />
                {d.nom}
              </li>
            ))}
        </ul>
      </section>

      {memeSegment.length > 0 && (
        <ChangerDePlan
          autres={memeSegment}
          onPayer={onPayer}
          onRevenirAuGratuit={onRevenirAuGratuit}
          prochaineEcheance={abonnement?.finPeriode ?? null}
        />
      )}

      {/* La résiliation n'apparaît que s'il y a quelque chose à résilier : la
          proposer sur le plan gratuit n'aurait aucun sens. */}
      {abonnement && abonnement.statut !== "cancelled" && (
        <Resilier
          abonnement={abonnement}
          onReprendre={onReprendre}
          onResilier={onResilier}
        />
      )}

      <section className="v2-plan-card">
        <div className="v2-nav-label">Facturation</div>
        <p className="v2-field-helper">
          Aucune facture pour l’instant.{" "}
          {abonnement?.statut === "trialing"
            ? "L’essai n’en génère pas."
            : "Elles apparaîtront ici dès le premier paiement."}
        </p>
      </section>

      <p className="v2-roles-note">
        <Icon name="help" />
        Une question sur votre abonnement ? Passez par{" "}
        <Link href="/v2/roadmap">l’aide</Link>.
      </p>
    </div>
  );
}
