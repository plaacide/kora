import Link from "next/link";

import {
  Field,
  FormActions,
  OnboardingTitle,
  SelectField,
  Stepper,
} from "@/features/v2/ui/Onboarding";
import { v2Routes } from "@/features/v2/navigation/routes";

export default function CompanyOnboardingPage() {
  return (
    <div className="v2-onboard-body">
      <Stepper current={2} />
      <OnboardingTitle
        title="Parlez-nous de votre entreprise"
        description="Ces informations permettent d’adapter votre plan de préparation."
      />

      <form className="v2-onboard-form">
        <Field label="Nom commercial" name="companyName" defaultValue="Nimba Solar" />

        <div className="v2-form-grid">
          <SelectField
            label="Pays d’immatriculation"
            name="country"
            defaultValue="Sénégal"
            options={["Sénégal", "Bénin", "Côte d’Ivoire", "Cameroun", "Ghana"]}
            helper="Pays OHADA — modèle documentaire OHADA appliqué."
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
          defaultValue="nimbasolar.com"
        />
        <Field
          label="Phrase de présentation"
          optional
          name="description"
          placeholder="Ce que fait votre entreprise, en une phrase"
        />

        <FormActions backHref={v2Routes.root}>
          <Link className="v2-onboard-primary" href={v2Routes.onboarding.operation}>
            Continuer
          </Link>
        </FormActions>
      </form>

      <p className="v2-onboard-disclaimer">
        Sanza présente une liste documentaire contextualisée — pas un avis juridique.
      </p>
    </div>
  );
}
