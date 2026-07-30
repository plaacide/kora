import { Standalone } from "./Shell";

/**
 * Écran 67 — Activité et questions, toutes opérations confondues.
 * Repris de `sanza_handoff/maquettes/screens/67-activite-questions-adaptees.html`.
 *
 * À ne pas confondre avec l'écran 30, qui est le journal d'une opération et n'a
 * donc rien à nommer. Ici chaque événement porte la pastille de son opération :
 * sans elle, « a consulté les relevés bancaires » ne dit pas de quel dossier il
 * s'agit.
 */

const SCOPES = [
  "Toutes les opérations",
  "Série A 2026",
  "Prêt Ecobank",
  "Diligence IFC",
];

interface Event {
  initials: string;
  who: string;
  from: string;
  verb: string;
  target: string;
  operation: string;
  time: string;
}

const DAYS: Array<{ label: string; events: Event[] }> = [
  {
    label: "Aujourd’hui — 29 juillet 2026",
    events: [
      {
        initials: "AD",
        who: "Amina Diallo",
        from: "· Sahel Growth Fund",
        verb: "a consulté",
        target: "États financiers 2025.pdf",
        operation: "Série A 2026",
        time: "14:12",
      },
      {
        initials: "CM",
        who: "Clara Morel",
        from: "· Impact Capital Africa",
        verb: "a posé une question sur",
        target: "le dossier financier",
        operation: "Série A 2026",
        time: "11:40",
      },
      {
        initials: "IF",
        who: "Équipe diligence",
        from: "· IFC",
        verb: "a téléchargé",
        target: "Politique ESG 2025.pdf",
        operation: "Diligence IFC",
        time: "09:05",
      },
    ],
  },
  {
    label: "Hier — 28 juillet 2026",
    events: [
      {
        initials: "KM",
        who: "Kwame Mensah",
        from: "· Horizon Ventures",
        verb: "a signé",
        target: "l’accord de confidentialité",
        operation: "Série A 2026",
        time: "17:31",
      },
      {
        initials: "BA",
        who: "Analyste crédit",
        from: "· BOA Sénégal",
        verb: "a consulté",
        target: "Relevés bancaires 2025.pdf",
        operation: "Prêt Ecobank",
        time: "10:22",
      },
    ],
  },
];

export function GlobalActivityScreen() {
  return (
    <Standalone
      action={
        <button className="v2-btn" data-variant="secondary" type="button">
          Exporter
        </button>
      }
      search={false}
      title="Activité — toutes les opérations"
    >
      <div className="v2-journal">
        <div className="v2-filterbar">
          {SCOPES.map((scope) => (
            <button data-active={scope === SCOPES[0]} key={scope} type="button">
              {scope}
            </button>
          ))}
        </div>

        {DAYS.map((day) => (
          <section key={day.label}>
            <div className="v2-nav-label">{day.label}</div>
            <div className="v2-folder-card">
              {day.events.map((event) => (
                <div className="v2-journal-row" key={`${event.time}-${event.target}`}>
                  <span className="v2-journal-avatar">{event.initials}</span>
                  <p>
                    <b>{event.who}</b> <span className="v2-muted-3">{event.from}</span>{" "}
                    <span className="v2-muted-2">{event.verb}</span>{" "}
                    <span className="v2-journal-target">{event.target}</span>
                  </p>
                  <span className="v2-tag">{event.operation}</span>
                  <span className="v2-journal-time">{event.time}</span>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </Standalone>
  );
}
