import { DEALROOM_NEUVE, PROGRAMME } from "@/features/v2/fixtures/programme";
import { ApercuDealroom } from "@/features/v2/ui/ApercuDealroom";
import { Icon } from "@/features/v2/ui/Icon";

/** Écran 28 — le branding d'une Dealroom DÉJÀ publiée. */
export default function DealroomBrandingPage() {
  return (
    <>
      <div className="v2-prog-head">
        <div>
          <h1>Branding</h1>
          {/* L'avertissement est en tête, pas en pied : on modifie une vitrine
              que des investisseurs ont sous les yeux. */}
          <p>
            Cette Dealroom est publiée — vos modifications seront visibles par
            les investisseurs dès l’enregistrement.
          </p>
        </div>
        <span className="v2-spacer" />
        <nav>
          <span className="v2-btn" data-variant="secondary">
            Annuler
          </span>
          <span className="v2-btn">Enregistrer les changements</span>
        </nav>
      </div>

      <div className="v2-dr-assistant" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="v2-card v2-dr-form">
          <div className="v2-field">
            <span>Logo</span>
            <div className="v2-onb-depot">
              <b>{PROGRAMME.initiales}</b>
              <span>savane-logo.svg</span>
              <span className="v2-btn" data-variant="secondary">
                Remplacer
              </span>
              <span className="v2-btn" data-variant="text-grey">
                Retirer
              </span>
            </div>
          </div>
          <div className="v2-field">
            <span>Bannière</span>
            <div className="v2-onb-depot">
              <b>
                <Icon name="file" />
              </b>
              <span>banniere-demoday.jpg</span>
              <span className="v2-btn" data-variant="secondary">
                Remplacer
              </span>
              <span className="v2-btn" data-variant="text-grey">
                Retirer
              </span>
            </div>
          </div>
          <div className="v2-reglage">
            <div>
              <b>Couleur d’accent</b>
            </div>
            <span
              style={{
                background: DEALROOM_NEUVE.accent,
                borderRadius: "var(--r-md)",
                height: 28,
                width: 44,
              }}
            />
          </div>
          <div className="v2-field">
            <span>Logos partenaires</span>
            <div className="v2-chips">
              {DEALROOM_NEUVE.partenaires.map((partenaire) => (
                <span className="v2-tag" key={partenaire}>
                  {partenaire} ✕
                </span>
              ))}
              <span className="v2-tag">+ Ajouter</span>
            </div>
          </div>
          <p className="v2-dr-note" style={{ margin: 0 }}>
            Cette modification sera visible par les investisseurs dès
            l’enregistrement.
          </p>
        </div>

        <div>
          <div className="v2-nav-label" style={{ padding: "0 0 8px" }}>
            Aperçu investisseur — temps réel
          </div>
          <ApercuDealroom />
        </div>
      </div>
    </>
  );
}
