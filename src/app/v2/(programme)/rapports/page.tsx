import { RAPPORTS } from "@/features/v2/fixtures/programme";
import { Icon } from "@/features/v2/ui/Icon";
import { Standalone } from "@/features/v2/ui/Shell";

/** Écran 36 — les rapports consolidés, tous programmes. */
export default function RapportsPage() {
  return (
    <Standalone search={false} title="Rapports">
      <div className="v2-prog-head">
        <div>
          <h1>Rapports</h1>
          <p>
            Des rapports d’avancement consolidés pour vos financeurs et
            partenaires.
          </p>
        </div>
        <span className="v2-spacer" />
        <nav>
          <span className="v2-btn">Générer un rapport</span>
        </nav>
      </div>

      <div className="v2-card" style={{ overflow: "hidden" }}>
        <table className="v2-tbl">
          <thead>
            <tr>
              <th>Rapport</th>
              <th>Périmètre</th>
              <th>Généré</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {RAPPORTS.map((rapport) => (
              <tr key={rapport.titre}>
                <td>
                  <div className="v2-ident">
                    <span className="v2-pastille" data-ton="red">
                      <Icon name="file" />
                    </span>
                    <div>
                      <b>{rapport.titre}</b>
                      <div>PDF</div>
                    </div>
                  </div>
                </td>
                <td className="v2-dim">{rapport.perimetre}</td>
                <td className="v2-dim">
                  {rapport.genere} · {rapport.partage}
                </td>
                <td data-actions>
                  <span className="v2-btn" data-variant="secondary">
                    Télécharger
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* La limite est la même que partout : on agrège la progression, jamais
          le contenu. Un rapport bailleur ne doit pas devenir une fuite. */}
      <p className="v2-dr-note">
        Un rapport agrège la progression — complétude, Challenges, activité des
        dealrooms. Jamais le contenu des documents des entreprises.
      </p>
    </Standalone>
  );
}
