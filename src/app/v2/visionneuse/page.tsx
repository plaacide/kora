import { notFound } from "next/navigation";

import { requireV2User } from "@/features/v2/server/session";
import { viewerDocument } from "@/features/v2/server/viewer";
import { SecureViewer } from "@/features/v2/ui/Viewer";

/**
 * La visionneuse vit hors du shell : ni rail, ni panneau contextuel. On y entre
 * par une pièce, on en ressort par la croix — vers `retour`, l'endroit d'où on
 * est venu, transmis par qui ouvre le lien.
 *
 * Une pièce absente, invisible ou interdite rend le même 404. Distinguer les
 * trois cas dirait déjà quelque chose à qui n'a rien à savoir : « ce document
 * existe, mais pas pour vous » est déjà une information.
 */
export default async function ViewerPage({
  searchParams,
}: {
  searchParams: Promise<{ document?: string; retour?: string }>;
}) {
  await requireV2User();
  const { document: documentId, retour } = await searchParams;

  if (!documentId) notFound();

  const document = await viewerDocument(documentId);
  if (!document) notFound();

  return (
    <main className="v2">
      <SecureViewer document={document} retour={retour} />
    </main>
  );
}
