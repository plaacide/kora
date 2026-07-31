"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  deleteV2Investor,
  saveV2Investor,
} from "@/app/v2/(workspace)/operations/[operationId]/lever/actions";
import { initials } from "@/features/v2/domain/activity";
import { paysAvecZone, paysParZone } from "@/features/v2/domain/geographie";
import { v2Routes } from "@/features/v2/navigation/routes";
import {
  CATEGORIES,
  FONCTIONS,
  ENGAGEMENTS,
  ETAPES,
  categorieLabel,
  colonnes,
  engagementLabel,
  engagementTon,
  etapeLabel,
  ticketsCumules,
  type Interaction,
  type InvestisseurPipeline,
} from "@/features/v2/domain/pipeline";
import type { Engagement } from "@/features/v2/domain/engagements";
import type { AccessRow } from "@/features/v2/server/access";
import type { SignauxDocumentaires } from "@/features/v2/server/fiche";
import { EmptyMedallion } from "./EmptyArt";
import { InteractionPanel, InteractionsSection } from "./Interactions";
import { InvestorFiche } from "./InvestorFiche";
import { Icon } from "./Icon";

/**
 * Écrans 38 à 40 — le pipeline investisseur.
 *
 * Règle non négociable du handoff : les trois dimensions ne sont jamais
 * fusionnées. L'ÉTAPE de relation, l'ÉTAT D'ACCÈS documentaire et le MONTANT
 * restent trois colonnes distinctes — un investisseur qui a signé le NDA n'est
 * pas pour autant intéressé, et un accès accordé n'est pas un engagement.
 *
 * L'état d'accès n'est d'ailleurs pas saisi ici : il est lu depuis les
 * invitations, par l'adresse. Le ressaisir laisserait les deux diverger.
 */

/** Un montant saisi avec des espaces reste un montant. */
function enNombre(valeur: string): number | null {
  const propre = valeur.replace(/[\s  ]/g, "");
  if (!propre) return null;
  const nombre = Number(propre);
  return Number.isFinite(nombre) ? nombre : null;
}

function tonAcces(acces: string | null): string {
  if (acces === "Accès actif") return "green";
  if (acces === "NDA en attente" || acces === "Invitation envoyée") return "blue";
  if (acces === "Révoqué") return "red";
  return "neutral";
}

