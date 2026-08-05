import { cohorte } from "@/features/v2/fixtures/programme";
import { CohorteShell } from "@/features/v2/ui/Shell";

/**
 * Le panneau contextuel d'une cohorte — écrans 03 à 17.
 *
 * L'effectif s'écrit de deux façons selon l'état, et les maquettes ne s'en
 * cachent pas : « 0 / 15 places » quand la cohorte est vide (écran 03), parce
 * que la seule information utile est ce qui reste à remplir ; « 12 entreprises »
 * dès qu'elle est peuplée (écran 05), parce que le nombre de places n'intéresse
 * plus personne.
 */
export default async function CohorteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ cohorteId: string }>;
}) {
  const { cohorteId } = await params;
  const fixture = cohorte(cohorteId);
  const vide = fixture.entreprises === 0;

  return (
    <CohorteShell
      cohorteId={fixture.id}
      compteurs={{
        entreprises: fixture.entreprises,
        challenges: fixture.challenges || undefined,
        questions: fixture.questions || undefined,
        dealrooms: fixture.dealrooms || undefined,
      }}
      effectif={
        vide
          ? `0 / ${fixture.places} places`
          : `${fixture.entreprises} entreprises`
      }
      nom={fixture.nom}
      periode={fixture.periode}
      search="Rechercher une entreprise"
    >
      {children}
    </CohorteShell>
  );
}
