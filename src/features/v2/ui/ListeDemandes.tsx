import { DEMANDES } from "../fixtures/programme";

/**
 * La liste des demandes d'accès — écrans 35 et 40.
 *
 * UN SEUL COMPOSANT, et une seule grille. Le LISEZ-MOI du 6 août l'écrit noir
 * sur blanc : l'en-tête et les lignes partagent
 * `minmax(240px,1.4fr) 1fr 1fr .9fr 210px`. Deux grilles voisines pour la même
 * liste se remarquent dès qu'on passe d'un écran à l'autre.
 *
 * SANZA TRANSMET, L'ENTREPRISE DÉCIDE. Les statuts disent la chaîne :
 * « À transmettre » attend le programme, « Transmise » attend l'entreprise.
 * Nulle part le programme n'ouvre une data room à la place de quelqu'un — les
 * seuls verbes qu'il a sont transmettre, refuser, relancer.
 */
export function ListeDemandes() {
  return (
    <>
      <div className="v2-card" style={{ overflow: "hidden" }}>
        <div className="v2-demande-tete">
          <span>Investisseur</span>
          <span>Entreprise visée</span>
          <span>Instrument</span>
          <span>reçue</span>
          <span style={{ textAlign: "right" }}>Statut</span>
        </div>
        {DEMANDES.map((demande) => (
          <div className="v2-demande" key={demande.investisseur}>
            <div className="v2-ident">
              <span className="v2-pastille" data-ton={demande.ton}>
                {demande.initiales}
              </span>
              <div>
                <b>{demande.investisseur}</b>
                <div>{demande.fonds}</div>
              </div>
            </div>
            <span>{demande.entreprise}</span>
            <span className="v2-dim">{demande.instrument}</span>
            <span className="v2-muted">{demande.recue}</span>
            <div className="v2-demande-actions">
              <span
                className="v2-badge"
                data-tone={demande.statut === "Transmise" ? "blue" : "amber"}
              >
                <span className="v2-dot" />
                {demande.statut}
              </span>
              {demande.actions.map((action) => (
                <span
                  className="v2-btn"
                  data-variant={action === "Refuser" ? "text-grey" : "text"}
                  key={action}
                >
                  {action}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="v2-dr-note">
        <b>Sanza transmet la demande à l’entreprise.</b> Elle seule décide
        d’ouvrir sa data room — vous suivez le statut ici.
      </p>
    </>
  );
}
