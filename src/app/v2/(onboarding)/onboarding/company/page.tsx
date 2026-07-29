import {
  Field,
  FormActions,
  OnboardingTitle,
  SelectField,
  Stepper,
} from "@/features/v2/ui/Onboarding";
import { v2Routes } from "@/features/v2/navigation/routes";
import { saveV2Company } from "../actions";

export default async function CompanyOnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { erreur } = await searchParams;

  return (
    <div className="v2-onboard-body">
      <Stepper current={2} />
      <OnboardingTitle
        title="Parlez-nous de votre entreprise"
        description="Ces informations permettent d’adapter votre plan de préparation."
      />

      <form action={saveV2Company} className="v2-onboard-form">
        {erreur && (
          <p className="v2-auth-error" role="alert">
            {erreur === "nom"
              ? "Indiquez le nom de votre entreprise pour continuer."
              : "L’enregistrement a échoué. Vérifiez les informations puis réessayez."}
          </p>
        )}
        <Field
          label="Nom commercial"
          name="companyName"
          placeholder="Nom de votre entreprise"
          required
        />

        <div className="v2-form-grid">
          <SelectField
            label="Pays d’immatriculation"
            name="country"
            defaultValue="Sénégal"
            options={["Sénégal", "Bénin", "Côte d’Ivoire", "Cameroun", "Ghana"]}
            helper="La structure documentaire sera adaptée à ce pays."
          />
          <SelectField
            label="Forme juridique"
            name="legalForm"
            defaultValue="SAS"
            options={["SAS", "SA", "SARL", "Entreprise individuelle"]}
          />
        </div>

        <Field
          label="Numéro d’immatriculation"
          optional
          name="registrationNumber"
          placeholder="SN-DKR-2021-B-12345"
        />

        <div className="v2-form-grid">
          <SelectField
            label="Secteur"
            name="sector"
            defaultValue="Énergie"
            options={["Énergie", "Finance", "Agriculture", "Santé", "Éducation"]}
          />
          <SelectField
            label="Stade de développement"
            name="stage"
            defaultValue="Série A"
            options={["Pré-amorçage", "Amorçage", "Série A", "Série B et plus"]}
          />
        </div>

        <Field
          label="Site internet"
          optional
          name="website"
          placeholder="votreentreprise.com"
        />
        <Field
          label="Phrase de présentation"
          optional
          name="description"
          placeholder="Ce que fait votre entreprise, en une phrase"
        />

        <FormActions backHref={v2Routes.root}>
          <button className="v2-onboard-primary" type="submit">
            Continuer
          </button>
        </FormActions>
      </form>

      <p className="v2-onboard-disclaimer">
        Sanza présente une liste documentaire contextualisée — pas un avis juridique.
      </p>
    </div>
  );
}
