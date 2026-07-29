import { requireV2Workspace } from "@/features/v2/server/session";
import { WorkspaceShell } from "@/features/v2/ui/Shell";

export default async function V2WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const workspace = await requireV2Workspace();

  return <WorkspaceShell email={workspace.user.email}>{children}</WorkspaceShell>;
}
