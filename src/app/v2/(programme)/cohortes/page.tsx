import {
  COHORTES,
  INDICATEURS_COHORTE,
  PROGRAMME,
} from "@/features/v2/fixtures/programme";
import { v2Routes } from "@/features/v2/navigation/routes";
import { BarreEtats } from "@/features/v2/ui/BarreEtats";
import { Standalone } from "@/features/v2/ui/Shell";

const ROUTES = v2Routes.programme.cohortes;

/** Écran 01 — aucune cohorte créée. */
function Vide() {
  return (
    <>
      <div className="v2-prog-head">
        <div>
          <h1>Mes cohortes</h1>
        </div>
      </div>
      <section className="v2-card v2-prog-empty">
        <h2>Commencez par une cohorte</h2>
        <p>
          Une cohorte rassemble les entreprises que vous accompagnez sur une
          période donnée.
        </p>
        <div>
          <span className="v2-btn">Créer ma première cohorte</span>
          <span className="v2-btn" data-variant="secondary">
            Comment ça marche
          </span>
        </div>
        <small>
          Vous verrez l’avancement de chaque entreprise, jamais ses documents.
        </small>
      </section>
    </>
  );
}

/** Écran 02 — deux cohortes actives, une archivée. */
function Liste() {
  const actives = COHORTES.filter((item) => !item.archivee);
  const archivees = COHORTES.filter((item) => item.archivee);

  return (
    <>
      <div className="v2-prog-head">
        <div>
          <h1>Mes cohortes</h1>
          <p>Les groupes d’entreprises que {PROGRAMME.nom} accompagne.</p>
        </div>
        <span className="v2-spacer" />
        <nav>
          <span className="v2-btn">Créer une cohorte</span>
        </nav>
      </div>
      <Cartes cohortes={actives} />
      {archivees.length > 0 && (
        <>
          <div className="v2-nav-label" style={{ padding: "22px 0 8px" }}>
            Archivées
          </div>
          <Cartes cohortes={archivees} />
        </>
      )}
    </>
  );
}

function Cartes({ cohortes }: { cohortes: readonly (typeof COHORTES)[number][] }) {
  return (
    <div className="v2-prog-grid">
      {cohortes.map((item) => {
        const indicateurs = INDICATEURS_COHORTE[item.id] ?? [];
        return (
          <article
            className="v2-card v2-prog-cohorte"
            data-archivee={item.archivee}
            key={item.id}
          >
            <header>
              <div>
                <h3>{item.nom}</h3>
                <div>{item.periodeListe}</div>
              </div>
              <span className="v2-spacer" />
              {item.archivee && <span className="v2-badge">Archivée</span>}
            </header>
            <div
              className="v2-prog-kvs"
              style={{
                gridTemplateColumns: `repeat(${indicateurs.length}, 1fr)`,
              }}
            >
              {indicateurs.map((indicateur) => (
                <div className="v2-kv" key={indicateur.libelle}>
                  <span className="v2-v">{indicateur.valeur}</span>
                  <span className="v2-k">{indicateur.libelle}</span>
                </div>
              ))}
            </div>
            <footer>
              <a className="v2-btn" data-variant="secondary" href={ROUTES.root(item.id)}>
                Ouvrir
              </a>
            </footer>
          </article>
        );
      })}
    </div>
  );
}

export default async function CohortesPage({
  searchParams,
}: {
  searchParams: Promise<{ etat?: string }>;
}) {
  const { etat } = await searchParams;
  const vide = etat === "vide";

  return (
    <Standalone
      search={vide ? false : "Rechercher une cohorte"}
      title="Mes cohortes"
    >
      {vide ? <Vide /> : <Liste />}
      <BarreEtats
        etats={[
          { href: `${ROUTES.list}?etat=vide`, label: "01 · vide", actif: vide },
          { href: ROUTES.list, label: "02 · liste", actif: !vide },
        ]}
      />
    </Standalone>
  );
}
