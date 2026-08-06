import { listerCohortes } from "@/features/v2/server/cohortes";
import { requireV2Workspace } from "@/features/v2/server/session";
import { v2Routes } from "@/features/v2/navigation/routes";
import { AvisEphemere } from "@/features/v2/ui/AvisEphemere";
import { BoutonEnvoi } from "@/features/v2/ui/BoutonEnvoi";
import { Standalone } from "@/features/v2/ui/Shell";

import { creerCohorte } from "./actions";

const ROUTES = v2Routes.programme.cohortes;

/**
 * Écrans 01 et 02 — la liste des cohortes. PREMIER ÉCRAN BRANCHÉ du parcours.
 *
 * La barre d'états a disparu : elle servait à atteindre un état que rien ne
 * distinguait dans l'adresse. Ici l'état vient de la base — une organisation
 * sans cohorte voit l'écran 01, dès la première créée elle voit le 02. C'est
 * ce que l'échafaudage annonçait, et il tombe écran par écran.
 */
export default async function CohortesPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const [{ erreur }, cohortes, { organization }] = await Promise.all([
    searchParams,
    listerCohortes(),
    requireV2Workspace(),
  ]);

  const actives = cohortes.filter((item) => !item.archivee);
  const archivees = cohortes.filter((item) => item.archivee);

  return (
    <Standalone
      search={cohortes.length > 0 ? "Rechercher une cohorte" : false}
      title="Mes cohortes"
    >
      {erreur && (
        <p className="v2-auth-error" role="alert">
          <AvisEphemere />
          {erreur === "nom"
            ? "Donnez un nom à votre cohorte pour continuer."
            : "La cohorte n’a pas pu être créée. Réessayez."}
        </p>
      )}

      {cohortes.length === 0 ? (
        <>
          <div className="v2-prog-head">
            <div>
              <h1>Mes cohortes</h1>
            </div>
          </div>
          <form action={creerCohorte} className="v2-card v2-prog-empty">
            <h2>Commencez par une cohorte</h2>
            <p>
              Une cohorte rassemble les entreprises que vous accompagnez sur une
              période donnée.
            </p>
            <div className="v2-duo" style={{ marginTop: 14, width: 420 }}>
              <label className="v2-field">
                <span className="v2-sr-only">Nom de la cohorte</span>
                <div className="v2-control" style={{ height: 44 }}>
                  <input name="nom" placeholder="Saison 4 · Agri & Agro" required />
                </div>
              </label>
              <label className="v2-field">
                <span className="v2-sr-only">Nombre de places</span>
                <div className="v2-control" style={{ height: 44 }}>
                  <input defaultValue={15} inputMode="numeric" name="places" />
                </div>
              </label>
            </div>
            <div>
              <BoutonEnvoi className="v2-btn" enCours="Création…">
                Créer ma première cohorte
              </BoutonEnvoi>
            </div>
            <small>
              Vous verrez l’avancement de chaque entreprise, jamais ses
              documents.
            </small>
          </form>
        </>
      ) : (
        <>
          <div className="v2-prog-head">
            <div>
              <h1>Mes cohortes</h1>
              <p>
                Les groupes d’entreprises que {organization.name} accompagne.
              </p>
            </div>
            <span className="v2-spacer" />
            <nav>
              <form action={creerCohorte}>
                <input name="nom" type="hidden" value="Nouvelle cohorte" />
                <BoutonEnvoi className="v2-btn" enCours="Création…">
                  Créer une cohorte
                </BoutonEnvoi>
              </form>
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
      )}
    </Standalone>
  );
}

/**
 * Une carte par cohorte.
 *
 * AUCUN INDICATEUR N'EST AFFICHÉ SANS DONNÉE — la note de l'écran 02 le dit,
 * et c'est ce qui distingue une cohorte qui démarre d'une cohorte qui échoue.
 * Une carte à « 0 entreprise, 0 Challenge » crie l'échec d'une cohorte créée
 * ce matin.
 */
function Cartes({
  cohortes,
}: {
  cohortes: readonly Awaited<ReturnType<typeof listerCohortes>>[number][];
}) {
  return (
    <div className="v2-prog-grid">
      {cohortes.map((item) => (
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
          {item.entreprises > 0 && (
            <div
              className="v2-prog-kvs"
              style={{ gridTemplateColumns: "repeat(2, 1fr)" }}
            >
              <div className="v2-kv">
                <span className="v2-v">{item.entreprises}</span>
                <span className="v2-k">
                  entreprise{item.entreprises > 1 ? "s" : ""}
                </span>
              </div>
              <div className="v2-kv">
                <span className="v2-v">{item.places}</span>
                <span className="v2-k">places</span>
              </div>
            </div>
          )}
          <footer>
            <a
              className="v2-btn"
              data-variant="secondary"
              href={ROUTES.entreprises(item.id)}
            >
              Ouvrir
            </a>
          </footer>
        </article>
      ))}
    </div>
  );
}
