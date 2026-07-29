"use client";

import Link from "next/link";
import { useState } from "react";

import { updateIndicators } from "@/features/v2/domain/lever";

import { Icon } from "./Icon";

function href(view: string, step?: string): string {
  const params = new URLSearchParams({ view });
  if (step) params.set("step", step);
  return `?${params.toString()}`;
}

function UpdateTabs({ current }: { current: string }) {
  const tabs = [
    ["overview", "Vue de la levée"],
    ["pipeline", "Pipeline"],
    ["commitments", "Engagements"],
    ["updates", "Mises à jour"],
  ];
  return (
    <nav className="v2-lever-tabs" aria-label="Navigation Lever">
      {tabs.map(([view, label]) => (
        <Link
          data-active={view === "updates" && ["updates", "update", "published"].includes(current)}
          href={href(view)}
          key={view}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}

function Frame({
  children,
  current,
  actions,
}: {
  children: React.ReactNode;
  current: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="v2-lever-page">
      {actions && <div className="v2-lever-actions">{actions}</div>}
      <UpdateTabs current={current} />
      {children}
    </div>
  );
}

export function LeverUpdates({
  current,
  step,
  published,
}: {
  current: string;
  step?: string;
  published: boolean;
}) {
  if (current === "published" || published) return <PublishedUpdate />;
  if (current === "update") return <UpdateWizard step={step ?? "audience"} />;
  return <UpdatesList />;
}

const updates = [
  ["T3 2026 — juillet", "VC et fonds equity", "Capital", "Sahel Growth · Horizon", "Brouillon", "—", "—"],
  ["T2 2026", "DFI et impact", "Dette", "Proparco", "Publiée", "10-07-2026", "4 consultations"],
  ["T2 2026", "VC et fonds equity", "Capital", "Sahel Growth · Horizon · Baobab", "Publiée", "08-07-2026", "9 consultations"],
  ["T1 2026", "Banque", "Dette", "Banque Atlantique", "Publiée", "05-04-2026", "2 consultations"],
] as const;

function UpdatesList() {
  return (
    <Frame
      current="updates"
      actions={
        <Link className="v2-btn" href={href("update", "audience")}>
          <Icon name="plus" />Créer une mise à jour
        </Link>
      }
    >
      <div className="v2-update-filter">
        <button type="button">Période⌄</button>
        <button type="button">Audience⌄</button>
        <button type="button">Instrument⌄</button>
        <span>4 mises à jour</span>
      </div>
      <div className="v2-update-table-wrap">
        <table className="v2-update-table">
          <thead><tr><th>Période</th><th>Audience</th><th>Instrument</th><th>Destinataires</th><th>État</th><th>Date</th><th>Consultations</th></tr></thead>
          <tbody>
            {updates.map((row) => (
              <tr key={`${row[0]}-${row[1]}`}>
                <td><Link href={row[4] === "Publiée" ? href("published") : href("update", "audience")}><strong>{row[0]}</strong></Link></td>
                <td>{row[1]}</td><td>{row[2]}</td><td>{row[3]}</td>
                <td><span className="v2-status" data-tone={row[4] === "Publiée" ? "green" : "neutral"}>{row[4]}</span></td>
                <td>{row[5]}</td><td>{row[6]}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <footer>
          <Icon name="lock" />
          Chaque mise à jour publiée est un instantané historisé. Une audience ne voit
          jamais les autres destinataires. Les consultations restent des signaux de lecture.
        </footer>
      </div>
    </Frame>
  );
}

const wizardSteps = [
  ["audience", "Audience"],
  ["indicators", "Indicateurs"],
  ["comment", "Commentaire"],
  ["review", "Vérification"],
] as const;

function UpdateWizard({ step }: { step: string }) {
  const currentIndex = Math.max(0, wizardSteps.findIndex(([key]) => key === step));
  return (
    <div className="v2-update-wizard">
      <div className="v2-wizard-heading">
        <span>Lever · Mises à jour /</span><strong>Créer une mise à jour</strong>
        <Link href={href("updates")}>×</Link>
      </div>
      <ol className="v2-update-steps">
        {wizardSteps.map(([key, label], index) => (
          <li className={index < currentIndex ? "is-done" : index === currentIndex ? "is-current" : ""} key={key}>
            {index > 0 && <i />}
            <span>{index < currentIndex ? "✓" : index + 1}</span>
            {label}
          </li>
        ))}
      </ol>
      {step === "indicators" ? (
        <IndicatorStep />
      ) : step === "comment" ? (
        <CommentStep />
      ) : step === "review" ? (
        <ReviewStep />
      ) : (
        <AudienceStep />
      )}
    </div>
  );
}

function AudienceStep() {
  return (
    <section className="v2-update-card">
      <header>
        <span className="v2-section-label">Étape 1 sur 4</span>
        <h1>À qui s’adresse cette mise à jour ?</h1>
        <p>La sélection d’indicateurs proposée dépend de l’instrument et du type de financeur.</p>
      </header>
      <div className="v2-update-body">
        <fieldset className="v2-update-choice">
          <legend>Instrument</legend>
          <div>
            <button type="button">Capital<small>Prise de participation</small></button>
            <button data-active="true" type="button">Dette<small>Prêt ou ligne de crédit</small></button>
            <button type="button">Financement DFI ou à impact<small>Capital, dette ou mixte</small></button>
          </div>
        </fieldset>
        <fieldset className="v2-update-choice">
          <legend>Type de financeur</legend>
          <div>
            <button type="button">VC ou fonds d’investissement</button>
            <button type="button">Banque ou prêteur</button>
            <button data-active="true" type="button">DFI ou investisseur à impact</button>
          </div>
        </fieldset>
        <label className="v2-field">
          <span>Destinataires</span>
          <span className="v2-control"><input defaultValue="Awa Cissé — Proparco" /><Icon name="chevron" /></span>
          <small className="v2-field-helper">Une audience ne voit jamais les autres destinataires.</small>
        </label>
        <label className="v2-field">
          <span>Période</span>
          <span className="v2-control"><input defaultValue="Trimestre — T3 2026" /><Icon name="chevron" /></span>
        </label>
        <div className="v2-audience-summary">
          <Icon name="trend" />
          <p>
            Les indicateurs proposés sont adaptés à <strong>une DFI ou un investisseur
            à impact</strong> pour une opération en <strong>dette</strong> : capacité
            de remboursement <strong>+ impact, gouvernance et ESG</strong>.
            Vous pouvez les modifier avant publication.
          </p>
        </div>
      </div>
      <footer>
        <Link href={href("updates")}>Annuler</Link>
        <Link className="v2-btn" href={href("update", "indicators")}>Continuer → Indicateurs</Link>
      </footer>
    </section>
  );
}

function IndicatorStep() {
  const defaults = Object.fromEntries(updateIndicators.map((indicator, index) => [indicator.id, index < 8]));
  const [shared, setShared] = useState<Record<string, boolean>>(defaults);
  const recommended = updateIndicators.slice(0, 8);
  const other = updateIndicators.slice(8);

  return (
    <section className="v2-update-card v2-indicator-card">
      <header>
        <span className="v2-section-label">Étape 2 sur 4</span>
        <h1>Indicateurs — Dette + DFI</h1>
        <p>Trois groupes : recommandés pour cette audience, autres disponibles, personnalisés. Rien n’est publié sans confirmation.</p>
      </header>
      <div className="v2-update-body">
        <IndicatorGroup
          indicators={recommended}
          shared={shared}
          setShared={setShared}
          title="Recommandés pour cette audience"
        />
        <IndicatorGroup
          indicators={other}
          shared={shared}
          setShared={setShared}
          title="Autres indicateurs disponibles"
        />
        <button className="v2-custom-indicator" type="button">
          <Icon name="plus" />
          <span><strong>Créer un indicateur personnalisé</strong><small>Nom, définition, période, unité et statut de vérification.</small></span>
        </button>
        <p className="v2-indicator-disclaimer">
          <Icon name="shield" />Un indicateur n’est jamais présenté comme audité parce
          qu’il est publié dans Sanza — le statut est déclaré par vous. Les ratios sans
          données sources n’apparaissent pas.
        </p>
      </div>
      <footer>
        <Link href={href("update", "audience")}>← Audience</Link>
        <Link className="v2-btn" href={href("update", "comment")}>Continuer → Commentaire</Link>
      </footer>
    </section>
  );
}

function IndicatorGroup({
  indicators,
  shared,
  setShared,
  title,
}: {
  indicators: typeof updateIndicators;
  shared: Record<string, boolean>;
  setShared: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  title: string;
}) {
  return (
    <section className="v2-indicator-group">
      <header><h2>{title}</h2><span>{indicators.filter((item) => shared[item.id]).length} partagés</span></header>
      {indicators.map((indicator) => (
        <div className="v2-indicator-row" data-shared={shared[indicator.id]} key={indicator.id}>
          <button
            aria-label={`Partager ${indicator.name}`}
            aria-pressed={shared[indicator.id]}
            className="v2-switch"
            data-active={shared[indicator.id]}
            onClick={() => setShared((current) => ({ ...current, [indicator.id]: !current[indicator.id] }))}
            type="button"
          ><span /></button>
          <div className="v2-indicator-copy">
            <div><strong>{indicator.name}</strong>{["Impact", "ESG"].includes(indicator.family) && <span className="v2-tag">{indicator.family}</span>}</div>
            <small>{indicator.definition} · {indicator.period}</small>
          </div>
          <label>
            <span>Valeur</span>
            <input defaultValue={indicator.value} />
          </label>
          <label>
            <span>Statut</span>
            <select defaultValue={indicator.status}>
              <option>Déclaré</option><option>Vérifié en interne</option><option>Audité</option>
            </select>
          </label>
        </div>
      ))}
    </section>
  );
}

function CommentStep() {
  return (
    <section className="v2-update-card">
      <header>
        <span className="v2-section-label">Étape 3 sur 4</span>
        <h1>Donnez le contexte du trimestre</h1>
        <p>Expliquez ce que les chiffres ne racontent pas seuls et formulez une demande claire.</p>
      </header>
      <div className="v2-update-body">
        <label className="v2-field v2-configure-textarea">
          <span>Résumé du dirigeant</span>
          <textarea defaultValue="Trimestre conforme au plan : flux opérationnel en hausse, service de la dette couvert à 1,6x, 12 400 ménages nouvellement desservis. Priorité du T4 : extension de deux mini-centrales dans la région de Kolda." />
          <small className="v2-field-helper">Visible par tous les destinataires de cette audience.</small>
        </label>
        <label className="v2-field v2-configure-textarea">
          <span>Demande au financeur <small>— facultative</small></span>
          <textarea defaultValue="Introduction auprès du guichet énergie décentralisée de la BOAD pour un cofinancement de la phase Kolda." />
        </label>
        <div className="v2-attachment-row">
          <Icon name="file" /><div><strong>rapport T2.pdf</strong><small>PDF · 2,4 Mo</small></div><button type="button">Remplacer</button>
        </div>
        <p className="v2-panel-callout"><Icon name="users" />Le commentaire et la pièce jointe ne seront partagés qu’avec Awa Cissé — Proparco.</p>
      </div>
      <footer>
        <Link href={href("update", "indicators")}>← Indicateurs</Link>
        <Link className="v2-btn" href={href("update", "review")}>Continuer → Vérification</Link>
      </footer>
    </section>
  );
}

const previewIndicators = updateIndicators.slice(0, 8);

function ReviewStep() {
  return (
    <section className="v2-update-card v2-review-update-card">
      <header>
        <span className="v2-section-label">Étape 4 sur 4</span>
        <h1>Vérifiez avant de publier</h1>
        <p>Voici exactement la mise à jour que recevra Proparco — rien de plus.</p>
      </header>
      <div className="v2-update-body">
        <div className="v2-recipient-preview">
          <header>
            <div><span>Aperçu destinataire</span><strong>Awa Cissé, Proparco</strong></div>
            <span className="v2-status" data-tone="blue">Dette + DFI · T3 2026</span>
          </header>
          <section>
            <span className="v2-section-label">Résumé du dirigeant</span>
            <p>Trimestre conforme au plan : flux opérationnel en hausse, service de la dette couvert à 1,6x, 12 400 ménages nouvellement desservis. Priorité du T4 : extension de deux mini-centrales dans la région de Kolda.</p>
          </section>
          <section>
            <div className="v2-preview-section-title"><span className="v2-section-label">Indicateurs</span><strong>8 partagés</strong></div>
            <div className="v2-preview-metrics">
              {previewIndicators.map((indicator) => (
                <div key={indicator.id}>
                  <span>{indicator.name.replace(" — couverture du service de la dette", "")}</span>
                  <strong>{indicator.value}</strong>
                  <small>{indicator.comparison ?? "—"}</small>
                  <em>{indicator.status}</em>
                </div>
              ))}
            </div>
          </section>
          <section className="v2-preview-request"><strong>Demande :</strong> introduction auprès du guichet énergie décentralisée de la BOAD pour un cofinancement de la phase Kolda.</section>
        </div>
        <div className="v2-publication-grid">
          <div><span>Destinataires</span><strong>Awa Cissé (Proparco)</strong><small>accès en lecture, journalisé</small></div>
          <div><span>Publication</span><strong>Immédiate · instantané versionné V1</strong></div>
          <div><span>Contenu</span><strong>8 indicateurs confirmés</strong><small>1 retiré : dette totale (sensible)</small></div>
          <div><span>Pièce jointe</span><strong>rapport T2.pdf</strong></div>
        </div>
      </div>
      <footer>
        <Link href={href("update", "comment")}>← Commentaire</Link>
        <div><button className="v2-btn" data-variant="secondary" type="button">Programmer</button><Link className="v2-btn" href={`${href("published")}&published=1`}>Publier la mise à jour</Link></div>
      </footer>
    </section>
  );
}

function PublishedUpdate() {
  return (
    <Frame
      current="published"
      actions={
        <>
          <button className="v2-btn" data-variant="secondary" type="button">Créer une correction (V2)</button>
          <Link className="v2-btn" href={href("update", "audience")}>Créer la mise à jour suivante</Link>
        </>
      }
    >
      <article className="v2-published-update">
        <header>
          <div><span className="v2-section-label">Mise à jour financeur</span><h1>Mise à jour T2 2026 — Proparco</h1></div>
          <div><span className="v2-status" data-tone="green">Publiée</span><small>V1 · figée</small></div>
        </header>
        <p>Trimestre conforme au plan : flux opérationnel en hausse, DSCR à 1,6x, 12 400 ménages nouvellement desservis…</p>
        <div className="v2-published-metrics">
          <div><span>DSCR</span><strong>1,6x</strong></div><div><span>Flux opérationnel</span><strong>36 M XOF</strong></div>
          <div><span>Ménages desservis</span><strong>12 400</strong></div><div><span>Emplois directs</span><strong>68</strong></div>
          <div><span>Émissions évitées</span><strong>1 850 tCO₂e</strong></div><div><span>Incidents E&S</span><strong>0</strong></div>
        </div>
        <p className="v2-frozen-note"><Icon name="lock" />Contenu figé au 10-07-2026 · toute correction crée une V2, l’historique reste consultable.</p>
        <section>
          <h2>Publication</h2>
          <div className="v2-publication-grid">
            <div><span>Publiée le</span><strong>10-07-2026 · 09:12</strong></div>
            <div><span>Par</span><strong>Amara Diallo</strong></div>
            <div><span>Pièce jointe</span><strong>rapport T2.pdf</strong></div>
          </div>
        </section>
        <section>
          <h2>Destinataires et consultations</h2>
          <div className="v2-update-recipient">
            <span>AC</span><div><strong>Awa Cissé</strong><small>Proparco</small></div><strong>4 consultations · dern. 22-07</strong><button type="button">Révoquer</button>
          </div>
          <p className="v2-rule-note"><Icon name="eye" />Les consultations sont des signaux de lecture — ni une approbation du contenu, ni une intention de financement. La révocation bloque les futures consultations mais conserve le journal.</p>
        </section>
      </article>
    </Frame>
  );
}
