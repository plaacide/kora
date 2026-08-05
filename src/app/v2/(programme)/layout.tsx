import { requireV2Workspace } from "@/features/v2/server/session";
import { WorkspaceShell } from "@/features/v2/ui/Shell";

/**
 * La coque du parcours programme.
 *
 * Le métier est porté par le GROUPE DE ROUTES, et non lu en base : tant que
 * les écrans sont en dur, une lecture de `profiles.account_type` n'ajouterait
 * qu'une requête pour un résultat déjà connu de l'adresse. Elle prendra sa
 * place ici au branchement, en un seul endroit.
 */
export default async function V2ProgrammeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const workspace = await requireV2Workspace();

  return (
    <WorkspaceShell email={workspace.user.email} metier="programme">
      {children}
    </WorkspaceShell>
  );
}
