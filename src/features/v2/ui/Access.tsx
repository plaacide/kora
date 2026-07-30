"use client";

import Link from "next/link";
import { useState } from "react";

import { Icon } from "./Icon";

const wizardSteps = ["Destinataire", "Contenu", "Sécurité", "Vérification"];
const stepOrder: Record<string, number> = {
  recipient: 1,
  content: 2,
  security: 3,
  review: 4,
};

const folderOptions = [
  ["Société et immatriculation", "5 pièces", true],
  ["Gouvernance et actionnariat", "4 pièces", true],
  ["Finance et comptabilité", "11 sur 12 pièces", true],
  ["Fiscalité", "3 pièces", false],
  ["Commercial et marché", "4 pièces", true],
  ["Équipe et RH", "2 pièces", false],
  ["Technologie et PI", "1 pièce", false],
  ["Impact et ESG", "2 pièces", false],
] as const;

function AccessStepper({ current }: { current: number }) {
  return (
    <ol className="v2-access-steps" aria-label="Étapes de création d’un accès">
      {wizardSteps.map((label, index) => {
        const number = index + 1;
        return (
          <li
            className={number < current ? "is-done" : number === current ? "is-current" : ""}
            key={label}
          >
            {index > 0 && <i />}
            <span>{number < current ? "✓" : number}</span>
            {label}
          </li>
        );
      })}
    </ol>
  );
}

function WizardCard({
  children,
  title,
  description,
  backHref,
  nextHref,
  nextLabel,
  footerExtra,
}: {
  children: React.ReactNode;
  title: string;
  description: string;
  backHref: string;
  nextHref: string;
  nextLabel: string;
  footerExtra?: React.ReactNode;
}) {
  return (
    <section className="v2-wizard-card">
      <header>
        <h2>{title}</h2>
        <p>{description}</p>
      </header>
      <div className="v2-wizard-body">{children}</div>
      <footer>
        <Link href={backHref}>{backHref === "?" ? "Annuler" : "← Retour"}</Link>
        <div>
          {footerExtra}
          <Link className="v2-btn" href={nextHref}>{nextLabel}</Link>
        </div>
      </footer>
    </section>
  );
}

export function AccessWizard({
  step,
  preview,
}: {
  step: string;
  preview: boolean;
}) {
  const current = stepOrder[step] ?? 1;

  return (
    <>
      <div className="v2-access-wizard">
        <div className="v2-wizard-heading">
          <span>Partage et accès /</span>
          <strong>Série A 2026.</strong>
          <em>Vous allez ouvrir une partie de cette data room à un invité.</em>
          <Link href="?">×</Link>
        </div>
        <AccessStepper current={current} />
        {current === 1 && <RecipientStep />}
        {current === 2 && <ContentStep />}
        {current === 3 && <SecurityStep />}
        {current === 4 && <ReviewStep />}
      </div>
      {preview && <GuestPreview />}
    </>
  );
}

function RecipientStep() {
  return (
    <WizardCard
      title="À qui donnez-vous accès ?"
      description="L’accès est nominatif : chaque personne est identifiée et journalisée."
      backHref="?"
      nextHref="?share=content"
      nextLabel="Continuer → Contenu"
    >
      <div className="v2-wizard-grid">
        <label className="v2-field">
          <span>Nom complet</span>
          <span className="v2-control"><input defaultValue="Amina Diallo" /></span>
        </label>
        <label className="v2-field">
          <span>E-mail professionnel</span>
          <span className="v2-control"><input defaultValue="amina.diallo@sahelgrowth.com" type="email" /></span>
        </label>
        <label className="v2-field">
          <span>Organisation</span>
          <span className="v2-control"><input defaultValue="Sahel Growth Fund" /></span>
        </label>
        <label className="v2-field">
          <span>Type</span>
          <span className="v2-control">
            <select defaultValue="Investisseur">
              <option>Investisseur</option><option>Banque</option><option>DFI</option>
              <option>Auditeur</option><option>Conseil</option>
            </select>
            <Icon name="chevron" />
          </span>
        </label>
      </div>
      <div className="v2-group-note">
        <Icon name="users" />
        <span>
          Plusieurs personnes de Sahel Growth Fund ? Créez un groupe : mêmes règles,
          activité individuelle.
        </span>
        <button type="button">Ajouter au groupe</button>
      </div>
    </WizardCard>
  );
}

