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
import { redirect } from "next/navigation";

import { etapeFinancement } from "@/features/v2/domain/operation";
import { saisieOnboarding } from "@/features/v2/server/startup";

import { saveV2Details } from "../actions";

export default async function OperationDetailsOnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { erreur } = await searchParams;
  const saisie = await saisieOnboarding();

  // CETTE ÉTAPE N'EXISTE QUE POUR CE QUI SE FINANCE. Y arriver avec un objectif
  // d'audit ou de diligence signifie une adresse tapée à la main : on renvoie
  // là où le tunnel continue, plutôt que de demander une « Série B » à
  // quelqu'un qui prépare un audit.
  const etape = etapeFinancement(saisie.objectif);
  if (!etape) redirect(v2Routes.onboarding.result);

  return (
    <div className="v2-onboard-body">
      <Stepper current={4} />
      <OnboardingTitle
        title={etape.titre}
        description={etape.description}
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
        {/* Le vocabulaire suit l'objectif : stade du tour pour une levée, type
            de concours pour une dette, type d'instrument pour un bailleur.
            « Série B » ne décrit rien d'une subvention. */}
        <SelectField
          label={etape.modalite.label}
          defaultValue={saisie.modalite}
          helper={etape.modalite.aide}
          name="modalite"
          options={[...etape.modalite.options]}
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
