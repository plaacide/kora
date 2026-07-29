import Link from "next/link";

import { Icon, type IconName } from "./Icon";

/**
 * Écrans 55, 56 et 57 — création d'une opération, en trois étapes.
 * Repris de `55-nouvelle-operation-type.html`, `56-…-infos.html` et
 * `57-…-structure.html`.
 *
 * C'est le parcours qui manquait : sans lui, un fondateur restait avec l'unique
 * opération créée à l'inscription, et les états « plusieurs opérations » des
 * écrans 53 et 54 étaient invérifiables.
 */

export type Step = "type" | "infos" | "structure";

const STEPS: Array<[Step, string]> = [
  ["type", "Type"],
  ["infos", "Informations"],
  ["structure", "Structure"],
];

const TYPES: Array<{ title: string; body: string; icon: IconName }> = [
  { title: "Lever en capital", body: "Ouvrez votre capital à des investisseurs.", icon: "pulse" },
  { title: "Obtenir un financement bancaire", body: "Préparez un dossier de dette ou de prêt.", icon: "landmark" },
  { title: "Répondre à une institution ou un bailleur", body: "Subventions, DFI et bailleurs internationaux.", icon: "globe" },
  { title: "Répondre à une diligence", body: "Un tiers examine votre entreprise.", icon: "file" },
  { title: "Préparer un audit", body: "Audit légal, financier ou d’impact.", icon: "shield-check" },
  { title: "Autre demande documentaire", body: "Toute autre transmission structurée de pièces.", icon: "folder" },
];

const STRUCTURES: Array<{ title: string; body: string; icon: IconName }> = [
  {
    title: "Structure recommandée par Sanza",
    body: "24 exigences requises et 8 dossiers adaptés à une Série A sous droit OHADA.",
    icon: "check",
  },
  {
    title: "Reprendre la structure d’une opération existante",
    body: "Dossiers et liste d’exigences uniquement — depuis « Levée Seed 2024 » par exemple.",
    icon: "columns",
  },
  { title: "Data room vide", body: "Construisez votre arborescence librement.", icon: "folder" },
];

const FIELDS: Array<[string, string | null]> = [
  ["Nom de l’opération", "Série A 2026"],
  ["Pays ou juridiction", null],
  ["Type de financeur", null],
  ["Stade", null],
  ["Montant recherché", "500 000 000"],
  ["Devise", null],
  ["Tour", null],
  ["Horizon de clôture", null],
];

function Stepper({ current }: { current: Step }) {
  const index = STEPS.findIndex(([step]) => step === current);

  return (
    <ol className="v2-steps">
      {STEPS.map(([step, label], position) => (
        <li
          data-state={position < index ? "done" : position === index ? "current" : undefined}
          key={step}
        >
          <span className="v2-step-number">
            {position < index ? <Icon name="check" /> : position + 1}
          </span>
          {label}
          {position < STEPS.length - 1 && <i className="v2-step-line" />}
        </li>
      ))}
    </ol>
  );
}

function Choices({
  items,
  wide,
}: {
  items: typeof TYPES;
  wide: boolean;
}) {
  return (
    <div className="v2-objective-grid" data-columns={wide ? 2 : 1}>
      {items.map((item, index) => (
        <button
          className="v2-objective"
          data-selected={index === 0}
          key={item.title}
          type="button"
        >
          <span className="v2-objective-icon"><Icon name={item.icon} /></span>
          <span>
            <strong>{item.title}</strong>
            <small>{item.body}</small>
          </span>
          {index === 0 && (
            <span className="v2-objective-check"><Icon name="check" /></span>
          )}
        </button>
      ))}
    </div>
  );
}

const COPY: Record<Step, { title: string; lead: string; cta: string }> = {
  type: {
    title: "Que préparez-vous ?",
    lead: "Sanza adaptera la préparation et la structure documentaire à votre besoin.",
    cta: "Continuer",
  },
  infos: {
    title: "Décrivez cette opération",
    lead: "Ces informations permettront à Sanza de préparer la bonne liste de pièces.",
    cta: "Continuer",
  },
  structure: {
    title: "Comment souhaitez-vous commencer ?",
    lead: "Vous pourrez modifier la structure documentaire ensuite.",
    cta: "Créer l’opération",
  },
};

const NEXT: Record<Step, string> = {
  type: "/v2/operations/nouvelle?etape=infos",
  infos: "/v2/operations/nouvelle?etape=structure",
  structure: "/v2/operations",
};

export function NewOperationWizard({ step }: { step: Step }) {
  const copy = COPY[step];

  return (
    <div className="v2 v2-wizard-page">
      <Stepper current={step} />

      <section className="v2-wizard-card" data-wide={step === "type"}>
        <header>
          <h2>{copy.title}</h2>
          <p>{copy.lead}</p>
        </header>

        <div className="v2-wizard-body">
          {step === "type" && <Choices items={TYPES} wide />}
          {step === "structure" && <Choices items={STRUCTURES} wide={false} />}
          {step === "infos" && (
            <div className="v2-wizard-grid">
              {FIELDS.map(([label, value]) => (
                <label className="v2-field" key={label}>
                  <span>{label}</span>
                  <span className="v2-control">
                    {value === null ? (
                      <>
                        <select />
                        <Icon name="chevron" />
                      </>
                    ) : (
                      <input defaultValue={value} />
                    )}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        <footer>
          <Link href="/v2/operations">Annuler</Link>
          <div>
            <Link className="v2-btn" href={NEXT[step]}>{copy.cta}</Link>
          </div>
        </footer>
      </section>
    </div>
  );
}
