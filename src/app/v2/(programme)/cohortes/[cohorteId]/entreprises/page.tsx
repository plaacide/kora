import {
  CHALLENGES_A_PROPOSER,
  cohorte,
  ENTREPRISES,
  SEGMENTS,
} from "@/features/v2/fixtures/programme";
import {
  lireCohorte,
  listerInvitations,
  type InvitationLue,
} from "@/features/v2/server/cohortes";
import { AvisEphemere } from "@/features/v2/ui/AvisEphemere";
import { BoutonEnvoi } from "@/features/v2/ui/BoutonEnvoi";

import { inviterEntreprise } from "../../actions";
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

/**
 * Écran 04 — les invitations réellement envoyées. BRANCHÉ.
 *
 * Le bloc « Conseil » a disparu : il nommait CoolBricks et son lien ouvert.
 * Le calculer demande une règle que personne n'a encore arrêtée — la plus
 * urgente ? la plus prometteuse ? — et l'inventer ici l'aurait figée dans un
 * écran plutôt que dans le domaine. Il revient quand la règle est décidée.
 */
function Invitations({
  cohorteId,
  invitations,
  erreur,
}: {
  cohorteId: string;
  invitations: readonly InvitationLue[];
  erreur?: string;
}) {
  const acceptees = invitations.filter((i) => i.statut === "Acceptée").length;

  return (
    <>
      <div className="v2-prog-head">
        <div>
          <h1>Entreprises</h1>
          <p>
            {invitations.length} invitation{invitations.length > 1 ? "s" : ""}{" "}
            envoyée{invitations.length > 1 ? "s" : ""} · {acceptees} acceptée
            {acceptees > 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {erreur && (
        <p className="v2-auth-error" role="alert">
          <AvisEphemere />
          {erreur === "email"
            ? "Donnez l’adresse e-mail de l’entreprise à inviter."
            : "L’invitation n’a pas pu être envoyée. Réessayez."}
        </p>
      )}

      <form
        action={inviterEntreprise}
        className="v2-card"
        style={{ display: "flex", gap: 12, marginBottom: 16, padding: "16px 18px" }}
      >
        <input name="cohorte" type="hidden" value={cohorteId} />
        <div className="v2-control" style={{ flex: 1, height: 44 }}>
          <input name="nom" placeholder="Nom de l’entreprise" />
        </div>
        <div className="v2-control" style={{ flex: 1, height: 44 }}>
          <input name="email" placeholder="contact@entreprise.com" required type="email" />
        </div>
        <BoutonEnvoi className="v2-btn" enCours="Envoi…">
          Inviter une entreprise
        </BoutonEnvoi>
      </form>

      {invitations.length > 0 && (
        <div className="v2-card" style={{ overflow: "hidden" }}>
          <table className="v2-tbl">
            <thead>
              <tr>
                <th>Entreprise</th>
                <th>Envoyée le</th>
                <th>Dernière activité</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {invitations.map((invitation) => (
                <tr key={invitation.id}>
                  <td>
                    <div className="v2-ident">
                      <span className="v2-pastille" data-ton="neutral">
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
                    <span className="v2-badge" data-tone={invitation.ton}>
                      <span className="v2-dot" />
                      {invitation.statut}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="v2-dr-note">
        Une invitation expire après 30 jours. Un rappel au maximum toutes les
        48&nbsp;heures par entreprise.
      </p>
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
  searchParams: Promise<{ arrivee?: string; erreur?: string }>;
}) {
  const [{ cohorteId }, { arrivee, erreur }] = await Promise.all([
    params,
    searchParams,
  ]);
  const [reelle, invitations] = await Promise.all([
    lireCohorte(cohorteId),
    listerInvitations(cohorteId),
  ]);

  // Tant qu'aucune entreprise n'a accepté, l'écran est celui des invitations.
  // L'écran 05 attend `sae_portfolio()` : il reste en fixtures, et le dit.
  if (reelle && reelle.entreprises === 0) {
    return (
      <Invitations
        cohorteId={cohorteId}
        erreur={erreur}
        invitations={invitations}
      />
    );
  }

  return cohorte(cohorteId).entreprises === 0 ? (
    <Invitations cohorteId={cohorteId} erreur={erreur} invitations={invitations} />
  ) : (
    <Actives arrivee={arrivee === "1"} cohorteId={cohorteId} />
  );
}
