import {
  avancement,
  echeanceCourte,
  etatSuivi,
  repartition,
  type Repartition,
} from "@/features/v2/domain/challenges";
import { v2Routes } from "@/features/v2/navigation/routes";
import {
  type ChallengeLu,
  listerChallenges,
  rafraichirChallenge,
} from "@/features/v2/server/challenges";

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
  part,
  total,
}: {
  part: Repartition;
  total: number;
}) {
  const largeur = (valeur: number) =>
    total > 0 ? `${(valeur / total) * 100}%` : "0%";
  const mots = [
    part.terminees > 0 && `${part.terminees} terminées`,
    part.enCours > 0 && `${part.enCours} en cours`,
    part.enRetard > 0 && `${part.enRetard} en retard`,
    part.aFaire > 0 && `${part.aFaire} à faire`,
  ].filter(Boolean);

  return (
    <div className="v2-chal-avancement">
      <div className="v2-segbar">
        <i data-part="terminees" style={{ width: largeur(part.terminees) }} />
        <i data-part="encours" style={{ width: largeur(part.enCours) }} />
        <i data-part="enretard" style={{ width: largeur(part.enRetard) }} />
      </div>
      <small>{mots.join(" · ") || "aucune entreprise assignée"}</small>
    </div>
  );
}

/** Écran 09b — les Challenges actifs. */
function Actifs({
  challenges,
  cohorteId,
  maintenant,
}: {
  challenges: readonly ChallengeLu[];
  cohorteId: string;
  maintenant: Date;
}) {
  // « N entreprises en retard », et non le nombre de Challenges qui en
  // comptent : deux Challenges peuvent être en retard sur la MÊME entreprise.
  // On dédoublonne donc par organisation.
  const enRetard = new Set<string>();
  for (const c of challenges) {
    for (const e of c.entreprises) {
      if (etatSuivi(e, c.echeance, maintenant) === "En retard") {
        enRetard.add(e.org);
      }
    }
  }

  return (
    <>
      <div className="v2-prog-head">
        <div>
          <h1>Challenges</h1>
          <p>
            {challenges.length} Challenge{challenges.length > 1 ? "s" : ""} actif
            {challenges.length > 1 ? "s" : ""}
            {enRetard.size > 0 &&
              ` · ${enRetard.size} entreprise${enRetard.size > 1 ? "s" : ""} en retard`}
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
        {challenges.map((challenge) => {
          const part = repartition(
            challenge.entreprises,
            challenge.echeance,
            maintenant,
          );
          const pourcent = avancement(challenge.entreprises);
          return (
            <article className="v2-card v2-chal" key={challenge.id}>
              <div>
                <div className="v2-chal-titre">
                  <a href={ROUTES.challenge(cohorteId, challenge.id)}>
                    {challenge.titre}
                  </a>
                  {challenge.categorie && (
                    <span className="v2-tag">{challenge.categorie}</span>
                  )}
                  {part.enRetard > 0 && (
                    <span className="v2-badge" data-tone="red">
                      <span className="v2-dot" />
                      {part.enRetard} en retard
                    </span>
                  )}
                </div>
                <div className="v2-chal-meta">
                  {challenge.entreprises.length} entreprise
                  {challenge.entreprises.length > 1 ? "s" : ""} ·{" "}
                  {challenge.echeance
                    ? `Échéance · ${echeanceCourte(challenge.echeance)}`
                    : "sans échéance"}
                  {pourcent !== null && ` · ${pourcent} %`}
                </div>
              </div>
              <Avancement part={part} total={challenge.entreprises.length} />
              <div className="v2-chal-actions">
                <a
                  className="v2-btn"
                  data-variant="secondary"
                  href={ROUTES.challenge(cohorteId, challenge.id)}
                >
                  Voir
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}

export default async function ChallengesPage({
  params,
}: {
  params: Promise<{ cohorteId: string }>;
}) {
  const { cohorteId } = await params;

  // Les critères connectés se remettent à jour AVANT l'affichage. La fonction
  // ne fait qu'ajouter et deux passages valent un seul : on peut l'appeler à
  // chaque ouverture sans y réfléchir.
  const premiers = await listerChallenges(cohorteId);
  await Promise.all(premiers.map((c) => rafraichirChallenge(c.id)));
  const challenges = premiers.length > 0 ? await listerChallenges(cohorteId) : premiers;

  // UNE seule lecture de l'heure pour toute la page : deux appels séparés
  // pourraient tomber de part et d'autre de minuit et donner deux verdicts
  // différents sur la même échéance.
  const maintenant = new Date();

  return challenges.length === 0 ? (
    <Vide cohorteId={cohorteId} />
  ) : (
    <Actifs
      challenges={challenges}
      cohorteId={cohorteId}
      maintenant={maintenant}
    />
  );
}
