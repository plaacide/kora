import Link from "next/link";
import { notFound } from "next/navigation";

import {
  documentStateLabel,
  folderVisibilityLabel,
} from "@/features/v2/domain/documents";
import { v2Routes } from "@/features/v2/navigation/routes";
import type { DocumentRow } from "@/features/v2/server/documents";
import {
  documentDetail,
  listDocuments,
  listFolders,
  listRequirements,
  pendingAssociations,
  resolveFolderPath,
} from "@/features/v2/server/documents";
import { requireV2Workspace } from "@/features/v2/server/session";

import {
  createV2Folder,
  deleteV2Document,
  deleteV2Folder,
  moveV2Document,
  renameV2Document,
  renameV2Folder,
  setV2DocumentHidden,
  setV2DocumentKey,
} from "../actions";
import { AssociationsPanel } from "@/features/v2/ui/Associations";
import { DocumentPanel } from "@/features/v2/ui/DocumentPanel";
import { DocumentUpload } from "@/features/v2/ui/DocumentUpload";
import { EmptyArt } from "@/features/v2/ui/EmptyArt";
import { Icon } from "@/features/v2/ui/Icon";
import { DocumentMenu, FolderMenu } from "@/features/v2/ui/DocumentMenu";

/** Les fixtures affichaient « 03-04-2026 » ; la base rend un horodatage ISO. */
function frenchDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fr-FR").replaceAll("/", "-");
}

/**
 * Les menus « ⋯ » avec leurs actions, liés une seule fois.
 *
 * Les actions serveur sont définies ICI plutôt que dans chaque ligne : une
 * `"use server"` déclarée dans une boucle serait recréée à chaque élément, et
 * l'identifiant d'opération y serait recopié autant de fois qu'il y a de
 * pièces. Un seul endroit le porte, et il vient du serveur — jamais du
 * navigateur, qui pourrait le remplacer par celui d'une autre organisation.
 */
function MenuPiece({
  document,
  dossierActuel,
  dossiers,
  operationId,
}: {
  document: DocumentRow;
  dossierActuel: string | null;
  dossiers: readonly { id: string; nom: string }[];
  operationId: string;
}) {
  return (
    <DocumentMenu
      documentId={document.id}
      dossierActuel={dossierActuel}
      dossiers={dossiers}
      estCle={document.estCle}
      masquee={document.hidden}
      nom={document.name}
      onDeplacer={async (folderId) => {
        "use server";
        return moveV2Document({ operationId, documentId: document.id, folderId });
      }}
      onMarquerCle={async (key) => {
        "use server";
        return setV2DocumentKey({ operationId, documentId: document.id, key });
      }}
      onMasquer={async (hidden) => {
        "use server";
        return setV2DocumentHidden({ operationId, documentId: document.id, hidden });
      }}
      onRenommer={async (nom) => {
        "use server";
        return renameV2Document({ operationId, documentId: document.id, name: nom });
      }}
      onSupprimer={async () => {
        "use server";
        return deleteV2Document({ operationId, documentId: document.id });
      }}
      urlVisionneuse={`?document=${document.id}`}
    />
  );
}

