import { DEALROOM_AUDIENCE } from "@/features/v2/fixtures/programme";

/** Écran 27 — l'audience investisseurs, nominative. */
export default function DealroomAudiencePage() {
  return (
    <>
      <div className="v2-prog-head">
        <div>
          <h1>Audience</h1>
          <p>
            Invitez les investisseurs autorisés à parcourir cette Dealroom.
          </p>
        </div>
      </div>

      <div
        className="v2-card"
        style={{ display: "flex", gap: 12, marginBottom: 16, padding: "16px 18px" }}
      >
        <div className="v2-control" style={{ flex: 1, height: 44 }}>
          <span style={{ color: "var(--text-4)" }}>adresse@fonds.com</span>
        </div>
        <span className="v2-btn">Inviter</span>
      </div>

      <div className="v2-card" style={{ overflow: "hidden" }}>
        <table className="v2-tbl">
          <thead>
            <tr>
              <th>Investisseur</th>
              <th>Statut</th>
              <th>Dernière activité</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {DEALROOM_AUDIENCE.map((invite) => (
              <tr key={invite.personne}>
                <td>
                  <div>
                    <b style={{ font: "600 13.5px var(--font-v2-head), sans-serif" }}>
                      {invite.personne}
                    </b>
                    <div className="v2-muted">{invite.organisation}</div>
                  </div>
                </td>
                <td>
                  <span className="v2-badge" data-tone={invite.ton}>
                    <span className="v2-dot" />
                    {invite.statut}
                  </span>
                </td>
                <td className="v2-dim">{invite.activite}</td>
                <td data-actions>
                  {invite.action === "—" ? (
                    <span className="v2-muted">—</span>
                  ) : (
                    <span
                      className="v2-btn"
                      data-variant={invite.actionGrise ? "text-grey" : "text"}
                    >
                      {invite.action}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Deux accès qui n'ont rien à voir. Les confondre ferait croire qu'on
          a repris une porte qu'on n'a jamais tenue. */}
      <p className="v2-dr-note">
        Retirer l’accès à la Dealroom ne révoque pas un accès à une data room
        déjà accordé par une entreprise.
      </p>
    </>
  );
}
