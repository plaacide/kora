/**
 * Écran 30 — Journal d'activité de l'opération.
 * Repris de `sanza_handoff/maquettes/screens/30-journal-activite.html`.
 */

const FILTERS = [
  "Tout",
  "Consultations",
  "Téléchargements",
  "NDA et accès",
  "Dépôts et versions",
  "Questions",
];

interface ActivityEntry {
  initials: string;
  who: string;
  from: string;
  verb: string;
  target: string;
  place: string;
  time: string;
}

const DAYS: Array<{ label: string; entries: ActivityEntry[] }> = [
  {
    label: "Aujourd’hui — 28 juillet 2026",
    entries: [
      {
        initials: "AD",
        who: "Amina Diallo",
        from: "· Sahel Growth Fund",
        verb: "a consulté",
        target: "États financiers 2025.pdf",
        place: "Dakar",
        time: "14:12",
      },
      {
        initials: "AD",
        who: "Amina Diallo",
        from: "· Sahel Growth Fund",
        verb: "a consulté",
        target: "Table de capitalisation.xlsx",
        place: "Dakar",
        time: "13:58",
      },
      {
        initials: "IS",
        who: "Ibrahima Sy",
        from: "· Équipe — Finance",
        verb: "a déposé",
        target: "Relevés bancaires 2025.pdf (v1)",
        place: "interne",
        time: "11:20",
      },
      {
        initials: "CM",
        who: "Clara Morel",
        from: "· Impact Capital Africa",
        verb: "a demandé l’accès au",
        target: "dossier financier",
        place: "via dealroom",
        time: "09:15",
      },
    ],
  },
  {
    label: "Hier — 27 juillet 2026",
    entries: [
      {
        initials: "KM",
        who: "Kwame Mensah",
        from: "· Horizon Ventures",
        verb: "a signé",
        target: "l’accord de confidentialité",
        place: "Accra",
        time: "16:40",
      },
      {
        initials: "KM",
        who: "Kwame Mensah",
        from: "· Horizon Ventures",
        verb: "a consulté",
        target: "Pitch deck v4.pdf",
        place: "Accra",
        time: "16:52",
      },
      {
        initials: "AD",
        who: "Amara Diallo",
        from: "· Équipe — Propriétaire",
        verb: "a créé un accès pour",
        target: "Moussa Ndao (Banque Atlantique)",
        place: "interne",
        time: "10:05",
      },
    ],
  },
];

export function ActivityScreen() {
  return (
    <>
      <div className="v2-filterbar">
        {FILTERS.map((filter) => (
          <button data-active={filter === "Tout"} key={filter} type="button">
            {filter}
          </button>
        ))}
      </div>

      <div className="v2-journal">
        {DAYS.map((day) => (
          <section key={day.label}>
            <div className="v2-nav-label">{day.label}</div>
            <div className="v2-folder-card">
              {day.entries.map((entry) => (
                <div className="v2-journal-row" key={`${entry.time}-${entry.target}`}>
                  <span className="v2-journal-avatar">{entry.initials}</span>
                  <p>
                    <b>{entry.who}</b> <span className="v2-muted-3">{entry.from}</span>{" "}
                    <span className="v2-muted-2">{entry.verb}</span>{" "}
                    <span className="v2-journal-target">{entry.target}</span>
                  </p>
                  <span className="v2-journal-place">{entry.place}</span>
                  <span className="v2-journal-time">{entry.time}</span>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
