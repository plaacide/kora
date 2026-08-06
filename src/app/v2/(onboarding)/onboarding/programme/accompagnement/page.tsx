import { saisieProgramme } from "@/features/v2/server/programme";
import { v2Routes } from "@/features/v2/navigation/routes";
import { AvisEphemere } from "@/features/v2/ui/AvisEphemere";
import { BoutonEnvoi } from "@/features/v2/ui/BoutonEnvoi";
import { Icon, type IconName } from "@/features/v2/ui/Icon";
import {
  ETAPES_PROGRAMME,
  OnboardingTitle,
  Stepper,
} from "@/features/v2/ui/Onboarding";

import { enregistrerAccompagnement } from "../actions";

/**
 * Écran 00b — étape 3 : comment le programme accompagne.
 *
 * PLUSIEURS CHOIX POSSIBLES, à la différence de l'objectif du fondateur qui
 * est exclusif : un accélérateur suit une cohorte ET la structure ET l'expose.
 * D'où des cases à cocher.
 *
 * Les CODES sont stables et les libellés ne le sont pas : c'est le code qui
 * part en base, pour que réécrire un titre ne réécrive pas les réponses déjà
 * données.
 */
const FACONS: readonly {
  code: string;
  icone: IconName;
  titre: string;
  description: string;
  parDefaut?: boolean;
}[] = [
  {
    code: "cohorte",
    icone: "layers",
    titre: "Suivre une cohorte",
    description:
      "Voir où en est chaque entreprise dans sa préparation, sans accéder à ses documents.",
    parDefaut: true,
  },
  {
    code: "challenges",
    icone: "check-square",
    titre: "Structurer avec des Challenges",
    description:
      "Fixer des objectifs documentaires par étape du programme — Demo Day, reporting, diligence.",
    parDefaut: true,
  },
  {
    code: "dealrooms",
    icone: "presentation",
    titre: "Exposer aux investisseurs",
    description:
      "Publier une dealroom brandée qui présente les entreprises prêtes de votre portefeuille.",
  },
  {
    code: "rapports",
    icone: "chart",
    titre: "Rendre compte à un bailleur",
    description:
      "Produire des rapports d’avancement consolidés pour vos financeurs et partenaires.",
  },
];

export default async function AccompagnementPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const [{ erreur }, saisie] = await Promise.all([
    searchParams,
    saisieProgramme(),
  ]);

  // Rien de retenu encore : on propose les deux premières, comme la maquette.
  const retenus =
    saisie.focus.length > 0
      ? new Set(saisie.focus)
      : new Set(FACONS.filter((f) => f.parDefaut).map((f) => f.code));

  return (
    <form
      action={enregistrerAccompagnement}
      className="v2-onboard-body v2-onboard-wide"
    >
      <Stepper current={3} etapes={ETAPES_PROGRAMME} />
      <OnboardingTitle
        description="Plusieurs choix possibles. Votre espace s’organise autour de ce que vous cochez."
        title="Comment accompagnez-vous vos entreprises ?"
      />

      {erreur && (
        <p className="v2-auth-error" role="alert">
          <AvisEphemere />
          L’enregistrement n’a pas abouti. Réessayez.
        </p>
      )}

      <fieldset className="v2-objective-grid">
        <legend className="v2-sr-only">Façons d’accompagner</legend>
        {FACONS.map((facon) => (
          <label className="v2-objective" key={facon.code}>
            <input
              defaultChecked={retenus.has(facon.code)}
              name="accompagnement"
              type="checkbox"
              value={facon.code}
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
        <a
          className="v2-onboard-back"
          href={v2Routes.programme.onboarding.organisation}
        >
          ← Retour
        </a>
        <div>
          <BoutonEnvoi className="v2-onboard-primary" enCours="Enregistrement…">
            Continuer
          </BoutonEnvoi>
        </div>
      </div>
      <p className="v2-onboard-disclaimer">
        Tout reste activable plus tard — ce choix ne ferme aucune porte.
      </p>
    </form>
  );
}
