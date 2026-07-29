import { EmptyArt } from "./EmptyArt";
import Link from "next/link";

import {
  investorPipeline,
  securedAmount,
  type CommitmentLevel,
  type DocumentAccessState,
  type InvestorRecord,
  type RelationshipStage,
} from "@/features/v2/domain/lever";
import { v2Routes } from "@/features/v2/navigation/routes";

import { Icon } from "./Icon";
import { LeverUpdates } from "./LeverUpdates";

export type LeverQuery = {
  view?: string;
  mode?: string;
  panel?: string;
  step?: string;
  configured?: string;
  published?: string;
};

const stageOrder: readonly RelationshipStage[] = [
  "À cibler",
  "Contacté",
  "Premier échange",
  "Intéressé",
  "Diligence",
  "Comité ou offre",
  "Engagé",
];

function queryHref(
  view: string,
  extra: Record<string, string | undefined> = {},
): string {
  const params = new URLSearchParams({ view });
  Object.entries(extra).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  return `?${params.toString()}`;
}

function toneForAccess(access: DocumentAccessState): string {
  if (access === "Accès actif" || access === "NDA signé") return "green";
  if (access === "Invitation envoyée") return "blue";
  if (access === "Révoqué") return "red";
  return "neutral";
}

function toneForCommitment(commitment: CommitmentLevel): string {
  if (commitment === "Confirmé") return "green";
  if (commitment === "Soft-commit") return "orange";
  if (commitment === "Intérêt indicatif") return "blue";
  return commitment === "Retiré" ? "red" : "neutral";
}

function LeverTabs({ current }: { current: string }) {
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
          data-active={
            current === view ||
            (view === "updates" && ["update", "published"].includes(current))
          }
          href={queryHref(view)}
          key={view}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}

function LeverFrame({
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
      <LeverTabs current={current} />
      {children}
    </div>
  );
}

export function Lever({
  operationId,
  query,
}: {
  operationId: string;
  query: LeverQuery;
}) {
  const current = query.view ?? "overview";

  if (current === "setup") return <LeverEmpty />;
  if (current === "configure") return <ConfigureRaise />;
  if (current === "pipeline") {
    return (
      <Pipeline
        mode={query.mode ?? "columns"}
        panel={query.panel}
        operationId={operationId}
      />
    );
  }
  if (current === "commitments") {
    return <Commitments panel={query.panel} />;
  }
  if (current === "close") return <CloseRaise />;
  if (current === "updates" || current === "update" || current === "published") {
    return (
      <LeverUpdates
        current={current}
        published={query.published === "1"}
        step={query.step}
      />
    );
  }

  return <RaiseOverview configured={query.configured === "1"} />;
}

function LeverEmpty() {
  return (
    <LeverFrame current="overview">
      <section className="v2-lever-empty">
        <EmptyArt name="search" />
        <h1>Structurez votre levée</h1>
        <p>
          Définissez l’objectif, le calendrier et les investisseurs à approcher.
          Lever devient ensuite votre centre de pilotage : progression financière,
          pipeline relationnel, relances et mises à jour.
        </p>
        <div>
          <Link className="v2-btn" href={queryHref("configure")}>
            Configurer ma levée
          </Link>
          <Link
            className="v2-btn"
            data-variant="secondary"
            href={queryHref("pipeline", { panel: "add" })}
          >
            Ajouter un investisseur
          </Link>
        </div>
        <small>
          Ajouter un investisseur au pipeline ne lui donne jamais accès à la data room.
        </small>
      </section>
    </LeverFrame>
  );
}

