import { Standalone } from "./Shell";

/**
 * Écran 68 — Abonnement adapté au multi-opérations.
 * Repris de `sanza_handoff/maquettes/screens/68-abonnement-adapte.html`.
 *
 * Le décompte ne porte que sur les opérations actives. Une archive ne compte
 * pas, et l'archivage ne supprime rien — c'est ce qui rend la limite tenable.
 */

const COUNTED: Array<[string, string, boolean]> = [
  ["Série A 2026", "Levée en capital", true],
  ["Prêt Ecobank", "Dette bancaire", true],
  ["Diligence IFC", "Diligence", true],
  ["Levée Seed 2024", "Archivée · lecture seule", false],
];

const PLANS: Array<[string, string, boolean]> = [
  ["Ready", "1 opération en préparation", false],
  ["Raise", "1 opération active", false],
  ["Close", "3 opérations actives", true],
  ["Sur mesure", "Nombre configurable", false],
];

export function SubscriptionScreen() {
  return (
    <Standalone search={false} title="Abonnement">
      <div className="v2-search-page">
        <section className="v2-content-card">
          <div className="v2-quota">
            <div>
              <span className="v2-nav-label">Opérations actives</span>
              <strong>3 sur 3</strong>
            </div>
            <span className="v2-status" data-tone="amber">Limite atteinte</span>
          </div>
          <p>
            Archivez une opération terminée pour en commencer une nouvelle —
            l’archivage est réversible et ne supprime rien.
          </p>
        </section>

        <section className="v2-folder-card">
          {COUNTED.map(([name, detail, counted]) => (
            <div className="v2-folder-row" key={name}>
              <strong>{name}</strong>
              <span>{detail}</span>
              <span className="v2-status" data-tone={counted ? undefined : "green"}>
                {counted ? "comptée" : "hors décompte"}
              </span>
            </div>
          ))}
        </section>

        <section className="v2-folder-card">
          <header><strong>Limites par plan</strong></header>
          {PLANS.map(([name, limit, current]) => (
            <div className="v2-folder-row" data-current={current} key={name}>
              <strong>
                {name}
                {current && (
                  <span className="v2-status" data-tone="orange">Votre plan</span>
                )}
              </strong>
              <span>{limit}</span>
            </div>
          ))}
        </section>

        <p className="v2-footnote">
          Les invités externes ne sont pas des sièges payants. Le passage à un
          plan inférieur ne supprime aucune donnée.
        </p>
      </div>
    </Standalone>
  );
}
