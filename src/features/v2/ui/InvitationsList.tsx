import { Standalone } from "./Shell";

/**
 * Écran 65 — Invitations et demandes, adapté au multi-opérations.
 * Repris de `sanza_handoff/maquettes/screens/65-invitations-demandes-adaptees.html`.
 *
 * Cet écran vit hors de toute opération : chaque ligne nomme donc la sienne.
 * Une invitation de programme porte « Programme » plutôt qu'un nom — c'est
 * justement l'opération à présenter qui reste à choisir.
 */

const SCOPES = [
  "Toutes les opérations",
  "Série A 2026",
  "Prêt Ecobank",
  "Diligence IFC",
];

interface Item {
  initials: string;
  title: string;
  operation: string;
  detail: string;
  when: string;
  action: string;
  href?: string;
}

const TODO: Item[] = [
  {
    initials: "AD",
    title: "Amina Diallo demande un accès",
    operation: "Série A 2026",
    detail: "· Sahel Growth Fund · dossier financier",
    when: "il y a 2 heures",
    action: "Examiner",
  },
  {
    initials: "DV",
    title: "Dakar Ventures vous invite à rejoindre la cohorte 2026",
    operation: "Programme",
    detail: "· choisissez l’opération à présenter",
    when: "il y a 3 jours",
    action: "Voir l’invitation",
    href: "/v2/invitations?vue=cohorte",
  },
  {
    initials: "BA",
    title: "BOA Sénégal demande des pièces complémentaires",
    operation: "Prêt Ecobank",
    detail: "· relevés bancaires certifiés",
    when: "il y a 5 jours",
    action: "Examiner",
  },
];

const DONE: Item[] = [
  {
    initials: "KM",
    title: "Kwame Mensah — accès accordé",
    operation: "Série A 2026",
    detail: "· Horizon Ventures · NDA signé",
    when: "hier",
    action: "Voir l’accès",
  },
];

function Row({ item }: { item: Item }) {
  return (
    <article className="v2-invite-row">
      <span className="v2-journal-avatar">{item.initials}</span>
      <div>
        <b>{item.title}</b>
        <small>
          <span className="v2-tag">{item.operation}</span> {item.detail}
        </small>
      </div>
      <span className="v2-journal-place">{item.when}</span>
      {item.href ? (
        <a className="v2-btn-mini" href={item.href}>{item.action}</a>
      ) : (
        <button className="v2-btn-mini" type="button">{item.action}</button>
      )}
    </article>
  );
}

export function InvitationsListScreen() {
  return (
    <Standalone search={false} title="Invitations et demandes">
      <div className="v2-invite-page">
        <div className="v2-filterbar">
          {SCOPES.map((scope) => (
            <button data-active={scope === SCOPES[0]} key={scope} type="button">
              {scope}
            </button>
          ))}
        </div>

        <div className="v2-nav-label">À traiter</div>
        <div className="v2-folder-card">
          {TODO.map((item) => (
            <Row item={item} key={item.title} />
          ))}
        </div>

        <div className="v2-nav-label" data-spaced="true">Traitées récemment</div>
        <div className="v2-folder-card">
          {DONE.map((item) => (
            <Row item={item} key={item.title} />
          ))}
        </div>
      </div>
    </Standalone>
  );
}
