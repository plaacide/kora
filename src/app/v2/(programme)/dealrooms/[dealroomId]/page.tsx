import {
  DEALROOM_ACTIVITE,
  DEALROOM_CHIFFRES,
} from "@/features/v2/fixtures/programme";

/** Écran 25 — la vue d'ensemble d'une Dealroom publiée. */
export default function DealroomPage() {
  return (
    <>
      <div className="v2-prog-head">
        <div>
          <h1>Demo Day 2026</h1>
          <p>Publiée le 12 juillet · dernière activité aujourd’hui</p>
        </div>
        <span className="v2-spacer" />
        <nav>
          <span className="v2-btn" data-variant="secondary">
            Prévisualiser
          </span>
          <span className="v2-btn" data-variant="secondary">
            Modifier
          </span>
          <span className="v2-btn">Inviter des investisseurs</span>
        </nav>
      </div>

      <div className="v2-chiffres">
        {DEALROOM_CHIFFRES.map((chiffre) => (
          <div className="v2-card v2-dr-chiffre" key={chiffre.titre}>
            <div className="v2-nav-label" style={{ padding: "0 0 6px" }}>
              {chiffre.titre}
            </div>
            <b>{chiffre.valeur}</b>
            <small>{chiffre.detail}</small>
          </div>
        ))}
      </div>

      <div className="v2-nav-label" style={{ padding: "0 0 8px" }}>
        Activité récente
      </div>
      <div className="v2-card" style={{ overflow: "hidden" }}>
        {DEALROOM_ACTIVITE.map((ligne) => (
          <div className="v2-dr-activite" key={ligne.fait}>
            <span>{ligne.fait}</span>
            <span>{ligne.quand}</span>
          </div>
        ))}
      </div>

      {/* La phrase la plus importante de l'écran : dépublier n'est pas
          révoquer. Elle est répétée à l'identique sur l'écran 26. */}
      <p className="v2-dr-note">
        Dépublier retire la Dealroom de la vue investisseurs. Les accès data
        room déjà accordés ne sont pas supprimés.
      </p>
    </>
  );
}