function ContentStep() {
  const defaults = Object.fromEntries(folderOptions.map(([name, , active]) => [name, active]));
  const [selected, setSelected] = useState<Record<string, boolean>>(defaults);

  return (
    <WizardCard
      title="Que verra Amina Diallo ?"
      description="Sélectionnez les dossiers ; ajoutez des exceptions pièce par pièce si nécessaire."
      backHref="?share=recipient"
      nextHref="?share=security"
      nextLabel="Continuer → Sécurité"
    >
      <div className="v2-content-mode">
        <button data-active="true" type="button">Sélection de dossiers</button>
        <button type="button">Tous les dossiers autorisés</button>
      </div>
      <div className="v2-share-folders">
        {folderOptions.map(([name, count]) => (
          <button
            aria-pressed={selected[name]}
            data-selected={selected[name]}
            key={name}
            type="button"
            onClick={() => setSelected((value) => ({ ...value, [name]: !value[name] }))}
          >
            <span>{selected[name] ? "✓" : ""}</span>
            <Icon name="folder" />
            <strong>{name}</strong>
            <small>{count}</small>
          </button>
        ))}
      </div>
      <div className="v2-share-warning">
        <Icon name="eye" />
        <span>
          <strong>1 exception :</strong> « Rapport d’audit 2024.pdf » restera masqué
          dans Finance et comptabilité. <button type="button">Gérer les exceptions</button>
        </span>
      </div>
      <p className="v2-share-summary">
        Résumé : <strong>4 dossiers · 24 pièces visibles</strong> · 8 pièces masquées
      </p>
    </WizardCard>
  );
}

function SecurityStep() {
  const [settings, setSettings] = useState({
    email: true,
    nda: true,
    watermark: true,
    download: false,
  });

  const rows = [
    ["email", "Vérification de l’e-mail", "Amina devra confirmer son adresse avant d’ouvrir le dossier."],
    ["nda", "Accord de confidentialité (NDA)", "Signature électronique requise avant le premier accès."],
    ["watermark", "Lecture filigranée", "Chaque page porte l’e-mail du lecteur et l’horodatage."],
    ["download", "Téléchargement", "Désactivé : consultation uniquement dans la visionneuse sécurisée."],
  ] as const;

  return (
    <WizardCard
      title="Règles de sécurité de cet accès"
      description="Les réglages recommandés sont déjà activés — vous gardez la main sur chacun."
      backHref="?share=content"
      nextHref="?share=review"
      nextLabel="Continuer → Vérification"
    >
      <div className="v2-security-list">
        {rows.map(([key, title, description]) => (
          <div key={key}>
            <button
              className="v2-switch"
              aria-pressed={settings[key]}
              data-active={settings[key]}
              type="button"
              onClick={() => setSettings((value) => ({ ...value, [key]: !value[key] }))}
            >
              <span />
            </button>
            <div><strong>{title}</strong><small>{description}</small></div>
            {key === "nda" ? <button type="button">NDA standard⌄</button> : key !== "download" && <span className="v2-tag">Recommandé</span>}
          </div>
        ))}
      </div>
      <div className="v2-wizard-grid">
        <label className="v2-field">
          <span>Date d’expiration</span>
          <span className="v2-control"><input defaultValue="30 novembre 2026" /></span>
          <small className="v2-field-helper">L’accès se fermera automatiquement à cette date.</small>
        </label>
        <label className="v2-field">
          <span>Code d’accès <small>— facultatif</small></span>
          <span className="v2-control">
            <select defaultValue="Aucun"><option>Aucun</option><option>Code à 6 chiffres</option></select>
            <Icon name="chevron" />
          </span>
        </label>
      </div>
    </WizardCard>
  );
}

function ReviewStep() {
  return (
    <WizardCard
      title="Vérifiez avant d’envoyer"
      description="Voici exactement ce qu’Amina Diallo recevra — rien de plus."
      backHref="?share=security"
      nextHref="?sent=1"
      nextLabel="Envoyer l’accès"
      footerExtra={
        <Link className="v2-btn" data-variant="secondary" href="?share=review&preview=1">
          <Icon name="eye" />Prévisualiser comme l’invité
        </Link>
      }
    >
      <div className="v2-review-grid">
        <div data-wide="true">
          <small>Opération</small>
          <strong>Série A 2026 — Levée en capital · Nimba Solar</strong>
        </div>
        <div>
          <small>Destinataire</small>
          <strong>Amina Diallo · Sahel Growth Fund</strong>
          <span>amina.diallo@sahelgrowth.com · Investisseur</span>
        </div>
        <div>
          <small>Expiration</small>
          <strong>30 novembre 2026</strong>
          <span>fermeture automatique, révocable à tout moment</span>
        </div>
        <div>
          <small>Sera visible</small>
          <span>Société et immatriculation (5)<br />Gouvernance et actionnariat (4)<br />Finance et comptabilité (11)<br />Commercial et marché (4)</span>
        </div>
        <div>
          <small>Restera masqué</small>
          <span>Fiscalité · Équipe et RH · Technologie et PI · Impact et ESG<br />+ Rapport d’audit 2024.pdf</span>
        </div>
      </div>
      <div className="v2-review-badges">
        <span className="v2-status" data-tone="green">E-mail vérifié requis</span>
        <span className="v2-status" data-tone="green">NDA standard requis</span>
        <span className="v2-status" data-tone="green">Lecture filigranée</span>
        <span className="v2-status" data-tone="neutral">Téléchargement désactivé</span>
      </div>
    </WizardCard>
  );
}

