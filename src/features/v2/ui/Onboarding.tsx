"use client";

import Link from "next/link";
import type { InputHTMLAttributes, ReactNode } from "react";

import { logoutV2 } from "@/app/v2/actions";

import { BoutonEnvoi } from "./BoutonEnvoi";
import { INTENTIONS } from "../domain/operation";
import { v2Routes } from "../navigation/routes";
import { ChipField } from "./ChipField";
import { Icon, type IconName } from "./Icon";
import { SanzaWordmark } from "./Logo";
import { saveV2Objective } from "@/app/v2/(onboarding)/onboarding/actions";

const steps = ["Compte", "Entreprise", "Objectif", "Détails", "Plan"];

export function OnboardingFrame({
  children,
  email,
}: {
  children: ReactNode;
  email: string;
}) {
  return (
    <div className="v2 v2-onboard-page">
      <header className="v2-onboard-head">
        {/* LE VRAI LOGO, pas le carré à lettre « S ». Celui-ci traînait encore
            ici alors que le reste de la V2 porte la marque officielle depuis
            longtemps — l'onboarding est pourtant le premier écran qu'on voit
            après l'inscription, celui où la marque compte le plus. */}
        <Link aria-label="Sanza" className="v2-brand" href={v2Routes.root}>
          <SanzaWordmark height={22} />
        </Link>

        {/* CE BANDEAU N'AVAIT QUE L'ADRESSE, en texte mort. Quelqu'un qui
            s'inscrivait avec le mauvais compte, ou qui bloquait sur une étape,
            n'avait aucune sortie : ni aide, ni déconnexion. L'onboarding est
            précisément le moment où l'on se trompe de compte. */}
        <div className="v2-onboard-actions">
          <span className="v2-onboard-email">
            Connecté en tant que <b>{email}</b>
          </span>

          <span className="v2-onboard-sep" aria-hidden="true" />

          <a
            className="v2-onboard-action"
            href={`mailto:contact@sanza.africa?subject=${encodeURIComponent(
              "Aide — création de mon espace Sanza",
            )}`}
          >
            <Icon name="help" />
            Besoin d’aide
          </a>

          <form action={logoutV2}>
            <button className="v2-onboard-action" type="submit">
              <Icon name="logout" />
              Se déconnecter
            </button>
          </form>
        </div>
      </header>
      {children}
    </div>
  );
}

