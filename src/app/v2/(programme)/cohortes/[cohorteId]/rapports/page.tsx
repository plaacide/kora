import { Icon } from "@/features/v2/ui/Icon";

const PERIODES = [
  { titre: "T3 2026", detail: "juillet → septembre", actif: true },
  { titre: "T2 2026", detail: "avril → juin" },
];

const DESTINATAIRES = [
  { titre: "AFD — bailleur principal", actif: true },
  { titre: "Proparco" },
  { titre: "Usage interne" },
];

const CONTENU = [
  "Progression des Challenges (4 en cours)",
  "Complétude des préparations (12 entreprises)",
  "Activité des dealrooms (visites, demandes)",
];

const HISTORIQUE = [
  { titre: "T2 2026", detail: "généré le 3 juillet · partagé avec l’AFD" },
  { titre: "T1 2026", detail: "généré le 4 avril · partagé avec l’AFD" },
];

/** Écran 39 — le générateur de rapport d'une cohorte, et son historique. */
export default function CohorteRapportsPage() {
  return (
    <>
      <div className="v2-prog-head">
        <div>
          <h1>Rapports</h1>
          <p>
            Générez un rapport d’avancement pour vos financeurs — progression
            agrégée, jamais les documents.
          </p>
        </div>
      </div>

      <div className="v2-generateur">
        <div className="v2-card v2-dr-form">
          <div className="v2-nav-label" style={{ padding: 0 }}>
            Nouveau rapport bailleur
          </div>

          <div className="v2-field">
            <span>Période</span>
            <div className="v2-choix">
              {PERIODES.map((periode) => (
                <label
                  className="v2-radio"
                  data-active={periode.actif}
                  key={periode.titre}
                >
                  <i />
                  <div>
                    <b>{periode.titre}</b>
                    <small>{periode.detail}</small>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="v2-field">
            <span>Destinataire</span>
            <div className="v2-choix">
              {DESTINATAIRES.map((destinataire) => (
                <label
                  className="v2-radio"
                  data-active={destinataire.actif}
                  key={destinataire.titre}
                >
                  <i />
                  <div>
                    <b>{destinataire.titre}</b>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="v2-field">
            <span>Contenu</span>
            {/* Ce que le rapport contient est ÉNUMÉRÉ avant de le produire :
                un bailleur reçoit de la progression, jamais des pièces. */}
            <div className="v2-liste-cochee">
              {CONTENU.map((ligne) => (
                <span key={ligne}>
                  <Icon name="check" />
                  {ligne}
                </span>
              ))}
            </div>
          </div>

          <div className="v2-dr-actions">
            <span className="v2-btn">Générer le rapport (PDF)</span>
          </div>
          <p style={{ color: "var(--text-3)", fontSize: 12.5, margin: 0 }}>
            Prêt en quelques secondes.
          </p>
        </div>

        <aside className="v2-card" style={{ overflow: "hidden" }}>
          <div className="v2-nav-label" style={{ padding: "16px 18px 8px" }}>
            Historique
          </div>
          {HISTORIQUE.map((rapport) => (
            <div className="v2-prog-journal" key={rapport.titre}>
              <span className="v2-pastille" data-ton="red">
                <Icon name="file" />
              </span>
              <div>
                <b>{rapport.titre}</b>
                <div className="v2-muted">{rapport.detail}</div>
              </div>
              <span className="v2-btn" data-variant="text">
                Télécharger
              </span>
            </div>
          ))}
        </aside>
      </div>
    </>
  );
}
