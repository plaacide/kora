"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { saveV2Investor } from "@/app/v2/(workspace)/operations/[operationId]/lever/actions";
import { initials } from "@/features/v2/domain/activity";
import {
  ETAPES,
  colonnes,
  etapeLabel,
  etapeTon,
  ticketsCumules,
  type InvestisseurPipeline,
} from "@/features/v2/domain/pipeline";
import { EmptyMedallion } from "./EmptyArt";
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
  devise,
  vue,
  edite,
}: {
  operationId: string;
  investisseurs: readonly InvestisseurPipeline[];
  devise: string;
  /** `colonnes` ou `tableau` — les deux lectures de la maquette. */
  vue: string;
  /** Identifiant de l'investisseur en cours d'édition, `add` pour un nouveau. */
  edite: string | null;
}) {
  const enColonnes = vue !== "tableau";
  const cumul = ticketsCumules(investisseurs);
  const enCours = edite
    ? (investisseurs.find((item) => item.id === edite) ?? null)
    : null;

  return (
    <div className="v2-pipeline-page">
      <div className="v2-filterbar">
        <Link data-active={enColonnes} href="?vue=colonnes">Colonnes</Link>
        <Link data-active={!enColonnes} href="?vue=tableau">Tableau</Link>
        <i />
        {investisseurs.length > 0 && (
          <span>
            {investisseurs.length} relation{investisseurs.length > 1 ? "s" : ""} ·{" "}
            <b>{cumul.toLocaleString("fr-FR")}</b> {devise} de tickets indicatifs
          </span>
        )}
        <Link className="v2-btn" href="?panel=add">
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
            <Link className="v2-btn" href="?panel=add">Ajouter un investisseur</Link>
          </div>
        </section>
      ) : enColonnes ? (
        <PipelineColonnes devise={devise} investisseurs={investisseurs} />
      ) : (
        <PipelineTableau devise={devise} investisseurs={investisseurs} />
      )}

      {edite && (
        <InvestorPanel investisseur={enCours} operationId={operationId} />
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
        <section key={colonne.statut}>
          <header>
            <strong>{colonne.nom}</strong>
            <span>{colonne.investisseurs.length}</span>
          </header>

          {colonne.investisseurs.length === 0 ? (
            <p>Aucune relation</p>
          ) : (
            colonne.investisseurs.map((item) => (
              <Link href={`?panel=${item.id}`} key={item.id}>
                <span className="v2-person-avatar">
                  {initials(item.organisation ?? item.nom)}
                </span>
                <div>
                  <strong>{item.organisation ?? item.nom}</strong>
                  <small>{item.nom}</small>
                  {item.acces && (
                    <span className="v2-status" data-tone={tonAcces(item.acces)}>
                      {item.acces}
                    </span>
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
            <th>Accès documentaire</th>
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
                  <small>{item.nom}</small>
                </div>
              </td>
              <td>
                <span className="v2-status" data-tone={etapeTon(item.statut)}>
                  {etapeLabel(item.statut)}
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
                {item.ticket != null ? item.ticket.toLocaleString("fr-FR") : "—"}
              </td>
              <td>
                <Link href={`?panel=${item.id}`}>Modifier</Link>
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
  investisseur,
}: {
  operationId: string;
  investisseur: InvestisseurPipeline | null;
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
  const [statut, setStatut] = useState(investisseur?.statut ?? "invite");

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
      statut,
    });

    setBusy(false);
    if (!res.ok) {
      setErreur(res.error ?? "L’investisseur n’a pas pu être enregistré.");
      return;
    }

    router.push("?");
    router.refresh();
  }

  return (
    <>
      <Link aria-label="Fermer" className="v2-scrim" href="?" />
      <aside className="v2-sidepanel">
        <header>
          <div>
            <span className="v2-status" data-tone="neutral">
              {investisseur ? "Modifier" : "Nouvelle relation"}
            </span>
            <h2>
              {investisseur?.organisation ??
                investisseur?.nom ??
                "Ajouter un investisseur"}
            </h2>
          </div>
          <Link aria-label="Fermer" href="?">×</Link>
        </header>

        <div className="v2-sidepanel-body">
          {erreur && (
            <p className="v2-auth-error" role="alert">
              {erreur}
            </p>
          )}

          <p className="v2-panel-note">
            Ajouté au pipeline uniquement — aucun accès documentaire n’est créé.
            Pour ouvrir la data room à cette personne, passez par Partage et
            accès.
          </p>

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
            <span>
              Ticket potentiel <small>— indicatif, jamais un engagement</small>
            </span>
            <span className="v2-control">
              <input
                inputMode="numeric"
                onChange={(event) => setTicket(event.target.value)}
                placeholder="150 000 000"
                value={ticket}
              />
            </span>
          </label>

          <label className="v2-field">
            <span>Étape de relation</span>
            <span className="v2-control">
              <select
                onChange={(event) => setStatut(event.target.value)}
                value={statut}
              >
                {ETAPES.map(([valeur, label]) => (
                  <option key={valeur} value={valeur}>{label}</option>
                ))}
              </select>
            </span>
          </label>

          <p className="v2-panel-note">
            Catégorie, pays, source de la relation, responsable interne, notes
            et prochaine action ne sont pas encore enregistrables : aucune
            colonne ne les porte. Une relation ne se supprime pas non plus —
            écartez-la par l’étape, ce qui garde la trace d’un tour.
          </p>
        </div>

        <footer className="v2-sidepanel-footer">
          <Link href="?">Annuler</Link>
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