export function InvestorsScreen({
  operationId,
  investisseurs,
  interactions,
  devise,
  vue,
  edite,
  interactionOuverte,
  investisseurCible,
  fiche,
  onglet,
  acces,
  engagements,
  signaux,
}: {
  operationId: string;
  investisseurs: readonly InvestisseurPipeline[];
  /** Ce qui a été consigné — écrans 41 et 42. */
  interactions: readonly Interaction[];
  devise: string;
  /** `colonnes` ou `tableau` — les deux lectures de la maquette. */
  vue: string;
  /** Identifiant de l'investisseur en cours d'édition, `add` pour un nouveau. */
  edite: string | null;
  /** `interaction` quand le panneau de l'écran 42 est ouvert. */
  interactionOuverte: string | null;
  /** La relation à laquelle l'interaction se rattache. */
  investisseurCible: string | null;
  /** La fiche ouverte — écran 41 — et l'onglet consulté. */
  fiche: string | null;
  onglet: string;
  /** Ce qui alimente les onglets Accès, Engagements et Activité. */
  acces: readonly AccessRow[];
  engagements: readonly Engagement[];
  signaux: SignauxDocumentaires;
}) {
  // Le pipeline vit sous l'onglet `?view=pipeline` de Lever : chaque lien doit
  // le reconduire, sans quoi le premier clic sort de l'écran.
  const lien = (extra: Record<string, string>) => {
    const params = new URLSearchParams({ view: "pipeline", ...extra });
    return `?${params}`;
  };
  const enColonnes = vue !== "tableau";
  const cumul = ticketsCumules(investisseurs);
  const enCours = edite
    ? (investisseurs.find((item) => item.id === edite) ?? null)
    : null;

  // L'écran 42 se rattache toujours à une relation : sans elle, il n'y a rien
  // à consigner et le panneau ne s'ouvre pas.
  const cible = investisseurCible
    ? (investisseurs.find((item) => item.id === investisseurCible) ?? null)
    : null;
  const interactionEditee = interactions.find(
    (i) => i.id === interactionOuverte,
  );

  const fichee = fiche
    ? (investisseurs.find((item) => item.id === fiche) ?? null)
    : null;

  return (
    <div className="v2-pipeline-page">
      <div className="v2-filterbar">
        <Link data-active={enColonnes} href={lien({ mode: "colonnes" })}>Colonnes</Link>
        <Link data-active={!enColonnes} href={lien({ mode: "tableau" })}>Tableau</Link>
        <i />
        {investisseurs.length > 0 && (
          <span>
            {investisseurs.length} relation{investisseurs.length > 1 ? "s" : ""} ·{" "}
            <b>{cumul.toLocaleString("fr-FR")}</b> {devise} de tickets indicatifs
          </span>
        )}
        <Link className="v2-btn" href={lien({ panel: "add" })}>
          <Icon name="plus" />
          Ajouter un investisseur
        </Link>
      </div>

      {investisseurs.length === 0 ? (
        <section className="v2-drop-empty">
          <EmptyMedallion icon="users" />
          <h2>Aucune relation suivie</h2>
          <p>
            Le pipeline est une liste tenue à la main : qui vous avez approché,
            où en est la conversation, quel ticket est évoqué. Il ne se remplit
            pas depuis la data room — c’est votre lecture du tour, pas la
            sienne.
          </p>
          <div>
            <Link className="v2-btn" href={lien({ panel: "add" })}>Ajouter un investisseur</Link>
          </div>
        </section>
      ) : enColonnes ? (
        <PipelineColonnes devise={devise} investisseurs={investisseurs} />
      ) : (
        <PipelineTableau devise={devise} investisseurs={investisseurs} />
      )}

      {edite && edite !== "interaction" && (
        <InvestorPanel
          devise={devise}
          interactions={interactions}
          investisseur={enCours}
          operationId={operationId}
        />
      )}

      {edite === "interaction" && cible && (
        <InteractionPanel
          interaction={interactionEditee ?? null}
          investisseur={cible}
          operationId={operationId}
        />
      )}

      {fichee && !edite && (
        <InvestorFiche
          acces={
            acces.find(
              (a) =>
                fichee.email &&
                a.email.toLowerCase() === fichee.email.toLowerCase(),
            ) ?? null
          }
          engagement={
            engagements.find((e) => e.investorId === fichee.id) ?? null
          }
          interactions={interactions.filter((i) => i.investorId === fichee.id)}
          investisseur={fichee}
          onglet={onglet}
          signaux={signaux}
        />
      )}
    </div>
  );
}

function PipelineColonnes({
  investisseurs,
  devise,
}: {
  investisseurs: readonly InvestisseurPipeline[];
  devise: string;
}) {
  return (
    <div className="v2-pipeline-columns">
      {colonnes(investisseurs).map((colonne) => (
        <section key={colonne.etape}>
          <header>
            <strong>{colonne.nom}</strong>
            <span>{colonne.investisseurs.length}</span>
          </header>

          {colonne.investisseurs.length === 0 ? (
            <p>Aucune relation</p>
          ) : (
            colonne.investisseurs.map((item) => (
              <Link href={`?view=pipeline&fiche=${item.id}`} key={item.id}>
                <span className="v2-person-avatar">
                  {initials(item.organisation ?? item.nom)}
                </span>
                <div>
                  <strong>{item.organisation ?? item.nom}</strong>
                  <small>
                    {item.nom}
                    {item.categorie ? ` · ${categorieLabel(item.categorie)}` : ""}
                  </small>
                  {/* Deux axes, deux badges : l'étape est la colonne,
                      l'engagement se lit ici. */}
                  {item.engagement !== "aucun" && (
                    <span
                      className="v2-status"
                      data-tone={engagementTon(item.engagement)}
                    >
                      {engagementLabel(item.engagement)}
                    </span>
                  )}
                  {item.acces && (
                    <span className="v2-status" data-tone={tonAcces(item.acces)}>
                      {item.acces}
                    </span>
                  )}
                  {item.prochaineAction && (
                    <em>
                      {item.prochaineAction}
                      {item.dateRelance
                        ? ` — ${new Date(item.dateRelance).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`
                        : ""}
                    </em>
                  )}
                  {item.ticket != null && (
                    <em>
                      {item.ticket.toLocaleString("fr-FR")} {devise}
                    </em>
                  )}
                </div>
              </Link>
            ))
          )}
        </section>
      ))}
    </div>
  );
}

