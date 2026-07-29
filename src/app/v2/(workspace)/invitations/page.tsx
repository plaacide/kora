import {
  CohortInvitationScreen,
  DealroomConsentPanel,
} from "@/features/v2/ui/Invitations";

export default async function InvitationsPage({
  searchParams,
}: {
  searchParams: Promise<{ dealroom?: string }>;
}) {
  const { dealroom } = await searchParams;

  return (
    <>
      <CohortInvitationScreen />
      {dealroom === "1" && <DealroomConsentPanel />}
    </>
  );
}
