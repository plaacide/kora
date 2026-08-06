import {
  ACCUEIL_A_TRAITER,
  ACCUEIL_ACTIVITE,
  ACCUEIL_CHIFFRES,
  PROGRAMME,
} from "@/features/v2/fixtures/programme";
import { v2Routes } from "@/features/v2/navigation/routes";
import { Standalone } from "@/features/v2/ui/Shell";

const ROUTES = v2Routes.programme;

/** Écran 34 — l'accueil du programme, première entrée du rail. */
export default function AccueilProgrammePage() {
  return (
    <Standalone search="Rechercher" title="Accueil">
      <div className="v2-salut">
        <div>
          <h1>Bonjour Fatou</h1>
          <p>
            {PROGRAMME.nom} · 2 cohortes actives · 26 entreprises accompagnées
          </p>
        </div>
        <span className="v2-spacer" />
        <nav style={{ display: "flex", flexShrink: 0, gap: 10 }}>
          <a className="v2-btn" href={ROUTES.dealrooms.nouvelle}>
            Créer une Dealroom
          </a>
          <a
            className="v2-btn"
            data-variant="secondary"
            href={ROUTES.cohortes.list}
          >
            Voir mes cohortes
          </a>
        </nav>
      </div>

      <div className="v2-chiffres">
        {ACCUEIL_CHIFFRES.map((chiffre) => (
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
        À traiter
      </div>
      <div className="v2-card" style={{ overflow: "hidden" }}>
        {ACCUEIL_A_TRAITER.map((ligne) => (
          /* Le NOMBRE d'abord, puis ce qu'il est, puis où : on lit le volume
             avant la nature, et c'est lui qui décide par quoi commencer. */
          <div className="v2-atraiter" key={ligne.quoi}>
            <b>{ligne.nombre}</b>
            <div>
              <span>{ligne.quoi}</span>
              <small>{ligne.ou}</small>
            </div>
            <span className="v2-btn" data-variant="secondary">
              {ligne.action}
            </span>
          </div>
        ))}
      </div>

      <div className="v2-nav-label" style={{ padding: "22px 0 8px" }}>
        Activité récente
      </div>
      <div className="v2-card" style={{ overflow: "hidden" }}>
        {ACCUEIL_ACTIVITE.map((ligne) => (
          <div className="v2-prog-journal" key={ligne.acteur + ligne.quand}>
            <span className="v2-pastille" data-ton={ligne.ton}>
              {ligne.initiales}
            </span>
            <div>
              <b>{ligne.acteur}</b> {ligne.fait}
              {ligne.cible && <b> {ligne.cible}</b>}
              <span className="v2-journal-ou">{ligne.ou}</span>
            </div>
            <small>{ligne.quand}</small>
          </div>
        ))}
      </div>
    </Standalone>
  );
}
