import {
  commitmentHistory,
  commitments,
} from "@/features/v2/server/commitments";
import {
  activeRaise,
  activiteRecenteLevee,
  pipelineInteractions,
  pipelineInvestors,
  prochainesActions,
} from "@/features/v2/server/raise";
import { listAccesses } from "@/features/v2/server/access";
import { documentarySignals } from "@/features/v2/server/fiche";
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

  const [
    raise,
    investisseurs,
    interactions,
    engagements,
    historique,
    majListe,
    acces,
    prochaines,
    activite,
  ] = await Promise.all([
    activeRaise(operationId),
    pipelineInvestors(operationId),
    pipelineInteractions(operationId),
    commitments(operationId),
    commitmentHistory(operationId),
    updates(operationId),
    listAccesses(operationId),
    // « Prochaines actions » et « Activité récente » affichaient quatre lignes
    // inventées chacune, sur toutes les levées. Un écran qui dit quoi faire
    // aujourd'hui doit dire ce qu'il y a à faire.
    prochainesActions(operationId),
    activiteRecenteLevee(operationId),
  ]);

  // Le détail d'une mise à jour ne se charge que si l'URL en désigne une :
  // indicateurs et consultations n'ont rien à faire dans la liste.
  const majCourante = query.maj
    ? await update(operationId, query.maj)
    : null;

  // Les signaux de lecture ne se calculent que pour la fiche ouverte : deux
  // mille lignes de journal par relation, pour un pipeline qu'on parcourt,
  // seraient payées pour rien.
  const fichee = query.fiche
    ? investisseurs.find((i) => i.id === query.fiche)
    : undefined;
  const signaux = await documentarySignals(operationId, fichee?.email ?? null);

  return (
    <Lever
      acces={acces}
      activite={activite}
      prochaines={prochaines}
      engagements={engagements}
      historique={historique}
      interactions={interactions}
      investisseurs={investisseurs}
      majCourante={majCourante}
      majListe={majListe}
      operationId={operationId}
      query={query}
      raise={raise}
      signaux={signaux}
    />
  );
}