function ConfigureRaise() {
  return (
    <div className="v2-lever-focus">
      <div className="v2-wizard-heading">
        <span>Lever /</span><strong>Configurer la levée</strong>
        <Link href={queryHref("setup")}>×</Link>
      </div>
      <section className="v2-configure-card">
        <header>
          <h1>Configurer la levée</h1>
          <p>Les informations restent modifiables tant que la levée n’est pas clôturée.</p>
        </header>

        <div className="v2-configure-section">
          <span className="v2-configure-number">1</span>
          <div>
            <h2>Objectif</h2>
            <div className="v2-wizard-grid">
              <Field label="Nom de la levée" value="Série A 2026" />
              <Field label="Stade" value="Série A" select />
              <Field label="Montant recherché" value="500 000 000" />
              <Field label="Devise" value="XOF — Franc CFA" select />
              <Field label="Instrument envisagé" value="Prise de participation" select wide />
            </div>
          </div>
        </div>

        <div className="v2-configure-section">
          <span className="v2-configure-number">2</span>
          <div>
            <h2>Conditions déclarées</h2>
            <div className="v2-wizard-grid">
              <Field label="Ticket minimum" value="25 000 000" />
              <Field label="Ticket maximum" value="150 000 000" />
              <Field label="Recherche d’un lead" value="Oui" select />
              <Field label="Valorisation déclarée" value="— facultatif" />
              <Field label="Part de capital envisagée" value="— facultatif" wide />
            </div>
          </div>
        </div>

        <div className="v2-configure-section">
          <span className="v2-configure-number">3</span>
          <div>
            <h2>Cibles</h2>
            <Field label="Types d’investisseurs" value="VC · Fonds à impact · DFI" />
            <div className="v2-configure-gap" />
            <Field label="Zones géographiques" value="Afrique de l’Ouest · Europe" />
            <div className="v2-configure-gap" />
            <Field label="Secteurs ou thèses pertinentes" value="Énergie distribuée · Climat" />
          </div>
        </div>

        <div className="v2-configure-section">
          <span className="v2-configure-number">4</span>
          <div>
            <h2>Calendrier et utilisation</h2>
            <div className="v2-wizard-grid">
              <Field label="Date d’ouverture" value="29 juillet 2026" />
              <Field label="Date cible de clôture" value="30 novembre 2026" />
            </div>
            <label className="v2-field v2-configure-textarea">
              <span>Principaux usages des fonds</span>
              <textarea defaultValue="Extension du réseau de mini-centrales (60 %), recrutement technique (25 %), fonds de roulement (15 %)" />
            </label>
          </div>
        </div>

        <div className="v2-configure-summary">
          <span className="v2-section-label">Synthèse avant activation</span>
          <p>
            <strong>Série A 2026 — 500 000 000 XOF</strong> en prise de participation ·
            lead recherché · tickets 25 – 150 M XOF · clôture visée le 30 novembre 2026.
          </p>
          <small>
            Sanza ne calcule ni ne recommande de valorisation, de dilution ou de
            montant — ces informations sont déclarées par vous.
          </small>
        </div>
        <footer>
          <Link href={queryHref("setup")}>Annuler</Link>
          <div>
            <button className="v2-btn" data-variant="secondary" type="button">
              Enregistrer le brouillon
            </button>
            <Link className="v2-btn" href={queryHref("overview", { configured: "1" })}>
              Activer la levée
            </Link>
          </div>
        </footer>
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  select = false,
  wide = false,
}: {
  label: string;
  value: string;
  select?: boolean;
  wide?: boolean;
}) {
  return (
    <label className="v2-field" data-wide={wide}>
      <span>{label}</span>
      <span className="v2-control">
        <input defaultValue={value} />
        {select && <Icon name="chevron" />}
      </span>
    </label>
  );
}

