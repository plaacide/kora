import { accessRequest, inbox } from "@/features/v2/server/inbox";
import { requireV2Workspace } from "@/features/v2/server/session";
import {
  CohortInvitationScreen,
  DealroomConsentPanel,
} from "@/features/v2/ui/Invitations";
import { InvitationsListScreen } from "@/features/v2/ui/InvitationsList";
import { Standalone } from "@/features/v2/ui/Shell";

/**
 * Écran 65 — la boîte de réception ; 31 et 32 restent l'invitation de cohorte.
 *
 * `search={false}` : rien à chercher dans une boîte qu'on traite en entier.
 */
export default async function InvitationsPage({
  searchParams,
}: {
  searchParams: Promise<{ vue?: string; dealroom?: string; demande?: string }>;
}) {
  const [{ organization }, query] = await Promise.all([
    requireV2Workspace(),
    searchParams,
  ]);

  if (query.vue === "cohorte") {
    return (
      <>
        <CohortInvitationScreen />
        {query.dealroom === "1" && <DealroomConsentPanel />}
      </>
    );
  }

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
