"use client";

import { createPortal } from "react-dom";
import { useState } from "react";

import { Icon } from "./Icon";

/**
 * Écran 16 — Dépôt multiple en cours.
 * Repris de `sanza_handoff/maquettes/screens/16-depot-en-cours.html`.
 *
 * Carte flottante en bas à droite, 420 px : le dépôt n'interrompt pas la
 * lecture de la data room derrière. Chevron pour la réduire, croix pour la
 * masquer, « Tout annuler » pour interrompre ce qui reste.
 *
 * RENDUE DANS UN PORTAIL, ET C'EST INDISPENSABLE. Elle est en `position:fixed`,
 * donc censée se caler sur la fenêtre — mais `.v2-documents-page` porte
 * `animation:v2-view … both`, dont l'état final conserve un `transform`. Un
 * `transform`, même nul, fait de l'élément le référentiel de ses descendants
 * fixes : la carte se posait alors au milieu de la page au lieu du bas de
 * l'écran. Le portail vers `document.body` s'affranchit de cet ancêtre, et de
 * tous ceux qu'une animation future pourrait rendre positionnants.
 *
 * Le pourcentage est mesuré, pas estimé — voir `DocumentUpload`, qui téléverse
 * en XHR précisément pour obtenir l'avancement que la maquette affiche.
 */

export type UploadState = "pending" | "uploading" | "done" | "failed" | "canceled";

export interface UploadRow {
  name: string;
  /** Taille en octets, telle que le navigateur la donne. */
  size: number;
  state: UploadState;
  /** 0 à 100, seulement pendant le téléversement. */
  progress?: number;
  error?: string;
}

const BADGES: Record<Exclude<UploadState, "uploading">, { label: string; tone: string }> = {
  pending: { label: "En attente", tone: "neutral" },
  done: { label: "Déposée", tone: "green" },
  failed: { label: "Échec", tone: "red" },
  canceled: { label: "Annulée", tone: "neutral" },
};

/** « 4,2 Mo » — séparateur décimal français, comme la maquette. */
export function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1).replace(".", ",")} Ko`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} Mo`;
}

export function UploadProgress({
  uploads,
  onCancelAll,
  onClose,
}: {
  uploads: readonly UploadRow[];
  onCancelAll: () => void;
  onClose: () => void;
}) {
  const [reduite, setReduite] = useState(false);

  // Le rendu serveur n'a jamais de dépôt en cours — un dépôt naît d'un geste.
  // La carte n'existe donc que côté navigateur, et le portail n'a pas de
  // désaccord d'hydratation à craindre.
  if (uploads.length === 0 || typeof document === "undefined") return null;

  const done = uploads.filter((row) => row.state === "done").length;
  const encours = uploads.some(
    (row) => row.state === "uploading" || row.state === "pending",
  );

  return createPortal(
    <section className="v2-upload-card" data-reduced={reduite}>
      <header>
        <b>
          Dépôt en cours — {done} sur {uploads.length} pièces
        </b>
        <button
          aria-label={reduite ? "Déplier" : "Réduire"}
          className="v2-upload-card-icon"
          onClick={() => setReduite((value) => !value)}
          type="button"
        >
          <Icon name="chevron" />
        </button>
        <button
          aria-label="Masquer"
          className="v2-upload-card-icon"
          onClick={onClose}
          type="button"
        >
          ×
        </button>
      </header>

      {!reduite && (
        <div className="v2-upload-card-body">
          {uploads.map((upload) => (
            <div className="v2-upload-line" key={upload.name}>
              <span className="v2-upload-line-icon">
                <Icon name="file" />
              </span>

              <div>
                <div>
                  <span title={upload.name}>{upload.name}</span>
                  <span>{fileSize(upload.size)}</span>
                </div>
                {upload.state === "uploading" && (
                  <div className="v2-upload-line-bar">
                    <div style={{ width: `${upload.progress ?? 0}%` }} />
                  </div>
                )}
              </div>

              {upload.state === "uploading" ? (
                <span className="v2-upload-line-percent">
                  {upload.progress ?? 0} %
                </span>
              ) : (
                <span
                  className="v2-status"
                  data-tone={BADGES[upload.state].tone}
                  title={upload.error}
                >
                  {BADGES[upload.state].label}
                </span>
              )}
            </div>
          ))}

          <footer>
            <span>La reprise est automatique en cas d’interruption.</span>
            {encours && (
              <button className="v2-btn-quiet" onClick={onCancelAll} type="button">
                Tout annuler
              </button>
            )}
          </footer>
        </div>
      )}
    </section>,
    document.body,
  );
}
