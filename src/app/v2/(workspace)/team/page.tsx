import { v2Routes } from "@/features/v2/navigation/routes";
import { myRole, teamMembers } from "@/features/v2/server/equipe";
import { requireV2Workspace } from "@/features/v2/server/session";
import { Standalone } from "@/features/v2/ui/Shell";
import { TeamTable } from "@/features/v2/ui/Team";

/**
 * Écran 33 — l'équipe interne.
 *
 * L'écran affichait quatre collaborateurs inventés à une adresse que le rail
 * proposait. Un écran vide se comprend ; un écran plein de faux membres se
 * croit.
 */
export default async function TeamPage() {
  const { organization } = await requireV2Workspace();

  const [membres, monRole] = await Promise.all([
    teamMembers(organization.id),
    myRole(organization.id),
  ]);

  return (
    <Standalone search={false} title="Équipe">
      <div className="v2-wide-page">
        <p className="v2-page-intro">
          Les collaborateurs participent à la préparation selon leur rôle. Les
          invités externes — investisseurs, banques, auditeurs — ne figurent
          jamais ici : ils se gèrent dans{" "}
          <a href={v2Routes.operations.list}>Partage et accès</a> de chaque
          opération.
        </p>

        <TeamTable membres={membres} monRole={monRole} />
      </div>
    </Standalone>
  );
}
