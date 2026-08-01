import Link from "next/link";

import {
  ventilation,
  type Engagement,
  type Requalification,
} from "@/features/v2/domain/engagements";
import type {
  Interaction,
  InvestisseurPipeline,
} from "@/features/v2/domain/pipeline";
import type { AccessRow } from "@/features/v2/server/access";
import type { SignauxDocumentaires } from "@/features/v2/server/fiche";
import {
  fourchetteTicket,
  libelleInstrumentLevee,
  libelleLead,
  libelleStade,
  repartition,
} from "@/features/v2/domain/levee";
import type { Raise } from "@/features/v2/server/raise";
import type { MiseAJour, MiseAJourResume } from "@/features/v2/server/updates";
import { CommitmentsScreen } from "./Commitments";
import { InvestorsScreen } from "./Investors";
import { EmptyArt } from "./EmptyArt";
import { RaiseClose, RaiseConfigure, RaiseEmpty } from "./RaiseForms";

import { v2Routes } from "@/features/v2/navigation/routes";

import { Icon } from "./Icon";
import { LeverUpdates } from "./LeverUpdates";

export type LeverQuery = {
  view?: string;
  mode?: string;
  panel?: string;
  step?: string;
  configured?: string;
  /** L'identifiant de la mise à jour ouverte — brouillon ou publiée. */
  maj?: string;
  /** L'interaction ouverte, et la relation à laquelle elle se rattache. */
  interaction?: string;
  investisseur?: string;
  /** `fiche` quand le panneau d'interaction a été ouvert depuis la fiche. */
  origine?: string;
  /** La fiche de relation ouverte — écran 41 — et son onglet. */
  fiche?: string;
  onglet?: string;
};


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
        <Link data-active={current === view} href={queryHref(view)} key={view}>
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
  acces,
  engagements,
  historique,
  interactions,
  signaux,
  investisseurs,
  majCourante,
  majListe,
  operationId,
  query,
  raise,
}: {
  /** Les engagements déclarés, un par investisseur — écrans 43 et 44. */
  engagements: readonly Engagement[];
  historique: readonly Requalification[];
  /** Ce qui a été consigné sur les relations — écrans 41 et 42. */
  interactions: readonly Interaction[];
  /** Les accès ouverts, pour l'onglet Accès de la fiche. */
  acces: readonly AccessRow[];
  /** Les signaux de lecture de la relation dont la fiche est ouverte. */
  signaux: SignauxDocumentaires;
  /** Le pipeline RÉEL. L'onglet affichait jusqu'ici quatre fixtures. */
  investisseurs: readonly InvestisseurPipeline[];
  /** La mise à jour ouverte, si l'URL en désigne une. */
  majCourante: MiseAJour | null;
  majListe: readonly MiseAJourResume[];
  operationId: string;
  query: LeverQuery;
  /** `null` quand l'opération n'a pas de levée en cours — c'est l'écran 35. */
  raise: Raise | null;
}) {
  const current = query.view ?? "overview";
  const retour = v2Routes.operations.lever(operationId);

  // Sans levée, tout mène au même endroit : il n'y a rien à piloter tant que
  // rien n'est ouvert. Forcer `?view=pipeline` ne doit pas montrer un tableau
  // de bord vide comme s'il était réel.
  if (!raise && current !== "configure") {
    return <LeverEmpty operationId={operationId} retour={retour} />;
  }

  if (current === "configure") {
    return (
      <RaiseConfigure operationId={operationId} raise={raise} retour={retour} />
    );
  }

  if (current === "close" && raise) {
    return <RaiseClose operationId={operationId} raise={raise} retour={retour} />;
  }
  if (current === "pipeline") {
    return (
      <LeverFrame current="pipeline">
        <InvestorsScreen
          devise={raise?.currency ?? "XOF"}
          edite={query.panel ?? null}
          acces={acces}
          engagements={engagements}
          fiche={query.fiche ?? null}
          interactionOuverte={query.interaction ?? null}
          interactions={interactions}
          onglet={query.onglet ?? "resume"}
          origine={query.origine === "fiche" ? "fiche" : "panel"}
          signaux={signaux}
          investisseurCible={query.investisseur ?? null}
          investisseurs={investisseurs}
          operationId={operationId}
          vue={query.mode ?? "colonnes"}
        />
      </LeverFrame>
    );
  }
  if (current === "commitments") {
    return (
      <LeverFrame
        current="commitments"
        actions={
          investisseurs.length > 0 ? (
            <Link
              className="v2-btn"
              href={queryHref("commitments", { panel: "commitment" })}
            >
              <Icon name="plus" />Enregistrer un engagement
            </Link>
          ) : undefined
        }
      >
        <CommitmentsScreen
          cible={raise?.target ?? null}
          devise={raise?.currency ?? "XOF"}
          engagements={engagements}
          historique={historique}
          investisseurs={investisseurs}
          montantDeclare={raise?.secured ?? null}
          operationId={operationId}
          panel={query.panel ?? null}
        />
      </LeverFrame>
    );
  }
  if (current === "updates") {
    // Seul l'ASSISTANT occupe tout l'écran : les maquettes 47 à 49 n'ont ni
    // onglets ni fil d'Ariane, on y est en train de composer. La maquette 50,
    // elle, remet les deux au-dessus de la mise à jour publiée — sans eux la
    // carte se collait au bandeau et on ne savait plus d'où l'on venait.
    const pleinEcran =
      query.step === "nouvelle" || majCourante?.statut === "brouillon";

    const contenu = (
      <LeverUpdates
        courante={majCourante}
        investisseurs={investisseurs}
        liste={majListe}
        operationId={operationId}
        step={query.step}
      />
    );

    if (pleinEcran) return <div className="v2-lever-page">{contenu}</div>;

    return (
      <LeverFrame
        current="updates"
        actions={
          // La mise à jour publiée porte ses propres actions — corriger,
          // enchaîner — et n'a que faire de « Créer une mise à jour ».
          majCourante === null && majListe.length > 0 ? (
            <Link
              className="v2-btn"
              href={queryHref("updates", { step: "nouvelle" })}
            >
              <Icon name="plus" />Créer une mise à jour
            </Link>
          ) : undefined
        }
      >
        {contenu}
      </LeverFrame>
    );
  }

  return (
    <RaiseOverview
      configured={query.configured === "1"}
      engagements={engagements}
      pipeline={investisseurs.length}
      raise={raise as Raise}
    />
  );
}

