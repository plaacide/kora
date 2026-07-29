import { requireV2User } from "@/features/v2/server/session";
import { SecureViewer } from "@/features/v2/ui/Viewer";

/**
 * La visionneuse vit hors du shell : ni rail, ni panneau contextuel. On y entre
 * par une pièce, on en ressort par la croix.
 */
export default async function ViewerPage() {
  await requireV2User();

  return (
    <main className="v2">
      <SecureViewer />
    </main>
  );
}
