import {
  Field,
  FormActions,
  InvestorTypePicker,
  OnboardingTitle,
  SelectField,
  Stepper,
} from "@/features/v2/ui/Onboarding";
import { AvisEphemere } from "@/features/v2/ui/AvisEphemere";
import { BoutonEnvoi } from "@/features/v2/ui/BoutonEnvoi";
import { v2Routes } from "@/features/v2/navigation/routes";
import { saisieOnboarding } from "@/features/v2/server/startup";

import { saveV2Details } from "../actions";

export default async function OperationDetailsOnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { erreur } = await searchParams;
  const saisie = await saisieOnboarding();

  return (
    <div className="v2-onboard-body">
      <Stepper current={4} />
      <OnboardingTitle
        title="Votre levée en capital"
        description="Tous les champs non indispensables peuvent être remplis plus tard."
      />

      <form action={saveV2Details} className="v2-onboard-form">
        {erreur && (
          <p className="v2-auth-error" role="alert">
            <AvisEphemere />
            L’enregistrement a échoué. Vérifiez les informations puis réessayez.
          </p>
        )}
        <div className="v2-form-grid v2-form-grid-amount">
          <Field
            label="Montant recherché"
            defaultValue={saisie.montant}
            name="targetAmount"
            placeholder="500 000 000"
            inputMode="numeric"
          />
          <SelectField
            label="Devise"
            defaultValue={saisie.devise}
            name="currency"
            options={["XOF", "EUR", "USD", "GHS"]}
          />
        </div>
        <SelectField
          label="Stade de la levée"
          defaultValue={saisie.stadeLevee}
          name="roundStage"
          options={["Pré-amorçage", "Amorçage", "Série A", "Série B", "Série C et plus"]}
        />
        <Field
          label="Date cible"
          defaultValue={saisie.horizon}
          name="targetDate"
          placeholder="Par exemple : 30 novembre 2026"
        />
        <InvestorTypePicker />

        <FormActions backHref={v2Routes.onboarding.operation}>
          {/* Deux boutons dans le même formulaire : pas de libellé de
              progression, `useFormStatus` ne dit pas lequel a été pressé. */}
          <BoutonEnvoi
            className="v2-onboard-later"
            name="skipDetails"
            value="1"
          >
            Remplir plus tard
          </BoutonEnvoi>
          <BoutonEnvoi className="v2-onboard-primary">
            Générer mon plan
          </BoutonEnvoi>
        </FormActions>
      </form>
    </div>
  );
}
