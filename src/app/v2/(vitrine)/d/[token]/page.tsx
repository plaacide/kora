import { notFound } from "next/navigation";

import { initiales } from "@/features/v2/domain/questions";
import { type FicheVitrine, lireVitrine } from "@/features/v2/server/vitrine";
import { Icon } from "@/features/v2/ui/Icon";

const TONS = ["orange", "blue", "green", "amber", "neutral"] as const;
function ton(nom: string): (typeof TONS)[number] {
  let somme = 0;
  for (const c of nom) somme = (somme + c.charCodeAt(0)) % 997;
  return TONS[somme % TONS.length]!;
}

/** « 500000 EUR » → « 500 k EUR ». Sans devise, rien : on n'en invente pas. */
const COMPACT = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 1,
  notation: "compact",
});

function montant(fiche: FicheVitrine): string | null {
  if (fiche.montant === null || fiche.montant <= 0) return null;
  return `${COMPACT.format(fiche.montant)} ${fiche.devise ?? ""}`.trim();
}

/**
 * Écrans 30 et 31 — l'accueil brandé et la recherche.
 *
 * UNE DEALROOM MONTRE DES FICHES, jamais des pièces. Aucun nom de document,
 * aucun lien de téléchargement : `dealroom_public` n'en rend pas, et la page
 * ne peut donc pas en afficher même par erreur. L'accès aux pièces se demande
 * séparément, et c'est là que le NDA reste.
 */
export default async function VitrinePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ q?: string; secteur?: string }>;
}) {
  const [{ token }, { q, secteur }] = await Promise.all([params, searchParams]);
  const vitrine = await lireVitrine(token);
  if (!vitrine) notFound();

  const base = `/v2/d/${token}`;
  const recherche = (q ?? "").trim().toLowerCase();

  // Les filtres portent sur ce qui est RÉELLEMENT rendu. La maquette en
  // dessine cinq — secteur, pays, stade, instrument, cohorte — mais le canal
  // public n'expose ni instrument ni cohorte : les proposer donnerait des
  // listes vides et laisserait croire à un défaut.
  const secteurs = [
    ...new Set(vitrine.entreprises.map((e) => e.secteur).filter(Boolean)),
  ] as string[];

  const cartes = vitrine.entreprises.filter(
    (e) =>
      (!recherche || e.nom.toLowerCase().includes(recherche)) &&
      (!secteur || e.secteur === secteur),
  );

  return (
    <>
      <div className="v2-vitrine-hero">
        {vitrine.banniere ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt="" className="v2-vitrine-banniere-img" src={vitrine.banniere} />
        ) : (
          <div className="v2-vitrine-banniere">
            <Icon name="file" />
            {vitrine.titre}
          </div>
        )}
        <div className="v2-vitrine-titre">
          <h1>{vitrine.titre}</h1>
          {vitrine.sousTitre && <p>{vitrine.sousTitre}</p>}
          {vitrine.description && <p>{vitrine.description}</p>}
          {vitrine.partenaires.length > 0 && (
            <div className="v2-vitrine-actions">
              <span className="v2-vitrine-sponsors">
                Programme soutenu par
                {vitrine.partenaires.map((partenaire) => (
                  <span className="v2-tag" key={partenaire}>
                    {partenaire}
                  </span>
                ))}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="v2-vitrine-corps">
        {/* Un formulaire en GET : la recherche vit dans l'URL, donc elle se
            partage et se recharge. Aucun JavaScript n'est nécessaire. */}
        <form className="v2-filtres" method="get">
          <label className="v2-field" style={{ flex: 1, minWidth: 220 }}>
            <span>Rechercher</span>
            <div className="v2-control">
              <Icon name="search" />
              <input
                defaultValue={q ?? ""}
                name="q"
                placeholder="Nom d’entreprise…"
              />
            </div>
          </label>
          {secteurs.length > 1 && (
            <label className="v2-field">
              <span>Secteur</span>
              <div className="v2-control">
                <select defaultValue={secteur ?? ""} name="secteur">
                  <option value="">Tous</option>
                  {secteurs.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
            </label>
          )}
          <button className="v2-btn" type="submit">
            Filtrer
          </button>
        </form>

        <div className="v2-filtres-compte">
          <b>
            {cartes.length} entreprise{cartes.length > 1 ? "s" : ""}
            {(recherche || secteur) && " correspondent"}
          </b>
          <span className="v2-spacer" />
          {(recherche || secteur) && (
            <a className="v2-lien-action" href={base}>
              Réinitialiser
            </a>
          )}
        </div>

        {cartes.length === 0 ? (
          <p className="v2-dr-note">
            {vitrine.entreprises.length === 0
              ? "Aucune entreprise n’est publiée dans cette sélection pour l’instant."
              : "Aucune entreprise ne correspond à cette recherche."}
          </p>
        ) : (
          <div className="v2-vitrine-grille">
            {cartes.map((fiche) => {
              const cherche = montant(fiche);
              return (
                <article className="v2-card v2-fiche" key={fiche.nom}>
                  <header>
                    <span className="v2-pastille" data-ton={ton(fiche.nom)}>
                      {initiales(fiche.nom)}
                    </span>
                    <div>
                      <b>{fiche.nom}</b>
                      <div>
                        {[fiche.secteur, fiche.pays].filter(Boolean).join(" · ") ||
                          "—"}
                      </div>
                    </div>
                  </header>
                  {fiche.stade && (
                    <div style={{ display: "flex", gap: 6 }}>
                      <span className="v2-tag">{fiche.stade}</span>
                    </div>
                  )}
                  {/* LE MONTANT NE S'AFFICHE QUE S'IL EXISTE. Une ligne
                      « Recherche — » laisserait croire que l'entreprise ne
                      cherche rien, alors qu'elle n'a simplement pas encore
                      désigné l'opération qu'elle présente. */}
                  {cherche && (
                    <div className="v2-kv">
                      <span className="v2-k">Recherche</span>
                      <span className="v2-v">{cherche}</span>
                    </div>
                  )}
                  <a
                    className="v2-btn"
                    data-bloc="true"
                    data-variant="secondary"
                    href={`${base}/${encodeURIComponent(fiche.nom)}`}
                  >
                    Voir la fiche
                  </a>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
