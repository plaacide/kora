import { Icon } from "./Icon";

/**
 * Écran 17 — Confirmation des associations suggérées.
 * Repris de `sanza_handoff/maquettes/screens/17-confirmation-associations.html`.
 *
 * Règle du handoff : rien n'est associé sans validation. Sanza propose, le
 * fondateur confirme. Une pièce peut satisfaire plusieurs exigences sans être
 * dupliquée — d'où les cases à cocher plutôt qu'un choix unique.
 */

interface Suggestion {
  requirement: string;
  origin: string;
  checked: boolean;
}

const DEPOSITS: Array<{ file: string; suggestions: Suggestion[] }> = [
  {
    file: "Relevés bancaires 2025.pdf",
    suggestions: [
      {
        requirement: "Relevés bancaires 12 mois",
        origin: "Demandé par Banque Atlantique",
        checked: true,
      },
    ],
  },
  {
    file: "Budget 2026 approuvé.pdf",
    suggestions: [
      {
        requirement: "Plan de trésorerie 18 mois",
        origin: "Requis · Capital, Banque",
        checked: true,
      },
      {
        requirement: "Projections financières",
        origin: "Recommandé · Capital",
        checked: false,
      },
    ],
  },
  {
    file: "Rapport d’audit 2025.pdf",
    suggestions: [
      {
        requirement: "Rapports d’audit",
        origin: "Recommandé · DFI",
        checked: true,
      },
      {
        requirement: "États financiers 3 exercices",
        origin: "Requis · Banque, DFI",
        checked: false,
      },
    ],
  },
];

const CONFIRMED = DEPOSITS.flatMap((deposit) =>
  deposit.suggestions.filter((suggestion) => suggestion.checked),
).length;

const SUGGESTED = DEPOSITS.reduce(
  (total, deposit) => total + deposit.suggestions.length,
  0,
);

export function AssociationsPanel() {
  return (
    <>
      <div className="v2-scrim" />
      <aside className="v2-sidepanel v2-associations-panel">
        <header>
          <div>
            <h2>{DEPOSITS.length} pièces ont été ajoutées</h2>
            <p>
              Sanza propose de les associer à {SUGGESTED} exigences. Vérifiez
              avant de confirmer.
            </p>
          </div>
          <a aria-label="Fermer" href="#">×</a>
        </header>

        <div className="v2-sidepanel-body">
          {DEPOSITS.map((deposit) => (
            <section className="v2-deposit-card" key={deposit.file}>
              <div className="v2-deposit-file">
                <Icon name="file" />
                <b>{deposit.file}</b>
              </div>
              <div className="v2-suggestion-list">
                {deposit.suggestions.map((suggestion) => (
                  <label
                    data-selected={suggestion.checked}
                    key={suggestion.requirement}
                  >
                    <input defaultChecked={suggestion.checked} type="checkbox" />
                    <span className="v2-remember-box">
                      <Icon name="check" />
                    </span>
                    <span>
                      <span>{suggestion.requirement}</span>
                      <small>{suggestion.origin}</small>
                    </span>
                  </label>
                ))}
              </div>
            </section>
          ))}

          <p className="v2-panel-note">
            Une pièce peut répondre à plusieurs exigences sans être dupliquée.
            Aucune association n’est définitive sans votre confirmation.
          </p>
        </div>

        <footer className="v2-sidepanel-footer">
          <button className="v2-btn" data-variant="secondary" type="button">
            Plus tard
          </button>
          <button className="v2-btn" type="button">
            Confirmer {CONFIRMED} associations
          </button>
        </footer>
      </aside>
    </>
  );
}
