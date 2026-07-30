import Link from "next/link";

import {
  CHART_BASELINE,
  CHART_LEFT,
  CHART_RIGHT,
  chartGeometry,
  chartLabels,
  initials,
  readingTime,
} from "../domain/activity";
import type { DailyViews, Reading } from "../server/activity";
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

const TABS = ["Consultations récentes", "Accès", "Documents", "Invités"];

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
      <div className="v2-home-activity-empty">
        <EmptyArt name="files" />
        <strong>Encore aucune activité</strong>
        <p>
          Quand vous partagerez votre data room, chaque consultation de vos
          invités apparaîtra ici, document par document.
        </p>
      </div>
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
            <small>
              {new Date(reading.lastReadAt).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </small>
          </div>
          <span className="v2-tag">{reading.operationName}</span>
          <span className="v2-home-activity-time">{readingTime(reading.totalMs)}</span>
        </div>
      ))}
    </div>
  );
}

export function HomeScreen({
  firstName,
  operationCount,
  views,
  readings,
}: {
  firstName: string;
  operationCount: number;
  views: readonly DailyViews[];
  readings: readonly Reading[];
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
            {TABS.map((tab, index) => (
              <span data-active={index === 0} key={tab}>
                {tab}
              </span>
            ))}
          </div>
          <div className="v2-home-activity-head">
            <span>Invité</span>
            <span>Document</span>
            <span>Opération</span>
            <span>Temps passé</span>
          </div>
          <ReadingRows readings={readings} />
        </section>
      </div>
    </Standalone>
  );
}
