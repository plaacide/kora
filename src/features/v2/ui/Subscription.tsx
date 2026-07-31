import Link from "next/link";

import {
  economieAnnuelle,
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

import { Icon } from "./Icon";

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
  operations,
  plan,
}: {
  /** `null` quand aucun abonnement n'existe — le plan gratuit s'applique. */
  abonnement: Abonnement | null;
  catalogue: readonly Plan[];
  consommation: readonly Consommation[];
  droits: readonly Droit[];
  operations: readonly OperationComptee[];
  plan: Plan;
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

  return (
    <div className="v2-narrow-page">
      <section className="v2-plan-card">
        <header>
          <div>
            <span className="v2-nav-label">Plan actuel</span>
            <h2>{plan.nom}</h2>
            {plan.description && <p>{plan.description}</p>}
          </div>
          <span className="v2-status" data-tone={statut.tone}>
            <i className="v2-dot" />
            {statut.label}
          </span>
        </header>

        <div className="v2-plan-price">
          <strong>{prix.principal}</strong>
          {prix.detail && <span>{prix.detail}</span>}
        </div>

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

        {abonnement?.finPeriode && abonnement.statut !== "trialing" && (
          <div className="v2-plan-meta">
            <div>
              <span>
                {abonnement.resiliationEnFinDePeriode
                  ? "Se termine le"
                  : "Renouvellement le"}
              </span>
              <strong>{dateJournal(abonnement.finPeriode)}</strong>
            </div>
            {abonnement.intervalle && (
              <div>
                <span>Facturation</span>
                <strong>
                  {abonnement.intervalle === "year" ? "Annuelle" : "Mensuelle"}
                </strong>
              </div>
            )}
          </div>
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
        <section className="v2-plan-card">
          <div className="v2-nav-label">Changer de plan</div>
          <div className="v2-plan-others">
            {memeSegment.map((autre) => {
              const p = prixAffiche(autre, "month");
              const economie = economieAnnuelle(autre);
              return (
                <div key={autre.code}>
                  <div>
                    <strong>
                      {autre.nom}
                      {autre.badge && (
                        <span className="v2-tag">{autre.badge}</span>
                      )}
                    </strong>
                    <small>{autre.description}</small>
                    {economie !== null && (
                      <small className="v2-plan-economie">
                        {economie} % d’économie à l’année
                      </small>
                    )}
                  </div>
                  <div className="v2-plan-others-prix">
                    <strong>{p.principal}</strong>
                    {p.detail && <small>{p.detail}</small>}
                  </div>
                </div>
              );
            })}
          </div>
          {/* Le changement de plan passe par un paiement, et aucun prestataire
              n'est encore branché. Un bouton qui ne mène nulle part serait pire
              qu'une phrase qui le dit. */}
          <p className="v2-roles-note">
            <Icon name="shield" />
            Le changement de plan en ligne n’est pas encore ouvert. Écrivez-nous
            et nous l’activons sur votre espace — sans interruption ni perte de
            données. Passer à un plan inférieur ne supprime aucune donnée.
          </p>
        </section>
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
