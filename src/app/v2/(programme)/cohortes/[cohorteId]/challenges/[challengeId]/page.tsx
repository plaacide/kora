import { notFound } from "next/navigation";

import {
  echeanceCourte,
  type EtatSuivi,
  etatSuivi,
  ordreDeSuivi,
  repartition,
} from "@/features/v2/domain/challenges";
import { initiales } from "@/features/v2/domain/questions";
import { v2Routes } from "@/features/v2/navigation/routes";
import {
  type CritereSuivi,
  criteresSuivis,
  type EntrepriseSuivie,
  lireChallenge,
  listerChallenges,
  rafraichirChallenge,
} from "@/features/v2/server/challenges";
import { destinataires } from "@/features/v2/server/questions";
import { AvisEphemere } from "@/features/v2/ui/AvisEphemere";
import { BoutonEnvoi } from "@/features/v2/ui/BoutonEnvoi";
import { Icon } from "@/features/v2/ui/Icon";

import { assignerChallenge } from "./actions";

const ROUTES = v2Routes.programme.cohortes;

const TON_STATUT: Record<EtatSuivi, string> = {
  "À faire": "neutral",
  "En cours": "blue",
  "En retard": "red",
  Terminé: "green",
};

const TONS = ["orange", "blue", "green", "amber", "neutral"] as const;
function ton(nom: string): (typeof TONS)[number] {
  let somme = 0;
  for (const c of nom) somme = (somme + c.charCodeAt(0)) % 997;
  return TONS[somme % TONS.length]!;
}

