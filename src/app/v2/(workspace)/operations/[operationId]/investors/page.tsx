import { redirect } from "next/navigation";

/**
 * Le pipeline vit dans Lever, pas sur sa propre route.
 *
 * Cette page existait et personne ne pouvait l'atteindre : le rail ne la
 * listait pas, et l'onglet « Pipeline » de Lever menait à des fixtures. Elle
 * redirige plutôt que de disparaître — un lien enregistré quelque part doit
 * continuer de mener au bon endroit.
 */
export default async function InvestorsPage({
  params,
}: {
  params: Promise<{ operationId: string }>;
}) {
  const { operationId } = await params;
  redirect(`/v2/operations/${operationId}/lever?view=pipeline`);
}