function RaiseOverview({ configured }: { configured: boolean }) {
  return (
    <LeverFrame
      current="overview"
      actions={
        <>
          <Link className="v2-btn" data-variant="secondary" href={queryHref("configure")}>
            Modifier la levée
          </Link>
          <Link className="v2-btn" href={queryHref("pipeline", { panel: "add" })}>
            <Icon name="plus" />Ajouter un investisseur
          </Link>
        </>
      }
    >
      {configured && (
        <div className="v2-success-banner">
          <Icon name="check" />La levée est active. Votre équipe peut maintenant piloter
          les relations et déclarer les engagements.
        </div>
      )}
      <div className="v2-lever-title">
        <div>
          <h1>Série A 2026 <span className="v2-status" data-tone="green">Active</span></h1>
          <p><Icon name="calendar" />Clôture visée le 30 novembre 2026</p>
        </div>
        <Link href={queryHref("close")}>Clôturer la levée</Link>
      </div>

      <section className="v2-finance-card">
        <header>
          <div>
            <span className="v2-section-label">Progression financière</span>
            <p>Montants déclarés par votre équipe — jamais déduits de l’activité documentaire</p>
          </div>
          <strong>40 %</strong>
        </header>
        <div className="v2-money-lead">
          <strong>200 000 000</strong>
          <span>sécurisés sur 500 000 000 XOF</span>
        </div>
        <div className="v2-money-progress"><span /></div>
        <div className="v2-money-grid">
          <div><span>Engagements confirmés</span><strong>120 000 000</strong></div>
          <div><span>Soft-commits déclarés</span><strong>80 000 000</strong></div>
          <div><span>Restant à sécuriser</span><strong>300 000 000</strong></div>
        </div>
        <small>Les intérêts indicatifs ne sont pas comptés.</small>
      </section>

      <div className="v2-lever-overview-grid">
        <section className="v2-lever-card">
          <header>
            <h2>Prochaines actions</h2>
            <Link href={queryHref("pipeline")}>Voir toutes les actions →</Link>
          </header>
          <ActionRow title="Relancer David Mensima" organisation="Baobab Ventures" owner="Amara" date="demain" />
          <ActionRow title="Envoyer la table de capitalisation" organisation="Horizon Ventures" owner="Ibrahima" date="aujourd’hui" />
          <ActionRow title="Préparer le Q&A de diligence" organisation="Sahel Growth Fund" owner="Amara" date="5 août" />
          <ActionRow title="Confirmer le call de cadrage" organisation="Impact Capital Africa" owner="Amara" date="26 juil." late />
        </section>

        <section className="v2-lever-card">
          <header><h2>Activité récente</h2></header>
          <ActivityRow title="Engagement confirmé enregistré" detail="Sahel Growth Fund, 120 M XOF" date="hier 17:30 · par Amara" />
          <ActivityRow title="Soft-commit déclaré" detail="Horizon Ventures, 80 M XOF" date="hier 11:05 · par Amara" />
          <ActivityRow title="NDA signé" detail="Kwame Mensah" date="hier 16:40" />
          <ActivityRow title="Réunion consignée" detail="Impact Capital Africa" date="25-07 · par Fatou" />
        </section>
      </div>

      <section className="v2-lever-card v2-raise-settings">
        <header><h2>Paramètres essentiels</h2><Link href={queryHref("configure")}>Modifier la levée</Link></header>
        <div>
          <div><span>Stade</span><strong>Série A</strong></div>
          <div><span>Instrument</span><strong>Prise de participation</strong></div>
          <div><span>Ticket recherché</span><strong>25 – 150 M XOF</strong></div>
          <div><span>Lead</span><strong>Recherché</strong></div>
          <div><span>Date cible</span><strong>30-11-2026</strong></div>
          <div><span>Usages des fonds</span><strong>Réseau 60 % · équipe 25 % · BFR 15 %</strong></div>
        </div>
      </section>
    </LeverFrame>
  );
}

function ActionRow({
  title,
  organisation,
  owner,
  date,
  late = false,
}: {
  title: string;
  organisation: string;
  owner: string;
  date: string;
  late?: boolean;
}) {
  return (
    <div className="v2-action-row">
      <span className="v2-action-check" />
      <div><strong>{title}</strong><small>— {organisation}</small></div>
      <span>{owner}</span>
      <span className="v2-status" data-tone={late ? "red" : "neutral"}>{late ? "En retard · " : ""}{date}</span>
    </div>
  );
}

function ActivityRow({ title, detail, date }: { title: string; detail: string; date: string }) {
  return (
    <div className="v2-activity-row">
      <span />
      <div><strong>{title} — {detail}</strong><small>{date}</small></div>
    </div>
  );
}

