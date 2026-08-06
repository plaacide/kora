import { DEALROOMS } from "@/features/v2/fixtures/programme";
import { v2Routes } from "@/features/v2/navigation/routes";
import { BarreEtats } from "@/features/v2/ui/BarreEtats";
import { Icon } from "@/features/v2/ui/Icon";
import { Standalone } from "@/features/v2/ui/Shell";

const ROUTES = v2Routes.programme.dealrooms;

const TON_STATUT: Record<string, string | undefined> = {
  Publiée: "green",
  Brouillon: undefined,
  "Prête à publier": "blue",
  Archivée: undefined,
};

/** Écran 18 — aucune Dealroom. */
function Vide() {
  return (
    <>
      <div className="v2-prog-head">
        <div>
          <h1>Dealrooms</h1>
          <p>
            Présentez une sélection d’entreprises à vos investisseurs dans un
            espace privé à votre image.
          </p>
        </div>
      </div>
      <section className="v2-card v2-prog-empty">
        <h2>Aucune Dealroom créée</h2>
        <p>
          Une Dealroom est privée, sur invitation, et peut réunir des
          entreprises de plusieurs cohortes. Aucun document n’y est publié.
        </p>
        <div>
          <a className="v2-btn" href={ROUTES.nouvelle}>
            Créer une Dealroom
          </a>
          <span className="v2-btn" data-variant="secondary">
            Voir un exemple
          </span>
        </div>
        <small>Chaque entreprise donne son accord Dealroom par Dealroom.</small>
      </section>
    </>
  );
}

/** Écran 19 — trois Dealrooms, deux publiées. */
function Liste() {
  const publiees = DEALROOMS.filter((item) => item.statut === "Publiée").length;

  return (
    <>
      <div className="v2-prog-head">
        <div>
          <h1>Dealrooms</h1>
          <p>
            {DEALROOMS.length} Dealrooms · {publiees} publiées
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
        {DEALROOMS.map((dealroom) => {
          const brouillon = dealroom.statut !== "Publiée";
          return (
            <article className="v2-card v2-dr-carte" key={dealroom.id}>
              <div className="v2-dr-banniere">
                <Icon name="file" />
                Bannière
              </div>
              <div className="v2-dr-corps">
                <header>
                  <h3>{dealroom.nom}</h3>
                  <span className="v2-spacer" />
                  <span
                    className="v2-badge"
                    data-tone={TON_STATUT[dealroom.statut]}
                  >
                    {dealroom.statut === "Publiée" && (
                      <span className="v2-dot" />
                    )}
                    {dealroom.statut}
                  </span>
                </header>
                <small>
                  {brouillon ? (
                    <>
                      {dealroom.entreprises} entreprises ·{" "}
                      {dealroom.consentementsEnAttente} consentements en attente
                    </>
                  ) : (
                    <>
                      {dealroom.entreprises} entreprises ·{" "}
                      {dealroom.investisseurs} investisseurs invités ·{" "}
                      {dealroom.demandes} demandes d’accès
                      <br />
                      Dernière activité · {dealroom.activite}
                    </>
                  )}
                </small>
                <footer>
                  {brouillon ? (
                    <a
                      className="v2-btn"
                      data-variant="secondary"
                      href={ROUTES.nouvelle}
                    >
                      Reprendre l’édition
                    </a>
                  ) : (
                    <>
                      <a className="v2-btn" href={ROUTES.root(dealroom.id)}>
                        Gérer
                      </a>
                      <span className="v2-btn" data-variant="secondary">
                        Prévisualiser
                      </span>
                    </>
                  )}
                  <span className="v2-spacer" />
                  <span className="v2-icbtn">
                    <Icon name="more" />
                  </span>
                </footer>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}

export default async function DealroomsPage({
  searchParams,
}: {
  searchParams: Promise<{ etat?: string }>;
}) {
  const { etat } = await searchParams;
  const vide = etat === "vide";

  return (
    <Standalone search={false} title="Dealrooms">
      {vide ? <Vide /> : <Liste />}
      <BarreEtats
        etats={[
          { actif: vide, href: `${ROUTES.list}?etat=vide`, label: "18 · vide" },
          { actif: !vide, href: ROUTES.list, label: "19 · trois Dealrooms" },
        ]}
      />
    </Standalone>
  );
}
