import {
  CohortInvitationScreen,
  DealroomConsentPanel,
} from "@/features/v2/ui/Invitations";
import { InvitationsListScreen } from "@/features/v2/ui/InvitationsList";

/**
 * L'écran 65 est la liste ; les écrans 31 et 32 sont ce qu'on voit en ouvrant
 * une invitation de cohorte.
 */
export default async function InvitationsPage({
  searchParams,
}: {
  searchParams: Promise<{ vue?: string; dealroom?: string }>;
}) {
  const { vue, dealroom } = await searchParams;

  if (vue !== "cohorte") return <InvitationsListScreen />;

  return (
    <>
      <CohortInvitationScreen />
      {dealroom === "1" && <DealroomConsentPanel />}
    </>
  );
}
