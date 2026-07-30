import Link from "next/link";

import { Icon } from "./Icon";

/**
 * Écran 19 — Visionneuse sécurisée.
 * Repris de `sanza_handoff/maquettes/screens/19-visionneuse.html`.
 *
 * Le fichier source ne quitte jamais le serveur : la page est rendue, puis
 * filigranée au nom du lecteur et à l'horodatage de sa consultation. Le
 * téléchargement reste désactivé tant que l'accès ne l'autorise pas — le
 * bouton est visible mais inerte, et son titre dit pourquoi.
 */

const PARAGRAPH_WIDTHS = [86, 70, 92, 64, 78, 58, 88, 72, 40];
const CHART_BARS = [40, 62, 48, 80, 66, 92];

export function SecureViewer({ retour }: { retour?: string }) {
  return (
    <div className="v2-viewer">
      <header className="v2-viewer-bar">
        <Link
          aria-label="Fermer la visionneuse"
          className="v2-viewer-close"
          href={retour || "/v2/operations"}
        >
          ×
        </Link>
        <div className="v2-viewer-title">
          <div>États financiers 2025.pdf</div>
          <div>Version active v2 · Finance et comptabilité · Série A 2026</div>
        </div>
        <span className="v2-viewer-flag">
          <Icon name="eye" />
          Lecture filigranée active
        </span>
        <button className="v2-viewer-icon" type="button" aria-label="Réduire">
          <Icon name="chevron" />
        </button>
        <span className="v2-viewer-zoom">92 %</span>
        <button className="v2-viewer-icon" type="button" aria-label="Agrandir">
          <Icon name="plus" />
        </button>
        <span
          className="v2-viewer-download"
          title="Téléchargement désactivé pour votre accès"
        >
          Télécharger
        </span>
      </header>

      <div className="v2-viewer-stage">
        <div className="v2-page">
          <div className="v2-page-content">
            <div className="v2-page-title">Nimba Solar SAS</div>
            <div className="v2-page-sub">
              États financiers — exercice clos le 31 décembre 2025
            </div>
            <div className="v2-page-lines">
              {PARAGRAPH_WIDTHS.map((width, index) => (
                <span key={index} style={{ width: `${width}%` }} />
              ))}
              <div className="v2-page-chart">
                {CHART_BARS.map((height, index) => (
                  <span key={index} style={{ height: `${height}%` }} />
                ))}
              </div>
            </div>
          </div>
          {/* Le filigrane porte le lecteur et l'heure — il identifie une fuite. */}
          <div aria-hidden="true" className="v2-watermark">
            <span>amina.diallo@sahelgrowth.com · 28-07-2026 14:12</span>
          </div>
        </div>
      </div>

      <footer className="v2-viewer-foot">
        <span>Page 3 sur 24</span>
        <span>·</span>
        <span>Chaque consultation est journalisée</span>
      </footer>
    </div>
  );
}
