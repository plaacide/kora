import { accessRequest, inbox } from "@/features/v2/server/inbox";
import { requireV2Workspace } from "@/features/v2/server/session";
import { InvitationsListScreen } from "@/features/v2/ui/InvitationsList";
import { Standalone } from "@/features/v2/ui/Shell";

/**
 * Écran 65 — la boîte de réception.
 *
 * Les écrans 31 et 32 (invitation de cohorte) ne sont plus atteignables : ils
 * affichaient des données inventées derrière `?vue=cohorte`. Hors périmètre de
 * la bêta, voir le lot K du plan de travail.
 *
 * `search={false}` : rien à chercher dans une boîte qu'on traite en entier.
 */
export default async function InvitationsPage({
  searchParams,
}: {
  searchParams: Promise<{ demande?: string }>;
}) {
  const [{ organization }, query] = await Promise.all([
    requireV2Workspace(),
    searchParams,
  ]);

  const [boite, demande] = await Promise.all([
    inbox(organization.id),
    query.demande
      ? accessRequest(organization.id, query.demande)
      : Promise.resolve(null),
  ]);

  return (
    <Standalone search={false} title="Invitations et demandes">
      <InvitationsListScreen boite={boite} demande={demande} />
    </Standalone>
  );
}