/** Écran 13 — à qui assigner ce Challenge. */
function Assigner({
  challengeId,
  cohorteId,
  dejaAssignees,
  entreprises,
  erreur,
}: {
  challengeId: string;
  cohorteId: string;
  dejaAssignees: ReadonlySet<string>;
  entreprises: readonly { org: string; nom: string }[];
  erreur?: string;
}) {
  return (
    <form action={assignerChallenge}>
      <input name="cohorte" type="hidden" value={cohorteId} />
      <input name="challenge" type="hidden" value={challengeId} />

      <div className="v2-prog-head">
        <div>
          <h1>À qui souhaitez-vous assigner ce Challenge&nbsp;?</h1>
        </div>
      </div>

      {erreur && (
        <p className="v2-auth-error" role="alert">
          <AvisEphemere />
          {erreur === "aucune"
            ? "Choisissez au moins une entreprise."
            : "L’assignation n’a pas abouti. Réessayez."}
        </p>
      )}

      <div className="v2-assigner">
        <div>
          <div className="v2-card" style={{ overflow: "hidden" }}>
            <table className="v2-tbl">
              <thead>
                <tr>
                  <th aria-label="Sélection" />
                  <th>Entreprise</th>
                  <th>État</th>
                </tr>
              </thead>
              <tbody>
                {entreprises.map((e) => {
                  const deja = dejaAssignees.has(e.org);
                  return (
                    <tr key={e.org}>
                      <td style={{ width: 36 }}>
                        {/* Une entreprise DÉJÀ assignée reste cochée et
                            désactivée : on n'assigne pas deux fois, et la
                            décocher ne la retirerait pas — `assign_challenge`
                            n'enlève rien. Laisser croire le contraire serait
                            pire que de l'interdire. */}
                        <input
                          defaultChecked={deja}
                          disabled={deja}
                          name="entreprise"
                          type="checkbox"
                          value={e.org}
                        />
                      </td>
                      <td>
                        <div className="v2-ident">
                          <span className="v2-pastille" data-ton={ton(e.nom)}>
                            {initiales(e.nom)}
                          </span>
                          <div>
                            <b>{e.nom}</b>
                          </div>
                        </div>
                      </td>
                      <td className="v2-dim">
                        {deja ? "déjà assignée" : "à assigner"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="v2-card">
          <BoutonEnvoi
            className="v2-btn"
            enCours="Assignation…"
          >
            Assigner le Challenge
          </BoutonEnvoi>
          <p>
            Chaque entreprise verra ce Challenge dans son espace. Un Challenge
            existant peut être assigné à tout moment à de nouvelles
            entreprises — sans le recréer.
          </p>
        </aside>
      </div>
    </form>
  );
}

/** Le panneau de l'écran 15 — une entreprise suivie sur ce Challenge. */
function PanneauEntreprise({
  criteres,
  echeance,
  entreprise,
  retour,
  titre,
}: {
  criteres: readonly CritereSuivi[];
  echeance: string | null;
  entreprise: EntrepriseSuivie;
  retour: string;
  titre: string;
}) {
  const faits = criteres.filter((c) => c.fait).length;
  const part = criteres.length > 0 ? (faits / criteres.length) * 100 : 0;

  return (
    <>
      <a
        aria-label="Fermer le panneau"
        className="v2-scrim-panneau"
        href={retour}
      />
      <aside className="v2-panneau">
        <div className="v2-panneau-head">
          <span className="v2-pastille" data-ton={ton(entreprise.nom)}>
            {initiales(entreprise.nom)}
          </span>
          <div style={{ flex: 1 }}>
            <h2>{entreprise.nom}</h2>
          </div>
          <a className="v2-x" href={retour}>
            <Icon name="close" />
          </a>
        </div>

        <div className="v2-panneau-body">
          <div>
            <div className="v2-nav-label" style={{ padding: "0 0 6px" }}>
              Challenge
            </div>
            <b style={{ font: "600 15px var(--font-v2-head), sans-serif" }}>
              {titre}
            </b>
            <div className="v2-chal-meta">
              {faits} / {criteres.length} critères réalisés · Échéance ·{" "}
              {echeanceCourte(echeance)}
            </div>
            <div
              className="v2-prep-bar"
              style={{ marginTop: 10, width: "100%" }}
            >
              <i style={{ width: `${part}%` }} />
            </div>
          </div>

          <div>
            <div className="v2-nav-label" style={{ padding: "0 0 4px" }}>
              Critères
            </div>
            {criteres.map((critere) => (
              <div
                className="v2-crit-suivi"
                data-fait={critere.fait}
                key={critere.id}
              >
                <i>{critere.fait && <Icon name="check" />}</i>
                <div>
                  <b>{critere.libelle}</b>
                  <small>
                    {/* L'ORIGINE EST DITE. « Validé automatiquement » et
                        « confirmé par l'entreprise » n'engagent pas la même
                        personne, et le programme doit savoir laquelle. */}
                    {critere.fait
                      ? critere.origine === "auto"
                        ? "validé automatiquement par Sanza"
                        : "confirmé par l’entreprise"
                      : critere.source === "connecte"
                        ? "se validera seul dès l’exigence satisfaite"
                        : "à confirmer par l’entreprise"}
                    {!critere.requis && " · facultatif"}
                  </small>
                </div>
              </div>
            ))}
          </div>

          <p className="v2-panneau-note">
            Vous voyez l’état de réalisation, jamais les documents de
            l’entreprise.
          </p>
        </div>

        <div className="v2-panneau-foot">
          <a className="v2-btn" data-variant="secondary" href={retour}>
            Fermer
          </a>
        </div>
      </aside>
    </>
  );
}

/** Écran 14 — le suivi du Challenge, retards en tête. */
function Suivi({
  challengeId,
  categorie,
  cohorteId,
  echeance,
  entreprises,
  maintenant,
  titre,
}: {
  challengeId: string;
  categorie: string | null;
  cohorteId: string;
  echeance: string | null;
  entreprises: readonly EntrepriseSuivie[];
  maintenant: Date;
  titre: string;
}) {
  const part = repartition(entreprises, echeance, maintenant);
  const base = ROUTES.challenge(cohorteId, challengeId);
  const triees = ordreDeSuivi(entreprises, echeance, maintenant);

  return (
    <>
      <div className="v2-prog-head">
        <div>
          <h1>{titre}</h1>
          <p>
            {entreprises.length} entreprise{entreprises.length > 1 ? "s" : ""} ·
            Échéance · {echeanceCourte(echeance)}
            {categorie && (
              <span className="v2-tag" style={{ marginLeft: 8 }}>
                {categorie}
              </span>
            )}
          </p>
        </div>
        <span className="v2-spacer" />
        <nav>
          <a className="v2-btn" data-variant="secondary" href={`${base}?assigner=1`}>
            Assigner à d’autres entreprises
          </a>
        </nav>
      </div>

      <div className="v2-chiffres">
        <div className="v2-card v2-chiffre">
          <b>{part.terminees}</b>
          <span>terminées</span>
        </div>
        <div className="v2-card v2-chiffre">
          <b>{part.enCours}</b>
          <span>en cours</span>
        </div>
        <div className="v2-card v2-chiffre" data-ton="red">
          <b>{part.enRetard}</b>
          <span>en retard</span>
        </div>
      </div>

      <div className="v2-card" style={{ overflow: "hidden" }}>
        <table className="v2-tbl">
          <thead>
            <tr>
              <th>Entreprise</th>
              <th>Progression</th>
              <th>Statut</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {triees.map((ligne) => {
              const etat = etatSuivi(ligne, echeance, maintenant);
              return (
                <tr key={ligne.org}>
                  <td>
                    <a
                      href={`${base}?entreprise=${ligne.org}`}
                      style={{ color: "inherit" }}
                    >
                      <div className="v2-ident">
                        <span className="v2-pastille" data-ton={ton(ligne.nom)}>
                          {initiales(ligne.nom)}
                        </span>
                        <div>
                          <b>{ligne.nom}</b>
                        </div>
                      </div>
                    </a>
                  </td>
                  <td>
                    {ligne.faits} / {ligne.requis}
                  </td>
                  <td>
                    <span className="v2-badge" data-tone={TON_STATUT[etat]}>
                      <span className="v2-dot" />
                      {etat}
                    </span>
                  </td>
                  <td data-actions>
                    {ligne.fige && <span className="v2-muted">figée</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="v2-prog-tbl-foot">
          <span>Tri : en retard d’abord.</span>
          <span>Vous voyez l’état de réalisation, jamais les documents.</span>
        </div>
      </div>
    </>
  );
}

export default async function ChallengePage({
  params,
  searchParams,
}: {
  params: Promise<{ cohorteId: string; challengeId: string }>;
  searchParams: Promise<{
    assigner?: string;
    entreprise?: string;
    erreur?: string;
  }>;
}) {
  const [{ challengeId, cohorteId }, { assigner, entreprise, erreur }] =
    await Promise.all([params, searchParams]);

  await rafraichirChallenge(challengeId);

  const [entete, challenges] = await Promise.all([
    lireChallenge(challengeId),
    listerChallenges(cohorteId),
  ]);
  if (!entete) notFound();

  const ici = challenges.find((c) => c.id === challengeId);
  const assignees = ici?.entreprises ?? [];
  const base = ROUTES.challenge(cohorteId, challengeId);

  // UNE seule lecture de l'heure : deux appels séparés pourraient tomber de
  // part et d'autre de minuit et rendre deux verdicts sur la même échéance.
  const maintenant = new Date();

  if (assigner === "1") {
    const membres = await destinataires(cohorteId);
    return (
      <Assigner
        challengeId={challengeId}
        cohorteId={cohorteId}
        dejaAssignees={new Set(assignees.map((e) => e.org))}
        entreprises={membres}
        erreur={erreur}
      />
    );
  }

  const suivie = entreprise
    ? assignees.find((e) => e.org === entreprise)
    : undefined;
  const criteres = suivie ? await criteresSuivis(challengeId, suivie.org) : [];

  return (
    <>
      <Suivi
        categorie={entete.categorie}
        challengeId={challengeId}
        cohorteId={cohorteId}
        echeance={entete.echeance}
        entreprises={assignees}
        maintenant={maintenant}
        titre={entete.titre}
      />
      {suivie && (
        <PanneauEntreprise
          criteres={criteres}
          echeance={entete.echeance}
          entreprise={suivie}
          retour={base}
          titre={entete.titre}
        />
      )}
    </>
  );
}
