import {
  fiche as chercherFiche,
  FICHE_DETAIL,
  INVESTISSEUR,
  PROGRAMME,
} from "@/features/v2/fixtures/programme";
import { BarreEtats } from "@/features/v2/ui/BarreEtats";

/** Écran 33 — la demande d'accès. Elle passe par le programme, pas autour. */
function Demande({ nom, retour }: { nom: string; retour: string }) {
  return (
    <div className="v2-scrim">
      <div className="v2-modale" style={{ width: 520 }}>
        <header>
          <h2>Demander l’accès à la data room de {nom}</h2>
        </header>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            padding: "18px 26px",
          }}
        >
          <div className="v2-duo">
            <label className="v2-field">
              <span>Votre organisation</span>
              <div className="v2-control" style={{ height: 44 }}>
                <span>{INVESTISSEUR.organisation}</span>
              </div>
            </label>
            <label className="v2-field">
              <span>Instrument</span>
              <div className="v2-control" style={{ height: 44 }}>
                <select defaultValue="Equity">
                  <option>Equity</option>
                </select>
              </div>
            </label>
          </div>
          <label className="v2-field">
            <span>Objet de votre intérêt</span>
            <div className="v2-control" style={{ height: 44 }}>
              <span style={{ color: "var(--text-4)" }}>
                Participation au tour Seed…
              </span>
            </div>
          </label>
          <label className="v2-field">
            <span>
              Message à l’entreprise <small>· optionnel</small>
            </span>
            <div
              className="v2-control"
              style={{ alignItems: "flex-start", height: 76, paddingTop: 12 }}
            >
              <span style={{ color: "var(--text-4)" }}>
                Présentez votre thèse et votre horizon…
              </span>
            </div>
          </label>
          {/* LA DÉCISION N'APPARTIENT PAS AU PROGRAMME. Il examine, il
              transmet ; c'est l'entreprise qui ouvre ou non sa data room. */}
          <p className="v2-panneau-note">
            {PROGRAMME.nom} examinera votre demande avant transmission. La
            décision finale appartient à {nom}, sauf mandat explicitement
            accordé au programme.
          </p>
        </div>
        <footer>
          <a className="v2-btn" data-variant="secondary" href={retour}>
            Annuler
          </a>
          <span className="v2-btn v2-accent">Envoyer la demande</span>
        </footer>
      </div>
    </div>
  );
}

/** Écran 32 — la fiche d'une entreprise. Aucun document n'y est accessible. */
export default async function FichePage({
  params,
  searchParams,
}: {
  params: Promise<{ dealroomId: string; entreprise: string }>;
  searchParams: Promise<{ demande?: string }>;
}) {
  const [{ dealroomId, entreprise }, { demande }] = await Promise.all([
    params,
    searchParams,
  ]);
  const fiche = chercherFiche(entreprise);
  const base = `/v2/d/${dealroomId}`;
  const ici = `${base}/${entreprise}`;

  return (
    <div className="v2-fiche-detail">
      <a href={`${base}?filtres=1`}>← Toutes les entreprises</a>

      <div className="v2-card" style={{ padding: "24px 28px" }}>
        <div className="v2-fiche-entete">
          <span className="v2-pastille v2-pastille-xl" data-ton={fiche.ton}>
            {fiche.initiales}
          </span>
          <div>
            <h1>{fiche.nom}</h1>
            <div>
              {fiche.secteur} · {fiche.pays}
            </div>
          </div>
          <a className="v2-btn v2-accent" href={`${ici}?demande=1`}>
            Demander l’accès à la data room
          </a>
        </div>

        <div className="v2-fiche-kvs">
          {[
            ["Stade", fiche.stade],
            ["Instrument", fiche.instrument],
            ["Montant recherché", fiche.montant],
            ["Cohorte", FICHE_DETAIL.cohorte],
          ].map(([k, v]) => (
            <div className="v2-kv" key={k}>
              <span className="v2-k">{k}</span>
              <span className="v2-v">{v}</span>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div>
            <div className="v2-nav-label" style={{ padding: "0 0 6px" }}>
              À propos
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.6, margin: 0 }}>
              {FICHE_DETAIL.aPropos}
            </p>
          </div>
          <div>
            <div className="v2-nav-label" style={{ padding: "0 0 6px" }}>
              Chiffres clés
            </div>
            <div style={{ display: "flex", gap: 24 }}>
              {FICHE_DETAIL.chiffres.map((chiffre) => (
                <div className="v2-kv" key={chiffre.k}>
                  <span className="v2-k">{chiffre.k}</span>
                  <span className="v2-v">{chiffre.v}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="v2-nav-label" style={{ padding: "0 0 6px" }}>
              Équipe
            </div>
            <div className="v2-fiche-equipe">
              {FICHE_DETAIL.equipe.map((membre) => (
                <span key={membre.nom}>
                  <span className="v2-pastille" data-ton="neutral">
                    {membre.initiales}
                  </span>
                  {membre.nom} · {membre.role}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* La promesse qui tient tout le parcours : rien de ce qui est ici n'est
          un document, et l'investisseur doit le savoir avant de demander. */}
      <p className="v2-dr-note" style={{ margin: 0 }}>
        Cette fiche présente uniquement les informations que l’entreprise a
        accepté de publier. Aucun document n’est accessible dans la Dealroom.
      </p>

      <BarreEtats
        etats={[
          { href: base, label: "30 · accueil" },
          { href: `${base}?filtres=1`, label: "31 · recherche et filtres" },
          { actif: !demande, href: ici, label: "32 · fiche entreprise" },
          { actif: Boolean(demande), href: `${ici}?demande=1`, label: "33 · demande d’accès" },
        ]}
      />

      {demande && <Demande nom={fiche.nom} retour={ici} />}
    </div>
  );
}