function LeverEmpty({
  operationId,
  retour,
}: {
  operationId: string;
  retour: string;
}) {
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
          <RaiseEmpty operationId={operationId} retour={retour} />
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

/** Écran 37 — la levée en cours, sur ses montants réels. */
function RaiseOverview({
  configured,
  engagements,
  pipeline,
  raise,
}: {
  configured: boolean;
  engagements: readonly Engagement[];
  pipeline: number;
  raise: Raise;
}) {
  const devise = raise.currency;
  const cible = raise.target ?? 0;
  const securise = raise.secured ?? 0;
  const restant = Math.max(0, cible - securise);
  const part = cible > 0 ? Math.round((securise / cible) * 100) : 0;
  const ventile = ventilation(engagements);
  const somme = (valeur: number) => valeur.toLocaleString("fr-FR");

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
          <h1>
            {raise.name ?? "Levée en cours"}{" "}
            <span className="v2-status" data-tone="green">Active</span>
          </h1>
          <p>
            <Icon name="calendar" />
            {raise.deadline
              ? `Clôture visée le ${new Date(raise.deadline).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`
              : "Aucune date de clôture visée"}
          </p>
        </div>
        <Link href={queryHref("close")}>Clôturer la levée</Link>
      </div>

      <section className="v2-finance-card">
        <header>
          <div>
            <span className="v2-section-label">Progression financière</span>
            <p>Montants déclarés par votre équipe — jamais déduits de l’activité documentaire</p>
          </div>
          <strong>{part} %</strong>
        </header>
        <div className="v2-money-lead">
          <strong>{somme(securise)}</strong>
          <span>
            sécurisés sur {cible > 0 ? somme(cible) : "—"} {devise}
          </span>
        </div>
        <div className="v2-money-progress">
          <span style={{ width: `${Math.min(100, part)}%` }} />
        </div>
        <div className="v2-money-grid">
          <div>
            <span>Restant à sécuriser</span>
            <strong>{somme(restant)}</strong>
          </div>
          <div>
            <span>Valorisation pré-money</span>
            <strong>{raise.preMoney ? somme(raise.preMoney) : "—"}</strong>
          </div>
          <div>
            <span>Investisseurs au pipeline</span>
            <strong>{pipeline}</strong>
          </div>
        </div>
        {engagements.length > 0 ? (
          // La ventilation vient des lignes d'engagement, pas d'une répartition
          // inventée à l'écran : c'est exactement ce que le montant unique ne
          // savait pas dire.
          <div className="v2-money-split">
            <span>
              <Icon name="check" />
              {somme(ventile.confirme.montant)} confirmés
            </span>
            <span>
              {somme(ventile.soft.montant)} en soft-commit
            </span>
            {ventile.interet.montant > 0 && (
              <span>
                {somme(ventile.interet.montant)} d’intérêt indicatif — non
                comptés
              </span>
            )}
            <Link href={queryHref("commitments")}>Voir le détail →</Link>
          </div>
        ) : (
          <small>
            Montant déclaré par votre équipe. Enregistrez les engagements pour
            qu’il se calcule investisseur par investisseur.
          </small>
        )}
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
        {/* CES SIX VALEURS ÉTAIENT ÉCRITES EN DUR. « Série A · Prise de
            participation · 25 – 150 M XOF » s'affichait sur toutes les levées,
            y compris une levée vide qui n'avait jamais rien déclaré. Un écran
            de synthèse qui invente ses chiffres est pire qu'un écran vide : on
            s'y fie. */}
        <div>
          <div>
            <span>Stade</span>
            <strong>{libelleStade(raise.stage) ?? "Non renseigné"}</strong>
          </div>
          <div>
            <span>Instrument</span>
            <strong>{libelleInstrumentLevee(raise.instrument) ?? "Non renseigné"}</strong>
          </div>
          <div>
            <span>Ticket recherché</span>
            <strong>
              {fourchetteTicket(raise.ticketMin, raise.ticketMax, devise) ??
                "Non renseigné"}
            </strong>
          </div>
          <div>
            <span>Lead</span>
            <strong>{libelleLead(raise.leadStatut) ?? "Non renseigné"}</strong>
          </div>
          <div>
            <span>Date cible</span>
            <strong>
              {raise.deadline
                ? new Date(raise.deadline).toLocaleDateString("fr-FR")
                : "Non renseignée"}
            </strong>
          </div>
          <div>
            <span>Usages des fonds</span>
            <strong>{repartition(raise.usagesFonds) ?? "Non renseignés"}</strong>
          </div>
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
