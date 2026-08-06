import { v2Routes } from "@/features/v2/navigation/routes";
import { Icon } from "@/features/v2/ui/Icon";
import { ETAPES_PROGRAMME, Stepper } from "@/features/v2/ui/Onboarding";

const COHORTES = v2Routes.programme.cohortes;

/** Ce que l'espace ouvre d'emblée, et ce qui reste activable. */
const PRET = [
  "Invitations par email ou lien",
  "Suivi de complétude",
  "Bibliothèque de Challenges",
  "Dealrooms — activable",
  "Rapports — activable",
];

/** Écran 00d — étape 5 : l'espace est prêt. */
export default function EspacePretPage() {
  return (
    <div className="v2-onboard-body">
      <Stepper current={5} etapes={ETAPES_PROGRAMME} />
      <div className="v2-onboard-title v2-onb-titre-centre">
        <span className="v2-onb-sceau">
          <Icon name="check" />
        </span>
        <h1>Votre espace programme est prêt</h1>
        <p>
          La cohorte est créée. Prochaine étape : inviter les entreprises que
          vous accompagnez.
        </p>
      </div>

      <div className="v2-card v2-onb-recap">
        <div>
          <div className="v2-kv">
            <span className="v2-k">Organisation</span>
            <span className="v2-v">Savane Accelerator — Sénégal</span>
          </div>
          <div className="v2-kv">
            <span className="v2-k">Cohorte créée</span>
            <span className="v2-v">Saison 4 · Agri &amp; Agro</span>
          </div>
        </div>
        <div>
          <div className="v2-kv">
            <span className="v2-k">Période</span>
            <span className="v2-v">Mars → décembre 2026 · 15 places</span>
          </div>
          <div className="v2-kv">
            <span className="v2-k">Accompagnement choisi</span>
            <span className="v2-v">Suivi de cohorte · Challenges</span>
          </div>
        </div>
        <div>
          <div className="v2-kv">
            <span className="v2-k">Prêt dans votre espace</span>
            <span className="v2-v">
              {PRET.map((item) => (
                <span className="v2-tag" key={item}>
                  {item}
                </span>
              ))}
            </span>
          </div>
        </div>
      </div>

      <p className="v2-onb-promesse">
        <Icon name="shield-check" />
        <span>
          <b>Chaque entreprise reste chez elle.</b> Vous voyez sa progression ;
          ses documents ne vous sont visibles que si elle les partage
          explicitement.
        </span>
      </p>

      <div className="v2-onb-fin">
        <a className="v2-btn" href={COHORTES.entreprises("saison-4-jour-1")}>
          Inviter mes premières entreprises
        </a>
        <a
          className="v2-btn"
          data-variant="secondary"
          href={`${COHORTES.list}?etat=vide`}
        >
          Voir mon espace
        </a>
      </div>
    </div>
  );
}