const accessRows = [
  ["AD", "Amina Diallo", "Sahel Growth Fund · Investisseur", "Accès actif", "green", "4 dossiers · 24 pièces", "Signé le 12-07", "il y a 2 h", "30-11-2026", "Détail"],
  ["KM", "Kwame Mensah", "Horizon Ventures · Investisseur", "Accès actif", "green", "3 dossiers · 18 pièces", "Signé hier", "hier 16:40", "30-11-2026", "Détail"],
  ["CM", "Clara Morel", "Impact Capital Africa · Investisseur", "NDA en attente", "blue", "3 dossiers · 18 pièces", "Envoyé", "—", "30-11-2026", "Relancer"],
  ["BA", "Moussa Ndao", "Banque Atlantique · Banque", "Invitation envoyée", "neutral", "2 dossiers · 14 pièces", "Requis", "—", "15-08-2026", "Renvoyer"],
  ["FA", "Cabinet Fall & Associés", "Auditeur", "Expire bientôt", "amber", "1 dossier · 6 pièces", "Signé le 02-05", "il y a 4 j", "dans 5 jours", "Prolonger"],
  ["EV", "Elikem Vondee", "EchoVC · Investisseur", "Révoqué", "red", "—", "Signé le 10-04", "12-06-2026", "—", "Historique"],
];

export function AccessTable({ sent }: { sent: boolean }) {
  return (
    <div className="v2-access-page">
      {sent && <div className="v2-success-banner"><Icon name="shield-check" />Accès envoyé à Amina Diallo. Il reste inactif jusqu’à la vérification de son e-mail et la signature du NDA.</div>}
      <div className="v2-access-filters">
        {["Tous", "Actifs", "En attente", "Expirés / révoqués"].map((label) => (
          <button data-active={label === "Tous"} key={label} type="button">{label}</button>
        ))}
        <Link href="?request=1">1 demande d’accès</Link>
        <span>Invités externes uniquement — <Link href="/v2/team">gérer l’équipe</Link></span>
      </div>
      <div className="v2-access-table-wrap">
        <table className="v2-access-table">
          <thead><tr><th>Personne · organisation</th><th>État d’accès</th><th>Périmètre</th><th>NDA</th><th>Dernière activité</th><th>Expiration</th><th>Action</th></tr></thead>
          <tbody>
            {accessRows.map((row) => (
              <tr key={row[1]}>
                <td><span className="v2-person-avatar">{row[0]}</span><div><strong>{row[1]}</strong><small>{row[2]}</small></div></td>
                <td><span className="v2-status" data-tone={row[4]}>{row[3]}</span></td>
                <td>{row[5]}</td><td>{row[6]}</td><td>{row[7]}</td><td>{row[8]}</td>
                <td><button type="button">{row[9]}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <footer>L’historique d’activité est conservé après révocation ou expiration.</footer>
      </div>
    </div>
  );
}

export function RequestPanel() {
  return (
    <>
      <Link className="v2-scrim" href="?" aria-label="Fermer la demande" />
      <aside className="v2-sidepanel">
        <header>
          <div>
            <span className="v2-status" data-tone="blue">Demande d’accès</span>
            <h2>Impact Capital Africa demande l’accès au dossier financier</h2>
          </div>
          <Link href="?" aria-label="Fermer">×</Link>
        </header>
        <div className="v2-sidepanel-body">
          <div className="v2-request-person">
            <span className="v2-person-avatar">CM</span>
            <div><strong>Clara Morel</strong><small>Impact Capital Africa · Investisseur · via votre fiche dealroom</small></div>
          </div>
          <section><small>Message joint</small><p className="v2-request-quote">Suite à notre échange, nous aimerions examiner vos états financiers et votre plan de trésorerie avant le comité du 12 août.</p></section>
          <div className="v2-detail-grid"><div><small>Périmètre demandé</small><strong>Finance et comptabilité</strong></div></div>
          <p className="v2-panel-note">
            Accorder ouvrira l’assistant de partage : vous choisirez le périmètre exact et les règles avant tout envoi.
          </p>
        </div>
        <footer className="v2-sidepanel-footer">
          <Link href="?">Refuser</Link>
          <button className="v2-btn" data-variant="secondary" type="button">Répondre d’abord</button>
          <Link className="v2-btn" href="?share=recipient">Accorder un accès…</Link>
        </footer>
      </aside>
    </>
  );
}

function GuestPreview() {
  return (
    <>
      <Link className="v2-scrim" href="?share=review" aria-label="Fermer la prévisualisation" />
      <aside className="v2-sidepanel">
        <header>
          <div><span className="v2-status" data-tone="green">Prévisualisation invitée</span><h2>Ce qu’Amina Diallo verra</h2></div>
          <Link href="?share=review" aria-label="Fermer">×</Link>
        </header>
        <div className="v2-sidepanel-body">
          <p className="v2-panel-note">Mode lecture seule · filigrane actif · téléchargement désactivé</p>
          <section className="v2-preview-folders">
            {folderOptions.filter(([, , active]) => active).map(([name, count]) => (
              <div key={name}><Icon name="folder" /><strong>{name}</strong><span>{count}</span></div>
            ))}
          </section>
          <p className="v2-panel-note">Les dossiers non sélectionnés et les exceptions ne sont pas visibles.</p>
        </div>
      </aside>
    </>
  );
}
