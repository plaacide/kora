import { requireV2Enabled } from "@/features/v2/server/feature";
import { PushTransitions } from "@/features/v2/ui/PushTransitions";
import "@/features/v2/ui/v2.css";

export default async function V2Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireV2Enabled();

  return (
    <>
      <PushTransitions />
      {children}
    </>
  );
}