export function Stepper({ current }: { current: number }) {
  return (
    <ol className="v2-steps" aria-label="Progression de l’onboarding">
      {steps.map((label, index) => {
        const number = index + 1;
        const done = number < current;
        const active = number === current;
        return (
          <li key={label} className={done ? "is-done" : active ? "is-current" : ""}>
            {index > 0 && <span className="v2-step-line" aria-hidden="true" />}
            <span className="v2-step-number" aria-hidden="true">
              {done ? "✓" : number}
            </span>
            <span>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function OnboardingTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="v2-onboard-title">
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  );
}

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  optional?: boolean;
};

export function Field({ label, optional, ...inputProps }: FieldProps) {
  return (
    <label className="v2-field">
      <span>
        {label}
        {optional && <small> — facultatif</small>}
      </span>
      <span className="v2-control">
        <input {...inputProps} />
      </span>
    </label>
  );
}

export function SelectField({
  label,
  name,
  defaultValue,
  options,
  groupes,
  helper,
}: {
  label: string;
  name: string;
  /**
   * À N'UTILISER QUE POUR REPRENDRE UNE SAISIE, jamais pour préremplir.
   *
   * Les six champs de l'onboarding arrivaient préremplis — Sénégal, SAS,
   * Énergie, Série A, XOF. Un fondateur ivoirien qui ne touchait pas au champ
   * enregistrait « Sénégal » sans l'avoir dit, et rien à l'écran ne distinguait
   * un choix d'un défaut. Une valeur qu'on n'a pas donnée ne doit pas être
   * enregistrée comme si on l'avait donnée.
   */
  defaultValue?: string;
  /** Liste plate, pour les choix courts. */
  options?: string[];
  /**
   * Liste groupée, rendue en `<optgroup>`.
   *
   * Cent quatre-vingt-huit pays ou trente-six secteurs en liste plate obligent
   * à tout parcourir. Le groupe n'est PAS enregistré — c'est le libellé seul
   * qui est stocké ; il ne sert qu'à guider l'œil.
   */
  groupes?: Array<{ titre: string; options: string[] }>;
  helper?: string;
}) {
  return (
    <label className="v2-field">
      <span>{label}</span>
      <span className="v2-control">
        {/* `defaultValue=""` N'EST PAS DÉCORATIF. Sans lui, le navigateur
            sélectionne la première option NON désactivée — « Sénégal » — et le
            champ redevient prérempli tout en passant la validation. Vérifié :
            en HTML nu la valeur initiale est « Sénégal » et le champ est
            valide ; avec `defaultValue=""` c'est « Choisissez… » et l'envoi est
            refusé. Ne pas retirer cette ligne. */}
        <select defaultValue={defaultValue ?? ""} name={name} required>
          {/* Le choix vide est `disabled` : il s'affiche à l'ouverture, mais on
              ne peut pas y revenir. `required` refuse alors l'envoi tant que
              rien n'est retenu — la contrainte est portée par le navigateur,
              donc elle tient même sans JavaScript. */}
          <option disabled value="">
            Choisissez…
          </option>
          {groupes
            ? groupes.map((groupe) => (
                <optgroup key={groupe.titre} label={groupe.titre}>
                  {groupe.options.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </optgroup>
              ))
            : (options ?? []).map((option) => (
                <option key={option}>{option}</option>
              ))}
        </select>
      </span>
      {helper && <small className="v2-field-helper">{helper}</small>}
    </label>
  );
}

export function FormActions({
  backHref,
  children,
}: {
  backHref: string;
  children: ReactNode;
}) {
  return (
    <div className="v2-form-actions">
      <Link className="v2-onboard-back" href={backHref}>← Retour</Link>
      <div>{children}</div>
    </div>
  );
}


/**
 * Le choix d'objectif — étape 3.
 *
 * CE QUI ÉTAIT CASSÉ. Les cartes étaient des `<button data-selected>` pilotés
 * par un `useState`, alors que la feuille de style stylise la sélection avec
 * `.v2-objective:has(input:checked)` — un `<input>` qui n'existait nulle part.
 * Résultat : cliquer une carte ne changeait RIEN à l'écran. Ni la bordure, ni
 * le fond, ni la coche. Et comme le champ caché portait l'état interne, le
 * formulaire partait toujours avec « Lever en capital », quel que soit le clic.
 *
 * On repasse à de vrais boutons radio, ce que la feuille de style attendait
 * depuis le début. On y gagne trois choses que le `useState` ne donnait pas :
 * la navigation aux flèches du clavier, l'annonce correcte par les lecteurs
 * d'écran, et un formulaire qui fonctionne même si le JavaScript n'a pas chargé
 * — ce qui arrive sur les connexions que Sanza vise.
 */
export function ObjectiveSelector({ hasError = false }: { hasError?: boolean }) {
  return (
    <form
      action={saveV2Objective}
      className="v2-onboard-body v2-onboard-wide"
    >
      <Stepper current={3} />
      <OnboardingTitle
        title="Que préparez-vous aujourd’hui ?"
        description="Votre réponse adapte les pièces, les étapes et le suivi. Vous pourrez la modifier."
      />
      {hasError && (
        <p className="v2-auth-error" role="alert">
          L’enregistrement a échoué. Sélectionnez votre objectif puis réessayez.
        </p>
      )}
      <fieldset className="v2-objective-grid">
        <legend className="v2-sr-only">Objectif de financement</legend>
        {INTENTIONS.map((objective) => (
          <label className="v2-objective" key={objective.valeur}>
            {/* AUCUN CHOIX PAR DÉFAUT. Le premier était coché à l'arrivée :
                celui qui passait l'étape sans y toucher enregistrait « Lever en
                capital » sans l'avoir dit. `required` refuse maintenant l'envoi
                tant que rien n'est retenu — sauf par « Je ne sais pas encore »,
                qui porte `formNoValidate` parce que c'est justement l'absence de
                réponse qu'il exprime. */}
            <input
              name="objective"
              required
              type="radio"
              value={objective.valeur}
            />
            <span className="v2-objective-icon"><Icon name={objective.icone as IconName} /></span>
            <span>
              <strong>{objective.titre}</strong>
              <small>{objective.description}</small>
            </span>
            <span className="v2-objective-check" aria-hidden="true">✓</span>
          </label>
        ))}
      </fieldset>
      <FormActions backHref={v2Routes.onboarding.company}>
        {/* Deux boutons dans le même formulaire : pas de libellé de
            progression, `useFormStatus` ne dit pas lequel a été pressé. */}
        <BoutonEnvoi
          className="v2-onboard-later"
          name="skipObjective"
          sansValidation
          value="1"
        >
          Je ne sais pas encore
        </BoutonEnvoi>
        <BoutonEnvoi className="v2-onboard-primary">Continuer</BoutonEnvoi>
      </FormActions>
      <p className="v2-onboard-disclaimer">
        « Je ne sais pas encore » crée un plan de base ; vous préciserez la cible plus tard.
      </p>
    </form>
  );
}

const investorTypes = [
  "Fonds de capital-risque",
  "Business angels",
  "Investisseur stratégique",
  "Fonds à impact",
];

export function InvestorTypePicker() {
  return (
    <ChipField
      defaultSelected={["Fonds de capital-risque", "Fonds à impact"]}
      label="Type d’investisseurs visés"
      options={investorTypes}
    />
  );
}
