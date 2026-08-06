import {
  DEALROOM_CUMUL,
  DEALROOM_JOURNAL,
} from "@/features/v2/fixtures/programme";

/** Écran 41 — ce que font les invités dans la Dealroom. */
export default function DealroomActivitePage() {
  return (
    <>
      <div className="v2-prog-head">
        <div>
          <h1>Activité</h1>
          {/* « visible par vous seul » : un investisseur ne voit pas qu'un
              autre est passé, et une entreprise non plus. */}
          <p>Ce que font vos invités dans la dealroom — visible par vous seul.</p>
        </div>
        <span className="v2-spacer" />
        <nav>
          <span className="v2-btn" data-variant="secondary">
            Exporter (CSV)
          </span>
        </nav>
      </div>

      <div className="v2-card" style={{ overflow: "hidden" }}>
        {DEALROOM_JOURNAL.map((groupe) => (
          <div key={groupe.jour}>
            <div className="v2-journal-jour">{groupe.jour}</div>
            {groupe.lignes.map((ligne) => (
              <div className="v2-prog-journal" key={ligne.texte + ligne.heure}>
                <span className="v2-pastille" data-ton={ligne.ton}>
                  {ligne.initiales}
                </span>
                <div>
                  {ligne.texte}
                  {ligne.cible && <b> {ligne.cible}</b>}
                </div>
                <small>{ligne.heure}</small>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="v2-nav-label" style={{ padding: "22px 0 8px" }}>
        Depuis la publication
      </div>
      <div className="v2-chiffres">
        {DEALROOM_CUMUL.map((cumul) => (
          <div className="v2-card v2-dr-chiffre" key={cumul.k}>
            <div className="v2-nav-label" style={{ padding: "0 0 6px" }}>
              {cumul.k}
            </div>
            <b>{cumul.v}</b>
          </div>
        ))}
      </div>
    </>
  );
}
