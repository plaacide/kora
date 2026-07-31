import {
  invitationScope,
  listAccesses,
  shareableFolders,
} from "@/features/v2/server/access";
import { listDocuments } from "@/features/v2/server/documents";
import { listOperations } from "@/features/v2/server/operations";
import { requireV2Workspace } from "@/features/v2/server/session";
import {
  AccessTable,
  AccessWizard,
  GuestPreview,
  RequestPanel,
} from "@/features/v2/ui/Access";

/**
 * Écrans 20 à 25 — le partage.
 *
 * L'assistant porte ses valeurs dans l'URL d'une étape à l'autre : un
 * rechargement en cours de route ne perd rien, et rien n'est écrit avant la
 * dernière étape.
 */
export default async function AccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ operationId: string }>;
  searchParams: Promise<{
    share?: string;
    request?: string;
    sent?: string;
    lien?: string;
    apercu?: string;
    dossier?: string;
    email?: string;
    level?: string;
    nda?: string;
    expires?: string;
    dossiers?: string;
  }>;
}) {
  const [{ operationId }, query] = await Promise.all([params, searchParams]);
  const { organization } = await requireV2Workspace();

  const nomOperation = async () => {
    const operations = await listOperations(organization.id);
    return (
      operations.find((operation) => operation.id === operationId)?.name ??
      "cette opération"
    );
  };

  if (query.share) {
    const [folders, name] = await Promise.all([
      shareableFolders(operationId),
      nomOperation(),
    ]);

    return (
      <AccessWizard
        draft={{
          email: query.email ?? "",
          level: query.level ?? "watermark",
          nda: query.nda ?? "1",
          expires: query.expires ?? "",
          dossiers: query.dossiers ?? "",
        }}
        folders={folders}
        operationId={operationId}
        operationName={name}
        step={query.share}
      />
    );
  }

  const accesses = await listAccesses(operationId);

  if (query.apercu) {
    const acces = accesses.find((row) => row.id === query.apercu);

    if (acces) {
      const [tous, name, choisis] = await Promise.all([
        shareableFolders(operationId),
        nomOperation(),
        invitationScope(acces.id),
      ]);

      // L'aperçu ne montre QUE ce que cette invitation ouvre. Lui faire lister
      // toute la data room en dirait plus à l'écran que l'invité n'en verra.
      const folders = choisis
        ? tous.filter((folder) => choisis.includes(folder.id))
        : tous;

      // Sans dossier choisi, on ouvre le premier : un aperçu vide n'apprend
      // rien à qui veut vérifier ce que l'invité voit.
      const folderId = query.dossier || folders[0]?.id || null;
      // Le fondateur est interne : la RLS ne lui cache rien. L'aperçu doit
      // donc retirer lui-même les pièces masquées, sinon il montre justement
      // ce que l'invité ne verra pas — l'inverse de ce que l'écran promet.
      const documents = folderId
        ? (await listDocuments(operationId, folderId)).filter(
            (document) => !document.hidden,
          )
        : [];

      return (
        <GuestPreview
          access={acces}
          documents={documents}
          folderId={folderId}
          folders={folders}
          operationName={name}
        />
      );
    }
  }

  return (
    <>
      <AccessTable
        accesses={accesses}
        lien={query.lien ?? null}
        operationId={operationId}
        sent={query.sent === "1" ? "1" : query.sent === "manuel" ? "manuel" : null}
      />
      {query.request === "1" && <RequestPanel />}
    </>
  );
}
