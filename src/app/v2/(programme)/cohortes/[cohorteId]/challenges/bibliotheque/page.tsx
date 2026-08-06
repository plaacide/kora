import {
  CATEGORIES,
  MES_MODELES,
  MODELES_SANZA,
  PROGRAMME,
} from "@/features/v2/fixtures/programme";
import { v2Routes } from "@/features/v2/navigation/routes";
import { Icon } from "@/features/v2/ui/Icon";

const ROUTES = v2Routes.programme.cohortes;

function Onglets({
  cohorteId,
  courant,
}: {
  cohorteId: string;
  courant: "sanza" | "miens";
}) {
  const base = ROUTES.bibliotheque(cohorteId);
  return (
    <div className="v2-onglets">
      <a data-active={courant === "sanza"} href={base}>
        Sanza · {CATEGORIES[0].nombre}
      </a>
      <a data-active={courant === "miens"} href={`${base}?onglet=miens`}>
        Mes modèles · {MES_MODELES.length}
      </a>
    </div>
  );
}

function Critere({
  critere,
}: {
  critere: (typeof MODELES_SANZA)[number]["criteres"][number];
}) {
  return (
    <div className="v2-critere">
      <i />
      <b>{critere.libelle}</b>
      {critere.source === "connecte" ? (
        <span className="v2-badge" data-tone="blue">
          <span className="v2-dot" />
          Connecté à Sanza
        </span>
      ) : (
        <span className="v2-badge">Manuel</span>
      )}
      <span className="v2-tag">
        {critere.obligatoire ? "Obligatoire" : "Optionnel"}
      </span>
    </div>
  );
}

/** Écran 10 — trois volets : catégories, liste, aperçu complet du modèle. */
function Sanza({ cohorteId }: { cohorteId: string }) {
  const modele = MODELES_SANZA[0];

  return (
    <div className="v2-biblio">
      <div className="v2-biblio-cats">
        <div className="v2-search">
          <Icon name="search" />
          Rechercher
        </div>
        {CATEGORIES.map((categorie) => (
          <a
            data-active={categorie.nom === modele.categorie}
            key={categorie.nom}
          >
            {categorie.nom}
            <span>{categorie.nombre}</span>
          </a>
        ))}
      </div>

      <div className="v2-card v2-biblio-liste">
        {MODELES_SANZA.map((item) => (
          <a data-active={item.id === modele.id} key={item.id}>
            <b>{item.titre}</b>
            <small>
              {item.criteres.length} critères · {item.duree}
            </small>
          </a>
        ))}
      </div>

      <div className="v2-card v2-biblio-detail">
        <header>
          <span className="v2-tag">{modele.categorie}</span>
          <span className="v2-marque-sanza">
            <i>S</i>Modèle Sanza
          </span>
          <span className="v2-spacer" />
          <small>Durée recommandée · {modele.duree}</small>
        </header>
        <h2>{modele.titre}</h2>
        <p>{modele.description}</p>
        <div>
          <div className="v2-nav-label" style={{ padding: "0 0 4px" }}>
            {modele.criteres.length} critères
          </div>
          {modele.criteres.map((critere) => (
            <Critere critere={critere} key={critere.libelle} />
          ))}
        </div>
        {/* §4 du handoff : le texte AU-DESSUS des deux boutons. */}
        <div className="v2-biblio-pied">
          <span>Déjà utilisé dans {modele.cohortes} de vos cohortes</span>
          <div>
            <span className="v2-btn" data-variant="secondary" style={{ flex: 1 }}>
              Dupliquer
            </span>
            <a
              className="v2-btn"
              href={`${ROUTES.challengeNouveau(cohorteId)}?modele=${modele.id}`}
              style={{ flex: 1.4 }}
            >
              Utiliser ce modèle
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Écran 16 — les modèles privés de l'organisation. Pas de partage au MVP. */
function Miens() {
  return (
    <div className="v2-modeles">
      {MES_MODELES.map((modele) => (
        <article className="v2-card v2-modele" key={modele.titre}>
          <div>
            <span className="v2-tag">Modèle privé</span>
          </div>
          <h3>{modele.titre}</h3>
          <small>
            {modele.criteres} critères · {modele.cohortes} · {modele.modifie}
          </small>
          <footer>
            <span className="v2-btn">Utiliser</span>
            <span className="v2-btn" data-variant="secondary">
              Modifier
            </span>
            <span className="v2-btn" data-variant="secondary">
              Dupliquer
            </span>
            <span className="v2-btn" data-variant="text-grey">
              Archiver
            </span>
          </footer>
        </article>
      ))}
      <div className="v2-card v2-modele-vide">
        <p>
          Enregistrez n’importe quel Challenge comme modèle pour le retrouver
          ici.
        </p>
      </div>
    </div>
  );
}

export default async function BibliothequePage({
  params,
  searchParams,
}: {
  params: Promise<{ cohorteId: string }>;
  searchParams: Promise<{ onglet?: string }>;
}) {
  const [{ cohorteId }, { onglet }] = await Promise.all([params, searchParams]);
  const miens = onglet === "miens";

  return (
    <>
      <div className="v2-prog-head">
        <div>
          <h1>Bibliothèque de Challenges</h1>
          <p>
            {miens
              ? `Les Challenges enregistrés par ${PROGRAMME.nom}, réutilisables de cohorte en cohorte.`
              : "Partez d’un modèle Sanza ou utilisez ceux enregistrés par votre organisation."}
          </p>
        </div>
        <span className="v2-spacer" />
        <nav>
          <a
            className="v2-btn"
            data-variant="secondary"
            href={ROUTES.challengeNouveau(cohorteId)}
          >
            Créer de zéro
          </a>
        </nav>
      </div>
      <Onglets cohorteId={cohorteId} courant={miens ? "miens" : "sanza"} />
      {miens ? <Miens /> : <Sanza cohorteId={cohorteId} />}
    </>
  );
}
