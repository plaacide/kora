import Link from "next/link";

import {
  Field,
  FormActions,
  InvestorTypePicker,
  OnboardingTitle,
  SelectField,
  Stepper,
} from "@/features/v2/ui/Onboarding";
import { v2Routes } from "@/features/v2/navigation/routes";

export default function OperationDetailsOnboardingPage() {
  return (
    <div className="v2-onboard-body">
      <Stepper current={4} />
      <OnboardingTitle
        title="Votre levée en capital"
        description="Tous les champs non indispensables peuvent être remplis plus tard."
      />

      <form className="v2-onboard-form">
        <div className="v2-form-grid v2-form-grid-amount">
          <Field
            label="Montant recherché"
            name="targetAmount"
            defaultValue="500 000 000"
            inputMode="numeric"
          />
          <SelectField
            label="Devise"
            name="currency"
            defaultValue="XOF"
            options={["XOF", "EUR", "USD", "GHS"]}
          />
        </div>
        <SelectField
          label="Stade de la levée"
          name="roundStage"
          defaultValue="Série A"
          options={["Pré-amorçage", "Amorçage", "Série A", "Série B", "Série C et plus"]}
        />
        <Field
          label="Date cible"
          name="targetDate"
          defaultValue="30 novembre 2026"
        />
        <InvestorTypePicker />

        <FormActions backHref={v2Routes.onboarding.operation}>
          <Link className="v2-onboard-later" href={v2Routes.onboarding.result}>
            Remplir plus tard
          </Link>
          <Link className="v2-onboard-primary" href={v2Routes.onboarding.result}>
            Générer mon plan
          </Link>
        </FormActions>
      </form>
    </div>
  );
}
