import { notFound } from "next/navigation";

import { initiales } from "@/features/v2/domain/questions";
import { lireVitrine } from "@/features/v2/server/vitrine";

const TONS = ["orange", "blue", "green", "amber", "neutral"] as const;
function ton(nom: string): (typeof TONS)[number] {
  let somme = 0;
  for (const c of nom) somme = (somme + c.charCodeAt(0)) % 997;
  return TONS[somme % TONS.length]!;
}

const COMPACT = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 1,
  notation: "compact",
});

/**
 * Écrans 32 et 33 — la fiche d'une entreprise, et la demande d'accès.
 *
 * AUCUN DOCUMENT N'Y EST ACCESSIBLE, et ce n'est pas une discipline
 * d'affichage : `dealroom_public` n'expose ni nom de pièce ni identifiant de
 * document. La page ne pourrait pas en montrer même par erreur.
 *
 * C'EST ICI QUE LE NDA SURVIT. L'arbitrage du 6 août l'a supprimé de l'ENTRÉE
 * de la Dealroom — pas de compte, donc pas de signataire, donc rien
 * d'opposable. Mais demander l'accès à une data room, c'est demander des
 * PIÈCES : il y a alors quelqu'un à identifier et un engagement à faire
 * signer. Une Dealroom montre des fiches, une data room contient des pièces ;
 * la première s'ouvre, la seconde se demande.
 */
export default async function FichePage({
  params,
  searchParams,
}: {
  params: Promise<{ entreprise: string; token: string }>;
  searchParams: Promise<{ demande?: string }>;
}) {
  const [{ entreprise, token }, { demande }] = await Promise.all([
    params,
    searchParams,
  ]);

  const vitrine = await lireVitrine(token);
  if (!vitrine) notFound();

  const nom = decodeURIComponent(entreprise);
  const fiche = vitrine.entreprises.find((e) => e.nom === nom);
  // Une entreprise qui a retiré son accord disparaît de `dealroom_public` :
  // sa fiche devient introuvable dans la seconde, sans que le programme ait
  // à republier.
  if (!fiche) notFound();

  const base = `/v2/d/${token}`;
  const ici = `${base}/${encodeURIComponent(fiche.nom)}`;
  const montant =
    fiche.montant !== null && fiche.montant > 0
      ? `${COMPACT.format(fiche.montant)} ${fiche.devise ?? ""}`.trim()
      : null;

  const paires = [
    ["Secteur", fiche.secteur],
    ["Pays", fiche.pays],
    ["Stade", fiche.stade],
    ["Montant recherché", montant],
  ].filter(([, v]) => Boolean(v)) as [string, string][];

  return (
    <div className="v2-fiche-detail">
      <a href={base}>← Toutes les entreprises</a>

      <div className="v2-card" style={{ padding: "24px 28px" }}>
        <div className="v2-fiche-entete">
          <span className="v2-pastille v2-pastille-xl" data-ton={ton(fiche.nom)}>
            {initiales(fiche.nom)}
          </span>
          <div>
            <h1>{fiche.nom}</h1>
            <div>
              {[fiche.secteur, fiche.pays].filter(Boolean).join(" · ") || "—"}
            </div>
          </div>
          <a className="v2-btn v2-accent" href={`${ici}?demande=1`}>
            Demander l’accès à la data room
          </a>
        </div>

        {/* SEULEMENT CE QUI EST RENSEIGNÉ. Une ligne « Stade — » ne dit pas
            que l'information manque : elle dit que l'entreprise n'a pas de
            stade, ce qui est faux. */}
        {paires.length > 0 && (
          <div className="v2-fiche-kvs">
            {paires.map(([k, v]) => (
              <div className="v2-kv" key={k}>
                <span className="v2-k">{k}</span>
                <span className="v2-v">{v}</span>
              </div>
            ))}
          </div>
        )}

        <p className="v2-dr-note" style={{ marginTop: 18 }}>
          Cette fiche présente ce que {fiche.nom} a accepté de publier. Les
          documents restent dans son espace : l’accès se demande, et elle
          décide.
        </p>
      </div>

      {demande === "1" && (
        <>
          <a
            aria-label="Fermer"
            className="v2-scrim-panneau"
            href={ici}
          />
          <aside className="v2-panneau">
            <div className="v2-panneau-head">
              <div style={{ flex: 1 }}>
                <h2>Demander l’accès à la data room</h2>
                <small>{fiche.nom}</small>
              </div>
            </div>
            <div className="v2-panneau-body">
              {/* L'ÉCRAN NE PROMET RIEN QU'IL NE TIENNE. La demande d'accès
                  n'est pas encore branchée : le dire vaut mieux qu'un
                  formulaire qui n'envoie rien. */}
              <p>
                La demande d’accès n’est pas encore ouverte sur cette Dealroom.
                {vitrine.contact
                  ? " En attendant, écrivez directement au programme."
                  : ""}
              </p>
              {vitrine.contact && (
                <a className="v2-btn v2-accent" href={`mailto:${vitrine.contact}`}>
                  Écrire au programme
                </a>
              )}
            </div>
            <div className="v2-panneau-foot">
              <a className="v2-btn" data-variant="secondary" href={ici}>
                Fermer
              </a>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
