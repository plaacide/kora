import { requireV2Workspace } from "@/features/v2/server/session";

export default async function V2WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireV2Workspace();

  return children;
}
