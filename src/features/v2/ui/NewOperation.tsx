import Link from "next/link";

import { createOperation } from "@/app/v2/operations/nouvelle/actions";
import { Icon, type IconName } from "./Icon";

/**
 * Écrans 55, 56 et 57 — création d'une opération, en trois étapes.
 * Repris de `55-nouvelle-operation-type.html`, `56-…-infos.html` et
 * `57-…-structure.html`.
 *
 * Chaque étape est un vrai `<form>` (GET pour type/infos, qui ne font que
 * naviguer vers l'étape suivante en portant leurs valeurs dans l'URL ; POST
 * via Server Action pour structure, qui crée réellement l'opération via
 * `create_data_room`). Le bouton du pied de page est rattaché au formulaire
 * de l'étape via `form="v2-new-operation-form"` : le pied reste un enfant
 * direct de `.v2-wizard-card`, comme sur les autres écrans-assistants qui
 * partagent cette même feuille de style.
 */

export type Step = "type" | "infos" | "structure";

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

/** Sans colonne source côté RPC pour l'instant : affichés, mais pas transmis. */
const FIELDS = [
  "Pays ou juridiction",
  "Type de financeur",
  "Stade",
  "Montant recherché",
  "Devise",
  "Tour",
  "Horizon de clôture",
];

const ERROR_MESSAGES: Record<string, string> = {
  nom: "Donnez un nom à cette opération avant de continuer.",
  structure: "Choisissez une structure disponible.",
  enregistrement: "L’opération n’a pas pu être créée. Réessayez.",
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

export function NewOperationWizard({
  step,
  type,
  nom,
  erreur,
}: {
  step: Step;
  type: string;
  nom: string;
  erreur?: string;
}) {
  const copy = COPY[step];

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
            <div className="v2-wizard-body">
              <Choices items={TYPES} name="type" selected={type} wide />
            </div>
          </form>
        )}

        {step === "infos" && (
          <form action="/v2/operations/nouvelle" id="v2-new-operation-form" method="get">
            <input name="etape" type="hidden" value="structure" />
            <input name="type" type="hidden" value={type} />
            <div className="v2-wizard-body">
              <div className="v2-wizard-grid">
                <label className="v2-field">
                  <span>Nom de l’opération</span>
                  <span className="v2-control">
                    <input defaultValue={nom} name="nom" placeholder="Série A 2026" required />
                  </span>
                </label>
                {FIELDS.map((label) => (
                  <label className="v2-field" key={label}>
                    <span>{label}</span>
                    <span className="v2-control">
                      <select />
                      <Icon name="chevron" />
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </form>
        )}

        {step === "structure" && (
          <form action={createOperation} id="v2-new-operation-form">
            <input name="type" type="hidden" value={type} />
            <input name="nom" type="hidden" value={nom} />
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
