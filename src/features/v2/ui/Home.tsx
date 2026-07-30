import Link from "next/link";

import {
  CHART_BASELINE,
  CHART_LEFT,
  CHART_RIGHT,
  accessLevelLabel,
  chartGeometry,
  chartLabels,
  initials,
  invitationStatusLabel,
  readingTime,
} from "../domain/activity";
import type {
  AccessEntry,
  DailyViews,
  DocumentActivity,
  GuestActivity,
  Reading,
} from "../server/activity";
import { v2Routes } from "../navigation/routes";
import { EmptyArt } from "./EmptyArt";
import { Standalone } from "./Shell";

/**
 * Écran 73 — accueil, tableau de bord de l'activité des invités.
 * Écran 74 — le même, le premier jour : ni opération, ni consultation.
 *
 * Les deux ne sont pas deux écrans mais un seul, dans deux états. La
 * structure ne bouge pas — « jamais un écran mort », dit la note de la
 * maquette 74 : le graphique garde ses axes, le tableau garde ses colonnes,
 * et ce qui manque est nommé plutôt que masqué.
 */

export const ACTIVITY_TABS = [
  ["consultations", "Consultations récentes"],
  ["acces", "Accès"],
  ["documents", "Documents"],
  ["invites", "Invités"],
] as const;

export type ActivityTab = (typeof ACTIVITY_TABS)[number][0];

export function isActivityTab(value: string | undefined): value is ActivityTab {
  return ACTIVITY_TABS.some(([key]) => key === value);
}

/** Les colonnes changent d'un onglet à l'autre ; la grille les suit. */
const TAB_COLUMNS: Record<ActivityTab, string[]> = {
  consultations: ["Invité", "Document", "Opération", "Temps passé"],
  acces: ["Invité", "Opération", "Niveau", "Échéance"],
  documents: ["Document", "Opération", "Lecteurs", "Temps cumulé"],
  invites: ["Invité", "Dernière visite", "Pièces lues", "Temps cumulé"],
};

function EmptyTab({ title, note }: { title: string; note: string }) {
  return (
    <div className="v2-home-activity-empty">
      <EmptyArt name="files" />
      <strong>{title}</strong>
      <p>{note}</p>
    </div>
  );
}

