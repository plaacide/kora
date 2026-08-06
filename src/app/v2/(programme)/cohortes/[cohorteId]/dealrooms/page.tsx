import { COHORTE_DEALROOMS } from "@/features/v2/fixtures/programme";
import { v2Routes } from "@/features/v2/navigation/routes";

const ROUTES = v2Routes.programme.dealrooms;

/** Écran 38 — les Dealrooms adossées à cette cohorte. */
export default function CohorteDealroomsPage() {
  return (
    <>
      <div className="v2-prog-head">
        <div>
          <h1>Dealrooms</h1>
          <p>
            {COHORTE_DEALROOMS.length} dealrooms adossées à cette cohorte
          </p>
        </div>
        <span className="v2-spacer" />
        <nav>
          <a className="v2-btn" href={ROUTES.nouvelle}>
            Créer une Dealroom
          </a>
        </nav>
      </div>

      <div className="v2-chal-liste">
        {COHORTE_DEALROOMS.map((dealroom) => (
          <article className="v2-card v2-dr-adossee" key={dealroom.id}>
            <div>
              <div className="v2-chal-titre">
                <h3>{dealroom.nom}</h3>
                <span
                  className="v2-badge"
                  data-tone={dealroom.statut === "Publiée" ? "green" : undefined}
                >
                  {dealroom.statut === "Publiée" && <span className="v2-dot" />}
                  {dealroom.statut}
                </span>
              </div>
              <div className="v2-dr-adossee-kvs">
                {[
                  ["Entreprises", dealroom.entreprises],
                  ["Audience", dealroom.audience],
                  ["Demandes", dealroom.demandes],
                ].map(([k, v]) => (
                  <div className="v2-kv" key={k}>
                    <span className="v2-k">{k}</span>
                    <span className="v2-v" style={{ fontSize: 13.5 }}>
                      {v}
                    </span>
                  </div>
                ))}
              </div>
              <div className="v2-chal-meta">{dealroom.etat}</div>
            </div>
            <div className="v2-chal-actions">
              {dealroom.actions.map((action, rang) => (
                <a
                  className="v2-btn"
                  data-variant={
                    rang === dealroom.actions.length - 1
                      ? undefined
                      : "secondary"
                  }
                  href={
                    dealroom.statut === "Publiée"
                      ? ROUTES.root(dealroom.id)
                      : ROUTES.nouvelle
                  }
                  key={action}
                >
                  {action}
                </a>
              ))}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
