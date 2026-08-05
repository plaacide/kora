import {
  CHALLENGES_A_PROPOSER,
  cohorte,
  ENTREPRISES,
  INVITATIONS,
  SEGMENTS,
} from "@/features/v2/fixtures/programme";
import { v2Routes } from "@/features/v2/navigation/routes";
import { BarreEtats } from "@/features/v2/ui/BarreEtats";
import { Icon } from "@/features/v2/ui/Icon";

const ROUTES = v2Routes.programme.cohortes;

function Conseil({ children }: { children: React.ReactNode }) {
  return (
    <div className="v2-prog-conseil">
      <Icon name="bulb" />
      <span>
        <b>Conseil.</b> {children}
      </span>
    </div>
  );
}

/** Écran 04 — quatre invitations envoyées, aucune acceptée. */
function Invitations({ cohorteId }: { cohorteId: string }) {
  return (
    <>
      <div className="v2-prog-head">
        <div>
          <h1>Entreprises</h1>
          <p>{INVITATIONS.length} invitations envoyées · 0 acceptée</p>
        </div>
        <span className="v2-spacer" />
        <nav>
          <span className="v2-btn" data-variant="secondary">
            Relancer tout le monde
          </span>
          <span className="v2-btn">Inviter une entreprise</span>
        </nav>
      </div>

      <Conseil>
        CoolBricks a ouvert le lien sans aller au bout. C’est l’invitation la
        plus prometteuse de votre liste&nbsp;: un appel court est probablement
        plus utile qu’un nouvel e-mail.
      </Conseil>

      <div className="v2-card" style={{ overflow: "hidden" }}>
        <table className="v2-tbl">
          <thead>
            <tr>
              <th>Entreprise</th>
              <th>Envoyée le</th>
              <th>Dernière activité</th>
              <th>Statut</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {INVITATIONS.map((invitation) => (
              <tr key={invitation.email}>
                <td>
                  <div className="v2-ident">
                    <span className="v2-pastille" data-ton={invitation.ton}>
                      {invitation.initiales}
                    </span>
                    <div>
                      <b>{invitation.nom}</b>
                      <div>{invitation.email}</div>
                    </div>
                  </div>
                </td>
                <td className="v2-muted">{invitation.envoyee}</td>
                <td className="v2-dim">{invitation.activite}</td>
                <td>
                  <span className="v2-badge" data-tone={invitation.statutTon}>
                    <span className="v2-dot" />
                    {invitation.statut}
                  </span>
                </td>
                <td data-actions>
                  <span className="v2-btn" data-variant="text">
                    {invitation.action}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p
        style={{
          color: "var(--text-3)",
          fontSize: "12.5px",
          margin: "12px 2px 0",
        }}
      >
        Une invitation expire après 30 jours. Un rappel au maximum toutes les
        48&nbsp;heures par entreprise.
      </p>
      <Etats cohorteId={cohorteId} courant="04" />
    </>
  );
}

/** Écran 05 — douze entreprises actives, six affichées. */
function Actives({
  cohorteId,
  arrivee,
}: {
  cohorteId: string;
  arrivee: boolean;
}) {
  const total = cohorte(cohorteId).entreprises;

  return (
    <>
      <div className="v2-prog-head">
        <div>
          <h1>Entreprises</h1>
          <p>
            {total} entreprises · 9 préparations actives · 4 Challenges en cours
            · 3 dans des Dealrooms
          </p>
        </div>
        <span className="v2-spacer" />
        <nav>
          <span className="v2-btn" data-variant="secondary">
            Inviter une entreprise
          </span>
          <span className="v2-btn" data-variant="secondary">
            Créer une Dealroom
          </span>
          <a className="v2-btn" href={ROUTES.challengeNouveau(cohorteId)}>
            Créer un Challenge
          </a>
        </nav>
      </div>

      <Conseil>
        Kalyx Foods a dépassé de 4 jours l’échéance du Challenge «&nbsp;Mettre à
        jour les KPIs&nbsp;». C’est l’action la plus urgente de la cohorte.
      </Conseil>

      <div className="v2-prog-segments">
        {SEGMENTS.map((segment, rang) => (
          <span className="v2-tag" data-active={rang === 0} key={segment}>
            {segment}
          </span>
        ))}
      </div>

      <div className="v2-card" style={{ overflow: "hidden" }}>
        <table className="v2-tbl">
          <thead>
            <tr>
              <th>Entreprise</th>
              <th>Opération présentée</th>
              <th>Préparation</th>
              <th>Challenges</th>
              <th>Dealrooms</th>
              <th>À faire</th>
            </tr>
          </thead>
          <tbody>
            {ENTREPRISES.map((entreprise) => (
              <tr key={entreprise.nom}>
                <td>
                  <div className="v2-ident">
                    <span className="v2-pastille" data-ton={entreprise.ton}>
                      {entreprise.initiales}
                    </span>
                    <div>
                      <b>{entreprise.nom}</b>
                      {entreprise.mention && (
                        <>
                          {" "}
                          <span
                            className="v2-badge"
                            data-tone={
                              entreprise.mention.ton === "red"
                                ? "red"
                                : undefined
                            }
                          >
                            {entreprise.mention.ton === "red" && (
                              <span className="v2-dot" />
                            )}
                            {entreprise.mention.texte}
                          </span>
                        </>
                      )}
                      <div>
                        {entreprise.secteur} · {entreprise.pays}
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  {entreprise.operation ? (
                    <div>
                      <span>{entreprise.operation}</span>
                      <div className="v2-muted">{entreprise.instrument}</div>
                    </div>
                  ) : (
                    <span className="v2-muted">non renseignée</span>
                  )}
                </td>
                <td>
                  {entreprise.preparation === null ? (
                    <span className="v2-muted">—</span>
                  ) : (
                    <div className="v2-prep">
                      <div className="v2-prep-bar">
                        <i style={{ width: `${entreprise.preparation}%` }} />
                      </div>
                      <span>{entreprise.preparation}&nbsp;%</span>
                    </div>
                  )}
                </td>
                <td className={entreprise.challenges ? undefined : "v2-muted"}>
                  {entreprise.challenges ?? "—"}
                </td>
                <td className={entreprise.dealroom ? undefined : "v2-muted"}>
                  {entreprise.dealroom ?? "—"}
                </td>
                <td>
                  {entreprise.aFaire ? (
                    <a className="v2-lien-action">{entreprise.aFaire}</a>
                  ) : (
                    <span className="v2-muted">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="v2-prog-tbl-foot">
          <span>
            {ENTREPRISES.length} entreprises affichées sur {total}
          </span>
          <span>Vous voyez l’avancement, jamais les documents.</span>
        </div>
      </div>
      <Etats cohorteId={cohorteId} courant={arrivee ? "17" : "05"} />
      {arrivee && <Arrivee cohorteId={cohorteId} />}
    </>
  );
}

/**
 * Écran 17 — une entreprise vient de rejoindre la cohorte.
 *
 * « Pas d'assignation silencieuse » : les Challenges actifs sont PROPOSÉS.
 * Le bouton compte ceux qui sont cochés, et « Pas maintenant » est une sortie
 * de plein droit, pas un abandon.
 */
function Arrivee({ cohorteId }: { cohorteId: string }) {
  return (
    <div className="v2-scrim">
      <div className="v2-modale" role="dialog">
        <header>
          <h2>CoolBricks vient de rejoindre la cohorte</h2>
          <p>
            {CHALLENGES_A_PROPOSER.length} Challenges sont actuellement actifs
            pour {cohorte(cohorteId).nom}. Choisissez ceux à proposer à
            CoolBricks.
          </p>
        </header>
        <ul>
          {CHALLENGES_A_PROPOSER.map((challenge) => (
            <li key={challenge.titre}>
              <span className="v2-modale-coche">
                <Icon name="check" />
              </span>
              <b>{challenge.titre}</b>
              <small>{challenge.criteres} critères</small>
            </li>
          ))}
        </ul>
        <footer>
          <a
            className="v2-btn"
            data-variant="secondary"
            href={ROUTES.entreprises(cohorteId)}
          >
            Pas maintenant
          </a>
          <span className="v2-btn">
            Assigner les {CHALLENGES_A_PROPOSER.length} Challenges
          </span>
        </footer>
      </div>
    </div>
  );
}

function Etats({
  cohorteId,
  courant,
}: {
  cohorteId: string;
  courant: "04" | "05" | "17";
}) {
  return (
    <BarreEtats
      etats={[
        {
          actif: courant === "04",
          href: ROUTES.entreprises("saison-4-jour-1"),
          label: "04 · invitations en attente",
        },
        {
          actif: courant === "05",
          href: ROUTES.entreprises("saison-4"),
          label: "05 · entreprises actives",
        },
        {
          actif: courant === "17",
          href: `${ROUTES.entreprises(cohorteId === "saison-4-jour-1" ? "saison-4" : cohorteId)}?arrivee=1`,
          label: "17 · une entreprise arrive",
        },
      ]}
    />
  );
}

export default async function EntreprisesPage({
  params,
  searchParams,
}: {
  params: Promise<{ cohorteId: string }>;
  searchParams: Promise<{ arrivee?: string }>;
}) {
  const [{ cohorteId }, { arrivee }] = await Promise.all([
    params,
    searchParams,
  ]);

  return cohorte(cohorteId).entreprises === 0 ? (
    <Invitations cohorteId={cohorteId} />
  ) : (
    <Actives arrivee={arrivee === "1"} cohorteId={cohorteId} />
  );
}
