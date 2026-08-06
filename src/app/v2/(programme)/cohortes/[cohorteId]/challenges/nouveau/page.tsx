import {
  CHALLENGE_NEUF,
  CHALLENGE_PERSONNALISE,
  cohorte,
  type CritereFixture,
} from "@/features/v2/fixtures/programme";
import { v2Routes } from "@/features/v2/navigation/routes";
import { BarreEtats } from "@/features/v2/ui/BarreEtats";
import { Icon } from "@/features/v2/ui/Icon";

const ROUTES = v2Routes.programme.cohortes;

/**
 * Écrans 11 et 12 — créer un Challenge, de zéro ou depuis un modèle Sanza.
 *
 * Un seul écran, deux entrées. Le modèle d'origine n'est JAMAIS modifié :
 * personnaliser en fait une copie, et le critère structurel de la copie reste
 * verrouillé — sans lui, le modèle ne tiendrait plus sa promesse.
 */
function Critere({ critere, rang }: { critere: CritereFixture; rang: number }) {
  return (
    <div className="v2-crit-ligne">
      <span className="v2-poignee">
        <Icon name="grip" />
      </span>
      <span className="v2-rang">{rang}</span>
      <div>
        <b>{critere.libelle}</b>
        <div className="v2-crit-etiquettes">
          {critere.source === "connecte" ? (
            <span className="v2-badge" data-tone="blue">
              <span className="v2-dot" />
              Connecté à Sanza · validation automatique
            </span>
          ) : (
            <span className="v2-badge">Manuel · confirmé par l’entreprise</span>
          )}
          <span className="v2-tag">
            {critere.obligatoire ? "Obligatoire" : "Optionnel"}
          </span>
        </div>
      </div>
      {/* Le verrou se dit à DROITE, à la place de la croix qu'il remplace —
          pas sous le libellé, où il passerait pour une étiquette de plus. */}
      {critere.structurel && (
        <small className="v2-crit-verrou">
          Critère structurel — non supprimable
        </small>
      )}
      <span className="v2-x" data-verrouille={critere.structurel}>
        <Icon name="close" />
      </span>
    </div>
  );
}

export default async function NouveauChallengePage({
  params,
  searchParams,
}: {
  params: Promise<{ cohorteId: string }>;
  searchParams: Promise<{ modele?: string }>;
}) {
  const [{ cohorteId }, { modele }] = await Promise.all([params, searchParams]);
  const derive = Boolean(modele);
  const challenge = derive ? CHALLENGE_PERSONNALISE : CHALLENGE_NEUF;
  const entreprises = cohorte(cohorteId).entreprises;

  return (
    <>
      {derive && (
        <div className="v2-bandeau-modele">
          <span className="v2-marque-sanza">
            <i>S</i>
          </span>
          <span>
            <b>Modèle Sanza.</b> Vous pouvez adapter ce Challenge à votre
            méthodologie. Le modèle original ne sera pas modifié.
          </span>
        </div>
      )}

      <div className="v2-prog-head">
        <div>
          <h1>
            {derive ? "Personnaliser le Challenge" : "Créer un Challenge"}
          </h1>
        </div>
      </div>

      <div className="v2-editeur">
        <div className="v2-card v2-editeur-form">
          <div className="v2-field">
            <span>Titre</span>
            <div className="v2-control" style={{ height: 46 }}>
              <span>{challenge.titre}</span>
            </div>
          </div>
          <div className="v2-field">
            <span>Description</span>
            <div
              className="v2-control"
              style={{ alignItems: "flex-start", height: 76, paddingTop: 14 }}
            >
              <span>{challenge.description}</span>
            </div>
          </div>
          <div className="v2-duo">
            <div className="v2-field">
              <span>Type</span>
              <div className="v2-control" style={{ height: 46 }}>
                <span>{challenge.type}</span>
                <span className="v2-spacer" />
                <Icon name="chevron" />
              </div>
            </div>
            <div className="v2-field">
              <span>Échéance</span>
              <div className="v2-control" style={{ height: 46 }}>
                <span>{challenge.echeance}</span>
                <span className="v2-spacer" />
                <Icon name="chevron" />
              </div>
            </div>
          </div>

          {!derive && (
            <div className="v2-field">
              <span>Entreprises concernées</span>
              <div className="v2-radios">
                <label className="v2-radio" data-active>
                  <i />
                  <div>
                    <b>Toute la cohorte</b>
                    <small>{entreprises} entreprises</small>
                  </div>
                </label>
                <label className="v2-radio">
                  <i />
                  <div>
                    <b>Entreprises sélectionnées</b>
                    <small>choisir à l’étape suivante</small>
                  </div>
                </label>
              </div>
            </div>
          )}

          <div className="v2-field">
            <span>
              Critères <small>· {challenge.criteres.length}</small>
            </span>
            <div className="v2-criteres">
              {challenge.criteres.map((critere, rang) => (
                <Critere critere={critere} key={critere.libelle} rang={rang + 1} />
              ))}
            </div>
            <span
              className="v2-btn"
              data-variant="text"
              style={{ alignSelf: "flex-start", marginTop: 6 }}
            >
              + Ajouter un critère
            </span>
          </div>

          <div className="v2-editeur-actions">
            <span className="v2-btn" data-variant="secondary">
              Enregistrer comme modèle
            </span>
            <a
              className="v2-btn"
              href={`${ROUTES.challenge(cohorteId, "demo-day")}?assigner=1`}
            >
              {derive ? "Continuer → Assigner" : "Créer le Challenge"}
            </a>
          </div>
        </div>

        <aside className="v2-aside">
          <div className="v2-card">
            <div className="v2-nav-label" style={{ padding: "0 0 8px" }}>
              Confidentialité
            </div>
            <p>
              Vous verrez l’état de chaque critère. Jamais le document qui le
              satisfait, ni son nom réel.
            </p>
          </div>
          <div className="v2-card">
            <div className="v2-nav-label" style={{ padding: "0 0 8px" }}>
              Critères connectés
            </div>
            <p>
              Un critère connecté à Sanza se valide automatiquement dès que
              l’exigence correspondante de l’entreprise est satisfaite.
            </p>
          </div>
        </aside>
      </div>

      <BarreEtats
        etats={[
          {
            actif: !derive,
            href: ROUTES.challengeNouveau(cohorteId),
            label: "11 · créer de zéro",
          },
          {
            actif: derive,
            href: `${ROUTES.challengeNouveau(cohorteId)}?modele=dossier-investisseur`,
            label: "12 · personnaliser un modèle",
          },
        ]}
      />
    </>
  );
}
