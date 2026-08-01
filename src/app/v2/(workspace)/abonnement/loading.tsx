import { Standalone } from "@/features/v2/ui/Shell";

/**
 * Ce qu'on montre pendant que l'écran se charge — §5 du handoff.
 *
 * POURQUOI DES BLOCS ET NON UN TOURNIQUET. Cet écran interroge la base six
 * fois : le plan, l'abonnement, la consommation, les droits, le catalogue, les
 * opérations. Sur une connexion lente, l'attente se voit. Un tourniquet dit
 * « attendez » sans dire combien de temps ni à quoi s'attendre ; des blocs à la
 * forme de l'écran final annoncent ce qui arrive, et l'œil s'y installe déjà.
 *
 * LES PROPORTIONS COMPTENT : elles reprennent celles des vraies cartes. Un
 * squelette qui ne ressemble pas au contenu produit un saut au moment du
 * remplacement — précisément ce qu'il devait éviter.
 */
export default function ChargementAbonnement() {
  return (
    <Standalone search={false} title="Abonnement">
      <div className="v2-narrow-page" aria-busy="true">
        <section className="v2-plan-card">
          <div className="v2-skel" style={{ width: "38%", height: 22 }} />
          <div className="v2-skel" style={{ width: "62%", height: 14, marginTop: 10 }} />
          <div className="v2-skel" style={{ width: "28%", height: 14, marginTop: 22 }} />
        </section>

        <section className="v2-plan-card">
          <div className="v2-skel" style={{ width: "16%", height: 12 }} />
          {[0, 1, 2].map((rang) => (
            <div key={rang} style={{ marginTop: 18 }}>
              <div className="v2-skel" style={{ width: "44%", height: 13 }} />
              <div className="v2-skel" style={{ height: 5, marginTop: 8 }} />
            </div>
          ))}
        </section>

        <section className="v2-plan-card">
          <div className="v2-skel" style={{ width: "22%", height: 12 }} />
          {[0, 1].map((rang) => (
            <div className="v2-skel" key={rang} style={{ height: 44, marginTop: 14 }} />
          ))}
        </section>
      </div>
    </Standalone>
  );
}
