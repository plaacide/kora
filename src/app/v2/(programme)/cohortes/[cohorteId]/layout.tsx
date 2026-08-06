import { notFound } from "next/navigation";

import { lireCohorte } from "@/features/v2/server/cohortes";
import { CohorteShell } from "@/features/v2/ui/Shell";

/**
 * Le panneau contextuel d'une cohorte — branché sur la base.
 *
 * Les compteurs que la donnée ne sait pas encore rendre — Challenges,
 * questions, Dealrooms — ne sont PAS affichés à zéro. Un panneau qui annonce
 * « Challenges 0 » sur une cohorte dont personne n'a encore créé de Challenge
 * ne dit pas qu'il n'y en a pas : il dit que le produit ne marche pas. Ils
 * reviendront avec leur lot.
 */
export default async function CohorteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ cohorteId: string }>;
}) {
  const { cohorteId } = await params;
  const cohorte = await lireCohorte(cohorteId);

  if (!cohorte) notFound();

  return (
    <CohorteShell
      cohorteId={cohorte.id}
      compteurs={{ entreprises: cohorte.entreprises }}
      effectif={cohorte.effectif}
      nom={cohorte.nom}
      periode={cohorte.periode}
      search="Rechercher une entreprise"
    >
      {children}
    </CohorteShell>
  );
}
