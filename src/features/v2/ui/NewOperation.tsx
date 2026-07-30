import Link from "next/link";

import { createOperation } from "@/app/v2/operations/nouvelle/actions";
import { intentCanCarryRaise } from "../domain/operation";
import { Icon, type IconName } from "./Icon";

/**
 * Écrans 55, 56 et 57 — création d'une opération, en trois étapes.
 * Repris de `55-nouvelle-operation-type.html`, `56-…-infos.html` et
 * `57-…-structure.html`.
 *
 * Chaque étape est un vrai `<form>` (GET pour type/infos, qui naviguent vers
 * l'étape suivante en portant leurs valeurs dans l'URL ; POST via Server
 * Action pour structure, qui crée réellement l'opération). Le bouton du pied
 * de page est rattaché au formulaire par `form="v2-new-operation-form"` : le
 * pied reste un enfant direct de `.v2-wizard-card`, comme sur les autres
 * écrans-assistants qui partagent cette feuille de style.
 *
 * Seul le nom est requis. Tout le reste est facultatif : le fondateur décide
 * de ce qu'il renseigne maintenant et de ce qu'il complètera plus tard.
 */

export type Step = "type" | "infos" | "structure";

/** Ce que les trois étapes se transmettent, d'abord par l'URL puis en champs cachés. */
export interface OperationDraft {
  type: string;
  nom: string;
  pays: string;
  financeur: string;
  stade: string;
  montant: string;
  devise: string;
  tour: string;
  horizon: string;
}

type Choice = {
  value: string;
  title: string;
  body: string;
  icon: IconName;
  disabled?: boolean;
};

const STEPS: Array<[Step, string]> = [
  ["type", "Type"],
  ["infos", "Informations"],
  ["structure", "Structure"],
];

/**
 * `value` est le vocabulaire de l'écran, pas celui de la base : la Server
 * Action (`actions.ts`) le fait correspondre aux quatre `objectif` réels.
 */
const TYPES: Choice[] = [
  { value: "equity", title: "Lever en capital", body: "Ouvrez votre capital à des investisseurs.", icon: "pulse" },
  { value: "debt", title: "Obtenir un financement bancaire", body: "Préparez un dossier de dette ou de prêt.", icon: "landmark" },
  { value: "dfi", title: "Répondre à une institution ou un bailleur", body: "Subventions, DFI et bailleurs internationaux.", icon: "globe" },
  { value: "diligence", title: "Répondre à une diligence", body: "Un tiers examine votre entreprise.", icon: "file" },
  { value: "audit", title: "Préparer un audit", body: "Audit légal, financier ou d’impact.", icon: "shield-check" },
  { value: "other", title: "Autre demande documentaire", body: "Toute autre transmission structurée de pièces.", icon: "folder" },
];

/**
 * « Reprendre la structure d'une opération existante » n'a pas d'équivalent
 * côté RPC (`create_data_room` n'accepte qu'un booléen `p_template`, pas de
 * deal source à copier) : l'option reste visible mais désactivée plutôt que
 * de simuler un résultat qu'elle ne peut pas produire.
 */
const STRUCTURES: Choice[] = [
  {
    value: "recommandee",
    title: "Structure recommandée par Sanza",
    body: "24 exigences requises et 8 dossiers adaptés à une Série A sous droit OHADA.",
    icon: "check",
  },
  {
    value: "existante",
    title: "Reprendre la structure d’une opération existante",
    body: "Bientôt disponible — depuis « Levée Seed 2024 » par exemple.",
    icon: "columns",
    disabled: true,
  },
  { value: "vide", title: "Data room vide", body: "Construisez votre arborescence librement.", icon: "folder" },
];

const COUNTRIES = ["Sénégal", "Bénin", "Côte d’Ivoire", "Cameroun", "Ghana"];

/** Valeurs alignées sur `raises.audience` (vc | dfi | banque). */
const FUNDERS: Array<[string, string]> = [
  ["vc", "Fonds d’investissement"],
  ["dfi", "Institution ou bailleur"],
  ["banque", "Banque"],
];

/** Mêmes intitulés qu'à l'onboarding, pour ne pas décrire deux fois la même chose. */
const STAGES = ["Pré-amorçage", "Amorçage", "Série A", "Série B et plus"];

const CURRENCIES = ["XOF", "EUR", "USD", "GHS"];

/** Valeurs alignées sur `raises.type_tour` (equity | dette | safe | convertible). */
const ROUNDS: Array<[string, string]> = [
  ["equity", "Equity"],
  ["dette", "Dette"],
  ["safe", "SAFE"],
  ["convertible", "Obligation convertible"],
];

const ERROR_MESSAGES: Record<string, string> = {
  nom: "Donnez un nom à cette opération avant de continuer.",
  structure: "Choisissez une structure disponible.",
  enregistrement: "L’opération n’a pas pu être créée. Réessayez.",
  levee:
    "L’opération est créée, mais les détails de la levée n’ont pas pu être enregistrés. Reprenez-les depuis l’onglet « Lever ».",
};

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
  name,
  selected,
  wide,
}: {
  items: Choice[];
  name: string;
  selected: string;
  wide: boolean;
}) {
  return (
    <div className="v2-objective-grid" data-columns={wide ? 2 : 1}>
      {items.map((item) => (
        <label className="v2-objective" key={item.value}>
          <input
            defaultChecked={item.value === selected}
            disabled={item.disabled}
            form="v2-new-operation-form"
            name={name}
            type="radio"
            value={item.value}
          />
          <span className="v2-objective-icon">
            <Icon name={item.icon} />
          </span>
          <span>
            <strong>{item.title}</strong>
            <small>{item.body}</small>
          </span>
          <span className="v2-objective-check">
            <Icon name="check" />
          </span>
        </label>
      ))}
    </div>
  );
}