function Pipeline({
  mode,
  panel,
  operationId,
}: {
  mode: string;
  panel?: string;
  operationId: string;
}) {
  return (
    <>
      <LeverFrame
        current="pipeline"
        actions={
          <>
            <div className="v2-view-toggle">
              <Link data-active={mode === "table"} href={queryHref("pipeline", { mode: "table" })}><Icon name="list" />Tableau</Link>
              <Link data-active={mode !== "table"} href={queryHref("pipeline", { mode: "columns" })}><Icon name="columns" />Colonnes</Link>
            </div>
            <Link className="v2-btn" href={queryHref("pipeline", { mode, panel: "add" })}>
              <Icon name="plus" />Ajouter un investisseur
            </Link>
          </>
        }
      >
        <div className="v2-pipeline-filter">
          <button type="button">Catégorie⌄</button>
          <button type="button">Responsable⌄</button>
          <button type="button">Accès⌄</button>
          <button type="button">Engagement⌄</button>
          <span>Relance en retard · 1</span>
          <small>Refusés (1) — repliés</small>
        </div>
        {mode === "table" ? <PipelineTable /> : <PipelineColumns />}
      </LeverFrame>
      {panel === "add" && <AddInvestorPanel />}
      {panel === "investor" && <InvestorPanel operationId={operationId} />}
      {panel === "interaction" && <InteractionPanel />}
      {panel === "commitment" && <CommitmentPanel backView="pipeline" />}
    </>
  );
}

function InvestorIdentity({ investor }: { investor: InvestorRecord }) {
  return (
    <div className="v2-investor-identity">
      <span>{investor.initials}</span>
      <div><strong>{investor.organisation}</strong><small>{investor.contact} · {investor.category}</small></div>
    </div>
  );
}

function PipelineColumns() {
  return (
    <>
      <div className="v2-kanban">
        {stageOrder.map((stage) => {
          const records = investorPipeline.filter((investor) => investor.stage === stage);
          return (
            <section className="v2-kanban-column" key={stage}>
              <header><strong>{stage}</strong><span>{records.length}</span></header>
              {records.length === 0 ? (
                <div className="v2-kanban-empty">Aucune relation</div>
              ) : (
                records.map((investor) => (
                  <Link className="v2-investor-card" href={queryHref("pipeline", { mode: "columns", panel: "investor" })} key={investor.organisation}>
                    <InvestorIdentity investor={investor} />
                    <div className="v2-investor-badges">
                      <span className="v2-status" data-tone={toneForAccess(investor.access)}>{investor.access}</span>
                      {investor.commitment !== "Aucun" && <span className="v2-status" data-tone={toneForCommitment(investor.commitment)}>{investor.commitment} {investor.amount ? `${investor.amount / 1_000_000} M` : ""}</span>}
                    </div>
                    <small><Icon name="clock" />{investor.nextAction}</small>
                  </Link>
                ))
              )}
            </section>
          );
        })}
      </div>
      <p className="v2-rule-note">
        <Icon name="shield" />Déplacer une carte change uniquement l’étape de la relation —
        jamais l’accès documentaire ni le montant déclaré.
      </p>
    </>
  );
}

