import { cohorte } from "@/features/v2/fixtures/programme";
import { v2Routes } from "@/features/v2/navigation/routes";
import { BarreEtats } from "@/features/v2/ui/BarreEtats";
import { Icon } from "@/features/v2/ui/Icon";
import { RoutePlaceholder } from "@/features/v2/ui/RoutePlaceholder";

const ROUTES = v2Routes.programme.cohortes;

/**
 * Écran 03 — la vue d'ensemble d'une cohorte, le premier jour.
 *
 * Le paquet ne maquette QUE cet état-là : il n'existe aucune vue d'ensemble
 * peuplée. Une cohorte qui compte des entreprises affiche donc ce qu'elle
 * attend, plutôt qu'un écran inventé.
 */
export default async function CohortePage({
  params,
}: {
  params: Promise<{ cohorteId: string }>;
}) {
  const { cohorteId } = await params;
  const fixture = cohorte(cohorteId);
  const etats = (
    <BarreEtats
      etats={[
        {
          actif: fixture.entreprises === 0,
          href: ROUTES.root("saison-4-jour-1"),
          label: "03 · cohorte vide",
        },
        {
          actif: fixture.entreprises > 0,
          href: ROUTES.root("saison-4"),
          label: "cohorte peuplée · non maquettée",
        },
      ]}
    />
  );

  if (fixture.entreprises > 0) {
    return (
      <>
        <RoutePlaceholder
          contract={[
            "Le paquet ne montre la vue d’ensemble qu’à l’état vide (écran 03).",
            "Ce que voit un programme dont la cohorte tourne reste à dessiner.",
          ]}
          links={[
            {
              href: ROUTES.entreprises(cohorteId),
              label: "Les entreprises de cette cohorte (écran 05)",
            },
          ]}
          purpose="L’état vide est maquetté, celui-ci ne l’est pas."
          title="Vue d’ensemble"
        />
        {etats}
      </>
    );
  }

  return (
    <>
      <div className="v2-prog-head">
        <div>
          <h1>Vue d’ensemble</h1>
          <p>0 / {fixture.places} places · aucune entreprise</p>
        </div>
        <span className="v2-spacer" />
        <nav>
          <span className="v2-btn" data-variant="secondary">
            Modifier la cohorte
          </span>
          <a className="v2-btn" href={ROUTES.entreprises(cohorteId)}>
            Inviter une entreprise
          </a>
        </nav>
      </div>

      <section className="v2-card v2-prog-empty">
        <h2>Invitez vos premières entreprises</h2>
        <p>
          Rien n’apparaîtra ici avant qu’une entreprise ait accepté votre
          invitation.
        </p>
        <div>
          <a className="v2-btn" href={ROUTES.entreprises(cohorteId)}>
            Inviter par e-mail
          </a>
          <span className="v2-btn" data-variant="secondary">
            Importer une liste
          </span>
        </div>
      </section>

      {/* Les deux promesses. Elles ne décorent pas : elles disent au programme
          ce qu'il n'aura pas, avant qu'il ne le cherche. */}
      <div className="v2-prog-promesses">
        <span>
          <Icon name="check" />
          Elle garde la main sur ses documents.
        </span>
        <span>
          <Icon name="check" />
          Vous verrez son avancement, pas ses pièces.
        </span>
      </div>
      {etats}
    </>
  );
}