function TextField({
  label,
  name,
  value,
  placeholder,
  type,
  required,
}: {
  label: string;
  name: string;
  value: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="v2-field">
      <span>{label}</span>
      <span className="v2-control">
        <input
          defaultValue={value}
          inputMode={name === "montant" ? "numeric" : undefined}
          name={name}
          placeholder={placeholder}
          required={required}
          type={type ?? "text"}
        />
      </span>
    </label>
  );
}

/**
 * Toutes les listes s'ouvrent sur une option vide, et c'est le comportement
 * par défaut : ne rien choisir est une réponse valable, pas un oubli.
 */
function SelectField({
  label,
  name,
  value,
  options,
}: {
  label: string;
  name: string;
  value: string;
  options: Array<[string, string]>;
}) {
  return (
    <label className="v2-field">
      <span>{label}</span>
      <span className="v2-control">
        <select defaultValue={value} name={name}>
          <option value="">—</option>
          {options.map(([optionValue, optionLabel]) => (
            <option key={optionValue} value={optionValue}>
              {optionLabel}
            </option>
          ))}
        </select>
        <Icon name="chevron" />
      </span>
    </label>
  );
}

function sameValue(values: string[]): Array<[string, string]> {
  return values.map((value) => [value, value]);
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

/** Les valeurs déjà saisies voyagent en champs cachés jusqu'à la création. */
function Carried({ draft, except }: { draft: OperationDraft; except: readonly string[] }) {
  return (
    <>
      {Object.entries(draft)
        .filter(([name, value]) => value && !except.includes(name))
        .map(([name, value]) => (
          <input key={name} name={name} type="hidden" value={value} />
        ))}
    </>
  );
}

export function NewOperationWizard({
  step,
  draft,
  erreur,
}: {
  step: Step;
  draft: OperationDraft;
  erreur?: string;
}) {
  const copy = COPY[step];
  const showRaise = intentCanCarryRaise(draft.type);

  return (
    <div className="v2 v2-wizard-page">
      <Stepper current={step} />

      <section className="v2-wizard-card" data-wide={step === "type"}>
        <header>
          <h2>{copy.title}</h2>
          <p>{copy.lead}</p>
        </header>

        {erreur && (
          <p className="v2-auth-error" role="alert">
            {ERROR_MESSAGES[erreur] ?? "Une erreur est survenue."}
          </p>
        )}

        {step === "type" && (
          <form action="/v2/operations/nouvelle" id="v2-new-operation-form" method="get">
            <input name="etape" type="hidden" value="infos" />
            <Carried draft={draft} except={["type"]} />
            <div className="v2-wizard-body">
              <Choices items={TYPES} name="type" selected={draft.type} wide />
            </div>
          </form>
        )}

        {step === "infos" && (
          <form action="/v2/operations/nouvelle" id="v2-new-operation-form" method="get">
            <input name="etape" type="hidden" value="structure" />
            <input name="type" type="hidden" value={draft.type} />
            <div className="v2-wizard-body">
              <div className="v2-wizard-grid">
                <TextField
                  label="Nom de l’opération"
                  name="nom"
                  placeholder="Série A 2026"
                  required
                  value={draft.nom}
                />
                <SelectField
                  label="Pays ou juridiction"
                  name="pays"
                  options={sameValue(COUNTRIES)}
                  value={draft.pays}
                />
                <SelectField
                  label="Type de financeur"
                  name="financeur"
                  options={FUNDERS}
                  value={draft.financeur}
                />
                <SelectField
                  label="Stade"
                  name="stade"
                  options={sameValue(STAGES)}
                  value={draft.stade}
                />
              </div>

              {showRaise && (
                <>
                  <hr className="v2-hr" />
                  <span className="v2-section-label">Détails de la levée</span>
                  <div className="v2-wizard-grid">
                    <TextField
                      label="Montant recherché"
                      name="montant"
                      placeholder="500 000 000"
                      value={draft.montant}
                    />
                    <SelectField
                      label="Devise"
                      name="devise"
                      options={sameValue(CURRENCIES)}
                      value={draft.devise}
                    />
                    <SelectField
                      label="Tour"
                      name="tour"
                      options={ROUNDS}
                      value={draft.tour}
                    />
                    <TextField
                      label="Horizon de clôture"
                      name="horizon"
                      type="date"
                      value={draft.horizon}
                    />
                  </div>
                  <p className="v2-wizard-note">
                    <Icon name="check" />
                    Ces détails ouvrent la levée de cette opération. Laissez-les
                    vides pour créer l’opération seule — vous pourrez ouvrir la
                    levée plus tard.
                  </p>
                </>
              )}
            </div>
          </form>
        )}

        {step === "structure" && (
          <form action={createOperation} id="v2-new-operation-form">
            <Carried draft={draft} except={[]} />
            <div className="v2-wizard-body">
              <Choices items={STRUCTURES} name="structure" selected="recommandee" wide={false} />
            </div>
          </form>
        )}

        <footer>
          <Link href="/v2/operations">Annuler</Link>
          <div>
            <button className="v2-btn" form="v2-new-operation-form" type="submit">
              {copy.cta}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
