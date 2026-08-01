import { paysZoneFranc } from "@/features/v2/domain/geographie";
import { SECTEURS } from "@/features/v2/domain/secteurs";
import {
  Field,
  FormActions,
  OnboardingTitle,
  SelectField,
  Stepper,
} from "@/features/v2/ui/Onboarding";
import { AvisEphemere } from "@/features/v2/ui/AvisEphemere";
import { BoutonEnvoi } from "@/features/v2/ui/BoutonEnvoi";
import { v2Routes } from "@/features/v2/navigation/routes";
import { saisieOnboarding } from "@/features/v2/server/startup";

import { saveV2Company } from "../actions";

export default async function CompanyOnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { erreur } = await searchParams;
  // Ce que la personne a déjà donné, réaffiché tel quel. Revenir à cette étape
  // montrait des champs vides : on croyait avoir tout perdu, et on ressaisissait.
  const saisie = await saisieOnboarding();

  return (
    <div className="v2-onboard-body">
      <Stepper current={2} />
      <OnboardingTitle
        title="Parlez-nous de votre entreprise"
        description="Elles identifient votre entreprise sur Sanza et figureront dans les dossiers que vous partagerez."
      />

      <form action={saveV2Company} className="v2-onboard-form">
        {erreur && (
          <p className="v2-auth-error" role="alert">
            {/* L'avis s'efface de l'URL après lecture : sans cela, recharger
                la page rejouait une erreur déjà corrigée. */}
            <AvisEphemere />
            {erreur === "nom"
              ? "Indiquez le nom de votre entreprise pour continuer."
              : "L’enregistrement a échoué. Vérifiez les informations puis réessayez."}
          </p>
        )}
        <Field
          label="Nom commercial"
          defaultValue={saisie.nom}
          name="companyName"
          placeholder="Nom de votre entreprise"
          required
        />

        <div className="v2-form-grid">
          {/* UEMOA puis CEMAC — quatorze pays, le périmètre commercial de
              Sanza. La liste mondiale reste disponible pour les investisseurs,
              où un fonds londonien est un cas courant. */}
          <SelectField
            label="Pays d’immatriculation"
            defaultValue={saisie.pays}
            name="country"
            groupes={paysZoneFranc().map((g) => ({
              titre: g.zone,
              options: g.pays,
            }))}
            helper="Le pays où votre société est immatriculée."
          />
          <SelectField
            label="Forme juridique"
            defaultValue={saisie.formeJuridique}
            name="legalForm"
            options={["SAS", "SA", "SARL", "Entreprise individuelle"]}
          />
        </div>

        <Field
          label="Numéro d’immatriculation"
          optional
          defaultValue={saisie.immatriculation}
          name="registrationNumber"
          placeholder="SN-DKR-2021-B-12345"
        />

        <div className="v2-form-grid">
          {/* Dix secteurs, assez larges pour ne pas hésiter. Cinq, c'était trop
              peu — la logistique et le BTP n'avaient rien à cocher. Trente-six,
              c'était pire : il fallait tout lire pour cocher. */}
          <SelectField
            label="Secteur"
            defaultValue={saisie.secteur}
            name="sector"
            options={[...SECTEURS]}
          />
          <SelectField
            label="Stade de développement"
            defaultValue={saisie.stade}
            name="stage"
            options={["Pré-amorçage", "Amorçage", "Série A", "Série B et plus"]}
          />
        </div>

        <Field
          label="Site internet"
          optional
          defaultValue={saisie.siteWeb}
          name="website"
          placeholder="votreentreprise.com"
        />
        <Field
          label="Phrase de présentation"
          optional
          defaultValue={saisie.description}
          name="description"
          placeholder="Ce que fait votre entreprise, en une phrase"
        />

        <FormActions backHref={v2Routes.root}>
          <BoutonEnvoi className="v2-onboard-primary" enCours="Enregistrement…">
            Continuer
          </BoutonEnvoi>
        </FormActions>
      </form>

      <p className="v2-onboard-disclaimer">
        Sanza présente une liste documentaire contextualisée — pas un avis juridique.
      </p>
    </div>
  );
}
