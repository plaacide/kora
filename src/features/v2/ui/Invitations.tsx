import Link from "next/link";

import { Icon } from "./Icon";

/**
 * Écran 31 — Invitation à rejoindre une cohorte.
 * Repris de `sanza_handoff/maquettes/screens/31-invitation-cohorte.html`.
 *
 * L'écran énonce sans détour ce que le programme verra et ce qui restera
 * privé : c'est la condition d'un consentement éclairé, pas un argumentaire.
 */

const SHARED = [
  "Identité de l’entreprise",
  "Objectif de financement",
  "Progression agrégée (18/24 requises)",
  "Nombre d’exigences par statut",
  "Échéances",
  "Besoins d’accompagnement déclarés",
];

const PRIVATE = [
  "Nom et contenu des pièces",
  "Liste détaillée des investisseurs",
  "Montants engagés par investisseur",
  "Notes internes",
  "Journal d’activité détaillé",
];

export function CohortInvitationScreen() {
  return (
    <div className="v2-main v2-centered-main">
      <header className="v2-top">
        <strong>Invitations et demandes</strong>
        <span className="v2-spacer" />
      </header>

      <div className="v2-centered-body">
        <section className="v2-content-card v2-invitation-card">
          <div className="v2-invitation-head">
            <span className="v2-programme-mark">DA</span>
            <div>
              <h1>Dakar Accelerator vous invite</h1>
              <div>
                Cohorte « Énergie 2026 » · 12 entreprises · suivi prévu jusqu’au
                31-12-2026
              </div>
            </div>
          </div>

          <hr className="v2-hr" />

          <div className="v2-disclosure">
            <div>
              <span className="v2-disclosure-label" data-tone="green">
                Ce que le programme verra
              </span>
              <span>
                {SHARED.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </span>
            </div>
            <div>
              <span className="v2-disclosure-label" data-tone="red">
                Ce qui restera privé
              </span>
              <span>
                {PRIVATE.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </span>
            </div>
          </div>

          <hr className="v2-hr" />

          <p className="v2-invitation-note">
            Tout accès supplémentaire passera par l’assistant de partage, comme
            pour n’importe quel invité. Vous pourrez quitter la cohorte à tout
            moment — le suivi s’arrête immédiatement.
          </p>

          <div className="v2-invitation-actions">
            <Link className="v2-btn" href="?vue=cohorte&dealroom=1">Rejoindre la cohorte</Link>
            <button className="v2-btn" data-variant="secondary" type="button">
              Plus tard
            </button>
            <span className="v2-spacer" />
            <button className="v2-btn-quiet" type="button">Décliner</button>
          </div>

          <p className="v2-invitation-footnote">
            Décliner ne nécessite aucune justification et n’est pas communiqué
            comme un refus motivé.
          </p>
        </section>
      </div>
    </div>
  );
}

/**
 * Écran 32 — Consentement à la publication sur le dealroom.
 * Repris de `sanza_handoff/maquettes/screens/32-consentement-dealroom.html`.
 *
 * Deux indicateurs portent la mention « jamais publiable » et ne sont pas
 * cochables : les montants engagés et la liste des investisseurs ne quittent
 * jamais l'opération.
 */

const INDICATORS: Array<{ label: string; checked: boolean; locked?: boolean }> = [
  { label: "Identité et secteur", checked: true },
  { label: "Objectif de financement", checked: true },
  { label: "Progression documentaire agrégée", checked: true },
  { label: "Montants engagés", checked: false, locked: true },
  { label: "Liste des investisseurs", checked: false, locked: true },
];

const CARD_FACTS: Array<[string, string]> = [
  ["Objectif", "500 000 000 XOF"],
  ["Échéance", "30 novembre 2026"],
  ["Préparation", "18 / 24 exigences prêtes"],
  ["Contact", "via demande d’accès uniquement"],
];

export function DealroomConsentPanel() {
  return (
    <>
      <Link aria-label="Fermer" className="v2-scrim" href="?vue=cohorte" />
      <aside className="v2-sidepanel v2-consent-panel">
        <header>
          <div>
            <h2>Publier votre fiche sur le dealroom ?</h2>
            <p>
              Voici exactement la fiche que verront les investisseurs du réseau
              Dakar Accelerator.
            </p>
          </div>
          <Link aria-label="Fermer" href="?vue=cohorte">×</Link>
        </header>

        <div className="v2-sidepanel-body">
          <section className="v2-preview-card">
            <div className="v2-preview-identity">
              <span className="v2-company-mark">NS</span>
              <div>
                <b>Nimba Solar</b>
                <small>Énergie · Sénégal · Série A</small>
              </div>
            </div>
            <hr className="v2-hr" />
            <div className="v2-detail-grid">
              {CARD_FACTS.map(([label, value]) => (
                <div key={label}>
                  <small>{label}</small>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          </section>

          <section>
            <small className="v2-field-label">Indicateurs publiés — à choisir</small>
            <div className="v2-indicator-list">
              {INDICATORS.map((indicator) => (
                <label key={indicator.label}>
                  <input
                    defaultChecked={indicator.checked}
                    disabled={indicator.locked}
                    type="checkbox"
                  />
                  <span className="v2-remember-box">
                    <Icon name="check" />
                  </span>
                  {indicator.label}
                  {indicator.locked && <span className="v2-tag">jamais publiable</span>}
                </label>
              ))}
            </div>
          </section>

          <label className="v2-field">
            <span>Période de publication</span>
            <span className="v2-control">
              <input defaultValue="Jusqu’au 31 décembre 2026" />
            </span>
          </label>

          <p className="v2-panel-note">
            Une demande d’accès reçue depuis le dealroom reste une demande —
            jamais un accès automatique. Vous pourrez suspendre ou{" "}
            <b>retirer la fiche immédiatement</b>, avec journalisation.
          </p>
        </div>

        <footer className="v2-sidepanel-footer">
          <Link className="v2-btn-quiet" href="?vue=cohorte">Annuler</Link>
          <span className="v2-spacer" />
          <button className="v2-btn" data-variant="secondary" type="button">
            <Icon name="eye" />
            Prévisualiser en plein écran
          </button>
          <button className="v2-btn" type="button">Publier la fiche</button>
        </footer>
      </aside>
    </>
  );
}
