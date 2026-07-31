"use client";

import Link from "next/link";

import { initials } from "@/features/v2/domain/activity";
import {
  niveau as niveauDe,
  type Engagement,
} from "@/features/v2/domain/engagements";
import { dateJournal, heure } from "@/features/v2/domain/journal";
import {
  categorieLabel,
  derniereInteraction,
  engagementLabel,
  engagementTon,
  etapeLabel,
  libelleInteraction,
  parDateDecroissante,
  type Interaction,
  type InvestisseurPipeline,
} from "@/features/v2/domain/pipeline";
import type { AccessRow } from "@/features/v2/server/access";
import type { SignauxDocumentaires } from "@/features/v2/server/fiche";

import { Icon } from "./Icon";

/**
 * Sept onglets dans 560 px.
 *
 * Les intitulés longs de la maquette — « Activité documentaire », « Notes
 * internes » — imposaient une barre de défilement horizontale, qui cache la
 * moitié des onglets derrière un geste que rien n'annonce. On abrège plutôt, et
 * la barre passe à la ligne s'il le faut : un onglet qu'on ne voit pas n'existe
 * pas.
 *
 * « Consultations » plutôt que « Documents » : le mot est déjà celui du produit
 * pour les signaux de lecture, et « Documents » se confondrait avec la data
 * room.
 */
const ONGLETS = [
  ["resume", "Résumé"],
  ["interactions", "Interactions"],
  ["documents", "Consultations"],
  ["acces", "Accès"],
  ["engagements", "Engagements"],
  ["questions", "Questions"],
  ["notes", "Notes"],
] as const;

function lien(extra: Record<string, string>): string {
  return `?${new URLSearchParams({ view: "pipeline", ...extra })}`;
}

/**
 * Écran 41 — la fiche d'une relation.
 *
 * Le panneau latéral sert à MODIFIER la relation ; cette fiche sert à la
 * COMPRENDRE. Les deux gestes n'appellent pas la même mise en page — l'un est
 * un formulaire, l'autre un dossier — et c'est pourquoi la maquette en fait un
 * écran plein plutôt qu'un onglet du panneau.
 */
