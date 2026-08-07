import {
  blocagePublication,
  statutAffiche,
  tonStatut,
} from "@/features/v2/domain/dealroom";
import { v2Routes } from "@/features/v2/navigation/routes";
import {
  type DealroomLu,
  listerDealrooms,
} from "@/features/v2/server/dealrooms";
import { Icon } from "@/features/v2/ui/Icon";
import { Standalone } from "@/features/v2/ui/Shell";

const ROUTES = v2Routes.programme.dealrooms;

/** Écran 18 — aucune Dealroom. */
function Vide() {
  return (
    <>
      <div className="v2-prog-head">
        <div>
          <h1>Dealrooms</h1>
          <p>
            Présentez une sélection d’entreprises à vos investisseurs dans un
            espace à votre image.
          </p>
        </div>
      </div>
      <section className="v2-card v2-prog-empty">
        <h2>Aucune Dealroom créée</h2>
        <p>
          Une Dealroom peut réunir des entreprises de plusieurs cohortes. Aucun
          document n’y est publié — seulement des fiches.
        </p>
        <div>
          <a className="v2-btn" href={ROUTES.nouvelle}>
            Créer une Dealroom
          </a>
        </div>
        <small>Chaque entreprise donne son accord Dealroom par Dealroom.</small>
      </section>
    </>
  );
}

function Carte({ dealroom }: { dealroom: DealroomLu }) {
  const statut = statutAffiche(dealroom);
  const blocage = blocagePublication(dealroom);
  const publiee = statut === "Publiée";

  return (
    <article className="v2-card v2-dr-carte">
      <div className="v2-dr-banniere">
        <Icon name="file" />
        Bannière
      </div>
      <div className="v2-dr-corps">
        <header>
          <h3>{dealroom.nom}</h3>
          <span className="v2-spacer" />
          <span className="v2-badge" data-tone={tonStatut(statut)}>
            {publiee && <span className="v2-dot" />}
            {statut}
          </span>
        </header>
        <small>
          {dealroom.entreprises} entreprise
          {dealroom.entreprises > 1 ? "s" : ""}
          {dealroom.cohortes > 1 && ` · ${dealroom.cohortes} cohortes`}
          {publiee && (
            <>
              {" · "}
              {dealroom.liensActifs} lien
              {dealroom.liensActifs > 1 ? "s" : ""} actif
              {dealroom.liensActifs > 1 ? "s" : ""}
            </>
          )}
          {/* CE QUI BLOQUE EST DIT, pas seulement signalé. Un bouton grisé
              sans raison est une impasse : le programme ne sait pas qui
              relancer. */}
          {blocage && (
            <>
              <br />
              {blocage}
            </>
          )}
        </small>
        <footer>
          <a className="v2-btn" href={ROUTES.root(dealroom.id)}>
            {publiee ? "Gérer" : "Reprendre l’édition"}
          </a>
        </footer>
      </div>
    </article>
  );
}

/** Écran 19 — les Dealrooms du programme. */
function Liste({ dealrooms }: { dealrooms: readonly DealroomLu[] }) {
  const publiees = dealrooms.filter((d) => d.statut === "publiee").length;

  return (
    <>
      <div className="v2-prog-head">
        <div>
          <h1>Dealrooms</h1>
          <p>
            {dealrooms.length} Dealroom{dealrooms.length > 1 ? "s" : ""}
            {publiees > 0 &&
              ` · ${publiees} publiée${publiees > 1 ? "s" : ""}`}
          </p>
        </div>
        <span className="v2-spacer" />
        <nav>
          <a className="v2-btn" href={ROUTES.nouvelle}>
            Créer une Dealroom
          </a>
        </nav>
      </div>

      <div className="v2-dr-grid">
        {dealrooms.map((dealroom) => (
          <Carte dealroom={dealroom} key={dealroom.id} />
        ))}
      </div>
    </>
  );
}

export default async function DealroomsPage() {
  const dealrooms = await listerDealrooms();

  return (
    <Standalone search={false} title="Dealrooms">
      {dealrooms.length === 0 ? <Vide /> : <Liste dealrooms={dealrooms} />}
    </Standalone>
  );
}