function shortDate(value: string): string {
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Chart({ series }: { series: readonly DailyViews[] }) {
  const geometry = chartGeometry(series);
  const labels = chartLabels(geometry.points);
  const total = series.reduce((sum, day) => sum + day.value, 0);

  return (
    <section className="v2-home-chart">
      <header>
        <span className="v2-section-label">Consultations par jour</span>
        {total === 0 ? (
          <span className="v2-home-chart-empty">Aucune consultation pour le moment</span>
        ) : (
          <span className="v2-home-chart-legend">
            <i />
            {total} consultation{total > 1 ? "s" : ""} sur la période
          </span>
        )}
      </header>

      <svg role="img" viewBox="0 0 1020 240">
        <title>
          {total === 0
            ? "Aucune consultation sur les trente derniers jours"
            : `${total} consultations sur les trente derniers jours`}
        </title>

        <g stroke="var(--line-soft)" strokeDasharray="3 4">
          {geometry.ticks.slice(0, -1).map((tick) => (
            <line key={tick.y} x1={CHART_LEFT - 32} x2={CHART_RIGHT + 4} y1={tick.y} y2={tick.y} />
          ))}
        </g>
        <line
          stroke="var(--line)"
          x1={CHART_LEFT - 32}
          x2={CHART_RIGHT + 4}
          y1={CHART_BASELINE}
          y2={CHART_BASELINE}
        />

        <g fill="var(--text-4)" fontSize="11" textAnchor="end">
          {geometry.ticks.map((tick) => (
            <text key={tick.label} x={CHART_LEFT - 42} y={tick.y + 4}>
              {tick.label}
            </text>
          ))}
        </g>

        <g fill="var(--text-4)" fontSize="11" textAnchor="middle">
          {labels.map((label) => (
            <text key={label.x} x={label.x} y={CHART_BASELINE + 24}>
              {label.label}
            </text>
          ))}
        </g>

        <polyline
          fill="none"
          points={geometry.polyline}
          stroke="var(--orange)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.25"
        />
      </svg>
    </section>
  );
}

function ReadingRows({ readings }: { readings: readonly Reading[] }) {
  if (readings.length === 0) {
    return (
      <EmptyTab
        note="Quand vous partagerez votre data room, chaque consultation de vos invités apparaîtra ici, document par document."
        title="Encore aucune activité"
      />
    );
  }

  return (
    <div className="v2-home-activity-rows">
      {readings.map((reading) => (
        <div
          className="v2-home-activity-row"
          key={`${reading.actorEmail}-${reading.documentName}`}
        >
          <div>
            <span className="v2-avatar-chip">{initials(reading.actorName)}</span>
            <div>
              <strong>{reading.actorName}</strong>
              <small>{reading.actorEmail}</small>
            </div>
          </div>
          <div>
            <span className="v2-home-activity-doc">{reading.documentName}</span>
            <small>{shortDate(reading.lastReadAt)}</small>
          </div>
          <span className="v2-tag">{reading.operationName}</span>
          <span className="v2-home-activity-time">{readingTime(reading.totalMs)}</span>
        </div>
      ))}
    </div>
  );
}

function AccessRows({ entries }: { entries: readonly AccessEntry[] }) {
  if (entries.length === 0) {
    return (
      <EmptyTab
        note="Votre data room reste privée tant que vous n’invitez personne. Chaque accès accordé apparaîtra ici, avec son échéance."
        title="Aucun accès accordé"
      />
    );
  }

  return (
    <div className="v2-home-activity-rows">
      {entries.map((entry) => {
        const status = invitationStatusLabel(entry.status, entry.expiresAt);

        return (
          <div
            className="v2-home-activity-row"
            key={`${entry.email}-${entry.operationName}-${entry.expiresAt ?? ""}`}
          >
            <div>
              <span className="v2-avatar-chip">{initials(entry.email)}</span>
              <div>
                <strong>{entry.email}</strong>
                <small>
                  <span className="v2-status" data-tone={status.tone}>
                    {status.label}
                  </span>
                </small>
              </div>
            </div>
            <span className="v2-tag">{entry.operationName}</span>
            <span>{accessLevelLabel(entry.level)}</span>
            <span className="v2-home-activity-time">
              {entry.expiresAt ? shortDate(entry.expiresAt) : "Sans échéance"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function DocumentRows({ documents }: { documents: readonly DocumentActivity[] }) {
  if (documents.length === 0) {
    return (
      <EmptyTab
        note="Dès qu’un invité ouvrira une pièce, elle apparaîtra ici avec le temps qu’il y a passé."
        title="Aucune pièce consultée"
      />
    );
  }

  return (
    <div className="v2-home-activity-rows">
      {documents.map((row) => (
        <div className="v2-home-activity-row" key={row.documentName}>
          <div>
            <span className="v2-home-activity-doc">{row.documentName}</span>
          </div>
          <span className="v2-tag">{row.operationName}</span>
          <span>
            {row.readers} lecteur{row.readers > 1 ? "s" : ""}
          </span>
          <span className="v2-home-activity-time">{readingTime(row.totalMs)}</span>
        </div>
      ))}
    </div>
  );
}

function GuestRows({ guests }: { guests: readonly GuestActivity[] }) {
  if (guests.length === 0) {
    return (
      <EmptyTab
        note="Les personnes à qui vous ouvrirez votre data room apparaîtront ici, avec ce qu’elles ont consulté."
        title="Aucun invité pour le moment"
      />
    );
  }

  return (
    <div className="v2-home-activity-rows">
      {guests.map((guest) => (
        <div className="v2-home-activity-row" key={guest.email || guest.name}>
          <div>
            <span className="v2-avatar-chip">{initials(guest.name)}</span>
            <div>
              <strong>{guest.name}</strong>
              <small>{guest.email}</small>
            </div>
          </div>
          <span>{shortDate(guest.lastSeenAt)}</span>
          <span>
            {guest.documents} pièce{guest.documents > 1 ? "s" : ""}
          </span>
          <span className="v2-home-activity-time">{readingTime(guest.totalMs)}</span>
        </div>
      ))}
    </div>
  );
}

export function HomeScreen({
  firstName,
  operationCount,
  views,
  tab,
  readings,
  accesses,
  documents,
  guests,
}: {
  firstName: string;
  operationCount: number;
  views: readonly DailyViews[];
  tab: ActivityTab;
  readings: readonly Reading[];
  accesses: readonly AccessEntry[];
  documents: readonly DocumentActivity[];
  guests: readonly GuestActivity[];
}) {
  const firstDay = operationCount === 0;

  return (
    <Standalone search="Rechercher partout…" title="Accueil">
      <div className="v2-home">
        <div className="v2-home-head">
          <div>
            <h1>
              {firstDay ? "Bienvenue" : "Bonjour"} {firstName}
            </h1>
            <p>
              {firstDay
                ? "L’activité de vos invités apparaîtra ici dès que votre première opération sera partagée."
                : `L’activité de vos invités sur vos ${operationCount} opération${
                    operationCount > 1 ? "s" : ""
                  } active${operationCount > 1 ? "s" : ""}.`}
            </p>
          </div>
          <span className="v2-btn" data-variant="secondary">
            30 derniers jours
          </span>
        </div>

        {firstDay && (
          <section className="v2-home-start">
            <span className="v2-section-label">Pour commencer</span>
            <h2>Créez votre première opération</h2>
            <p>
              Levée, financement bancaire ou diligence : Sanza préparera la liste
              de pièces et une data room privée. Personne n’y aura accès tant que
              vous ne partagez pas.
            </p>
            <div>
              <Link className="v2-btn" href={v2Routes.operations.new}>
                Créer une opération
              </Link>
              <Link className="v2-quiet-link" href={v2Routes.help}>
                Découvrir comment Sanza fonctionne
              </Link>
            </div>
          </section>
        )}

        <Chart series={views} />

        <section className="v2-home-activity">
          <span className="v2-section-label">Détail de l’activité</span>
          <div className="v2-home-tabs">
            {ACTIVITY_TABS.map(([key, label]) => (
              <Link data-active={key === tab} href={`?onglet=${key}`} key={key}>
                {label}
              </Link>
            ))}
          </div>
          <div className="v2-home-activity-head">
            {TAB_COLUMNS[tab].map((column) => (
              <span key={column}>{column}</span>
            ))}
          </div>
          {tab === "consultations" && <ReadingRows readings={readings} />}
          {tab === "acces" && <AccessRows entries={accesses} />}
          {tab === "documents" && <DocumentRows documents={documents} />}
          {tab === "invites" && <GuestRows guests={guests} />}
        </section>
      </div>
    </Standalone>
  );
}