function PipelineTable() {
  return (
    <div className="v2-pipeline-table-wrap">
      <table className="v2-pipeline-table">
        <thead><tr>
          <th>Organisation · contact</th><th>Étape de relation</th><th>Dernière interaction</th>
          <th>Prochaine action</th><th>Responsable</th><th>Accès documentaire</th>
          <th>Engagement financier</th><th>Montant (XOF)</th>
        </tr></thead>
        <tbody>
          {investorPipeline.map((investor) => (
            <tr key={investor.organisation}>
              <td><Link href={queryHref("pipeline", { mode: "table", panel: "investor" })}><InvestorIdentity investor={investor} /></Link></td>
              <td><span className="v2-status" data-tone="blue">{investor.stage}</span></td>
              <td>{investor.lastInteraction}</td><td>{investor.nextAction}</td><td>{investor.owner}</td>
              <td><span className="v2-status" data-tone={toneForAccess(investor.access)}>{investor.access}</span></td>
              <td><span className="v2-status" data-tone={toneForCommitment(investor.commitment)}>{investor.commitment}</span></td>
              <td>{investor.amount?.toLocaleString("fr-FR") ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <footer>
        <span>4 relations actives · 1 refusée (repliée)</span>
        <strong>Sécurisé : {securedAmount(investorPipeline) / 1_000_000} M / 500 M XOF</strong>
        <small>Les intérêts indicatifs ne comptent pas.</small>
      </footer>
    </div>
  );
}

function PanelShell({
  children,
  title,
  eyebrow,
  closeHref,
  footer,
  wide = false,
}: {
  children: React.ReactNode;
  title: string;
  eyebrow: string;
  closeHref: string;
  footer?: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <>
      <Link className="v2-scrim" href={closeHref} aria-label="Fermer" />
      <aside className="v2-sidepanel v2-lever-panel" data-wide={wide}>
        <header>
          <div><span className="v2-section-label">{eyebrow}</span><h2>{title}</h2></div>
          <Link href={closeHref}>×</Link>
        </header>
        <div className="v2-sidepanel-body">{children}</div>
        {footer && <footer className="v2-sidepanel-footer">{footer}</footer>}
      </aside>
    </>
  );
}

function AddInvestorPanel() {
  const close = queryHref("pipeline");
  return (
    <PanelShell
      eyebrow="Lever · Pipeline"
      title="Ajouter un investisseur"
      closeHref={close}
      footer={<><Link href={close}>Annuler</Link><Link className="v2-btn" href={queryHref("pipeline", { panel: "investor" })}>Ajouter au pipeline</Link></>}
    >
      <p className="v2-panel-callout">
        <Icon name="shield" />Ajouté au pipeline uniquement — aucun accès documentaire n’est créé.
      </p>
      <div className="v2-wizard-grid">
        <Field label="Organisation" value="Kora Impact Partners" wide />
        <Field label="Catégorie" value="VC" select />
        <Field label="Contact principal" value="Nadia Mensah" />
        <Field label="Fonction" value="Partner" />
        <Field label="E-mail" value="nadia@koraimpact.com" wide />
        <Field label="Pays ou zone" value="Ghana · Afrique de l’Ouest" wide />
        <Field label="Ticket potentiel" value="100 000 000 XOF" wide />
      </div>
      <small className="v2-field-helper">Indicatif — jamais compté comme engagement.</small>
      <div className="v2-wizard-grid">
        <Field label="Source de la relation" value="Introduction — Dakar Accelerator" wide />
        <Field label="Responsable interne" value="Amara Diallo" select />
        <Field label="Étape initiale" value="Contacté" select />
        <Field label="Prochaine action" value="Envoyer le teaser" />
        <Field label="Date de relance" value="2 août 2026" />
      </div>
      <label className="v2-field v2-configure-textarea">
        <span>Notes internes</span>
        <textarea defaultValue="Rencontrée au sommet Africa Energy Forum. Thèse énergie distribuée, tickets Série A en Afrique de l’Ouest." />
        <small className="v2-field-helper">Jamais visibles par l’investisseur.</small>
      </label>
    </PanelShell>
  );
}

function InvestorPanel({ operationId }: { operationId: string }) {
  const investor = investorPipeline[1];
  const close = queryHref("pipeline");
  return (
    <PanelShell
      eyebrow="Fiche investisseur"
      title="Horizon Ventures"
      closeHref={close}
      wide
      footer={
        <>
          <Link href={queryHref("pipeline", { panel: "interaction" })}>Ajouter une interaction</Link>
          <Link className="v2-btn" data-variant="secondary" href={queryHref("pipeline", { panel: "commitment" })}>Enregistrer un engagement</Link>
          <Link className="v2-btn" href={`${v2Routes.operations.access(operationId)}?share=recipient`}>Créer un accès documentaire</Link>
        </>
      }
    >
      <div className="v2-panel-investor-head">
        <span>{investor.initials}</span>
        <div><strong>{investor.organisation}</strong><small>Kwame Mensah · Partner · VC · Accra</small></div>
      </div>
      <nav className="v2-panel-tabs">
        {["Résumé", "Interactions", "Activité documentaire", "Accès", "Engagements", "Questions", "Notes internes"].map((item) => <button data-active={item === "Résumé"} key={item} type="button">{item}</button>)}
      </nav>
      <div className="v2-three-dimensions">
        <div><span>Relation</span><strong className="v2-status" data-tone="blue">Intéressé</strong></div>
        <div><span>Accès documentaire</span><strong className="v2-status" data-tone="green">NDA signé</strong></div>
        <div><span>Engagement</span><strong className="v2-status" data-tone="orange">Soft-commit</strong></div>
      </div>
      <div className="v2-panel-kv">
        <div><span>Montant déclaré</span><strong>80 000 000 XOF</strong><small>soft-commit, 27-07</small></div>
        <div><span>Responsable interne</span><strong>Ibrahima Sy</strong></div>
        <div><span>Dernière interaction</span><strong>NDA signé — hier 16:40</strong></div>
        <div><span>Prochaine action</span><strong>Envoyer la cap table — aujourd’hui</strong></div>
      </div>
      <section className="v2-signal-card">
        <span className="v2-section-label">Signaux documentaires</span>
        <div><div><strong>3</strong><small>Visites</small></div><div><strong>5 / 18</strong><small>Docs consultés</small></div><div><strong>41 min</strong><small>Temps total</small></div></div>
        <p>Des signaux d’engagement — jamais une probabilité d’investissement.</p>
      </section>
      <section className="v2-notes-card">
        <span className="v2-section-label">Notes essentielles</span>
        <p>Veut voir la cap table et la répartition avant le comité interne du 8 août. Sensible au co-investissement avec un lead local.</p>
      </section>
    </PanelShell>
  );
}

function InteractionPanel() {
  const close = queryHref("pipeline", { panel: "investor" });
  return (
    <PanelShell eyebrow="Horizon Ventures · Kwame Mensah" title="Ajouter une interaction" closeHref={close} footer={<><Link href={close}>Annuler</Link><Link className="v2-btn" href={close}>Enregistrer l’interaction</Link></>}>
      <fieldset className="v2-choice-field">
        <legend>Type</legend>
        <div>{["E-mail", "Appel", "Réunion", "Événement", "Note", "Autre"].map((type) => <button data-active={type === "Réunion"} key={type} type="button">{type}</button>)}</div>
      </fieldset>
      <div className="v2-wizard-grid"><Field label="Date" value="29 juillet 2026" /><Field label="Responsable" value="Ibrahima Sy" select /></div>
      <Field label="Participants" value="Kwame Mensah · Amara Diallo" wide />
      <label className="v2-field v2-configure-textarea"><span>Résumé</span><textarea defaultValue="Revue du plan de trésorerie. Kwame veut la table de capitalisation détaillée avant son comité interne du 8 août. Ton positif, questions sur la structure du tour." /></label>
      <Field label="Résultat" value="Positif — attend la cap table" wide />
      <div className="v2-wizard-grid"><Field label="Prochaine action" value="Envoyer la cap table" /><Field label="Date de relance" value="30 juillet 2026" /></div>
      <p className="v2-panel-callout"><Icon name="mail" />Cette interaction est consignée par votre équipe — Sanza n’envoie ni ne détecte d’e-mail.</p>
    </PanelShell>
  );
}

function CommitmentPanel({ backView }: { backView: string }) {
  const close = queryHref(backView, backView === "pipeline" ? { panel: "investor" } : {});
  return (
    <PanelShell eyebrow="Déclaration de l’équipe" title="Enregistrer un engagement" closeHref={close} footer={<><Link href={close}>Annuler</Link><Link className="v2-btn" href={queryHref(backView)}>Enregistrer l’engagement</Link></>}>
      <Field label="Investisseur" value="Horizon Ventures — Kwame Mensah" select wide />
      <fieldset className="v2-level-choice">
        <legend>Niveau</legend>
        <label><input name="level" type="radio" /><span><strong>Intérêt indicatif</strong><small>Un ordre de grandeur évoqué — non compté dans le montant sécurisé</small></span></label>
        <label data-active="true"><input defaultChecked name="level" type="radio" /><span><strong>Soft-commit déclaré</strong><small>Intention communiquée explicitement, non contractuelle</small></span></label>
        <label><input name="level" type="radio" /><span><strong>Engagement confirmé</strong><small>Confirmation écrite ou term sheet signé</small></span></label>
      </fieldset>
      <div className="v2-wizard-grid"><Field label="Montant" value="80 000 000" /><Field label="Devise" value="XOF" select /><Field label="Date" value="29 juillet 2026" wide /></div>
      <Field label="Preuve ou référence" value="E-mail du 27-07-2026" wide />
      <label className="v2-field v2-configure-textarea"><span>Commentaire</span><textarea defaultValue="Confirmé oralement puis par e-mail — sous réserve du comité du 8 août." /></label>
      <p className="v2-panel-callout"><Icon name="shield" />Cet engagement est déclaré par votre équipe. Il n’est pas déduit de l’activité documentaire de l’investisseur.</p>
    </PanelShell>
  );
}

function Commitments({ panel }: { panel?: string }) {
  return (
    <>
      <LeverFrame current="commitments" actions={<Link className="v2-btn" href={queryHref("commitments", { panel: "commitment" })}>Enregistrer un engagement</Link>}>
        <div className="v2-commitment-stats">
          <section><span>Engagements confirmés</span><strong>120 000 000</strong><small>XOF · 1 investisseur</small></section>
          <section><span>Soft-commits déclarés</span><strong>80 000 000</strong><small>XOF · 1 investisseur</small></section>
          <section><span>Restant à sécuriser</span><strong>300 000 000</strong><small>XOF sur 500 M</small></section>
        </div>
        <div className="v2-commitment-table-wrap">
          <table className="v2-commitment-table">
            <thead><tr><th>Investisseur</th><th>Niveau</th><th>Montant</th><th>Devise</th><th>Date</th><th>Dernière modification</th><th>Responsable</th><th>Action</th></tr></thead>
            <tbody>
              <tr><td><strong>Sahel Growth Fund</strong><small>Amina Diallo</small></td><td><span className="v2-status" data-tone="green">Confirmé</span></td><td>120 000 000</td><td>XOF</td><td>27-07-2026</td><td>—</td><td>Amara</td><td><button type="button">Modifier</button></td></tr>
              <tr><td><strong>Horizon Ventures</strong><small>Kwame Mensah</small></td><td><span className="v2-status" data-tone="orange">Soft-commit</span></td><td>80 000 000</td><td>XOF</td><td>27-07-2026</td><td>—</td><td>Ibrahima</td><td><button type="button">Modifier</button></td></tr>
            </tbody>
          </table>
        </div>
        <section className="v2-history-card">
          <h2>Historique des modifications</h2>
          <ActivityRow title="Sahel Growth Fund" detail="intérêt indicatif (100 M) requalifié en engagement confirmé (120 M)" date="27-07 · par Amara · preuve : term sheet signé" />
          <ActivityRow title="Horizon Ventures" detail="soft-commit de 80 M enregistré" date="27-07 · par Ibrahima · preuve : e-mail du 27-07" />
          <p>Une modification ou un retrait conserve l’historique. Les intérêts indicatifs ne sont jamais additionnés aux totaux.</p>
        </section>
      </LeverFrame>
      {panel === "commitment" && <CommitmentPanel backView="commitments" />}
    </>
  );
}

function CloseRaise() {
  return (
    <div className="v2-close-page">
      <div className="v2-wizard-heading"><span>Lever /</span><strong>Clôturer la levée</strong><Link href={queryHref("overview")}>×</Link></div>
      <section className="v2-close-card">
        <header><h1>Clôturer la levée — Série A 2026</h1><p>Vérifiez le récapitulatif : après clôture, l’opération passe en lecture seule.</p></header>
        <div className="v2-close-summary">
          <div><span>Montant finalement levé</span><strong>450 000 000 XOF</strong><small>sur 500 M recherchés</small></div>
          <div><span>Date de clôture</span><strong>30 novembre 2026</strong></div>
          <div><span>Investisseurs participants</span><strong>Sahel Growth Fund (300 M, lead) · Horizon Ventures (150 M)</strong></div>
          <div><span>Engagements retirés ou non réalisés</span><strong>Impact Capital Africa — soft-commit de 50 M non confirmé</strong></div>
        </div>
        <label className="v2-field v2-configure-textarea"><span>Note de clôture <small>— facultative</small></span><textarea defaultValue="Tour bouclé avec un lead régional. Reliquat abandonné au profit d’une clôture rapide." /></label>
        <fieldset className="v2-level-choice">
          <legend>Accès externes</legend>
          <label data-active="true"><input defaultChecked name="access" type="radio" /><span><strong>Conserver les accès actuels selon leurs échéances</strong></span></label>
          <label><input name="access" type="radio" /><span><strong>Révoquer tous les accès externes maintenant</strong></span></label>
        </fieldset>
        <p className="v2-panel-callout"><Icon name="lock" />Les pièces, interactions et engagements restent consultables. Vous pourrez dupliquer la structure pour une prochaine opération.</p>
        <footer><Link href={queryHref("overview")}>Annuler</Link><button className="v2-btn v2-danger-button" type="button">Clôturer la levée</button></footer>
      </section>
    </div>
  );
}