export function InvestorFiche({
  acces,
  engagement,
  interactions,
  investisseur,
  onglet,
  signaux,
}: {
  /** L'invitation qui correspond à l'adresse, si elle existe. */
  acces: AccessRow | null;
  engagement: Engagement | null;
  interactions: readonly Interaction[];
  investisseur: InvestisseurPipeline;
  onglet: string;
  signaux: SignauxDocumentaires;
}) {
  const siennes = parDateDecroissante(interactions);
  const derniere = derniereInteraction(siennes);
  const actuel = ONGLETS.some(([cle]) => cle === onglet) ? onglet : "resume";

  return (
    <>
      {/* La maquette 41 pose la fiche en PANNEAU sur le pipeline grisé, pas en
          écran plein : on consulte une relation sans quitter la liste, et on
          revient d'un clic dans le vide. */}
      <Link aria-label="Fermer" className="v2-scrim" href={lien({})} />
      <aside className="v2-sidepanel v2-fiche-panel">
        <header className="v2-fiche-head">
          <span className="v2-fiche-avatar">
            {initials(investisseur.organisation ?? investisseur.nom)}
          </span>
          <div>
            <h2>{investisseur.organisation ?? investisseur.nom}</h2>
            <p>
              {[
                investisseur.nom,
                investisseur.fonction,
                investisseur.categorie
                  ? categorieLabel(investisseur.categorie)
                  : null,
                investisseur.pays,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <Link aria-label="Fermer" href={lien({})}>
            ×
          </Link>
        </header>

        <nav aria-label="Sections de la fiche" className="v2-fiche-tabs">
          {ONGLETS.map(([cle, label]) => (
            <Link
              data-active={actuel === cle}
              href={lien({ fiche: investisseur.id, onglet: cle })}
              key={cle}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="v2-sidepanel-body v2-fiche-body">

      {actuel === "resume" && (
        <Resume
          derniere={derniere}
          engagement={engagement}
          investisseur={investisseur}
          signaux={signaux}
        />
      )}

      {actuel === "interactions" && (
        <ListeInteractions
          interactions={siennes}
          investisseur={investisseur}
        />
      )}

      {actuel === "documents" && <ActiviteDocumentaire signaux={signaux} />}

      {actuel === "acces" && (
        <Acces acces={acces} investisseur={investisseur} />
      )}

      {actuel === "engagements" && (
        <Engagements engagement={engagement} investisseur={investisseur} />
      )}

      {actuel === "questions" && <Questions />}

      {actuel === "notes" && <Notes investisseur={investisseur} />}
        </div>

        <footer className="v2-sidepanel-footer">
          <Link href={lien({})}>Fermer</Link>
          <Link className="v2-btn" href={lien({ panel: investisseur.id })}>
            Modifier la relation
          </Link>
        </footer>
      </aside>
    </>
  );
}

function Ligne({
  children,
  libelle,
  precision,
}: {
  children: React.ReactNode;
  libelle: string;
  /**
   * Le qualificatif — « confirmé · 31-07 ». Sur sa propre ligne plutôt qu'entre
   * parenthèses : dans une colonne de 250 px, une parenthèse rejette le montant
   * à la ligne et on lit « 120 000 000 XOF (confirmé, » avant la suite.
   */
  precision?: string | null;
}) {
  return (
    <div>
      <span>{libelle}</span>
      <strong>{children}</strong>
      {precision && <small>{precision}</small>}
    </div>
  );
}

/** L'onglet Résumé — ce qu'on veut savoir sans cliquer. */
function Resume({
  derniere,
  engagement,
  investisseur,
  signaux,
}: {
  derniere: Interaction | null;
  engagement: Engagement | null;
  investisseur: InvestisseurPipeline;
  signaux: SignauxDocumentaires;
}) {
  return (
    <>
      <section className="v2-fiche-card">
        <div className="v2-fiche-kv">
          <Ligne libelle="Étape de relation">
            {etapeLabel(investisseur.etape)}
          </Ligne>
          <Ligne libelle="Accès documentaire">
            {investisseur.acces ?? "Non invité"}
          </Ligne>
          <Ligne libelle="Engagement">
            <span
              className="v2-status"
              data-tone={engagementTon(investisseur.engagement)}
            >
              <i className="v2-dot" />
              {engagementLabel(investisseur.engagement)}
            </span>
          </Ligne>
          <Ligne
            libelle="Montant déclaré"
            precision={
              engagement
                ? `${niveauDe(engagement.niveau).court.toLowerCase()} · ${dateJournal(engagement.date)}`
                : null
            }
          >
            {engagement
              ? `${engagement.montant.toLocaleString("fr-FR")} ${engagement.devise ?? ""}`
              : "—"}
          </Ligne>
          <Ligne libelle="Responsable interne">
            {investisseur.responsable ?? "—"}
          </Ligne>
          <Ligne
            libelle="Dernière interaction"
            precision={
              derniere
                ? `${libelleInteraction(derniere.type)} · ${dateJournal(derniere.date)}`
                : null
            }
          >
            {derniere
              ? derniere.resultat || libelleInteraction(derniere.type)
              : "aucune"}
          </Ligne>
          <Ligne
            libelle="Prochaine action"
            precision={
              investisseur.dateRelance
                ? `relance le ${dateJournal(investisseur.dateRelance)}`
                : null
            }
          >
            {investisseur.prochaineAction ?? "—"}
          </Ligne>
          <Ligne libelle="Ticket indicatif">
            {investisseur.ticket
              ? investisseur.ticket.toLocaleString("fr-FR")
              : "—"}
          </Ligne>
        </div>
      </section>

      <SignauxCard signaux={signaux} />

      {investisseur.notes && (
        <section className="v2-fiche-card">
          <div className="v2-nav-label">Notes essentielles</div>
          <p className="v2-fiche-notes">{investisseur.notes}</p>
        </section>
      )}

      <div className="v2-fiche-actions">
        <Link
          className="v2-btn"
          href={lien({ panel: "interaction", investisseur: investisseur.id })}
        >
          <Icon name="plus" />
          Ajouter une interaction
        </Link>
        <Link
          className="v2-btn"
          data-variant="secondary"
          href="?view=commitments&panel=commitment"
        >
          Enregistrer un engagement
        </Link>
        {investisseur.email && (
          <Link
            className="v2-btn"
            data-variant="secondary"
            href={`../access?share=1&email=${encodeURIComponent(investisseur.email)}`}
          >
            Créer un accès documentaire
          </Link>
        )}
      </div>
    </>
  );
}

/**
 * Les signaux documentaires.
 *
 * La phrase sous les chiffres n'est pas une précaution de style : trois
 * visites ne sont pas trois quarts d'un investissement, et un écran qui laisse
 * croire le contraire fait prendre de mauvaises décisions.
 */
function SignauxCard({ signaux }: { signaux: SignauxDocumentaires }) {
  return (
    <section className="v2-fiche-card">
      <div className="v2-nav-label">Signaux documentaires</div>
      <div className="v2-fiche-signals">
        <div>
          <span>Visites</span>
          <strong>{signaux.visites}</strong>
        </div>
        <div>
          <span>Pièces lues</span>
          <strong>
            {signaux.piecesConsultees}
            {signaux.piecesTotales > 0 && ` / ${signaux.piecesTotales}`}
          </strong>
        </div>
        <div>
          <span>Pages vues</span>
          <strong>{signaux.pagesVues}</strong>
        </div>
        <div>
          <span>Dernière</span>
          <strong>
            {signaux.derniereVisite ? dateJournal(signaux.derniereVisite) : "—"}
          </strong>
        </div>
      </div>
      <p className="v2-roles-note">
        <Icon name="eye" />
        Des signaux d’engagement — jamais une probabilité d’investissement. Une
        visite est une série de pages consultées à moins de trente minutes
        d’intervalle ; le temps de lecture n’est pas mesuré.
      </p>
    </section>
  );
}

function ListeInteractions({
  interactions,
  investisseur,
}: {
  interactions: readonly Interaction[];
  investisseur: InvestisseurPipeline;
}) {
  return (
    <section className="v2-fiche-card">
      <div className="v2-fiche-card-head">
        <span className="v2-nav-label">
          {interactions.length} interaction{interactions.length > 1 ? "s" : ""}
        </span>
        <Link
          className="v2-btn-mini"
          href={lien({ panel: "interaction", investisseur: investisseur.id })}
        >
          <Icon name="plus" />
          Consigner
        </Link>
      </div>

      {interactions.length === 0 ? (
        <p className="v2-field-helper">
          Rien de consigné. Un appel, un e-mail, une réunion — ce que vous
          écrivez ici est ce dont vous vous souviendrez.
        </p>
      ) : (
        <ol className="v2-interactions-full">
          {interactions.map((i) => (
            <li key={i.id}>
              <span className="v2-interaction-type">
                {libelleInteraction(i.type)}
              </span>
              <div>
                <strong>{i.resultat || libelleInteraction(i.type)}</strong>
                <small>
                  {dateJournal(i.date)}
                  {i.responsable ? ` · par ${i.responsable}` : ""}
                  {i.participants ? ` · avec ${i.participants}` : ""}
                </small>
                {i.resume && <p>{i.resume}</p>}
                {i.prochaineAction && (
                  <small className="v2-interaction-next">
                    <Icon name="clock" />
                    {i.prochaineAction}
                    {i.dateRelance ? ` — ${dateJournal(i.dateRelance)}` : ""}
                  </small>
                )}
              </div>
              <Link
                href={lien({
                  panel: "interaction",
                  investisseur: investisseur.id,
                  interaction: i.id,
                })}
              >
                Modifier
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function ActiviteDocumentaire({ signaux }: { signaux: SignauxDocumentaires }) {
  return (
    <>
      <SignauxCard signaux={signaux} />

      <section className="v2-fiche-card">
        <div className="v2-nav-label">Pièces consultées</div>
        {signaux.pieces.length === 0 ? (
          <p className="v2-field-helper">
            Aucune consultation. Soit l’accès n’a pas encore été ouvert, soit il
            n’a pas encore été utilisé — les deux se lisent dans l’onglet Accès.
          </p>
        ) : (
          <ol className="v2-fiche-docs">
            {signaux.pieces.map((p) => (
              <li key={p.documentId}>
                <Icon name="file" />
                <div>
                  <strong>{p.nom}</strong>
                  <small>
                    {p.pages} page{p.pages > 1 ? "s" : ""} · dernière lecture le{" "}
                    {dateJournal(p.derniere)} à {heure(p.derniere)}
                  </small>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </>
  );
}

function Acces({
  acces,
  investisseur,
}: {
  acces: AccessRow | null;
  investisseur: InvestisseurPipeline;
}) {
  if (!investisseur.email) {
    return (
      <section className="v2-fiche-card">
        <p className="v2-panel-note">
          <Icon name="shield" />
          Aucune adresse n’est renseignée sur cette relation : elle ne peut donc
          pas recevoir d’accès. Ajoutez-la depuis « Modifier la relation ».
        </p>
      </section>
    );
  }

  if (!acces) {
    return (
      <section className="v2-fiche-card">
        <p className="v2-field-helper">
          Aucun accès documentaire n’a été ouvert à {investisseur.email}.
          Figurer au pipeline ne donne jamais accès à la data room — les deux
          gestes sont volontairement séparés.
        </p>
        <div className="v2-fiche-actions">
          <Link
            className="v2-btn"
            href={`../access?share=1&email=${encodeURIComponent(investisseur.email)}`}
          >
            Créer un accès documentaire
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="v2-fiche-card">
      <div className="v2-fiche-kv">
        <Ligne libelle="Adresse">{acces.email}</Ligne>
        <Ligne libelle="État">{investisseur.acces ?? acces.status}</Ligne>
        <Ligne libelle="Niveau">{acces.level}</Ligne>
        <Ligne libelle="Accord de confidentialité">
          {acces.ndaRequired
            ? acces.ndaSignedAt
              ? `Signé le ${dateJournal(acces.ndaSignedAt)}`
              : "Exigé — non signé"
            : "Non exigé"}
        </Ligne>
        <Ligne libelle="Échéance">
          {acces.expiresAt ? dateJournal(acces.expiresAt) : "Sans échéance"}
        </Ligne>
        <Ligne libelle="Ouvert le">{dateJournal(acces.createdAt)}</Ligne>
      </div>
      <p className="v2-roles-note">
        <Icon name="folder" />
        {acces.scopePending
          ? "Périmètre que l’acceptation ouvrira : "
          : "Périmètre réellement ouvert : "}
        {acces.scope.folders} dossier{acces.scope.folders > 1 ? "s" : ""} ·{" "}
        {acces.scope.documents} pièce{acces.scope.documents > 1 ? "s" : ""}.
      </p>
      <div className="v2-fiche-actions">
        <Link className="v2-btn" data-variant="secondary" href="../access">
          Gérer dans Partage et accès
        </Link>
      </div>
    </section>
  );
}

function Engagements({
  engagement,
  investisseur,
}: {
  engagement: Engagement | null;
  investisseur: InvestisseurPipeline;
}) {
  if (!engagement) {
    return (
      <section className="v2-fiche-card">
        <p className="v2-field-helper">
          Aucun engagement déclaré. Un engagement est écrit par votre équipe —
          il n’est jamais déduit de l’activité documentaire de l’investisseur.
        </p>
        <div className="v2-fiche-actions">
          <Link className="v2-btn" href="?view=commitments&panel=commitment">
            Enregistrer un engagement
          </Link>
        </div>
      </section>
    );
  }

  const n = niveauDe(engagement.niveau);

  return (
    <section className="v2-fiche-card">
      <div className="v2-fiche-kv">
        <Ligne libelle="Niveau">
          <span className="v2-status" data-tone={n.tone}>
            <i className="v2-dot" />
            {n.court}
          </span>
        </Ligne>
        <Ligne libelle="Montant">
          {engagement.montant.toLocaleString("fr-FR")} {engagement.devise ?? ""}
        </Ligne>
        <Ligne libelle="Date">{dateJournal(engagement.date)}</Ligne>
        <Ligne libelle="Responsable">{engagement.responsable ?? "—"}</Ligne>
        <Ligne libelle="Preuve">{engagement.preuve ?? "—"}</Ligne>
        <Ligne libelle="Compté dans le sécurisé">
          {n.compte ? "Oui" : "Non — intérêt indicatif"}
        </Ligne>
      </div>
      {engagement.commentaire && (
        <p className="v2-fiche-notes">{engagement.commentaire}</p>
      )}
      <div className="v2-fiche-actions">
        <Link
          className="v2-btn"
          data-variant="secondary"
          href={`?view=commitments&panel=${engagement.id}`}
        >
          Modifier l’engagement
        </Link>
      </div>
      <p className="v2-roles-note">
        <Icon name="shield" />
        Déclaré par votre équipe le {dateJournal(engagement.date)}
        {investisseur.responsable ? `, suivi par ${investisseur.responsable}` : ""}.
      </p>
    </section>
  );
}

/**
 * L'onglet Questions.
 *
 * La maquette le pose, le produit ne le porte pas : il n'existe aucune
 * mécanique de questions dans Sanza. L'onglet le dit plutôt que d'afficher une
 * liste vide — une liste vide laisse croire que personne n'a demandé, alors
 * que personne ne PEUT demander.
 */
function Questions() {
  return (
    <section className="v2-fiche-card">
      <div className="v2-nav-label">Questions</div>
      <p className="v2-field-helper">
        Sanza ne porte pas encore de questions-réponses : un investisseur qui
        veut un éclaircissement vous écrit directement. Ce qu’il vous demande a
        sa place dans une interaction — c’est là qu’on le retrouvera.
      </p>
    </section>
  );
}

function Notes({ investisseur }: { investisseur: InvestisseurPipeline }) {
  return (
    <section className="v2-fiche-card">
      <div className="v2-nav-label">
        Notes internes — jamais visibles par l’investisseur
      </div>
      {investisseur.notes ? (
        <p className="v2-fiche-notes">{investisseur.notes}</p>
      ) : (
        <p className="v2-field-helper">Aucune note.</p>
      )}
      <div className="v2-fiche-actions">
        <Link
          className="v2-btn"
          data-variant="secondary"
          href={lien({ panel: investisseur.id })}
        >
          Modifier les notes
        </Link>
      </div>
    </section>
  );
}
