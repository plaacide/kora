import { Icon } from "./Icon";

/**
 * Écrans 59, 60 et 61 — les dialogues de la liste des opérations.
 * Repris de `59-modale-limite-plan.html`, `60-modale-cloture-archivage.html`
 * et `61-modale-choix-dealroom.html`.
 *
 * Chaque dialogue dit ce qui est conservé avant ce qui change : sur une
 * clôture ou un archivage, la première question du fondateur est toujours
 * « est-ce que je perds mes documents ? ».
 */

export type DialogKind =
  | "limite-plan"
  | "limite-close"
  | "cloture"
  | "archivage"
  | "dealroom";

const OPERATIONS: Array<[string, string]> = [
  ["Série A 2026", "Capital · Active · 72 % prête"],
  ["Prêt Ecobank", "Dette · Active · 45 % prête"],
];

interface Content {
  title: string;
  body: string;
  confirm: string;
  cancel: string;
  choices?: Array<[string, string]>;
  radios?: string[];
  note?: string;
}

const CONTENT: Record<DialogKind, Content> = {
  "limite-plan": {
    title: "Votre plan comprend une opération active",
    body: "« Série A 2026 » est actuellement active. Archivez-la avant d’en commencer une nouvelle, ou passez au plan Close pour gérer plusieurs opérations simultanément.",
    confirm: "Découvrir Close",
    cancel: "Voir l’opération actuelle",
  },
  "limite-close": {
    title: "Vos trois opérations actives sont utilisées",
    body: "Archivez une opération terminée avant d’en commencer une nouvelle.",
    confirm: "Archiver une opération",
    cancel: "Annuler",
  },
  cloture: {
    title: "Clôturer « Série A 2026 » ?",
    body: "La data room, les accès, les NDA, les consultations et les engagements resteront consultables.",
    radios: [
      "Conserver les accès jusqu’à leur expiration",
      "Révoquer les accès maintenant",
    ],
    confirm: "Clôturer l’opération",
    cancel: "Continuer à travailler",
  },
  archivage: {
    title: "Archiver « Série A 2026 » ?",
    body: "L’opération passera en lecture seule et ne comptera plus dans votre limite. Aucun document ne sera supprimé.",
    confirm: "Archiver l’opération",
    cancel: "Conserver active",
  },
  dealroom: {
    title: "Quelle opération souhaitez-vous présenter ?",
    body: "Le programme verra les informations autorisées de cette opération. Il ne verra aucun document sans votre accord.",
    choices: OPERATIONS,
    confirm: "Présenter cette opération",
    cancel: "Annuler",
    note: "Le mandat et le consentement documentaire ne s’appliqueront qu’à cette opération.",
  },
};

export function OperationDialog({ kind }: { kind: DialogKind }) {
  const content = CONTENT[kind];

  return (
    <>
      <div className="v2-scrim" />
      <div aria-modal="true" className="v2-dialog" role="dialog">
        <h2>{content.title}</h2>
        <p>{content.body}</p>

        {content.radios && (
          <div className="v2-dialog-radios">
            {content.radios.map((label, index) => (
              <label data-selected={index === 0} key={label}>
                <input defaultChecked={index === 0} name="acces" type="radio" />
                <span className="v2-radio-mark" />
                {label}
              </label>
            ))}
          </div>
        )}

        {content.choices && (
          <div className="v2-dialog-choices">
            {content.choices.map(([name, meta], index) => (
              <button data-selected={index === 0} key={name} type="button">
                <span>
                  <b>{name}</b>
                  <small>{meta}</small>
                </span>
                {index === 0 && <Icon name="check" />}
              </button>
            ))}
          </div>
        )}

        <footer>
          <button className="v2-btn" type="button">{content.confirm}</button>
          <button className="v2-btn" data-variant="secondary" type="button">
            {content.cancel}
          </button>
        </footer>

        {content.note && <p className="v2-dialog-note">{content.note}</p>}
      </div>
    </>
  );
}