function MenuDossier({
  contient,
  folderId,
  nom,
  operationId,
  urlOuvrir,
}: {
  contient: number;
  folderId: string;
  nom: string;
  operationId: string;
  urlOuvrir: string;
}) {
  return (
    <FolderMenu
      contient={contient}
      nom={nom}
      onCreerSous={async (sousNom) => {
        "use server";
        return createV2Folder({ operationId, parentId: folderId, name: sousNom });
      }}
      onRenommer={async (nouveau) => {
        "use server";
        return renameV2Folder({ operationId, folderId, name: nouveau });
      }}
      onSupprimer={async () => {
        "use server";
        // Jamais en cascade : la base refuse un dossier non vide, et c'est ce
        // qu'on veut — un rangement ne doit pas emporter ce qu'il range.
        return deleteV2Folder({ operationId, folderId, cascade: false });
      }}
      urlOuvrir={urlOuvrir}
    />
  );
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
  }>;
}) {
  const { operationId, folderPath } = await params;
  const { document, upload, associations } = await searchParams;

  // L'organisation compose le premier segment de la clé de stockage : c'est
  // sur lui que la policy du bucket vérifie l'appartenance.
  const [{ organization }, folder] = await Promise.all([
    requireV2Workspace(),
    resolveFolderPath(operationId, folderPath ?? []),
  ]);

  // Un dossier nommé dans l'URL mais introuvable n'est pas une data room vide :
  // c'est un lien périmé, et le dire vaut mieux que de montrer un écran vide.
  if ((folderPath?.length ?? 0) > 0 && !folder) notFound();

  if (!folder) {
    // LES PIÈCES DE LA RACINE SE LISENT AUSSI. Le dépôt les y accepte depuis le
    // début — c'est même le seul endroit possible quand une opération n'a
    // aucune structure documentaire — mais l'écran ne listait que les dossiers.
    // Les fichiers déposés là existaient, occupaient le stockage facturé, et
    // personne ne pouvait les voir ni les récupérer.
    const [folders, racine] = await Promise.all([
      listFolders(operationId),
      listDocuments(operationId, null),
    ]);
    const total =
      folders.reduce((sum, row) => sum + row.documentCount, 0) + racine.length;
    // Les destinations offertes par « Déplacer vers… ».
    const choixDossiers = folders.map((f) => ({ id: f.id, nom: f.name }));

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
              <DocumentUpload
                folderId={null}
                operationId={operationId}
                organizationId={organization.id}
              >
                Choisir des fichiers
              </DocumentUpload>
              <button className="v2-btn" data-variant="secondary" type="button">
                Créer un dossier
              </button>
            </div>
            <small className="v2-drop-note">
              Déposées ici, vos pièces restent visibles de votre équipe seule.
              Rangez-les dans un dossier pour pouvoir les partager.
            </small>
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
                <MenuDossier
                  contient={row.documentCount}
                  folderId={row.id}
                  nom={row.name}
                  operationId={operationId}
                  urlOuvrir={v2Routes.operations.documents(operationId, [row.name])}
                />
              </div>
            ))}
          </section>
        )}

        {/* Les pièces hors dossier. Le texte ne les présente pas comme un
            oubli : déposer à la racine est un choix valable — elles restent
            privées à l'équipe. Il dit simplement ce que le rangement change,
            car c'est la seule conséquence qui compte. */}
        {racine.length > 0 && (
          <section className="v2-folder-card">
            <header>
              <strong>Pièces hors dossier</strong>
              <span>
                — visibles de votre équipe seule ; rangez-les dans un dossier
                pour pouvoir les partager
              </span>
            </header>
            {racine.map((row) => (
              <div className="v2-folder-row" key={row.id}>
                <Link
                  className="v2-folder-link"
                  href={`?document=${row.id}`}
                >
                  <Icon name="file" />
                  <strong>{row.name}</strong>
                  <span>{frenchDate(row.updatedAt)}</span>
                  <span className="v2-status" data-tone="neutral">
                    {row.hidden ? "Masquée" : "Privée"}
                  </span>
                </Link>
                <MenuPiece
                  document={row}
                  dossierActuel={null}
                  dossiers={choixDossiers}
                  operationId={operationId}
                />
              </div>
            ))}
          </section>
        )}
      </div>
    );
  }

  const [documents, tousLesDossiers] = await Promise.all([
    listDocuments(operationId, folder.id),
    listFolders(operationId),
  ]);
  const choixDossiers = tousLesDossiers.map((f) => ({ id: f.id, nom: f.name }));
  // Le panneau lit le détail complet — versions et journal compris — que la
  // liste ne porte pas.
  const detail = document ? await documentDetail(operationId, document) : null;

  // Écran 17 : les pièces qui viennent d'être déposées attendent d'être
  // rattachées à une exigence. Leurs identifiants voyagent dans l'URL, donc
  // l'écran survit à un rechargement.
  const aAssocier = associations?.split(",").filter(Boolean) ?? [];
  const [pending, requirements] = aAssocier.length
    ? await Promise.all([
        pendingAssociations(operationId, aAssocier),
        listRequirements(operationId),
      ])
    : [[], []];

  return (
    <>
      <div className="v2-document-table-wrap">
        {documents.length === 0 ? (
          <section className="v2-drop-empty">
            <EmptyArt name="files" />
            <h2>Ce dossier est vide</h2>
            <p>Déposez-y vos pièces, ou choisissez un autre dossier.</p>
            <div>
              <DocumentUpload
                folderId={folder.id}
                operationId={operationId}
                organizationId={organization.id}
              >
                Choisir des fichiers
              </DocumentUpload>
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
                      <td>
                        {row.hidden ? (
                          <span className="v2-status" data-tone="neutral">
                            Masquée aux invités
                          </span>
                        ) : (
                          folderVisibilityLabel(row.guestCount)
                        )}
                      </td>
                      <td>{row.versionNo ? `v${row.versionNo}` : "—"}</td>
                      <td>{frenchDate(row.updatedAt)}</td>
                      <td>{row.owner ?? "—"}</td>
                      <td>
                        <span className="v2-status" data-tone={state.tone}>
                          {state.label}
                        </span>
                      </td>
                      <td>
                        <MenuPiece
                          document={row}
                          dossierActuel={folder.id}
                          dossiers={choixDossiers}
                          operationId={operationId}
                        />
                      </td>
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

      {upload === "1" && (
        <>
          <Link className="v2-scrim" href="?" aria-label="Fermer le panneau" />
          <aside className="v2-sidepanel">
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
                <DocumentUpload
                  folderId={folder.id}
                  operationId={operationId}
                  organizationId={organization.id}
                >
                  Choisir des fichiers
                </DocumentUpload>
              </section>
              <p className="v2-panel-note">
                Chaque association pièce ↔ exigence vous sera présentée pour
                confirmation.
              </p>
            </div>
          </aside>
        </>
      )}

      {detail && (
        <DocumentPanel
          closeHref="?"
          detail={detail}
          operationId={operationId}
          organizationId={organization.id}
          viewerHref={`/v2/visionneuse?document=${detail.id}&retour=${encodeURIComponent(
            `${v2Routes.operations.documents(operationId, folderPath ?? [])}?document=${detail.id}`,
          )}`}
        />
      )}
      {pending.length > 0 && (
        <AssociationsPanel
          closeHref="?"
          operationId={operationId}
          pending={pending}
          requirements={requirements}
        />
      )}
    </>
  );
}
