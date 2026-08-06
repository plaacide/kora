import { v2Routes } from "@/features/v2/navigation/routes";
import { Icon } from "@/features/v2/ui/Icon";
import {
  ETAPES_PROGRAMME,
  OnboardingTitle,
  Stepper,
} from "@/features/v2/ui/Onboarding";

const ROUTES = v2Routes.programme.onboarding;

/** Écran 00c — étape 4 : la première cohorte, pré-remplie. */
export default function PremiereCohortePage() {
  return (
    <div className="v2-onboard-body">
      <Stepper current={4} etapes={ETAPES_PROGRAMME} />
      <OnboardingTitle
        description="Une cohorte rassemble les entreprises que vous accompagnez sur une période donnée."
        title="Créez votre première cohorte"
      />

      <label className="v2-field">
        <span>Nom de la cohorte</span>
        <div className="v2-control">
          <input defaultValue="Saison 4 · Agri & Agro" name="nom" />
        </div>
        <small className="v2-field-aide">
          Visible par les entreprises invitées.
        </small>
      </label>

      <div className="v2-duo">
        <label className="v2-field">
          <span>Début</span>
          <div className="v2-control">
            <select defaultValue="Mars 2026" name="debut">
              <option>Mars 2026</option>
            </select>
          </div>
        </label>
        <label className="v2-field">
          <span>Fin</span>
          <div className="v2-control">
            <select defaultValue="Décembre 2026" name="fin">
              <option>Décembre 2026</option>
            </select>
          </div>
        </label>
      </div>

      <div className="v2-duo">
        <label className="v2-field">
          <span>Nombre de places</span>
          <div className="v2-control">
            <input defaultValue="15" name="places" />
          </div>
        </label>
        <label className="v2-field">
          <span>
            Focus sectoriel <small>— facultatif</small>
          </span>
          <div className="v2-control">
            <select defaultValue="Agri & Agro" name="focus">
              <option>Agri &amp; Agro</option>
            </select>
          </div>
        </label>
      </div>

      <p className="v2-onb-promesse">
        <Icon name="shield-check" />
        <span>
          <b>Vous verrez l’avancement, jamais les documents.</b> Chaque
          entreprise garde le contrôle de son espace.
        </span>
      </p>

      <div className="v2-form-actions">
        <a className="v2-onboard-back" href={ROUTES.accompagnement}>
          ← Retour
        </a>
        <div>
          <a className="v2-onboard-later" href={ROUTES.pret}>
            Créer ma cohorte plus tard
          </a>
          <a className="v2-btn" href={ROUTES.pret}>
            Créer la cohorte
          </a>
        </div>
      </div>
      <p className="v2-onboard-disclaimer">
        Vous inviterez les entreprises juste après — par email ou lien ouvert.
      </p>
    </div>
  );
}
