import { Icon } from "./Icon";
import { SampleRowMenu } from "./RowMenu";

/**
 * Écrans 09 et 10 — les deux autres états de la vue d'ensemble.
 * Repris de `09-vue-ensemble-preparation.html` et `10-vue-ensemble-partagee.html`.
 *
 * L'écran 08 (arrivée) est déjà en place ; ceux-ci montrent l'opération une
 * fois la préparation engagée, puis une fois le dossier partagé.
 */

const HEADING = (
  <div className="v2-operation-heading">
    <div>
      <h1>Série A 2026</h1>
      <p>
        <span>Levée en capital</span><b>·</b>
        <span>500 000 000 XOF</span><b>·</b>
        <span>Échéance 30 novembre 2026</span>
      </p>
    </div>
    <SampleRowMenu label="Série A 2026" />
  </div>
);

const PRIORITIES: Array<[string, string, string]> = [
  ["Statuts à jour", "Requis · OHADA", "À préparer"],
  ["États financiers 2025", "Requis · Capital", "À actualiser"],
  ["Table de capitalisation", "Requis · Capital", "Pièce à confirmer"],
  ["Attestation fiscale", "Requis · Niger", "À préparer"],
];

const DEPOSITS: Array<[string, string, string]> = [
  ["Pitch deck v4.pdf", "Commercial et marché", "hier 18:12"],
  ["Registre de commerce.pdf", "Société et immatriculation", "24-07"],
  ["Contrats top 10 clients.zip", "Commercial et marché", "22-07"],
  ["Organigramme.pdf", "Équipe et RH", "21-07"],
];

export function OverviewPreparation() {
  return (
    <div className="v2-operation-page">
      {HEADING}

      <section className="v2-next-action">
        <div>
          <span className="v2-section-label">Prochaine action</span>
          <h2>Mettre à jour les états financiers</h2>
          <div>
            <button className="v2-btn" type="button">Remplacer la pièce</button>
            <button className="v2-btn" data-variant="secondary" type="button">
              Pourquoi cette priorité ?
            </button>
          </div>
        </div>
      </section>

      <section className="v2-content-card">
        <span className="v2-section-label">Progression</span>
        <h3>18 sur 24 exigences requises sont prêtes</h3>
        <div className="v2-progress"><span style={{ width: "75%" }} /></div>
        <p>
          <b>4</b> à fournir · <b>2</b> pièces à actualiser · <b>9/13</b>{" "}
          recommandées prêtes
        </p>
        <p className="v2-deadline">
          <Icon name="calendar" />
          Échéance la plus proche : dépôt banque partenaire — 15 août
        </p>
      </section>

      <section className="v2-folder-card">
        <header className="v2-folder-head-action">
          <strong>À traiter en priorité</strong>
          <a className="v2-quiet-link" href="#">Plan complet →</a>
        </header>
        {PRIORITIES.map(([name, level, status]) => (
          <div className="v2-folder-row" key={name}>
            <strong>{name}</strong>
            <span>{level}</span>
            <span className="v2-status">{status}</span>
          </div>
        ))}
      </section>

      <section className="v2-folder-card">
        <header><strong>Dernières pièces déposées</strong></header>
        {DEPOSITS.map(([name, folder, when]) => (
          <div className="v2-folder-row" key={name}>
            <Icon name="file" />
            <strong>{name}</strong>
            <span>{folder}</span>
            <span>{when}</span>
          </div>
        ))}
      </section>
    </div>
  );
}

const ACTIVITY: Array<[string, string, string, string, string]> = [
  ["Amina Diallo", "· Sahel Growth Fund", "a consulté", "États financiers 2025.pdf", "il y a 2 h"],
  ["Kwame Mensah", "· Horizon Ventures", "a signé", "l’accord de confidentialité", "hier 16:40"],
  ["Impact Capital Africa", "· Clara Morel", "a demandé l’accès au", "dossier financier", "hier 09:15"],
];

const RELATIONS: Array<[string, string, string]> = [
  ["Sahel Growth Fund", "Amina Diallo", "Diligence"],
  ["Horizon Ventures", "Kwame Mensah", "Intéressé"],
  ["Impact Capital Africa", "Clara Morel", "Échange planifié"],
];

export function OverviewShared() {
  return (
    <div className="v2-operation-page">
      {HEADING}

      <section className="v2-next-action">
        <div>
          <span className="v2-section-label">Prochaine action</span>
          <h2>Relancer Horizon Ventures</h2>
          <div>
            <button className="v2-btn" type="button">Préparer la relance</button>
            <button className="v2-btn" data-variant="secondary" type="button">
              Voir son activité
            </button>
          </div>
        </div>
      </section>

      <section className="v2-content-card">
        <span className="v2-section-label">Progression</span>
        <h3>22 sur 24 exigences requises sont prêtes</h3>
        <div className="v2-progress"><span style={{ width: "92%" }} /></div>
        <p>
          <b>2</b> à fournir · <b>1</b> à actualiser · <b>31</b> pièces déposées
        </p>
      </section>

      <section className="v2-folder-card">
        <header className="v2-folder-head-action">
          <strong>Activité récente</strong>
          <a className="v2-quiet-link" href="#">Journal complet →</a>
        </header>
        {ACTIVITY.map(([who, from, verb, target, when]) => (
          <div className="v2-journal-row" key={`${who}-${when}`}>
            <p>
              <b>{who}</b> <span className="v2-muted-3">{from}</span>{" "}
              <span className="v2-muted-2">{verb}</span> <a href="#">{target}</a>
            </p>
            <span className="v2-journal-time">{when}</span>
          </div>
        ))}
      </section>

      <section className="v2-folder-card">
        <header className="v2-folder-head-action">
          <strong>État de la relation</strong>
          <a className="v2-quiet-link" href="#">Pipeline →</a>
        </header>
        {RELATIONS.map(([organisation, contact, stage]) => (
          <div className="v2-folder-row" key={organisation}>
            <strong>{organisation}</strong>
            <span>{contact}</span>
            <span className="v2-status">{stage}</span>
          </div>
        ))}
        <footer className="v2-relation-note">
          Montant déclaré en engagement : <b>aucun pour l’instant</b>. Les
          consultations ne sont jamais converties en intention.
        </footer>
      </section>
    </div>
  );
}
