import {
  COHORTE_ACTIVITE,
  COHORTE_CHALLENGES,
  COHORTE_CHIFFRES,
  cohorte,
} from "@/features/v2/fixtures/programme";
import { v2Routes } from "@/features/v2/navigation/routes";
import { BarreEtats } from "@/features/v2/ui/BarreEtats";
import { Icon } from "@/features/v2/ui/Icon";


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
          label: "37 · cohorte peuplée",
        },
      ]}
    />
  );

  if (fixture.entreprises > 0) {
    return (
      <>
        <div className="v2-prog-head">
          <div>
            <h1>Vue d’ensemble</h1>
            <p>
              {fixture.entreprises} / {fixture.places} places · complétude
              moyenne 62 %
            </p>
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

        <div className="v2-chiffres">
          {COHORTE_CHIFFRES.map((chiffre) => (
            <div className="v2-card v2-dr-chiffre" key={chiffre.titre}>
              <div className="v2-nav-label" style={{ padding: "0 0 6px" }}>
                {chiffre.titre}
              </div>
              <b>{chiffre.valeur}</b>
              <small>{chiffre.detail}</small>
            </div>
          ))}
        </div>

        <div className="v2-prog-head" style={{ marginBottom: 8 }}>
          <div className="v2-nav-label" style={{ padding: 0 }}>
            Challenges en cours
          </div>
          <span className="v2-spacer" />
          <a className="v2-lien-action" href={ROUTES.challenges(cohorteId)}>
            Tout voir
          </a>
        </div>
        <div className="v2-card" style={{ overflow: "hidden" }}>
          {COHORTE_CHALLENGES.map((challenge) => (
            <div className="v2-prog-journal" key={challenge.titre}>
              <div>
                <b>{challenge.titre}</b>
                <div className="v2-muted">
                  {challenge.echeance} · {challenge.entreprises}
                </div>
              </div>
              <div className="v2-prep" style={{ flex: "0 0 auto" }}>
                <div className="v2-prep-bar">
                  <i style={{ width: `${challenge.avancement}%` }} />
                </div>
                <span>{challenge.avancement}&nbsp;%</span>
              </div>
            </div>
          ))}
        </div>

        <div className="v2-nav-label" style={{ padding: "22px 0 8px" }}>
          À traiter
        </div>
        <div className="v2-card" style={{ overflow: "hidden" }}>
          <div className="v2-atraiter">
            <b>3</b>
            <div>
              <span>Questions sans réponse</span>
            </div>
            <a
              className="v2-btn"
              data-variant="secondary"
              href={ROUTES.questions(cohorteId)}
            >
              Voir
            </a>
          </div>
          <div className="v2-atraiter">
            <b>2</b>
            <div>
              <span>Invitations sans réponse</span>
              <small>14 j</small>
            </div>
            <span className="v2-btn" data-variant="secondary">
              Relancer
            </span>
          </div>
        </div>

        <div className="v2-nav-label" style={{ padding: "22px 0 8px" }}>
          Activité récente
        </div>
        <div className="v2-card" style={{ overflow: "hidden" }}>
          {COHORTE_ACTIVITE.map((ligne) => (
            <div className="v2-prog-journal" key={ligne.acteur}>
              <span className="v2-pastille" data-ton={ligne.ton}>
                {ligne.initiales}
              </span>
              <div>
                <b>{ligne.acteur}</b> {ligne.fait}
              </div>
              <small>{ligne.quand}</small>
            </div>
          ))}
        </div>
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
