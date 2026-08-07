import {
  type CritereModele,
  criteresModele,
  lireBibliotheque,
} from "@/features/v2/server/challenges";
import { AvisEphemere } from "@/features/v2/ui/AvisEphemere";
import { BoutonEnvoi } from "@/features/v2/ui/BoutonEnvoi";

import { creerChallenge } from "./actions";

/** Trois lignes vierges : de quoi ajouter sans exiger de JavaScript. */
const LIGNES_VIERGES = 3;

const MESSAGES: Readonly<Record<string, string>> = {
  creation: "Le Challenge n’a pas pu être créé. Réessayez.",
  criteres: "Un Challenge a besoin d’au moins un critère.",
  structurel:
    "Ce modèle Sanza porte un critère structurel qui ne peut pas être retiré. Rétablissez-le pour continuer.",
  titre: "Donnez un titre à ce Challenge.",
};

/**
 * Une ligne de critère — écrans 11 et 12.
 *
 * ELLE PORTE SES PROPRES CHAMPS, et c'est ce qui rend l'écran utilisable sans
 * JavaScript : `source` et `cle` voyagent en champs cachés, le libellé est
 * modifiable, et le rang sert de clé aux deux cases. `getAll` conservant
 * l'ordre du document, l'action peut recoller les colonnes.
 */
function LigneCritere({
  critere,
  rang,
}: {
  critere: CritereModele | null;
  rang: number;
}) {
  const source = critere?.source ?? "manuel";
  return (
    <div className="v2-crit-ligne">
      <span className="v2-rang">{rang + 1}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="v2-control" style={{ height: 40 }}>
          <input
            defaultValue={critere?.libelle ?? ""}
            name="critere"
            placeholder="Intitulé du critère…"
          />
        </div>
        <input name="source" type="hidden" value={source} />
        <input name="cle" type="hidden" value={critere?.catalogKey ?? ""} />
        <div className="v2-crit-etiquettes">
          {source === "connecte" ? (
            <span className="v2-badge" data-tone="blue">
              <span className="v2-dot" />
              Connecté à Sanza · validation automatique
            </span>
          ) : (
            <span className="v2-badge">Manuel · confirmé par l’entreprise</span>
          )}
          <label className="v2-tag">
            <input
              defaultChecked={critere?.requis ?? true}
              name="obligatoire"
              type="checkbox"
              value={rang}
            />{" "}
            Obligatoire
          </label>
          {/* Le verrou remplace la case de retrait, il ne s'y ajoute pas :
              une case grisée à côté d'un texte « non supprimable » dirait
              deux fois la même chose, et inviterait quand même à cliquer. */}
          {critere?.structurel ? (
            <small className="v2-crit-verrou">
              Critère structurel — non supprimable
            </small>
          ) : (
            critere && (
              <label className="v2-tag">
                <input name="retire" type="checkbox" value={rang} /> Retirer
              </label>
            )
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Écrans 11 et 12 — créer un Challenge, de zéro ou depuis un modèle Sanza.
 *
 * Un seul écran, deux entrées. Le modèle d'origine n'est JAMAIS modifié :
 * personnaliser en fait une copie — `create_challenge` recopie les critères
 * dans l'instance — et le critère structurel reste verrouillé, sans quoi le
 * modèle ne tiendrait plus sa promesse.
 */
export default async function NouveauChallengePage({
  params,
  searchParams,
}: {
  params: Promise<{ cohorteId: string }>;
  searchParams: Promise<{ erreur?: string; modele?: string }>;
}) {
  const [{ cohorteId }, { erreur, modele }] = await Promise.all([
    params,
    searchParams,
  ]);

  const derive = Boolean(modele);
  const [criteres, bibliotheque] = await Promise.all([
    modele ? criteresModele(modele) : Promise.resolve([]),
    derive ? lireBibliotheque() : Promise.resolve([]),
  ]);
  const source = bibliotheque.find((m) => m.id === modele);

  return (
    <form action={creerChallenge}>
      <input name="cohorte" type="hidden" value={cohorteId} />
      {modele && <input name="modele" type="hidden" value={modele} />}

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
          <h1>{derive ? "Personnaliser le Challenge" : "Créer un Challenge"}</h1>
        </div>
      </div>

      {erreur && (
        <p className="v2-auth-error" role="alert">
          <AvisEphemere />
          {MESSAGES[erreur] ?? MESSAGES.creation}
        </p>
      )}

      <div className="v2-editeur">
        <div className="v2-card v2-editeur-form">
          <label className="v2-field">
            <span>Titre</span>
            <div className="v2-control" style={{ height: 46 }}>
              <input
                defaultValue={source?.titre ?? ""}
                name="titre"
                placeholder="Préparer votre Demo Day"
                required
              />
            </div>
          </label>

          <div className="v2-duo">
            <label className="v2-field">
              <span>
                Catégorie <small>— facultatif</small>
              </span>
              <div className="v2-control" style={{ height: 46 }}>
                <input
                  defaultValue={source?.categorie ?? ""}
                  name="categorie"
                  placeholder="Levée de fonds"
                />
              </div>
            </label>
            <label className="v2-field">
              <span>
                Échéance <small>— facultatif</small>
              </span>
              <div className="v2-control" style={{ height: 46 }}>
                <input name="echeance" type="date" />
              </div>
            </label>
          </div>

          <div className="v2-field">
            <span>
              Critères{" "}
              <small>· {criteres.length || "à définir"}</small>
            </span>
            <div className="v2-criteres">
              {criteres.map((critere, rang) => (
                <LigneCritere critere={critere} key={critere.libelle} rang={rang} />
              ))}
              {/* Les lignes vierges SONT le bouton « ajouter ». Une ligne au
                  libellé vide est ignorée par l'action : elles ne coûtent
                  rien, et elles évitent d'exiger du JavaScript pour une
                  opération aussi banale qu'ajouter une ligne. */}
              {Array.from({ length: LIGNES_VIERGES }, (_, i) => (
                <LigneCritere
                  critere={null}
                  key={`vierge-${i}`}
                  rang={criteres.length + i}
                />
              ))}
            </div>
          </div>

          <div className="v2-editeur-actions">
            <BoutonEnvoi className="v2-btn" enCours="Création…">
              {derive ? "Continuer → Assigner" : "Créer le Challenge"}
            </BoutonEnvoi>
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
              l’exigence correspondante de l’entreprise est satisfaite. Seules
              les exigences du référentiel peuvent l’être — un critère ajouté
              ici est confirmé par l’entreprise.
            </p>
          </div>
        </aside>
      </div>
    </form>
  );
}
