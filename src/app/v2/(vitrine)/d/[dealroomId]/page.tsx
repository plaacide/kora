import {
  DEALROOM_NEUVE,
  FICHES,
  PROGRAMME,
} from "@/features/v2/fixtures/programme";
import { BarreEtats } from "@/features/v2/ui/BarreEtats";
import { Icon } from "@/features/v2/ui/Icon";

/** Écran 30 — l'accueil brandé. */
export default async function VitrinePage({
  params,
  searchParams,
}: {
  params: Promise<{ dealroomId: string }>;
  searchParams: Promise<{ filtres?: string }>;
}) {
  const [{ dealroomId }, { filtres }] = await Promise.all([
    params,
    searchParams,
  ]);
  const avecFiltres = filtres === "1";
  const cartes = avecFiltres
    ? FICHES.filter((f) => f.instrument === "Equity")
    : FICHES.slice(0, 6);
  const base = `/v2/d/${dealroomId}`;

  return (
    <>
      {!avecFiltres && (
        <div className="v2-vitrine-hero">
          <div className="v2-vitrine-banniere">
            <Icon name="file" />
            Bannière Demo Day 2026 · 1600 × 400
          </div>
          <div className="v2-vitrine-titre">
            <h1>{DEALROOM_NEUVE.titrePublic}</h1>
            <p>
              12 entreprises sélectionnées par {PROGRAMME.nom}, présentées avec
              les informations qu’elles ont accepté de publier.
            </p>
            <div className="v2-vitrine-actions">
              <a className="v2-btn v2-accent" href={`${base}?filtres=1`}>
                Explorer les entreprises
              </a>
              <span className="v2-vitrine-sponsors">
                Programme soutenu par
                {DEALROOM_NEUVE.partenaires.map((partenaire) => (
                  <span className="v2-tag" key={partenaire}>
                    {partenaire}
                  </span>
                ))}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="v2-vitrine-corps">
        {avecFiltres ? (
          <>
            <div className="v2-filtres">
              <label className="v2-field" style={{ flex: 1, minWidth: 220 }}>
                <span>Rechercher</span>
                <div className="v2-control">
                  <Icon name="search" />
                  <span style={{ color: "var(--text-4)" }}>
                    Nom d’entreprise…
                  </span>
                </div>
              </label>
              {[
                ["Secteur", "Tous"],
                ["Pays", "Tous"],
                ["Stade", "Tous"],
                ["Instrument", "Equity"],
                ["Cohorte", "Toutes"],
              ].map(([label, valeur]) => (
                <label className="v2-field" key={label}>
                  <span>{label}</span>
                  <div className="v2-control">
                    <select defaultValue={valeur}>
                      <option>{valeur}</option>
                    </select>
                  </div>
                </label>
              ))}
            </div>
            <div className="v2-filtres-compte">
              <b>{cartes.length + 2} entreprises correspondent</b>
              <span className="v2-spacer" />
              <a className="v2-lien-action" href={base}>
                Réinitialiser les filtres
              </a>
            </div>
          </>
        ) : (
          <div className="v2-nav-label" style={{ padding: "0 0 12px" }}>
            12 entreprises
          </div>
        )}

        <div className="v2-vitrine-grille">
          {cartes.map((fiche) => (
            <article className="v2-card v2-fiche" key={fiche.nom}>
              <header>
                <span className="v2-pastille" data-ton={fiche.ton}>
                  {fiche.initiales}
                </span>
                <div>
                  <b>{fiche.nom}</b>
                  <div>
                    {fiche.secteur} · {fiche.pays}
                  </div>
                </div>
              </header>
              {/* La ligne de pitch : sans elle, douze cartes ne se
                  distinguent que par leur secteur. */}
              <p>{fiche.pitch}</p>
              <div style={{ display: "flex", gap: 6 }}>
                <span className="v2-tag">{fiche.stade}</span>
                <span className="v2-tag">{fiche.instrument}</span>
              </div>
              <div className="v2-kv">
                <span className="v2-k">Recherche</span>
                <span className="v2-v">{fiche.montant}</span>
              </div>
              <a
                className="v2-btn"
                data-bloc="true"
                data-variant="secondary"
                href={`${base}/${fiche.initiales.toLowerCase()}`}
              >
                Voir la fiche
              </a>
            </article>
          ))}
        </div>

        <BarreEtats
          etats={[
            { actif: !avecFiltres, href: base, label: "30 · accueil" },
            { actif: avecFiltres, href: `${base}?filtres=1`, label: "31 · recherche et filtres" },
            { href: `${base}/cb`, label: "32 · fiche entreprise" },
            { href: `${base}/cb?demande=1`, label: "33 · demande d’accès" },
          ]}
        />
      </div>
    </>
  );
}
