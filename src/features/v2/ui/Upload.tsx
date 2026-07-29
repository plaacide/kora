/**
 * Écran 16 — Dépôt multiple en cours.
 * Repris de `sanza_handoff/maquettes/screens/16-depot-en-cours.html`.
 *
 * Chaque fichier porte son propre état : déposé, en cours avec son
 * pourcentage, ou en attente. La reprise est automatique — l'écran le dit,
 * parce qu'une connexion qui tombe au milieu d'un dépôt de 9 Mo est la norme,
 * pas l'exception.
 */

interface Upload {
  file: string;
  size: string;
  state: string;
  progress?: number;
}

const UPLOADS: Upload[] = [
  { file: "Relevés bancaires 2025.pdf", size: "4,2 Mo", state: "Déposée" },
  { file: "Budget 2026 approuvé.pdf", size: "1,8 Mo", state: "Déposée" },
  { file: "Rapport d’audit 2025.pdf", size: "9,6 Mo", state: "62 %", progress: 62 },
  { file: "Projections 2026-2029.xlsx", size: "0,9 Mo", state: "En attente" },
];

const DONE = UPLOADS.filter((upload) => upload.state === "Déposée").length;

export function UploadProgress() {
  return (
    <section className="v2-folder-card v2-upload-progress">
      <header className="v2-folder-head-action">
        <strong>
          Dépôt en cours — {DONE} sur {UPLOADS.length} pièces
        </strong>
        <button className="v2-btn-quiet" type="button">Tout annuler</button>
      </header>

      {UPLOADS.map((upload) => (
        <div className="v2-upload-row" key={upload.file}>
          <div>
            <b>{upload.file}</b>
            <small>{upload.size}</small>
          </div>
          {upload.progress !== undefined && (
            <div className="v2-progress v2-upload-bar">
              <span style={{ width: `${upload.progress}%` }} />
            </div>
          )}
          <span
            className="v2-status"
            data-tone={upload.state === "Déposée" ? "green" : undefined}
          >
            {upload.state}
          </span>
        </div>
      ))}

      <footer>La reprise est automatique en cas d’interruption.</footer>
    </section>
  );
}
