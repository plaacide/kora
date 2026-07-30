/**
 * Écran 69 — Rejoindre une cohorte, adapté au multi-opérations.
 * Repris de `sanza_handoff/maquettes/screens/69-cohorte-dealroom-adapte.html`.
 *
 * L'entreprise rejoint la cohorte, mais l'accès reste attaché à une opération
 * précise. C'est la distinction que l'écran doit rendre évidente : adhérer à un
 * programme n'ouvre pas tout le reste.
 */

const RULES = [
  "Le programme verra les informations autorisées de « Série A 2026 » uniquement.",
  "Aucun document n’est partagé sans votre accord explicite.",
  "Le mandat et le consentement ne s’appliquent qu’à cette opération.",
];

export function CohortJoinScreen() {
  return (
    <div className="v2 v2-join-page">
      <div className="v2-join-head">
        <span className="v2-join-mark">DV</span>
        <h1>Rejoindre la cohorte Dakar Ventures 2026</h1>
        <p>
          Nimba Solar rejoint la cohorte — l’accès documentaire reste lié à une
          opération précise.
        </p>
      </div>

      <section className="v2-wizard-card">
        <header className="v2-join-pick">
          <span className="v2-nav-label">Opération présentée</span>
          <button className="v2-btn-quiet" type="button">Changer d’opération</button>
        </header>

        <div className="v2-wizard-body">
          <div className="v2-join-operation">
            <div>
              <b>Série A 2026</b>
              <small>Capital · Active · 72 % prête</small>
            </div>
            <span className="v2-status" data-tone="orange">Sélectionnée</span>
          </div>

          <ul className="v2-join-rules">
            {RULES.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </div>

        <footer>
          <button className="v2-btn-quiet" type="button">Refuser</button>
          <div>
            <button className="v2-btn" type="button">Rejoindre la cohorte</button>
          </div>
        </footer>
      </section>
    </div>
  );
}
