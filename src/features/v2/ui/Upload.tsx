/**
 * Écran 16 — Dépôt multiple en cours.
 * Repris de `sanza_handoff/maquettes/screens/16-depot-en-cours.html`.
 *
 * Chaque fichier porte son propre état. L'écran n'apparaît qu'à partir de deux
 * pièces : pour une seule, la ligne de retour sous le bouton suffit, et
 * déployer un tableau pour un fichier ferait plus de bruit que d'information.
 */

export type UploadState = "pending" | "uploading" | "done" | "failed";

export interface UploadRow {
  name: string;
  /** Taille en octets, telle que le navigateur la donne. */
  size: number;
  state: UploadState;
  error?: string;
}

const LABELS: Record<UploadState, { label: string; tone?: string }> = {
  pending: { label: "En attente" },
  uploading: { label: "Dépôt en cours" },
  done: { label: "Déposée", tone: "green" },
  failed: { label: "Échec", tone: "red" },
};

/** « 4,2 Mo » — le séparateur décimal français, comme partout ailleurs. */
export function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} Mo`;
}

export function UploadProgress({ uploads }: { uploads: readonly UploadRow[] }) {
  if (uploads.length === 0) return null;

  const done = uploads.filter((row) => row.state === "done").length;
  const failed = uploads.filter((row) => row.state === "failed").length;
  const finished = done + failed === uploads.length;

  return (
    <section className="v2-folder-card v2-upload-progress">
      <header className="v2-folder-head-action">
        <strong>
          {finished
            ? `Dépôt terminé — ${done} sur ${uploads.length} pièces`
            : `Dépôt en cours — ${done} sur ${uploads.length} pièces`}
        </strong>
      </header>

      {uploads.map((upload) => {
        const status = LABELS[upload.state];

        return (
          <div className="v2-upload-row" key={upload.name}>
            <div>
              <b>{upload.name}</b>
              <small>
                {fileSize(upload.size)}
                {upload.error ? ` · ${upload.error}` : ""}
              </small>
            </div>

            {/* Barre indéterminée, jamais un pourcentage : le téléversement
                vers le bucket ne rend pas d'avancement exploitable, et
                afficher « 62 % » serait une invention — précisément le genre
                de chiffre qu'un fondateur croirait. */}
            {upload.state === "uploading" && (
              <div className="v2-progress v2-upload-bar" data-indeterminate="true">
                <span />
              </div>
            )}

            <span className="v2-status" data-tone={status.tone}>
              {status.label}
            </span>
          </div>
        );
      })}

      {!finished && (
        <footer>Ne fermez pas cette page tant que le dépôt n’est pas terminé.</footer>
      )}
    </section>
  );
}
