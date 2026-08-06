import { saisieProgramme } from "@/features/v2/server/programme";
import { v2Routes } from "@/features/v2/navigation/routes";
import { AvisEphemere } from "@/features/v2/ui/AvisEphemere";
import { BoutonEnvoi } from "@/features/v2/ui/BoutonEnvoi";
import { Icon } from "@/features/v2/ui/Icon";
import {
  ETAPES_PROGRAMME,
  OnboardingTitle,
  Stepper,
} from "@/features/v2/ui/Onboarding";

import { creerPremiereCohorte, reporterLaCohorte } from "../actions";

/** Les mois proposés, de l'année en cours à la suivante. */
const MOIS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

function moisProposes(): string[] {
  const annee = new Date().getUTCFullYear();
  return [annee, annee + 1].flatMap((an) =>
    MOIS.map((mois) => `${mois[0].toUpperCase()}${mois.slice(1)} ${an}`),
  );
}

/** Écran 00c — étape 4 : la première cohorte. */
export default async function PremiereCohortePage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const [{ erreur }, saisie] = await Promise.all([
    searchParams,
    saisieProgramme(),
  ]);
  const mois = moisProposes();

  return (
    <form action={creerPremiereCohorte} className="v2-onboard-body">
      <Stepper current={4} etapes={ETAPES_PROGRAMME} />
      <OnboardingTitle
        description="Une cohorte rassemble les entreprises que vous accompagnez sur une période donnée."
        title="Créez votre première cohorte"
      />

      {erreur && (
        <p className="v2-auth-error" role="alert">
          <AvisEphemere />
          {erreur === "nom"
            ? "Donnez un nom à votre cohorte pour continuer."
            : "La cohorte n’a pas pu être créée. Réessayez."}
        </p>
      )}

      <label className="v2-field">
        <span>Nom de la cohorte</span>
        <div className="v2-control">
          <input
            defaultValue={saisie.cohorte?.nom ?? ""}
            name="nom"
            placeholder="Saison 4 · Agri &amp; Agro"
            required
          />
        </div>
        <small className="v2-field-aide">
          Visible par les entreprises invitées.
        </small>
      </label>

      <div className="v2-duo">
        <label className="v2-field">
          <span>Début</span>
          <div className="v2-control">
            <select defaultValue={mois[2]} name="debut">
              {mois.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
        </label>
        <label className="v2-field">
          <span>Fin</span>
          <div className="v2-control">
            <select defaultValue={mois[11]} name="fin">
              {mois.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
        </label>
      </div>

      <div className="v2-duo">
        <label className="v2-field">
          <span>Nombre de places</span>
          <div className="v2-control">
            <input
              defaultValue={saisie.cohorte?.places ?? 15}
              inputMode="numeric"
              name="places"
            />
          </div>
        </label>
        <label className="v2-field">
          <span>
            Focus sectoriel <small>— facultatif</small>
          </span>
          {/* PAS DE COLONNE POUR CE CHAMP. `cohorts` porte un `goal`, pas un
              secteur ; la maquette le demande, la base ne sait pas où le
              mettre. Il est affiché et non enregistré, plutôt que d'inventer
              une colonne dans le dos du modèle. */}
          <div className="v2-control">
            <select defaultValue="Agri & Agro" disabled name="focus">
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
        <a
          className="v2-onboard-back"
          href={v2Routes.programme.onboarding.accompagnement}
        >
          ← Retour
        </a>
        <div>
          <BoutonEnvoi
            className="v2-onboard-later"
            formAction={reporterLaCohorte}
            sansValidation
          >
            Créer ma cohorte plus tard
          </BoutonEnvoi>
          <BoutonEnvoi className="v2-onboard-primary">
            Créer la cohorte
          </BoutonEnvoi>
        </div>
      </div>
      <p className="v2-onboard-disclaimer">
        Vous inviterez les entreprises juste après — par email ou lien ouvert.
      </p>
    </form>
  );
}
