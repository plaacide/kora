import Link from "next/link";
import { notFound } from "next/navigation";

import {
  documentStateLabel,
  folderVisibilityLabel,
} from "@/features/v2/domain/documents";
import { v2Routes } from "@/features/v2/navigation/routes";
import {
  listDocuments,
  listFolders,
  resolveFolderPath,
} from "@/features/v2/server/documents";
import { AssociationsPanel } from "@/features/v2/ui/Associations";
import { EmptyArt } from "@/features/v2/ui/EmptyArt";
import { Icon } from "@/features/v2/ui/Icon";
import { SampleRowMenu } from "@/features/v2/ui/RowMenu";
import { UploadProgress } from "@/features/v2/ui/Upload";

/** Les fixtures affichaient « 03-04-2026 » ; la base rend un horodatage ISO. */
function frenchDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fr-FR").replaceAll("/", "-");
}

export default async function DocumentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ operationId: string; folderPath?: string[] }>;
  searchParams: Promise<{
    document?: string;
    upload?: string;
    associations?: string;
    depot?: string;
  }>;
}) {
  const { operationId, folderPath } = await params;
  const { document, upload, associations, depot } = await searchParams;

  const folder = await resolveFolderPath(operationId, folderPath ?? []);

  // Un dossier nommé dans l'URL mais introuvable n'est pas une data room vide :
  // c'est un lien périmé, et le dire vaut mieux que de montrer un écran vide.
  if ((folderPath?.length ?? 0) > 0 && !folder) notFound();

  if (!folder) {
    const folders = await listFolders(operationId);
    const total = folders.reduce((sum, row) => sum + row.documentCount, 0);

    return (
      <div className="v2-documents-page">
        {total === 0 && (
          <section className="v2-drop-empty">
            <EmptyArt name="files" />
            <h2>Déposez vos premières pièces</h2>
            <p>
              Glissez-déposez vos fichiers ici, ou choisissez un dossier. Sanza
              proposera de les associer aux exigences de votre plan — vous
              confirmez toujours.
            </p>
            <div>
              <button className="v2-btn" type="button">Choisir des fichiers</button>
              <button className="v2-btn" data-variant="secondary" type="button">
                Créer un dossier
              </button>
            </div>
          </section>
        )}

        {folders.length === 0 ? (
          <section className="v2-folder-card">
            <header>
              <strong>Aucun dossier</strong>
              <span>— cette opération a été créée sans structure documentaire</span>
            </header>
          </section>
        ) : (
          <section className="v2-folder-card">
            <header>
              <strong>Structure suggérée par votre plan</strong>
              <span>
                — modifiable ; les exigences restent indépendantes de
                l’arborescence
              </span>
            </header>
            {folders.map((row) => (
              <div className="v2-folder-row" key={row.id}>
                <Link
                  className="v2-folder-link"
                  href={v2Routes.operations.documents(operationId, [row.name])}
                >
                  <Icon name="folder" />
                  <strong>{row.name}</strong>
                  <span>
                    {row.documentCount === 0
                      ? "0 pièce"
                      : `${row.documentCount} pièce${row.documentCount > 1 ? "s" : ""}`}
                  </span>
                  <span className="v2-status" data-tone="neutral">
                    {row.guestCount === 0 ? "Privé" : folderVisibilityLabel(row.guestCount)}
                  </span>
                </Link>
                <SampleRowMenu label={row.name} />
              </div>
            ))}
          </section>
        )}
      </div>
    );
  }

  const documents = await listDocuments(operationId, folder.id);
  const opened = documents.find((row) => row.id === document);

  return (
    <>
      <div className="v2-document-table-wrap">
        {documents.length === 0 ? (
          <section className="v2-drop-empty">
            <EmptyArt name="files" />
            <h2>Ce dossier est vide</h2>
            <p>Déposez-y vos pièces, ou choisissez un autre dossier.</p>
            <div>
              <button className="v2-btn" type="button">Choisir des fichiers</button>
            </div>
          </section>
        ) : (
          <>
            <table className="v2-document-table">
              <thead>
                <tr>
                  <th>#</th><th>Nom</th><th>Exigence associée</th><th>Visibilité</th>
                  <th>Version</th><th>Mise à jour</th><th>Propriétaire</th><th>Statut</th><th />
                </tr>
              </thead>
              <tbody>
                {documents.map((row) => {
                  const state = documentStateLabel(row.status);

                  return (
                    <tr key={row.id}>
                      <td>{row.indexPath || "—"}</td>
                      <td>
                        <Link href={`?document=${row.id}`}>
                          <Icon name="file" /><strong>{row.name}</strong>
                        </Link>
                      </td>
                      <td>{row.requirement ?? "—"}</td>
                      <td>{folderVisibilityLabel(row.guestCount)}</td>
                      <td>{row.versionNo ? `v${row.versionNo}` : "—"}</td>
                      <td>{frenchDate(row.updatedAt)}</td>
                      <td>{row.owner ?? "—"}</td>
                      <td>
                        <span className="v2-status" data-tone={state.tone}>
                          {state.label}
                        </span>
                      </td>
                      <td><SampleRowMenu label={row.name} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <footer>
              <span>
                {documents.length} pièce{documents.length > 1 ? "s" : ""} dans ce dossier
              </span>
            </footer>
          </>
        )}
      </div>

      {(opened || upload === "1") && (
        <>
          <Link className="v2-scrim" href="?" aria-label="Fermer le panneau" />
          <aside className="v2-sidepanel">
            {upload === "1" ? (
              <>
                <header>
                  <div>
                    <span className="v2-status" data-tone="neutral">Privé</span>
                    <h2>Ajouter du contenu</h2>
                  </div>
                  <Link href="?" aria-label="Fermer">×</Link>
                </header>
                <div className="v2-sidepanel-body">
                  <section className="v2-upload-zone v2-upload-zone-large">
                    <Icon name="file" />
                    <strong>Déposez plusieurs fichiers</strong>
                    <span>PDF, DOCX, XLSX, PPTX · 20 Mo par fichier</span>
                    <button className="v2-btn" type="button">Choisir des fichiers</button>
                  </section>
                  <p className="v2-panel-note">
                    Chaque association pièce ↔ exigence vous sera présentée pour
                    confirmation.
                  </p>
                </div>
              </>
            ) : (
              opened && (
                <>
                  <header>
                    <div>
                      <span
                        className="v2-status"
                        data-tone={documentStateLabel(opened.status).tone}
                      >
                        {documentStateLabel(opened.status).label}
                      </span>
                      <h2>{opened.name}</h2>
                    </div>
                    <Link href="?" aria-label="Fermer">×</Link>
                  </header>
                  <div className="v2-sidepanel-body">
                    <div className="v2-detail-grid">
                      <div>
                        <small>Exigence associée</small>
                        <strong>{opened.requirement ?? "Aucune"}</strong>
                      </div>
                      <div><small>Dossier</small><strong>{folder.name}</strong></div>
                      <div>
                        <small>Visibilité</small>
                        <strong>{folderVisibilityLabel(opened.guestCount)}</strong>
                      </div>
                      <div>
                        <small>Version active</small>
                        <strong>{opened.versionNo ? `v${opened.versionNo}` : "—"}</strong>
                      </div>
                      <div>
                        <small>Déposée par</small>
                        <strong>{opened.owner ?? "—"}</strong>
                      </div>
                      <div>
                        <small>Mise à jour</small>
                        <strong>{frenchDate(opened.updatedAt)}</strong>
                      </div>
                    </div>
                  </div>
                </>
              )
            )}
          </aside>
        </>
      )}
      {depot === "1" && <UploadProgress />}
      {associations === "1" && <AssociationsPanel />}
    </>
  );
}
