import {
  PORTEFEUILLE_CHIFFRES,
  PRIORITES,
} from "@/features/v2/fixtures/programme";
import { v2Routes } from "@/features/v2/navigation/routes";
import { BarreEtats } from "@/features/v2/ui/BarreEtats";
import { Standalone } from "@/features/v2/ui/Shell";

/** Écran 06 — aucune activité encore. AUCUN indicateur à zéro n'est affiché. */
function Vide() {
  return (
    <>
      <div className="v2-prog-head">
        <div>
          <h1>Portefeuille</h1>
        </div>
      </div>
      <section className="v2-card v2-prog-empty">
        <h2>
          Vos indicateurs attendent les premières activités de vos entreprises
        </h2>
        <p>
          Dès qu’une entreprise rejoint une cohorte et entame sa préparation,
          son avancement apparaît ici.
        </p>
        <div>
          <a className="v2-btn" href={v2Routes.programme.cohortes.list}>
            Voir mes cohortes
          </a>
          <span className="v2-btn" data-variant="secondary">
            Relancer mes entreprises
          </span>
        </div>
      </section>
    </>
  );
}

/** Écran 07 — « qui dois-je contacter aujourd'hui ? ». */
function Rempli() {
  return (
    <>
      <div className="v2-prog-head">
        <div>
          <h1>Portefeuille</h1>
          <p>Toutes cohortes confondues · mis à jour il y a 5 minutes</p>
        </div>
        <span className="v2-spacer" />
        <nav>
          {/* Le seul chemin vers les rapports que le paquet dessine — et il ne
              mène nulle part, faute d'écran. Voir INCOHERENCES-MAQUETTES.md. */}
          <span className="v2-btn" data-variant="secondary">
            Rapport bailleur
          </span>
        </nav>
      </div>

      <div className="v2-chiffres">
        {PORTEFEUILLE_CHIFFRES.map((chiffre) => (
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
        À traiter aujourd’hui
      </div>
      <div className="v2-card" style={{ overflow: "hidden" }}>
        {PRIORITES.map((priorite) => (
          <div className="v2-priorite" key={priorite.nom}>
            <span className="v2-pastille" data-ton={priorite.ton}>
              {priorite.initiales}
            </span>
            <div>
              <b>{priorite.nom}</b>
              <div>{priorite.objet}</div>
              <div>{priorite.detail}</div>
            </div>
            <span className="v2-btn" data-variant="secondary">
              Voir
            </span>
          </div>
        ))}
      </div>

      {/* TROIS À LA FOIS, et l'écran le dit. Une quatrième ligne ferait de la
          réponse une liste, et d'une liste on ne fait rien. */}
      <p className="v2-dr-note">
        Trois priorités à la fois. Les suivantes apparaîtront lorsque celles-ci
        seront traitées.
      </p>
    </>
  );
}

export default async function PortefeuillePage({
  searchParams,
}: {
  searchParams: Promise<{ etat?: string }>;
}) {
  const { etat } = await searchParams;
  const vide = etat === "vide";

  return (
    <Standalone search={false} title="Portefeuille">
      {vide ? <Vide /> : <Rempli />}
      <BarreEtats
        etats={[
          {
            actif: vide,
            href: `${v2Routes.programme.portefeuille}?etat=vide`,
            label: "06 · vide",
          },
          {
            actif: !vide,
            href: v2Routes.programme.portefeuille,
            label: "07 · rempli",
          },
        ]}
      />
    </Standalone>
  );
}