function PipelineTableau({
  investisseurs,
  devise,
}: {
  investisseurs: readonly InvestisseurPipeline[];
  devise: string;
}) {
  return (
    <div className="v2-access-table-wrap">
      <table className="v2-access-table">
        <thead>
          <tr>
            <th>Organisation · contact</th>
            <th>Étape de relation</th>
            <th>Engagement</th>
            <th>Accès documentaire</th>
            <th>Prochaine action</th>
            <th>Ticket ({devise})</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {investisseurs.map((item) => (
            <tr key={item.id}>
              <td>
                <span className="v2-person-avatar">
                  {initials(item.organisation ?? item.nom)}
                </span>
                <div>
                  <strong>{item.organisation ?? item.nom}</strong>
                  <small>
                    {item.nom}
                    {item.fonction ? ` · ${item.fonction}` : ""}
                    {item.categorie ? ` · ${categorieLabel(item.categorie)}` : ""}
                    {item.pays ? ` · ${paysAvecZone(item.pays)}` : ""}
                  </small>
                </div>
              </td>
              <td>{etapeLabel(item.etape)}</td>
              <td>
                <span
                  className="v2-status"
                  data-tone={engagementTon(item.engagement)}
                >
                  {engagementLabel(item.engagement)}
                </span>
              </td>
              {/* Trois dimensions distinctes : l'accès ne fait pas avancer
                  l'étape, et l'étape ne donne aucun accès. */}
              <td>
                {item.acces ? (
                  <span className="v2-status" data-tone={tonAcces(item.acces)}>
                    {item.acces}
                  </span>
                ) : (
                  "Aucun accès"
                )}
              </td>
              <td>
                {item.prochaineAction ?? "—"}
                {item.dateRelance && (
                  <small>
                    {new Date(item.dateRelance).toLocaleDateString("fr-FR")}
                  </small>
                )}
              </td>
              <td>
                {item.ticket != null ? item.ticket.toLocaleString("fr-FR") : "—"}
              </td>
              <td>
                <Link href={`?view=pipeline&fiche=${item.id}`}>Ouvrir</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <footer>
        Les tickets sont indicatifs. Ils ne sont jamais additionnés au montant
        sécurisé de la levée, qui reste une déclaration de votre équipe.
      </footer>
    </div>
  );
}

function InvestorPanel({
  operationId,
  interactions,
  investisseur,
  devise,
}: {
  operationId: string;
  interactions: readonly Interaction[];
  investisseur: InvestisseurPipeline | null;
  devise: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const [nom, setNom] = useState(investisseur?.nom ?? "");
  const [organisation, setOrganisation] = useState(investisseur?.organisation ?? "");
  const [email, setEmail] = useState(investisseur?.email ?? "");
  const [ticket, setTicket] = useState(
    investisseur?.ticket ? String(investisseur.ticket) : "",
  );
  const [etape, setEtape] = useState(investisseur?.etape ?? "a_cibler");
  const [engagement, setEngagement] = useState(
    investisseur?.engagement ?? "aucun",
  );
  const [categorie, setCategorie] = useState(investisseur?.categorie ?? "");
  const [fonction, setFonction] = useState(investisseur?.fonction ?? "");
  const [pays, setPays] = useState(investisseur?.pays ?? "");
  const [source, setSource] = useState(investisseur?.source ?? "");
  const [responsable, setResponsable] = useState(investisseur?.responsable ?? "");
  const [prochaineAction, setProchaineAction] = useState(
    investisseur?.prochaineAction ?? "",
  );
  const [dateRelance, setDateRelance] = useState(investisseur?.dateRelance ?? "");
  const [notes, setNotes] = useState(investisseur?.notes ?? "");
  const [armeSuppression, setArmeSuppression] = useState(false);

  async function supprimer() {
    if (!investisseur) return;

    setBusy(true);
    setErreur(null);

    const res = await deleteV2Investor({
      operationId,
      id: investisseur.id,
    });

    setBusy(false);
    if (!res.ok) {
      setErreur(res.error ?? "La relation n’a pas pu être retirée.");
      return;
    }

    router.push("?view=pipeline");
    router.refresh();
  }

  async function enregistrer() {
    setBusy(true);
    setErreur(null);

    const res = await saveV2Investor({
      operationId,
      id: investisseur?.id ?? null,
      nom,
      organisation,
      email,
      ticket: enNombre(ticket),
      etape,
      engagement,
      categorie,
      fonction,
      pays,
      source,
      responsable,
      prochaineAction,
      dateRelance,
      notes,
    });

    setBusy(false);
    if (!res.ok) {
      setErreur(res.error ?? "L’investisseur n’a pas pu être enregistré.");
      return;
    }

    router.push("?view=pipeline");
    router.refresh();
  }

  return (
    <>
      <Link aria-label="Fermer" className="v2-scrim" href="?view=pipeline" />
      <aside className="v2-sidepanel">
        <header>
          <div>
            <span className="v2-panel-eyebrow">Lever · Pipeline</span>
            <h2>
              {investisseur?.organisation ??
                investisseur?.nom ??
                "Ajouter un investisseur"}
            </h2>
          </div>
          <Link aria-label="Fermer" href="?view=pipeline">×</Link>
        </header>

        <div className="v2-sidepanel-body">
          {erreur && (
            <p className="v2-auth-error" role="alert">
              {erreur}
            </p>
          )}

          {/* Le pipeline et la data room restent deux choses : suivre une
              relation n'ouvre rien. Mais le geste suivant est assez fréquent
              pour mériter un chemin — avec ce qu'on sait déjà. */}
          {investisseur?.acces ? (
            <section className="v2-access-bridge">
              <div>
                <strong>Accès documentaire</strong>
                <small>
                  Cette adresse a déjà un accès à l’opération :{" "}
                  {investisseur.acces.toLowerCase()}.
                </small>
              </div>
              <Link href={v2Routes.operations.access(operationId)}>
                Voir l’accès
              </Link>
            </section>
          ) : email.trim().includes("@") ? (
            <section className="v2-access-bridge">
              <div>
                <strong>Aucun accès documentaire</strong>
                <small>
                  Ajouter au pipeline n’ouvre rien. L’assistant reprendra
                  l’adresse saisie ici.
                </small>
              </div>
              <Link
                href={`${v2Routes.operations.access(operationId)}?share=recipient&email=${encodeURIComponent(email.trim().toLowerCase())}`}
              >
                Créer un accès documentaire
              </Link>
            </section>
          ) : (
            <p className="v2-panel-note">
              <Icon name="shield" />
              Ajouté au pipeline uniquement — aucun accès documentaire n’est
              créé. Renseignez l’e-mail pour pouvoir lui ouvrir la data room.
            </p>
          )}

          <label className="v2-field">
            <span>Organisation</span>
            <span className="v2-control">
              <input
                onChange={(event) => setOrganisation(event.target.value)}
                placeholder="Sahel Growth Fund"
                value={organisation}
              />
            </span>
          </label>

          {/* Deux colonnes, comme la maquette 40 : un panneau qui se lit d'un
              coup d'œil plutôt qu'une colonne qu'on fait défiler. */}
          <div className="v2-panel-grid">
          <label className="v2-field">
            <span>Catégorie</span>
            <span className="v2-control">
              <select
                onChange={(event) => setCategorie(event.target.value)}
                value={categorie}
              >
                <option value="">Non renseignée</option>
                {CATEGORIES.map(([valeur, label]) => (
                  <option key={valeur} value={valeur}>{label}</option>
                ))}
              </select>
            </span>
          </label>

          <label className="v2-field">
            <span>Contact principal</span>
            <span className="v2-control">
              <input
                onChange={(event) => setNom(event.target.value)}
                placeholder="Amina Diallo"
                value={nom}
              />
            </span>
          </label>
          </div>

          <label className="v2-field">
            <span>
              Fonction <small>— facultatif</small>
            </span>
            <span className="v2-control">
              <select
                onChange={(event) => setFonction(event.target.value)}
                value={fonction}
              >
                <option value="">Non renseignée</option>
                {FONCTIONS.map((valeur) => (
                  <option key={valeur} value={valeur}>{valeur}</option>
                ))}
              </select>
            </span>
          </label>

          {/* La ZONE ne se saisit pas : elle se déduit du pays. Demander les
              deux laisserait un jour « Ghana · Afrique de l'Est » en base, et
              personne pour dire lequel a raison. */}
          <label className="v2-field">
            <span>
              Pays <small>— la zone en découle</small>
            </span>
            <span className="v2-control">
              <select
                onChange={(event) => setPays(event.target.value)}
                value={pays}
              >
                <option value="">Non renseigné</option>
                {paysParZone().map((groupe) => (
                  <optgroup key={groupe.zone} label={groupe.zone}>
                    {groupe.pays.map((nom) => (
                      <option key={nom} value={nom}>{nom}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </span>
          </label>
          {pays && <small className="v2-field-hint">{paysAvecZone(pays)}</small>}

          <label className="v2-field">
            <span>
              E-mail <small>— relie cette relation à son accès</small>
            </span>
            <span className="v2-control">
              <input
                onChange={(event) => setEmail(event.target.value)}
                placeholder="amina.diallo@fonds.com"
                type="email"
                value={email}
              />
            </span>
          </label>

          <label className="v2-field">
            <span>Ticket potentiel</span>
            <span className="v2-control">
              <input
                inputMode="numeric"
                onChange={(event) => setTicket(event.target.value)}
                placeholder="150 000 000"
                value={ticket}
              />
              {/* La devise vient de la levée : un ticket sans monnaie de
                  compte ne veut rien dire. */}
              <em>{devise}</em>
            </span>
          </label>
          <small className="v2-field-hint">
            Indicatif — jamais compté comme engagement.
          </small>

          <label className="v2-field">
            <span>
              Source de la relation <small>— facultatif</small>
            </span>
            <span className="v2-control">
              <input
                onChange={(event) => setSource(event.target.value)}
                placeholder="Introduction — Dakar Accelerator"
                value={source}
              />
            </span>
          </label>

          <hr />

          <div className="v2-panel-grid">
          {/* DEUX AXES, jamais fusionnés : où en est la conversation, et ce
              qui est promis. Un investisseur peut être en diligence ET avoir
              soft-committé — c'est la phrase qu'on prononce vraiment. */}
          <label className="v2-field">
            <span>Étape de relation</span>
            <span className="v2-control">
              <select
                onChange={(event) => setEtape(event.target.value)}
                value={etape}
              >
                {ETAPES.map(([valeur, label]) => (
                  <option key={valeur} value={valeur}>{label}</option>
                ))}
              </select>
            </span>
          </label>

          <label className="v2-field">
            <span>
              Engagement <small>— déclaré, jamais déduit</small>
            </span>
            <span className="v2-control">
              <select
                onChange={(event) => setEngagement(event.target.value)}
                value={engagement}
              >
                {ENGAGEMENTS.map(([valeur, label]) => (
                  <option key={valeur} value={valeur}>{label}</option>
                ))}
              </select>
            </span>
          </label>

          </div>

          <hr />

          <label className="v2-field">
            <span>
              Responsable interne <small>— facultatif</small>
            </span>
            <span className="v2-control">
              <input
                onChange={(event) => setResponsable(event.target.value)}
                placeholder="Amara Diallo"
                value={responsable}
              />
            </span>
          </label>

          {/* Prochaine action et sa date vont ensemble : une échéance sans
              geste, ou un geste sans date, ne fait pas revenir personne. */}
          <div className="v2-panel-grid">
          <label className="v2-field">
            <span>
              Prochaine action <small>— facultatif</small>
            </span>
            <span className="v2-control">
              <input
                onChange={(event) => setProchaineAction(event.target.value)}
                placeholder="Envoyer la table de capitalisation"
                value={prochaineAction}
              />
            </span>
          </label>

          <label className="v2-field">
            <span>
              Date de relance <small>— facultatif</small>
            </span>
            <span className="v2-control">
              <input
                onChange={(event) => setDateRelance(event.target.value)}
                type="date"
                value={dateRelance}
              />
            </span>
          </label>

          </div>

          {investisseur && (
            <>
              <hr />
              <InteractionsSection
                interactions={interactions}
                investisseur={investisseur}
              />
            </>
          )}

          <label className="v2-field">
            <span>
              Notes internes <small>— jamais visibles par l’investisseur</small>
            </span>
            <span className="v2-control">
              <textarea
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Rencontré au sommet Africa Energy Forum. Thèse énergie distribuée."
                rows={3}
                value={notes}
              />
            </span>
          </label>

          {investisseur && (
            <section className="v2-danger-zone">
              <div>
                <strong>Retirer du pipeline</strong>
                <small>
                  À ne pas confondre avec l’étape « Écarté », qui garde la trace
                  d’une relation qui n’a pas abouti — un investisseur qui a dit
                  non fait partie de l’histoire du tour. Retirez seulement une
                  erreur de saisie.
                </small>
              </div>
              {armeSuppression ? (
                <div>
                  <button disabled={busy} onClick={supprimer} type="button">
                    {busy ? "Suppression…" : "Confirmer"}
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => setArmeSuppression(false)}
                    type="button"
                  >
                    Annuler
                  </button>
                </div>
              ) : (
                <button onClick={() => setArmeSuppression(true)} type="button">
                  Retirer
                </button>
              )}
            </section>
          )}
        </div>

        <footer className="v2-sidepanel-footer">
          <Link href="?view=pipeline">Annuler</Link>
          <button
            className="v2-btn"
            disabled={busy || nom.trim().length < 2}
            onClick={enregistrer}
            type="button"
          >
            {busy
              ? "Enregistrement…"
              : investisseur
                ? "Enregistrer"
                : "Ajouter au pipeline"}
          </button>
        </footer>
      </aside>
    </>
  );
}
