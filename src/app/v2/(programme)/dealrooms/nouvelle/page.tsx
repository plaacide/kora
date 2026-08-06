import {
  CANDIDATES_DEALROOM,
  DEALROOM_NEUVE,
  PROGRAMME,
} from "@/features/v2/fixtures/programme";
import { v2Routes } from "@/features/v2/navigation/routes";
import { ApercuDealroom } from "@/features/v2/ui/ApercuDealroom";
import { BarreEtats } from "@/features/v2/ui/BarreEtats";
import { Icon } from "@/features/v2/ui/Icon";
import { Standalone } from "@/features/v2/ui/Shell";

const ROUTES = v2Routes.programme.dealrooms;

const ETAPES = ["Identité", "Branding", "Entreprises", "Audience"] as const;
type Etape = "identite" | "branding" | "entreprises" | "audience" | "apercu";
const ORDRE: Etape[] = ["identite", "branding", "entreprises", "audience"];

function lien(etape: Etape) {
  return `${ROUTES.nouvelle}?etape=${etape}`;
}

/** Le fil des quatre étapes. À l'aperçu, les quatre sont franchies. */
function Etapes({ courante }: { courante: Etape }) {
  const rang = ORDRE.indexOf(courante);
  return (
    <ol className="v2-steps" style={{ marginBottom: 20 }}>
      {ETAPES.map((label, index) => {
        const franchie = rang < 0 || index < rang;
        const active = index === rang;
        return (
          <li
            className={franchie ? "is-done" : active ? "is-current" : ""}
            key={label}
          >
            {index > 0 && <span aria-hidden="true" className="v2-step-line" />}
            <span aria-hidden="true" className="v2-step-number">
              {franchie ? "✓" : index + 1}
            </span>
            <span>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

function Aside({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <aside className="v2-card" style={{ padding: "16px 18px" }}>
      <div className="v2-nav-label" style={{ padding: "0 0 8px" }}>
        {titre}
      </div>
      <p style={{ color: "var(--text-2)", fontSize: 13, margin: 0 }}>
        {children}
      </p>
    </aside>
  );
}

function Reglage({
  titre,
  detail,
  actif,
  fin,
}: {
  titre: string;
  detail?: string;
  actif?: boolean;
  fin?: React.ReactNode;
}) {
  return (
    <div className="v2-reglage">
      <div>
        <b>{titre}</b>
        {detail && <small>{detail}</small>}
      </div>
      {fin ?? <span className="v2-inter" data-actif={actif} />}
    </div>
  );
}

/** Écran 20 — l'identité. */
function Identite() {
  return (
    <>
      <div className="v2-prog-head">
        <div>
          <h1>Créez votre Dealroom</h1>
        </div>
      </div>
      <div className="v2-dr-assistant">
        <div className="v2-card v2-dr-form">
          {[
            ["Nom interne", DEALROOM_NEUVE.nomInterne],
            ["Titre public", DEALROOM_NEUVE.titrePublic],
            ["Sous-titre", DEALROOM_NEUVE.sousTitre],
          ].map(([label, valeur]) => (
            <div className="v2-field" key={label}>
              <span>{label}</span>
              <div className="v2-control" style={{ height: 46 }}>
                <span>{valeur}</span>
              </div>
            </div>
          ))}
          <div className="v2-field">
            <span>
              Description <small>· optionnel</small>
            </span>
            <div
              className="v2-control"
              style={{ alignItems: "flex-start", height: 76, paddingTop: 14 }}
            >
              <span style={{ color: "var(--text-4)" }}>
                Présentez votre programme et l’événement en quelques lignes…
              </span>
            </div>
          </div>
          <div className="v2-field">
            <span>Contact</span>
            <div className="v2-control" style={{ height: 46 }}>
              <span>{DEALROOM_NEUVE.contact}</span>
            </div>
          </div>
          <Reglage
            actif
            detail="Logo et couleur repris par défaut — modifiables à l’étape suivante."
            titre={`Utiliser le branding de ${PROGRAMME.nom}`}
          />
          <div className="v2-dr-actions">
            <span className="v2-btn" data-variant="secondary">
              Enregistrer le brouillon
            </span>
            <a className="v2-btn" href={lien("branding")}>
              Continuer →
            </a>
          </div>
        </div>
        <Aside titre="Une Dealroom">
          Un espace privé, sur invitation, qui présente une sélection
          d’entreprises — d’une ou plusieurs cohortes — sans exposer leurs
          documents.
        </Aside>
      </div>
    </>
  );
}

/** Écran 21 — le branding, avec l'aperçu qui suit en temps réel. */
function Branding() {
  return (
    <>
      <div className="v2-prog-head">
        <div>
          <h1>Personnalisez l’identité de la Dealroom</h1>
        </div>
      </div>
      <div className="v2-dr-assistant" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="v2-card v2-dr-form">
          <div className="v2-field">
            <span>Logo</span>
            <div className="v2-onb-depot">
              <b>{PROGRAMME.initiales}</b>
              <span>PNG ou SVG · fond transparent recommandé</span>
              <span className="v2-btn" data-variant="secondary">
                Importer
              </span>
            </div>
          </div>
          <div className="v2-field">
            <span>Bannière</span>
            <div className="v2-onb-depot">
              <b>
                <Icon name="file" />
              </b>
              <span>1600 × 400 px minimum</span>
              <span className="v2-btn" data-variant="secondary">
                Importer
              </span>
            </div>
          </div>
          <Reglage
            fin={
              <span
                style={{
                  background: DEALROOM_NEUVE.accent,
                  borderRadius: "var(--r-md)",
                  height: 28,
                  width: 44,
                }}
              />
            }
            titre="Couleur d’accent"
            detail="Un contraste insuffisant sera corrigé automatiquement."
          />
          <Reglage
            fin={
              <span className="v2-chips">
                <span className="v2-tag" data-active>
                  Clair
                </span>
                <span className="v2-tag">Sombre</span>
              </span>
            }
            titre="Thème"
          />
          <div className="v2-field">
            <span>
              Logos partenaires <small>· {DEALROOM_NEUVE.partenaires.length}</small>
            </span>
            <div className="v2-chips">
              {DEALROOM_NEUVE.partenaires.map((partenaire) => (
                <span className="v2-tag" key={partenaire}>
                  {partenaire} ✕
                </span>
              ))}
              <span className="v2-tag">+ Ajouter</span>
            </div>
          </div>
          <Reglage
            actif
            detail="Inclus dans votre plan actuel"
            titre="Afficher «&nbsp;Powered by Sanza&nbsp;»"
          />
          <div className="v2-dr-actions" data-entre="true">
            <a className="v2-btn" data-variant="secondary" href={lien("identite")}>
              ← Retour
            </a>
            <a className="v2-btn" href={lien("entreprises")}>
              Continuer →
            </a>
          </div>
        </div>
        <div>
          <div className="v2-nav-label" style={{ padding: "0 0 8px" }}>
            Aperçu investisseur — temps réel
          </div>
          <ApercuDealroom />
          <p
            style={{
              color: "var(--text-3)",
              fontSize: 12.5,
              margin: "12px 2px 0",
            }}
          >
            La grille, la typographie et les composants restent ceux de Sanza.
            Le branding apporte l’identité, pas la structure.
          </p>
        </div>
      </div>
    </>
  );
}

const TON_CONSENTEMENT: Record<string, string | undefined> = {
  "Accord donné": "green",
  "En attente": "amber",
  "À demander": undefined,
  Refusé: "red",
};

/** Écran 22 — les entreprises, de plusieurs cohortes. */
function Entreprises() {
  const retenues = CANDIDATES_DEALROOM.filter((item) => item.retenue);
  const accords = retenues.filter(
    (item) => item.consentement === "Accord donné",
  ).length;

  return (
    <>
      <div className="v2-prog-head">
        <div>
          <h1>Choisissez les entreprises</h1>
          <p>
            Une entreprise sans accord peut préparer la Dealroom, mais ne sera
            pas publiée.
          </p>
        </div>
        <span className="v2-spacer" />
        <nav>
          <span className="v2-btn" data-variant="secondary">
            Demander l’accord aux entreprises sélectionnées
          </span>
        </nav>
      </div>

      <div className="v2-chips" style={{ marginBottom: 14 }}>
        <span className="v2-tag">Saison 4 · Agri &amp; Agro ✕</span>
        <span className="v2-tag">Fintech 2026 ✕</span>
        <span className="v2-tag">+ Cohorte</span>
      </div>

      <div className="v2-card" style={{ overflow: "hidden" }}>
        <table className="v2-tbl">
          <thead>
            <tr>
              <th aria-label="Sélection" />
              <th>Entreprise</th>
              <th>Cohorte</th>
              <th>Stade</th>
              <th>Préparation</th>
              <th>Consentement</th>
            </tr>
          </thead>
          <tbody>
            {CANDIDATES_DEALROOM.map((item) => (
              <tr data-retenue={item.retenue} key={item.nom}>
                <td style={{ width: 36 }}>
                  <span className="v2-case" data-cochee={item.retenue}>
                    {item.retenue && <Icon name="check" />}
                  </span>
                </td>
                <td>
                  <div className="v2-ident">
                    <span className="v2-pastille" data-ton={item.ton}>
                      {item.initiales}
                    </span>
                    <div>
                      <b>{item.nom}</b>
                      <div>
                        {item.secteur} · {item.pays}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="v2-dim">{item.cohorte}</td>
                <td className="v2-dim">{item.stade}</td>
                <td>{item.preparation} %</td>
                <td>
                  <span
                    className="v2-badge"
                    data-tone={TON_CONSENTEMENT[item.consentement]}
                  >
                    {item.consentement === "Refusé" && (
                      <span className="v2-dot" />
                    )}
                    {item.consentement}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="v2-prog-tbl-foot">
          <span>
            {retenues.length} sélectionnées · {accords} accords donnés ·{" "}
            {retenues.length - accords} en attente
          </span>
          <span>L’entreprise choisit elle-même l’opération présentée.</span>
        </div>
      </div>

      <div className="v2-dr-actions" data-entre="true" style={{ marginTop: 16 }}>
        <a className="v2-btn" data-variant="secondary" href={lien("branding")}>
          ← Retour
        </a>
        <a className="v2-btn" href={lien("audience")}>
          Continuer →
        </a>
      </div>
    </>
  );
}

/** Écran 23 — l'audience et la sécurité. Aucune option publique. */
function Audience() {
  return (
    <>
      <div className="v2-prog-head">
        <div>
          <h1>Qui pourra accéder à cette Dealroom&nbsp;?</h1>
        </div>
      </div>
      <div className="v2-dr-assistant">
        <div className="v2-card v2-dr-form">
          <label className="v2-radio" data-active>
            <i />
            <div>
              <b>Sur invitation uniquement</b>
              <small>
                Seule option disponible — cette Dealroom ne sera jamais publique
                ni indexée.
              </small>
            </div>
          </label>
          <Reglage
            actif
            detail="Le lien n’ouvre l’accès qu’à la personne invitée."
            titre="Invitation liée à l’adresse e-mail"
          />
          <Reglage
            detail="Un lien transféré n’ouvre pas l’accès."
            titre="Transfert du lien"
          />
          <Reglage
            fin={<span className="v2-tag">30 jours ▾</span>}
            titre="Expiration des invitations"
          />
          <Reglage
            detail="Demander une acceptation avant l’entrée."
            titre="NDA Dealroom"
          />
          <Reglage
            actif
            detail="Les investisseurs peuvent demander l’accès — chaque demande passe par vous, puis par l’entreprise."
            titre="Demandes d’accès aux data rooms"
          />
          <div className="v2-dr-actions" data-entre="true">
            <a
              className="v2-btn"
              data-variant="secondary"
              href={lien("entreprises")}
            >
              ← Retour
            </a>
            <a className="v2-btn" href={lien("apercu")}>
              Voir l’aperçu →
            </a>
          </div>
        </div>
        <Aside titre="Résumé">
          Cette Dealroom ne sera pas indexée. Seules les personnes invitées
          pourront y entrer. Aucun document d’entreprise n’y est publié.
        </Aside>
      </div>
    </>
  );
}

/** Écran 24 — l'aperçu avant publication. Exactement la vue investisseur. */
function Apercu() {
  const sansAccord = 2;

  return (
    <>
      <div className="v2-prog-head">
        <div>
          <h1>Aperçu — non publié</h1>
          <p>
            12 entreprises sélectionnées · 10 ont donné leur accord ·{" "}
            {sansAccord} attendent encore
          </p>
        </div>
        <span className="v2-spacer" />
        <nav>
          <a className="v2-btn" data-variant="secondary" href={lien("audience")}>
            Retour à l’édition
          </a>
          {/* PUBLIER RESTE FERMÉ tant que des accords manquent, et le bandeau
              dit pourquoi. Un bouton actif qui refuserait ensuite serait pire
              qu'un bouton éteint. */}
          <button className="v2-btn" disabled type="button">
            Publier
          </button>
        </nav>
      </div>

      <div className="v2-dr-blocage">
        <Icon name="clock" />
        <span>
          {sansAccord} entreprises n’ont pas encore donné leur accord. Retirez-les
          ou attendez leur réponse pour publier.
        </span>
      </div>

      <ApercuDealroom />
    </>
  );
}

const VUES: Record<Etape, () => React.ReactElement> = {
  identite: Identite,
  branding: Branding,
  entreprises: Entreprises,
  audience: Audience,
  apercu: Apercu,
};

export default async function NouvelleDealroomPage({
  searchParams,
}: {
  searchParams: Promise<{ etape?: string }>;
}) {
  const { etape } = await searchParams;
  const courante: Etape =
    etape && etape in VUES ? (etape as Etape) : "identite";
  const Vue = VUES[courante];

  return (
    /* L'assistant vit DANS la coque, pas à côté : sans elle, ni barre
       supérieure ni marges — la page collait au panneau de gauche. */
    <Standalone search={false} title="Nouvelle Dealroom">
      <Etapes courante={courante} />
      <Vue />
      <BarreEtats
        etats={[
          { actif: courante === "identite", href: lien("identite"), label: "20 · identité" },
          { actif: courante === "branding", href: lien("branding"), label: "21 · branding" },
          { actif: courante === "entreprises", href: lien("entreprises"), label: "22 · entreprises" },
          { actif: courante === "audience", href: lien("audience"), label: "23 · audience" },
          { actif: courante === "apercu", href: lien("apercu"), label: "24 · aperçu" },
        ]}
      />
    </Standalone>
  );
}
