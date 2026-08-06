import {
  APERCU_ENTREPRISES,
  DEALROOM_NEUVE,
  PROGRAMME,
} from "../fixtures/programme";
import { Icon } from "./Icon";

/**
 * L'aperçu investisseur d'une Dealroom.
 *
 * UN SEUL COMPOSANT, rendu par les écrans 21, 24 et 28. La maquette 24 dit
 * « exactement la vue investisseur » : deux implémentations divergeraient, et
 * c'est justement l'aperçu qui ne doit pas mentir — c'est sur lui qu'un
 * programme décide de publier.
 *
 * L'ACCENT vient de la Dealroom et non du thème : c'est tout l'objet du
 * branding. Il passe par une variable, pour que la structure Sanza reste la
 * même — « le branding apporte l'identité, pas la structure ».
 */
export function ApercuDealroom({
  accent = DEALROOM_NEUVE.accent,
  titre = DEALROOM_NEUVE.titrePublic,
  sousTitre = DEALROOM_NEUVE.sousTitre,
  partenaires = DEALROOM_NEUVE.partenaires,
  investisseur = "marie@fund.com",
}: {
  accent?: string;
  titre?: string;
  sousTitre?: string;
  partenaires?: readonly string[];
  investisseur?: string;
}) {
  return (
    <div
      className="v2-apercu"
      style={{ "--dr-accent": accent } as React.CSSProperties}
    >
      <div className="v2-apercu-liseré" />
      <div className="v2-apercu-nav">
        <span className="v2-apercu-marque">{PROGRAMME.initiales}</span>
        <b>{PROGRAMME.nom}</b>
        <span className="v2-spacer" />
        <span>{investisseur} · Quitter</span>
      </div>
      <div className="v2-apercu-banniere">
        <Icon name="file" />
        Bannière 1600 × 400
      </div>
      <div className="v2-apercu-hero">
        <b>{titre}</b>
        <span>{sousTitre}</span>
        <span className="v2-btn v2-apercu-cta">Explorer les entreprises</span>
        {partenaires.length > 0 && (
          <div className="v2-apercu-sponsors">
            Programme soutenu par
            {partenaires.map((partenaire) => (
              <span className="v2-tag" key={partenaire}>
                {partenaire}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="v2-apercu-cartes">
        {APERCU_ENTREPRISES.map((entreprise) => (
          <div key={entreprise.nom}>
            <b>{entreprise.nom}</b>
            <div>{entreprise.ligne}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
