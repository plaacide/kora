import { v2Routes } from "@/features/v2/navigation/routes";
import {
  type CritereModele,
  criteresModele,
  lireBibliotheque,
  type ModeleLu,
} from "@/features/v2/server/challenges";
import { Icon } from "@/features/v2/ui/Icon";

const ROUTES = v2Routes.programme.cohortes;

function Onglets({
  cohorteId,
  courant,
  miens,
  sanza,
}: {
  cohorteId: string;
  courant: "sanza" | "miens";
  miens: number;
  sanza: number;
}) {
  const base = ROUTES.bibliotheque(cohorteId);
  return (
    <div className="v2-onglets">
      <a data-active={courant === "sanza"} href={base}>
        Sanza · {sanza}
      </a>
      <a data-active={courant === "miens"} href={`${base}?onglet=miens`}>
        Mes modèles · {miens}
      </a>
    </div>
  );
}

function Critere({ critere }: { critere: CritereModele }) {
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
        {critere.requis ? "Obligatoire" : "Optionnel"}
      </span>
      {/* L'écran 12 le promet, et `create_challenge` l'applique : un critère
          structurel d'un modèle Sanza ne peut pas être retiré. Le dire ICI
          évite de le découvrir au moment où la création échoue. */}
      {critere.structurel && <span className="v2-tag">Structurel</span>}
    </div>
  );
}

/** Écran 10 — trois volets : catégories, liste, aperçu complet du modèle. */
function Sanza({
  choisi,
  cohorteId,
  criteres,
  modeles,
}: {
  choisi: ModeleLu | undefined;
  cohorteId: string;
  criteres: readonly CritereModele[];
  modeles: readonly ModeleLu[];
}) {
  const base = ROUTES.bibliotheque(cohorteId);

  // Les catégories sont DÉRIVÉES des modèles présents, jamais écrites en dur.
  // La maquette en affiche neuf totalisant quatorze modèles ; le contenu de
  // treize d'entre eux n'existe nulle part. Un compteur figé aurait promis
  // une bibliothèque que la base ne porte pas.
  const categories = new Map<string, number>();
  for (const m of modeles) {
    const nom = m.categorie ?? "Sans catégorie";
    categories.set(nom, (categories.get(nom) ?? 0) + 1);
  }

  if (!choisi) {
    return (
      <section className="v2-card v2-prog-empty">
        <h2>La bibliothèque Sanza est vide</h2>
        <p>
          Aucun modèle n’est encore publié. Vous pouvez créer un Challenge de
          zéro, et l’enregistrer comme modèle pour le réutiliser.
        </p>
        <div>
          <a className="v2-btn" href={ROUTES.challengeNouveau(cohorteId)}>
            Créer de zéro
          </a>
        </div>
      </section>
    );
  }

  return (
    <div className="v2-biblio">
      <div className="v2-biblio-cats">
        <div className="v2-search">
          <Icon name="search" />
          Rechercher
        </div>
        <a data-active={true}>
          Tous<span>{modeles.length}</span>
        </a>
        {[...categories].map(([nom, nombre]) => (
          <a key={nom}>
            {nom}
            <span>{nombre}</span>
          </a>
        ))}
      </div>

      <div className="v2-card v2-biblio-liste">
        {modeles.map((item) => (
          <a
            data-active={item.id === choisi.id}
            href={`${base}?modele=${item.id}`}
            key={item.id}
          >
            <b>{item.titre}</b>
            <small>
              {item.criteres} critère{item.criteres > 1 ? "s" : ""}
              {item.duree && ` · ${item.duree}`}
            </small>
          </a>
        ))}
      </div>

      <div className="v2-card v2-biblio-detail">
        <header>
          {choisi.categorie && <span className="v2-tag">{choisi.categorie}</span>}
          {choisi.sanza && (
            <span className="v2-marque-sanza">
              <i>S</i>Modèle Sanza
            </span>
          )}
          <span className="v2-spacer" />
          {choisi.duree && <small>Durée recommandée · {choisi.duree}</small>}
        </header>
        <h2>{choisi.titre}</h2>
        {choisi.description && <p>{choisi.description}</p>}
        <div>
          <div className="v2-nav-label" style={{ padding: "0 0 4px" }}>
            {criteres.length} critère{criteres.length > 1 ? "s" : ""}
          </div>
          {criteres.map((critere) => (
            <Critere critere={critere} key={critere.libelle} />
          ))}
        </div>
        {/* §4 du handoff : le texte AU-DESSUS des deux boutons. */}
        <div className="v2-biblio-pied">
          <span>
            {choisi.utilisations === 0
              ? "Jamais utilisé dans vos cohortes"
              : `Déjà utilisé dans ${choisi.utilisations} de vos cohortes`}
          </span>
          <div>
            <a
              className="v2-btn"
              href={`${ROUTES.challengeNouveau(cohorteId)}?modele=${choisi.id}`}
              style={{ flex: 1 }}
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
function Miens({
  cohorteId,
  modeles,
}: {
  cohorteId: string;
  modeles: readonly ModeleLu[];
}) {
  return (
    <div className="v2-modeles">
      {modeles.map((modele) => (
        <article className="v2-card v2-modele" key={modele.id}>
          <div>
            <span className="v2-tag">Modèle privé</span>
          </div>
          <h3>{modele.titre}</h3>
          <small>
            {modele.criteres} critère{modele.criteres > 1 ? "s" : ""}
            {modele.utilisations > 0 &&
              ` · ${modele.utilisations} cohorte${modele.utilisations > 1 ? "s" : ""}`}
          </small>
          <footer>
            <a
              className="v2-btn"
              href={`${ROUTES.challengeNouveau(cohorteId)}?modele=${modele.id}`}
            >
              Utiliser
            </a>
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
  searchParams: Promise<{ modele?: string; onglet?: string }>;
}) {
  const [{ cohorteId }, { modele, onglet }] = await Promise.all([
    params,
    searchParams,
  ]);
  const surMiens = onglet === "miens";

  const tous = await lireBibliotheque();
  const sanza = tous.filter((m) => m.sanza);
  const miens = tous.filter((m) => !m.sanza);

  // Le modèle demandé, ou le premier de l'onglet. Un identifiant inconnu
  // retombe sur le premier plutôt que d'ouvrir un écran vide.
  const liste = surMiens ? miens : sanza;
  const choisi = liste.find((m) => m.id === modele) ?? liste[0];
  const criteres = choisi ? await criteresModele(choisi.id) : [];

  return (
    <>
      <div className="v2-prog-head">
        <div>
          <h1>Bibliothèque de Challenges</h1>
          <p>
            {surMiens
              ? "Les Challenges enregistrés par votre organisation, réutilisables de cohorte en cohorte."
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
      <Onglets
        cohorteId={cohorteId}
        courant={surMiens ? "miens" : "sanza"}
        miens={miens.length}
        sanza={sanza.length}
      />
      {surMiens ? (
        <Miens cohorteId={cohorteId} modeles={miens} />
      ) : (
        <Sanza
          choisi={choisi}
          cohorteId={cohorteId}
          criteres={criteres}
          modeles={sanza}
        />
      )}
    </>
  );
}
