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
  guestViewsByDocument,
  listDocuments,
  listFolders,
  listRequirements,
  pendingAssociations,
  resolveFolderPath,
} from "@/features/v2/server/documents";
import { requireV2Workspace } from "@/features/v2/server/session";
import { viewerDocument } from "@/features/v2/server/viewer";
import { SecureViewer } from "@/features/v2/ui/Viewer";

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
import { BarreDataRoom } from "@/features/v2/ui/BarreDataRoom";
import { DocumentMenu, FolderMenu } from "@/features/v2/ui/DocumentMenu";
import { NomEditable } from "@/features/v2/ui/NomEditable";

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
  chemin,
  document,
  dossierActuel,
  dossiers,
  operationId,
}: {
  /** L'adresse de la vue courante — le lecteur s'y pose en surcouche. */
  chemin: string;
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
      onSupprimer={async () => {
        "use server";
        return deleteV2Document({ operationId, documentId: document.id });
      }}
      // « Ouvrir » pose le lecteur PAR-DESSUS la liste — le panneau latéral,
      // lui, montre les versions et le journal, jamais le document.
      urlVisionneuse={`${chemin}?lecteur=${document.id}`}
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
      folderId={folderId}
      nom={nom}
      onCreerSous={async (sousNom) => {
        "use server";
        return createV2Folder({ operationId, parentId: folderId, name: sousNom });
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
    /** La pièce ouverte en surcouche, par-dessus la liste. */
    lecteur?: string;
  }>;
}) {
  const { operationId, folderPath } = await params;
  const { document, upload, associations, lecteur } = await searchParams;

  // L'organisation compose le premier segment de la clé de stockage : c'est
  // sur lui que la policy du bucket vérifie l'appartenance.
  const [{ organization }, folder] = await Promise.all([
    requireV2Workspace(),
    resolveFolderPath(operationId, folderPath ?? []),
  ]);

  // Un dossier nommé dans l'URL mais introuvable n'est pas une data room vide :
  // c'est un lien périmé, et le dire vaut mieux que de montrer un écran vide.
  if ((folderPath?.length ?? 0) > 0 && !folder) notFound();

  // L'adresse d'où l'on est venu : « Ajouter du contenu » doit déposer DANS le
  // dossier ouvert, pas à la racine.
  const cheminActuel = v2Routes.operations.documents(operationId, folderPath ?? []);

  // LE LECTEUR SE POSE SUR LA LISTE, il ne la remplace pas. Consulter une pièce
  // n'est pas quitter la data room : on garde la liste derrière, et le clic à
  // côté referme. La page /v2/visionneuse reste pour les liens directs, où il
  // n'y a rien derrière à montrer.
  const aLire = lecteur ? await viewerDocument(lecteur) : null;

  if (!folder) {
    // LES PIÈCES DE LA RACINE SE LISENT AUSSI. Le dépôt les y accepte depuis le
    // début — c'est même le seul endroit possible quand une opération n'a
    // aucune structure documentaire — mais l'écran ne listait que les dossiers.
    // Les fichiers déposés là existaient, occupaient le stockage facturé, et
    // personne ne pouvait les voir ni les récupérer.
    const [folders, racine, vues] = await Promise.all([
      listFolders(operationId),
      listDocuments(operationId, null),
      guestViewsByDocument(operationId, organization.id),
    ]);
    const total =
      folders.reduce((sum, row) => sum + row.documentCount, 0) + racine.length;
    // Les destinations offertes par « Déplacer vers… ».
    const choixDossiers = folders.map((f) => ({ id: f.id, nom: f.name }));

    return (
      <>
      <div className="v2-documents-page">
        <BarreDataRoom
          hrefAjouter={`${cheminActuel}?upload=1`}
          hrefPartager={`/v2/operations/${operationId}/access`}
          onCreerDossier={async (nomDossier) => {
            "use server";
            return createV2Folder({
              operationId,
              parentId: null,
              name: nomDossier,
            });
          }}
        />

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

        {/* UN SEUL BLOC. Les dossiers et les pièces hors dossier vivaient dans
            deux cartes séparées : une data room sans structure en affichait
            donc deux, dont l'une ne disait que « aucun dossier ». Deux cadres
            pour un même contenu obligent à comprendre pourquoi ils sont deux —
            et la réponse n'intéresse personne. */}
        <section className="v2-folder-card">
          <header>
            <strong>Contenu de la data room</strong>
            <span>
              {folders.length === 0
                ? "— aucun dossier ; les exigences restent indépendantes de l’arborescence"
                : "— structure modifiable ; les exigences restent indépendantes de l’arborescence"}
            </span>
          </header>

          {folders.map((row) => (
            <div className="v2-folder-row" key={row.id}>
              <Link
                className="v2-folder-link"
                href={v2Routes.operations.documents(operationId, [row.name])}
              >
                <Icon name="folder" />
                <strong>
                  <NomEditable
                    cle={row.id}
                    nom={row.name}
                    onRenommer={async (nouveau) => {
                      "use server";
                      return renameV2Folder({
                        operationId,
                        folderId: row.id,
                        name: nouveau,
                      });
                    }}
                    titre="ce dossier"
                  />
                </strong>
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

          {/* Les pièces hors dossier suivent les dossiers, dans le même cadre.
              Un simple intertitre les distingue : y déposer est un choix
              valable, pas un oubli — elles restent privées à l'équipe. */}
          {racine.length > 0 && (
            <>
              {folders.length > 0 && (
                <div className="v2-folder-sous-titre">
                  Hors dossier — visibles de votre équipe seule
                </div>
              )}
              {racine.map((row) => (
                <div className="v2-folder-row" key={row.id}>
                  <Link className="v2-folder-link" href={`?document=${row.id}`}>
                    <Icon name="file" />
                    <strong>
                      <NomEditable
                        cle={row.id}
                        nom={row.name}
                        onRenommer={async (nouveau) => {
                          "use server";
                          return renameV2Document({
                            operationId,
                            documentId: row.id,
                            name: nouveau,
                          });
                        }}
                        titre="cette pièce"
                      />
                    </strong>
                    <span>{frenchDate(row.updatedAt)}</span>
                    {/* Les consultations n'ont de sens qu'externes : « 12 vues »
                        ne dit rien si onze viennent de l'équipe qui a déposé le
                        fichier. Zéro se dit par un tiret — l'absence de lecture
                        n'est pas un chiffre, c'est une attente. */}
                    <span className="v2-folder-vues">
                      {vues.get(row.id)
                        ? `${vues.get(row.id)} consultation${(vues.get(row.id) as number) > 1 ? "s" : ""}`
                        : "—"}
                    </span>
                    <span className="v2-status" data-tone="neutral">
                      {row.hidden ? "Masquée" : "Privée"}
                    </span>
                  </Link>
                  <MenuPiece
                    chemin={cheminActuel}
                    document={row}
                    dossierActuel={null}
                    dossiers={choixDossiers}
                    operationId={operationId}
                  />
                </div>
              ))}
            </>
          )}
        </section>
      </div>
      {aLire && <SecureViewer document={aLire} enSurcouche retour={cheminActuel} />}
      </>
    );
  }

  const [documents, tousLesDossiers, vues] = await Promise.all([
    listDocuments(operationId, folder.id),
    listFolders(operationId),
    guestViewsByDocument(operationId, organization.id),
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
        <BarreDataRoom
          hrefAjouter={`${cheminActuel}?upload=1`}
          hrefPartager={`/v2/operations/${operationId}/access`}
          onCreerDossier={async (nomDossier) => {
            "use server";
            return createV2Folder({
              operationId,
              parentId: folder.id,
              name: nomDossier,
            });
          }}
        />

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
                  <th>Version</th><th>Mise à jour</th><th>Consultations</th>
                  <th>Propriétaire</th><th>Statut</th><th />
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
                          <Icon name="file" />
                          <strong>
                            <NomEditable
                              cle={row.id}
                              nom={row.name}
                              onRenommer={async (nouveau) => {
                                "use server";
                                return renameV2Document({
                                  operationId,
                                  documentId: row.id,
                                  name: nouveau,
                                });
                              }}
                              titre="cette pièce"
                            />
                          </strong>
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
                      {/* Externes seulement — voir `guestViewsByDocument`. */}
                      <td>{vues.get(row.id) ?? "—"}</td>
                      <td>{row.owner ?? "—"}</td>
                      <td>
                        <span className="v2-status" data-tone={state.tone}>
                          {state.label}
                        </span>
                      </td>
                      <td>
                        <MenuPiece
                          chemin={cheminActuel}
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
          viewerHref={`${cheminActuel}?lecteur=${detail.id}`}
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
      {aLire && <SecureViewer document={aLire} enSurcouche retour={cheminActuel} />}
    </>
  );
}
