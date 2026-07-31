import {
  commitmentHistory,
  commitments,
} from "@/features/v2/server/commitments";
import { activeRaise, pipelineInvestors } from "@/features/v2/server/raise";
import { update, updates } from "@/features/v2/server/updates";
import { Lever, type LeverQuery } from "@/features/v2/ui/Lever";

/**
 * Écrans 35 à 50 — la levée entière : vue, pipeline, engagements, mises à jour.
 *
 * Les quatre onglets vivent sur la même route, comme les maquettes le montrent.
 * Une route par onglet aurait été plus simple à écrire et plus dure à
 * atteindre : c'est ainsi que le pipeline s'était retrouvé sur une URL que rien
 * ne listait.
 */
export default async function LeverPage({
  params,
  searchParams,
}: {
  params: Promise<{ operationId: string }>;
  searchParams: Promise<LeverQuery>;
}) {
  const [{ operationId }, query] = await Promise.all([params, searchParams]);

  const [raise, investisseurs, engagements, historique, majListe] =
    await Promise.all([
      activeRaise(operationId),
      pipelineInvestors(operationId),
      commitments(operationId),
      commitmentHistory(operationId),
      updates(operationId),
    ]);

  // Le détail d'une mise à jour ne se charge que si l'URL en désigne une :
  // indicateurs et consultations n'ont rien à faire dans la liste.
  const majCourante = query.maj
    ? await update(operationId, query.maj)
    : null;

  return (
    <Lever
      engagements={engagements}
      historique={historique}
      investisseurs={investisseurs}
      majCourante={majCourante}
      majListe={majListe}
      operationId={operationId}
      query={query}
      raise={raise}
    />
  );
}
