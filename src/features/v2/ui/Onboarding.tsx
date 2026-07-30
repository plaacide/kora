"use client";

import Link from "next/link";
import { useState, type InputHTMLAttributes, type ReactNode } from "react";

import { v2Routes } from "../navigation/routes";
import { ChipField } from "./ChipField";
import { Icon, type IconName } from "./Icon";
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
        <Link className="v2-brand" href={v2Routes.root}>
          <span>S</span>
          Sanza
        </Link>
        <span className="v2-onboard-email">{email}</span>
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
  helper,
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: string[];
  helper?: string;
}) {
  return (
    <label className="v2-field">
      <span>{label}</span>
      <span className="v2-control">
        <select name={name} defaultValue={defaultValue}>
          {options.map((option) => <option key={option}>{option}</option>)}
        </select>
        <Icon name="chevron" />
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

const objectives: Array<{
  id: string;
  title: string;
  description: string;
  icon: IconName;
}> = [
  {
    id: "equity",
    title: "Lever en capital",
    description: "Business angels, fonds de capital-risque ou investisseur stratégique.",
    icon: "pulse",
  },
  {
    id: "debt",
    title: "Obtenir un financement bancaire",
    description: "Crédit, ligne de financement, financement d’équipement ou besoin de trésorerie.",
    icon: "landmark",
  },
  {
    id: "dfi",
    title: "Répondre à une institution ou un bailleur",
    description: "DFI, subvention, programme d’investissement ou financement à impact.",
    icon: "globe",
  },
  {
    id: "diligence",
    title: "Répondre à une diligence",
    description: "Une organisation vous a transmis une demande de pièces ou souhaite examiner votre entreprise.",
    icon: "file",
  },
];

export function ObjectiveSelector({ hasError = false }: { hasError?: boolean }) {
  const [selected, setSelected] = useState("equity");

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
      <input name="objective" type="hidden" value={selected} />
      <div className="v2-objective-grid" role="radiogroup" aria-label="Objectif de financement">
        {objectives.map((objective) => (
          <button
            key={objective.id}
            className="v2-objective"
            data-selected={selected === objective.id}
            type="button"
            role="radio"
            aria-checked={selected === objective.id}
            onClick={() => setSelected(objective.id)}
          >
            <span className="v2-objective-icon"><Icon name={objective.icon} /></span>
            <span>
              <strong>{objective.title}</strong>
              <small>{objective.description}</small>
            </span>
            <span className="v2-objective-check" aria-hidden="true">✓</span>
          </button>
        ))}
      </div>
      <FormActions backHref={v2Routes.onboarding.company}>
        <button
          className="v2-onboard-later"
          name="skipObjective"
          type="submit"
          value="1"
        >
          Je ne sais pas encore
        </button>
        <button className="v2-onboard-primary" type="submit">
          Continuer
        </button>
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
