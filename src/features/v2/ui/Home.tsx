import Link from "next/link";

import { v2Routes } from "../navigation/routes";
import { Icon } from "./Icon";
import { Standalone } from "./Shell";

/**
 * Écran 58 — Accueil, plusieurs opérations.
 * Repris de `sanza_handoff/maquettes/screens/58-accueil-multi-operations.html`.
 *
 * L'accueil ne récapitule pas tout : il ne montre que ce qui demande une
 * décision aujourd'hui, puis la liste courte des opérations avec leur
 * préparation. Aucune carte de statistique à zéro.
 */

const ATTENTION: Array<{
  operation: string;
  message: string;
  action: string;
  urgent: boolean;
}> = [
  {
    operation: "Diligence IFC",
    message: "8 pièces à fournir avant le 12 août",
    action: "Voir la préparation",
    urgent: true,
  },
  {
    operation: "Série A 2026",
    message: "Amina Diallo attend une réponse depuis 3 jours",
    action: "Ouvrir la question",
    urgent: false,
  },
];

const OPERATIONS: Array<{
  name: string;
  type: string;
  preparation: number;
  badge: string;
  tone: "orange" | "neutral" | "amber";
}> = [
  { name: "Série A 2026", type: "Levée en capital", preparation: 72, badge: "Partagée", tone: "orange" },
  { name: "Prêt Ecobank", type: "Dette bancaire", preparation: 45, badge: "Privée", tone: "neutral" },
  { name: "Diligence IFC", type: "Diligence", preparation: 61, badge: "Échéance proche", tone: "amber" },
];

export function HomeScreen({ firstName }: { firstName: string }) {
  return (
    <Standalone search="Rechercher partout…" title="Accueil">
      <div className="v2-home">
        <div>
          <h1>Bonjour {firstName}</h1>
          <p>Voici ce qui demande votre attention aujourd’hui.</p>
        </div>

        <div className="v2-attention-grid">
          {ATTENTION.map((item) => (
            <section
              className="v2-attention-card"
              data-urgent={item.urgent}
              key={item.operation}
            >
              <span className="v2-nav-label">{item.operation}</span>
              <h2>{item.message}</h2>
              <div>
                <button
                  className="v2-btn"
                  data-variant={item.urgent ? undefined : "secondary"}
                  type="button"
                >
                  {item.action}
                </button>
              </div>
            </section>
          ))}
        </div>

        <section className="v2-folder-card">
          <header className="v2-folder-head-action">
            <span className="v2-nav-label">Vos opérations</span>
            <Link className="v2-quiet-link" href={v2Routes.operations.list}>
              Voir toutes les opérations
            </Link>
          </header>
          {OPERATIONS.map((operation) => (
            <div className="v2-home-row" key={operation.name}>
              <b>{operation.name}</b>
              <span className="v2-home-type">{operation.type}</span>
              <div className="v2-home-progress">
                <div className="v2-progress">
                  <span style={{ width: `${operation.preparation}%` }} />
                </div>
                <span>{operation.preparation} %</span>
              </div>
              <span className="v2-status" data-tone={operation.tone}>
                <i className="v2-dot" />
                {operation.badge}
              </span>
              <Icon name="chevron" />
            </div>
          ))}
        </section>
      </div>
    </Standalone>
  );
}
