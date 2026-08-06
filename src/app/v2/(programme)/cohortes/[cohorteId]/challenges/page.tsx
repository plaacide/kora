import {
  CHALLENGES,
  CHALLENGES_TERMINES,
  cohorte,
  ENTREPRISES_EN_RETARD,
} from "@/features/v2/fixtures/programme";
import { v2Routes } from "@/features/v2/navigation/routes";
import { BarreEtats } from "@/features/v2/ui/BarreEtats";

const ROUTES = v2Routes.programme.cohortes;

/** Écran 09 — aucun Challenge actif. */
function Vide({ cohorteId }: { cohorteId: string }) {
  return (
    <>
      <div className="v2-prog-head">
        <div>
          <h1>Challenges</h1>
          <p>Transformez vos objectifs de cohorte en actions concrètes.</p>
        </div>
      </div>
      <section className="v2-card v2-prog-empty">
        <h2>Aucun Challenge n’est actif pour cette cohorte</h2>
        <p>
          Un Challenge est une action structurée demandée à vos
          entreprises&nbsp;: préparer un Demo Day, compléter un dossier, mettre
          à jour des KPIs.
        </p>
        <div>
          <a className="v2-btn" href={ROUTES.challengeNouveau(cohorteId)}>
            Créer un Challenge
          </a>
          <a
            className="v2-btn"
            data-variant="secondary"
            href={ROUTES.bibliotheque(cohorteId)}
          >
            Parcourir la bibliothèque
          </a>
        </div>
        <small>
          Vous suivez l’état d’avancement. Les documents restent dans l’espace
          de chaque entreprise.
        </small>
      </section>
    </>
  );
}

/**
 * La barre segmentée d'un Challenge — écran 09b.
 *
 * Vert ce qui est fait, orange ce qui avance, rouge ce qui a dépassé. Une
 * jauge unique dirait un pourcentage sans dire qu'une entreprise est en
 * retard : la seule chose à voir ici.
 */
function Avancement({
  repartition,
  entreprises,
}: {
  repartition: (typeof CHALLENGES)[number]["repartition"];
  entreprises: number;
}) {
  const part = (valeur: number) => `${(valeur / entreprises) * 100}%`;
  const mots = [
    repartition.terminees > 0 && `${repartition.terminees} terminées`,
    repartition.enCours > 0 && `${repartition.enCours} en cours`,
    repartition.enRetard > 0 && `${repartition.enRetard} en retard`,
    repartition.aFaire > 0 && `${repartition.aFaire} à faire`,
  ].filter(Boolean);

  return (
    <div className="v2-chal-avancement">
      <div className="v2-segbar">
        <i
          data-part="terminees"
          style={{ width: part(repartition.terminees) }}
        />
        <i data-part="encours" style={{ width: part(repartition.enCours) }} />
        <i data-part="enretard" style={{ width: part(repartition.enRetard) }} />
      </div>
      <small>{mots.join(" · ")}</small>
    </div>
  );
}

/** Écran 09b — quatre Challenges actifs, un terminé. */
function Actifs({ cohorteId }: { cohorteId: string }) {
  return (
    <>
      <div className="v2-prog-head">
        <div>
          <h1>Challenges</h1>
          {/* « 1 entreprise en retard », et non le nombre de Challenges qui
              en comptent une : deux Challenges peuvent être en retard sur la
              MÊME entreprise. Le chiffre est celui de la maquette, il ne se
              déduit pas des quatre lignes. */}
          <p>
            {CHALLENGES.length} Challenges actifs · {ENTREPRISES_EN_RETARD}{" "}
            entreprise en retard
          </p>
        </div>
        <span className="v2-spacer" />
        <nav>
          <a
            className="v2-btn"
            data-variant="secondary"
            href={ROUTES.bibliotheque(cohorteId)}
          >
            Bibliothèque
          </a>
          <a className="v2-btn" href={ROUTES.challengeNouveau(cohorteId)}>
            Créer un Challenge
          </a>
        </nav>
      </div>

      <div className="v2-chal-liste">
        {CHALLENGES.map((challenge) => (
          <article className="v2-card v2-chal" key={challenge.id}>
            <div>
              <div className="v2-chal-titre">
                <a href={ROUTES.challenge(cohorteId, challenge.id)}>
                  {challenge.titre}
                </a>
                <span className="v2-tag">{challenge.categorie}</span>
                {challenge.repartition.enRetard > 0 && (
                  <span className="v2-badge" data-tone="red">
                    <span className="v2-dot" />
                    {challenge.repartition.enRetard} en retard
                  </span>
                )}
              </div>
              <div className="v2-chal-meta">
                {challenge.entreprises} entreprises · Échéance ·{" "}
                {challenge.echeance}
              </div>
            </div>
            <Avancement
              entreprises={challenge.entreprises}
              repartition={challenge.repartition}
            />
            <div className="v2-chal-actions">
              <a
                className="v2-btn"
                data-variant="secondary"
                href={`${ROUTES.challenge(cohorteId, challenge.id)}?assigner=1`}
              >
                Assigner
              </a>
              <a
                className="v2-btn"
                data-variant="secondary"
                href={ROUTES.challenge(cohorteId, challenge.id)}
              >
                Voir
              </a>
            </div>
          </article>
        ))}
      </div>

      <div className="v2-nav-label" style={{ padding: "22px 0 8px" }}>
        Terminés
      </div>
      {CHALLENGES_TERMINES.map((challenge) => (
        <div className="v2-card v2-chal-clos" key={challenge.titre}>
          <b>{challenge.titre}</b>
          <span className="v2-tag">{challenge.categorie}</span>
          <span className="v2-badge" data-tone="green">
            <span className="v2-dot" />
            {challenge.resultat}
          </span>
          <span className="v2-spacer" />
          <span>{challenge.clos}</span>
        </div>
      ))}
    </>
  );
}

export default async function ChallengesPage({
  params,
}: {
  params: Promise<{ cohorteId: string }>;
}) {
  const { cohorteId } = await params;
  const vide = cohorte(cohorteId).challenges === 0;

  return (
    <>
      {vide ? <Vide cohorteId={cohorteId} /> : <Actifs cohorteId={cohorteId} />}
      <BarreEtats
        etats={[
          {
            actif: vide,
            href: ROUTES.challenges("saison-4-jour-1"),
            label: "09 · aucun Challenge",
          },
          {
            actif: !vide,
            href: ROUTES.challenges("saison-4"),
            label: "09b · quatre actifs",
          },
        ]}
      />
    </>
  );
}
