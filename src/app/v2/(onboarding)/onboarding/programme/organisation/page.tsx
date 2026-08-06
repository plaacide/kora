import { v2Routes } from "@/features/v2/navigation/routes";
import {
  ETAPES_PROGRAMME,
  OnboardingTitle,
  Stepper,
} from "@/features/v2/ui/Onboarding";

const ROUTES = v2Routes.programme.onboarding;

const TYPES = [
  "Accélérateur",
  "Incubateur",
  "Fonds d’investissement",
  "Banque ou institution financière",
  "Bailleur / programme d’appui",
];

/** Écran 00a — étape 2 : l'organisation. */
export default function OrganisationPage() {
  return (
    <div className="v2-onboard-body">
      <Stepper current={2} etapes={ETAPES_PROGRAMME} />
      <OnboardingTitle
        description="Ces informations apparaîtront auprès des entreprises que vous invitez et sur vos dealrooms."
        title="Parlez-nous de votre organisation"
      />

      <label className="v2-field">
        <span>Nom de l’organisation</span>
        <div className="v2-control">
          <input defaultValue="Savane Accelerator" name="nom" />
        </div>
      </label>

      <div className="v2-duo">
        <label className="v2-field">
          <span>Type d’organisation</span>
          <div className="v2-control">
            <select defaultValue={TYPES[0]} name="type">
              {TYPES.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </div>
        </label>
        <label className="v2-field">
          <span>Pays</span>
          <div className="v2-control">
            <select defaultValue="Sénégal" name="pays">
              <option>Sénégal</option>
            </select>
          </div>
        </label>
      </div>

      <label className="v2-field">
        <span>
          Site internet <small>— facultatif</small>
        </span>
        <div className="v2-control">
          <input defaultValue="savane.africa" name="site" />
        </div>
      </label>

      <div className="v2-field">
        <span>
          Logo <small>— facultatif, utilisé sur vos dealrooms</small>
        </span>
        {/* La maquette peint cette pastille avec `var(--brand)`, un token qui
            n'existe dans aucun `parcours.css`. Elle serait donc transparente.
            L'accent orange est la seule lecture possible. */}
        <div className="v2-onb-depot">
          <b>SA</b>
          <span>
            Déposez un fichier PNG ou SVG — sinon nous utilisons vos initiales.
          </span>
          <span className="v2-btn" data-variant="secondary">
            Choisir un fichier
          </span>
        </div>
      </div>

      <div className="v2-form-actions">
        <span className="v2-onboard-back">← Retour</span>
        <div>
          <a className="v2-btn" href={ROUTES.accompagnement}>
            Continuer
          </a>
        </div>
      </div>
      <p className="v2-onboard-disclaimer">
        Vous pourrez modifier ces informations à tout moment dans les réglages.
      </p>
    </div>
  );
}
