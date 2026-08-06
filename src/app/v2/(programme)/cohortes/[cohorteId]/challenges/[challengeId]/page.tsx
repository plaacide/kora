import {
  A_ASSIGNER,
  ASSIGNATIONS,
  CHALLENGES,
  CRITERES_SUIVIS,
  PROGRAMME,
  SEGMENTS_SUIVI,
} from "@/features/v2/fixtures/programme";
import { v2Routes } from "@/features/v2/navigation/routes";
import { BarreEtats } from "@/features/v2/ui/BarreEtats";
import { Icon } from "@/features/v2/ui/Icon";

const ROUTES = v2Routes.programme.cohortes;

function challengeOu(id: string) {
  return CHALLENGES.find((item) => item.id === id) ?? CHALLENGES[0];
}

/** Écran 13 — à qui assigner ce Challenge. */
function Assigner({
  cohorteId,
  challengeId,
}: {
  cohorteId: string;
  challengeId: string;
}) {
  const challenge = challengeOu(challengeId);
  const retenues = A_ASSIGNER.filter((item) => item.retenue).length;
  const connectes = 2;

  return (
    <>
      <div className="v2-prog-head">
        <div>
          <h1>À qui souhaitez-vous assigner ce Challenge&nbsp;?</h1>
        </div>
      </div>

      <div className="v2-assigner">
        <div>
          <div className="v2-radios">
            <label className="v2-radio">
              <i />
              <div>
                <b>Toute la cohorte</b>
                <small>12 entreprises</small>
              </div>
            </label>
            <label className="v2-radio" data-active>
              <i />
              <div>
                <b>Entreprises sélectionnées</b>
                <small>{retenues} sélectionnées</small>
              </div>
            </label>
          </div>

          <div className="v2-card" style={{ overflow: "hidden" }}>
            <table className="v2-tbl">
              <thead>
                <tr>
                  <th aria-label="Sélection" />
                  <th>Entreprise</th>
                  <th>Préparation</th>
                </tr>
              </thead>
              <tbody>
                {A_ASSIGNER.map((item) => (
                  <tr data-retenue={item.retenue} key={item.nom}>
                    <td style={{ width: 36 }}>
                      <span className="v2-case" data-cochee={item.retenue}>
                        {item.retenue && <Icon name="check" />}
                      </span>
                    </td>
                    <td>
                      <div className="v2-ident">
                        <span className="v2-pastille" data-ton={item.ton}>
                          {item.initiales}
                        </span>
                        <div>
                          <b>{item.nom}</b>
                          <div>
                            {item.secteur} · {item.pays}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="v2-prep">
                        <div className="v2-prep-bar">
                          <i style={{ width: `${item.preparation}%` }} />
                        </div>
                        <span>{item.preparation}&nbsp;%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="v2-card v2-resume">
          <div className="v2-nav-label" style={{ padding: 0 }}>
            Résumé
          </div>
          <div className="v2-kv">
            <span className="v2-k">Challenge</span>
            <span className="v2-v">{challenge.titre}</span>
          </div>
          <hr className="v2-hr" />
          <div className="v2-kv">
            <span className="v2-k">Entreprises</span>
            <span className="v2-v">{retenues} sélectionnées</span>
          </div>
          <div className="v2-kv">
            <span className="v2-k">Critères</span>
            <span className="v2-v">
              4 · dont {connectes} connectés à Sanza
            </span>
          </div>
          <div className="v2-kv">
            <span className="v2-k">Échéance</span>
            <span className="v2-v">{challenge.echeance}</span>
          </div>
          <a
            className="v2-btn"
            data-bloc="true"
            href={ROUTES.challenge(cohorteId, challengeId)}
            style={{ marginTop: 6 }}
          >
            Assigner le Challenge
          </a>
          {/* Un Challenge EXISTANT s'assigne à tout moment à de nouvelles
              entreprises — sans le recréer. C'est ce que dit la maquette, et
              c'est pourquoi cet écran est atteignable depuis la liste. */}
          <p>
            Chaque entreprise verra ce Challenge dans son espace, avec la
            mention «&nbsp;Demandé par {PROGRAMME.nom}&nbsp;». Un Challenge
            existant peut être assigné à tout moment à de nouvelles
            entreprises — sans le recréer.
          </p>
        </aside>
      </div>
    </>
  );
}

/** Le panneau de l'écran 15 — une entreprise suivie sur ce Challenge. */
function PanneauEntreprise({
  cohorteId,
  challengeId,
}: {
  cohorteId: string;
  challengeId: string;
}) {
  const suivie = ASSIGNATIONS.find((item) => item.initiales === "CB")!;
  const faits = CRITERES_SUIVIS.filter((item) => item.fait).length;
  const retour = ROUTES.challenge(cohorteId, challengeId);

  return (
    <>
      <a aria-label="Fermer le panneau" className="v2-scrim-panneau" href={retour} />
      <aside className="v2-panneau">
        <div className="v2-panneau-head">
          <span className="v2-pastille" data-ton={suivie.ton}>
            {suivie.initiales}
          </span>
          <div style={{ flex: 1 }}>
            <h2>{suivie.nom}</h2>
            <small>
              {suivie.secteur} · {suivie.pays}
            </small>
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
              {challengeOu(challengeId).titre}
            </b>
            <div className="v2-chal-meta">
              {faits} / {CRITERES_SUIVIS.length} critères réalisés · Échéance ·{" "}
              {suivie.echeance}
            </div>
            <div className="v2-prep-bar" style={{ marginTop: 10, width: "100%" }}>
              <i style={{ width: `${(faits / CRITERES_SUIVIS.length) * 100}%` }} />
            </div>
          </div>

          <div>
            <div className="v2-nav-label" style={{ padding: "0 0 4px" }}>
              Critères
            </div>
            {CRITERES_SUIVIS.map((critere) => (
              <div
                className="v2-crit-suivi"
                data-fait={critere.fait}
                key={critere.libelle}
              >
                <i>{critere.fait && <Icon name="check" />}</i>
                <div>
                  <b>{critere.libelle}</b>
                  <small>{critere.detail}</small>
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
          <span className="v2-btn">Envoyer un rappel</span>
        </div>
      </aside>
    </>
  );
}

const TON_STATUT: Record<string, string> = {
  "En retard": "red",
  "En cours": "blue",
  Terminé: "green",
  "À faire": "neutral",
};

/** Écran 14 — le suivi du Challenge, retards en tête. */
function Suivi({
  cohorteId,
  challengeId,
}: {
  cohorteId: string;
  challengeId: string;
}) {
  const challenge = challengeOu(challengeId);
  const { repartition } = challenge;

  return (
    <>
      <div className="v2-prog-head">
        <div>
          <h1>{challenge.titre}</h1>
          <p>
            {challenge.entreprises} entreprises · Échéance ·{" "}
            {challenge.echeance}{" "}
            <span className="v2-tag" style={{ marginLeft: 8 }}>
              {challenge.categorie}
            </span>
          </p>
        </div>
        <span className="v2-spacer" />
        <nav>
          <a
            className="v2-btn"
            data-variant="secondary"
            href={`${ROUTES.challenge(cohorteId, challengeId)}?assigner=1`}
          >
            Assigner à d’autres entreprises
          </a>
          <span className="v2-btn" data-variant="secondary">
            Modifier
          </span>
          <span className="v2-btn" data-variant="text-grey">
            Archiver
          </span>
        </nav>
      </div>

      <div className="v2-chiffres">
        <div className="v2-card v2-chiffre">
          <b>{repartition.terminees}</b>
          <span>terminées</span>
        </div>
        <div className="v2-card v2-chiffre">
          <b>{repartition.enCours}</b>
          <span>en cours</span>
        </div>
        <div className="v2-card v2-chiffre" data-ton="red">
          <b>{repartition.enRetard}</b>
          <span>en retard</span>
        </div>
      </div>

      <div className="v2-prog-segments">
        {SEGMENTS_SUIVI.map((segment, rang) => (
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
              <th>Progression</th>
              <th>Statut</th>
              <th>Échéance</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {ASSIGNATIONS.map((ligne) => (
              <tr key={ligne.nom}>
                <td>
                  <a
                    href={`${ROUTES.challenge(cohorteId, challengeId)}?entreprise=${ligne.initiales.toLowerCase()}`}
                    style={{ color: "inherit" }}
                  >
                    <div className="v2-ident">
                      <span className="v2-pastille" data-ton={ligne.ton}>
                        {ligne.initiales}
                      </span>
                      <div>
                        <b>{ligne.nom}</b>
                        <div>
                          {ligne.secteur} · {ligne.pays}
                        </div>
                      </div>
                    </div>
                  </a>
                </td>
                <td>
                  {ligne.faits} / {ligne.total}
                </td>
                <td>
                  <span
                    className="v2-badge"
                    data-tone={TON_STATUT[ligne.statut]}
                  >
                    <span className="v2-dot" />
                    {ligne.statut}
                  </span>
                </td>
                <td className="v2-dim">{ligne.echeance}</td>
                <td data-actions>
                  {ligne.statut === "Terminé" ? (
                    <span className="v2-muted">—</span>
                  ) : (
                    <span className="v2-btn" data-variant="text">
                      Envoyer un rappel
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="v2-prog-tbl-foot">
          <span>
            Tri&nbsp;: en retard, puis échéance proche.
          </span>
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
  searchParams: Promise<{ assigner?: string; entreprise?: string }>;
}) {
  const [{ cohorteId, challengeId }, { assigner, entreprise }] =
    await Promise.all([params, searchParams]);
  const base = ROUTES.challenge(cohorteId, challengeId);

  return (
    <>
      {assigner === "1" ? (
        <Assigner challengeId={challengeId} cohorteId={cohorteId} />
      ) : (
        <Suivi challengeId={challengeId} cohorteId={cohorteId} />
      )}
      <BarreEtats
        etats={[
          { actif: assigner === "1", href: `${base}?assigner=1`, label: "13 · assigner" },
          { actif: !assigner && !entreprise, href: base, label: "14 · suivi" },
          {
            actif: Boolean(entreprise),
            href: `${base}?entreprise=cb`,
            label: "15 · une entreprise suivie",
          },
        ]}
      />
      {entreprise && (
        <PanneauEntreprise challengeId={challengeId} cohorteId={cohorteId} />
      )}
    </>
  );
}
