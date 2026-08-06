import { DEALROOM_ENTREPRISES } from "@/features/v2/fixtures/programme";

/** Écran 26 — les entreprises publiées dans la Dealroom. */
export default function DealroomEntreprisesPage() {
  const publiees = DEALROOM_ENTREPRISES.filter((item) => item.publiee).length;
  const attente = DEALROOM_ENTREPRISES.length - publiees;

  return (
    <>
      <div className="v2-prog-head">
        <div>
          <h1>Entreprises</h1>
          <p>
            12 sélectionnées · {publiees + 6} fiches publiées · {attente + 1} en
            attente d’accord
          </p>
        </div>
        <span className="v2-spacer" />
        <nav>
          <span className="v2-btn">Ajouter des entreprises</span>
        </nav>
      </div>

      <div className="v2-card" style={{ overflow: "hidden" }}>
        <table className="v2-tbl">
          <thead>
            <tr>
              <th>Entreprise</th>
              <th>Cohorte</th>
              {/* Le titre de la colonne EST la règle : l'opération est choisie
                  par l'entreprise, jamais par le programme. */}
              <th>Opération choisie par l’entreprise</th>
              <th>Statut</th>
              <th>Consentement</th>
              <th>Demandes</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {DEALROOM_ENTREPRISES.map((item) => (
              <tr key={item.nom}>
                <td>
                  <div className="v2-ident">
                    <span className="v2-pastille" data-ton={item.ton}>
                      {item.initiales}
                    </span>
                    <div>
                      <b>{item.nom}</b>
                      <div>
                        {item.secteur} · {item.pays}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="v2-dim">{item.cohorte}</td>
                <td className={item.publiee ? undefined : "v2-muted"}>
                  {item.operation}
                </td>
                <td>
                  <span
                    className="v2-badge"
                    data-tone={item.publiee ? "green" : undefined}
                  >
                    {item.publiee && <span className="v2-dot" />}
                    {item.publiee ? "Publiée" : "Non publiée"}
                  </span>
                </td>
                <td>
                  <span
                    className="v2-badge"
                    data-tone={
                      item.consentement === "Accord donné" ? "green" : "amber"
                    }
                  >
                    <span className="v2-dot" />
                    {item.consentement}
                  </span>
                </td>
                <td className={item.demandes ? undefined : "v2-muted"}>
                  {item.demandes ?? "—"}
                </td>
                <td data-actions>
                  <span className="v2-btn" data-variant="text-grey">
                    Dépublier
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="v2-dr-note">
        Dépublier retire la fiche de cette Dealroom. Les accès déjà accordés à
        une data room ne sont pas supprimés.
      </p>
    </>
  );
}
