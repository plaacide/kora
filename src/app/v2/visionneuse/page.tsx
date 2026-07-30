import { requireV2User } from "@/features/v2/server/session";
import { SecureViewer } from "@/features/v2/ui/Viewer";

/**
 * La visionneuse vit hors du shell : ni rail, ni panneau contextuel. On y entre
 * par une pièce, on en ressort par la croix — vers `retour`, l'endroit d'où on
 * est venu, transmis par qui ouvre le lien.
 */
export default async function ViewerPage({
  searchParams,
}: {
  searchParams: Promise<{ retour?: string }>;
}) {
  await requireV2User();
  const { retour } = await searchParams;

  return (
    <main className="v2">
      <SecureViewer retour={retour} />
    </main>
  );
}
