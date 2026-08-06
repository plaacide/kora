import { requireV2User } from "@/features/v2/server/session";
import { WorkspaceShell } from "@/features/v2/ui/Shell";

/**
 * La coque du parcours programme.
 *
 * Le métier est porté par le GROUPE DE ROUTES, et non lu en base : tant que
 * les écrans sont en dur, une lecture de `profiles.account_type` n'ajouterait
 * qu'une requête pour un résultat déjà connu de l'adresse. Elle prendra sa
 * place ici au branchement, en un seul endroit.
 *
 * ON N'EXIGE PAS D'ORGANISATION. `requireV2Workspace` en réclame une et
 * renvoie à l'onboarding quand elle manque : un programme fraîchement inscrit
 * ne pouvait donc pas ouvrir un seul de ces écrans. Or aucun d'eux ne lit quoi
 * que ce soit — ils affichent les fixtures des maquettes. Exiger une
 * organisation pour montrer des données qui n'en viennent pas est une barrière
 * qui ne protège rien. Elle reviendra au branchement, avec ce qu'elle garde.
 */
export default async function V2ProgrammeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireV2User();

  return (
    <WorkspaceShell email={user.email} metier="programme">
      {children}
    </WorkspaceShell>
  );
}
