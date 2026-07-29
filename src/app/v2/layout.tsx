import { requireV2Enabled } from "@/features/v2/server/feature";

export default async function V2Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireV2Enabled();

  return children;
}
