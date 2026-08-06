import { v2Routes } from "@/features/v2/navigation/routes";
import { Icon, type IconName } from "@/features/v2/ui/Icon";
import {
  ETAPES_PROGRAMME,
  OnboardingTitle,
  Stepper,
} from "@/features/v2/ui/Onboarding";

const ROUTES = v2Routes.programme.onboarding;

/**
 * Écran 00b — étape 3 : comment le programme accompagne.
 *
 * PLUSIEURS CHOIX POSSIBLES, à la différence de l'objectif du fondateur qui
 * est exclusif : un accélérateur suit une cohorte ET la structure ET l'expose.
 * D'où des cases à cocher, et deux déjà retenues.
 */
const FACONS: readonly {
  icone: IconName;
  titre: string;
  description: string;
  retenu?: boolean;
}[] = [
  {
    icone: "layers",
    titre: "Suivre une cohorte",
    description:
      "Voir où en est chaque entreprise dans sa préparation, sans accéder à ses documents.",
    retenu: true,
  },
  {
    icone: "check-square",
    titre: "Structurer avec des Challenges",
    description:
      "Fixer des objectifs documentaires par étape du programme — Demo Day, reporting, diligence.",
    retenu: true,
  },
  {
    icone: "presentation",
    titre: "Exposer aux investisseurs",
    description:
      "Publier une dealroom brandée qui présente les entreprises prêtes de votre portefeuille.",
  },
  {
    icone: "chart",
    titre: "Rendre compte à un bailleur",
    description:
      "Produire des rapports d’avancement consolidés pour vos financeurs et partenaires.",
  },
];

export default function AccompagnementPage() {
  return (
    <div className="v2-onboard-body v2-onboard-wide">
      <Stepper current={3} etapes={ETAPES_PROGRAMME} />
      <OnboardingTitle
        description="Plusieurs choix possibles. Votre espace s’organise autour de ce que vous cochez."
        title="Comment accompagnez-vous vos entreprises ?"
      />

      <fieldset className="v2-objective-grid">
        <legend className="v2-sr-only">Façons d’accompagner</legend>
        {FACONS.map((facon) => (
          <label className="v2-objective" key={facon.titre}>
            <input
              defaultChecked={facon.retenu}
              name="accompagnement"
              type="checkbox"
              value={facon.titre}
            />
            <span className="v2-objective-icon">
              <Icon name={facon.icone} />
            </span>
            <span>
              <strong>{facon.titre}</strong>
              <small>{facon.description}</small>
            </span>
            <span aria-hidden="true" className="v2-objective-check">
              ✓
            </span>
          </label>
        ))}
      </fieldset>

      <div className="v2-form-actions">
        <a className="v2-onboard-back" href={ROUTES.organisation}>
          ← Retour
        </a>
        <div>
          <a className="v2-btn" href={ROUTES.cohorte}>
            Continuer
          </a>
        </div>
      </div>
      <p className="v2-onboard-disclaimer">
        Tout reste activable plus tard — ce choix ne ferme aucune porte.
      </p>
    </div>
  );
}
