"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  deleteV2Commitment,
  saveV2Commitment,
} from "@/app/v2/(workspace)/operations/[operationId]/lever/actions";
import {
  NIVEAUX,
  niveau as niveauDe,
  phraseRequalification,
  restant,
  ventilation,
  type Engagement,
  type NiveauEngagement,
  type Requalification,
} from "@/features/v2/domain/engagements";
import { dateJournal } from "@/features/v2/domain/journal";
import type { InvestisseurPipeline } from "@/features/v2/domain/pipeline";

import { EmptyMedallion } from "./EmptyArt";
import { Icon } from "./Icon";

function somme(valeur: number): string {
  return valeur.toLocaleString("fr-FR");
}

function href(view: string, extra: Record<string, string> = {}): string {
  const params = new URLSearchParams({ view, ...extra });
  return `?${params.toString()}`;
}

/**
 * Écran 44 — la vue des engagements, sur les lignes réelles.
 *
 * Les trois totaux du haut ne sont pas trois champs : ce sont trois lectures
 * des mêmes lignes. Le montant sécurisé de la levée se recalcule en base à
 * chaque enregistrement, ce qui veut dire qu'il ne peut plus contredire le
 * tableau qui est juste en dessous.
 */
export function CommitmentsScreen({
  cible,
  devise,
  engagements,
  historique,
  investisseurs,
  montantDeclare,
  operationId,
  panel,
}: {
  cible: number | null;
  devise: string;
  engagements: readonly Engagement[];
  historique: readonly Requalification[];
  investisseurs: readonly InvestisseurPipeline[];
  /**
   * L'ancien `montant_engage` saisi à la main, quand il précède les lignes.
   * Il n'est pas effacé en silence : le fondateur doit savoir d'où vient le
   * chiffre qu'il voyait hier.
   */
  montantDeclare: number | null;
  operationId: string;
  panel: string | null;
}) {
  const v = ventilation(engagements);
  const aReprendre =
    engagements.length === 0 && (montantDeclare ?? 0) > 0;

  const edite = panel && panel !== "commitment"
    ? engagements.find((e) => e.id === panel) ?? null
    : null;

  return (
    <>
      {engagements.length === 0 ? (
        <section className="v2-drop-empty">
          <EmptyMedallion icon="trend" />
          <h2>Aucun engagement déclaré</h2>
          <p>
            Enregistrez ici ce que chaque investisseur s’est engagé à mettre —
            avec son niveau, sa date et sa preuve. Le montant sécurisé de la
            levée se recalcule à partir de ces lignes.
          </p>
          {aReprendre && (
            <p className="v2-panel-callout">
              <Icon name="shield" />
              Un montant de {somme(montantDeclare ?? 0)} {devise} avait été
              saisi directement sur la levée. Il reste affiché tant qu’aucun
              engagement n’est enregistré ; dès le premier, le total viendra des
              lignes ci-dessous.
            </p>
          )}
          {investisseurs.length === 0 && (
            <p className="v2-field-helper">
              Ajoutez d’abord un investisseur au pipeline : un engagement se
              rattache toujours à une relation.
            </p>
          )}
        </section>
      ) : (
        <>
          <div className="v2-commitment-stats">
            <section>
              <span>Engagements confirmés</span>
              <strong>{somme(v.confirme.montant)}</strong>
              <small>
                {devise} · {v.confirme.investisseurs}{" "}
                {v.confirme.investisseurs > 1 ? "investisseurs" : "investisseur"}
              </small>
            </section>
            <section>
              <span>Soft-commits déclarés</span>
              <strong>{somme(v.soft.montant)}</strong>
              <small>
                {devise} · {v.soft.investisseurs}{" "}
                {v.soft.investisseurs > 1 ? "investisseurs" : "investisseur"}
              </small>
            </section>
            <section>
              <span>Restant à sécuriser</span>
              <strong>{somme(restant(cible, v.securise))}</strong>
              <small>
                {devise}
                {cible ? ` sur ${somme(cible)}` : " · objectif non fixé"}
              </small>
            </section>
          </div>

          <div className="v2-commitment-table-wrap">
            <table className="v2-commitment-table">
              <thead>
                <tr>
                  <th>Investisseur</th>
                  <th>Niveau</th>
                  <th>Montant</th>
                  <th>Devise</th>
                  <th>Date</th>
                  <th>Dernière modification</th>
                  <th>Responsable</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {engagements.map((e) => {
                  const n = niveauDe(e.niveau);
                  return (
                    <tr key={e.id}>
                      <td>
                        <strong>{e.organisation ?? e.investisseur}</strong>
                        {e.organisation && <small>{e.investisseur}</small>}
                      </td>
                      <td>
                        <span className="v2-status" data-tone={n.tone}>
                          <i className="v2-dot" />
                          {n.court}
                        </span>
                      </td>
                      <td>{somme(e.montant)}</td>
                      <td>{e.devise ?? devise}</td>
                      <td>{dateJournal(e.date)}</td>
                      <td>
                        {e.requalifie ? dateJournal(e.modifieLe) : "—"}
                      </td>
                      <td>{e.responsable ?? "—"}</td>
                      <td>
                        <Link href={href("commitments", { panel: e.id })}>
                          Modifier
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {historique.length > 0 && (
            <section className="v2-history-card">
              <h2>Historique des modifications</h2>
              {historique.map((ligne) => (
                <div className="v2-activity-row" key={ligne.id}>
                  <span />
                  <div>
                    <strong>
                      {ligne.investisseur} — {phraseRequalification(ligne)}
                    </strong>
                    <small>
                      {dateJournal(ligne.at)}
                      {ligne.auteur ? ` · par ${ligne.auteur}` : ""}
                      {ligne.preuve ? ` · preuve : ${ligne.preuve}` : ""}
                    </small>
                  </div>
                </div>
              ))}
              <p>
                Une modification ou un retrait conserve l’historique. Les
                intérêts indicatifs ne sont jamais additionnés aux totaux.
              </p>
            </section>
          )}
        </>
      )}

      {(panel === "commitment" || edite) && (
        <CommitmentPanel
          devise={devise}
          engagement={edite}
          investisseurs={investisseurs}
          operationId={operationId}
        />
      )}
    </>
  );
}

/**
 * Écran 43 — enregistrer un engagement.
 *
 * Le choix de l'investisseur se fait dans le pipeline, jamais en texte libre :
 * un engagement rattaché à un nom saisi à la main ne se relance pas, ne se
 * recoupe pas avec l'accès documentaire, et finit en doublon du même
 * investisseur écrit deux fois.
 */
function CommitmentPanel({
  devise,
  engagement,
  investisseurs,
  operationId,
}: {
  devise: string;
  engagement: Engagement | null;
  investisseurs: readonly InvestisseurPipeline[];
  operationId: string;
}) {
  const router = useRouter();
  const close = href("commitments");

  const [investorId, setInvestorId] = useState(
    engagement?.investorId ?? investisseurs[0]?.id ?? "",
  );
  const [niveau, setNiveau] = useState<NiveauEngagement>(
    engagement?.niveau ?? "soft_commit",
  );
  const [montant, setMontant] = useState(
    engagement ? String(engagement.montant) : "",
  );
  const [monnaie, setMonnaie] = useState(engagement?.devise ?? devise);
  const [date, setDate] = useState(
    engagement?.date ?? new Date().toISOString().slice(0, 10),
  );
  const [preuve, setPreuve] = useState(engagement?.preuve ?? "");
  const [commentaire, setCommentaire] = useState(engagement?.commentaire ?? "");
  const [responsable, setResponsable] = useState(engagement?.responsable ?? "");
  const [busy, setBusy] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  async function enregistrer() {
    const valeur = Number(montant.replace(/\s/g, "").replace(",", "."));
    if (!Number.isFinite(valeur) || valeur <= 0) {
      setErreur("Indiquez un montant.");
      return;
    }

    setBusy("save");
    setErreur(null);

    const res = await saveV2Commitment({
      operationId,
      investorId,
      niveau,
      montant: valeur,
      devise: monnaie,
      date,
      preuve,
      commentaire,
      responsable,
    });

    setBusy(null);
    if (!res.ok) {
      setErreur(res.error ?? "L’engagement n’a pas pu être enregistré.");
      return;
    }

    router.push(close);
    router.refresh();
  }

  async function retirer() {
    if (!engagement) return;
    setBusy("delete");
    setErreur(null);

    const res = await deleteV2Commitment({ operationId, id: engagement.id });

    setBusy(null);
    if (!res.ok) {
      setErreur(res.error ?? "L’engagement n’a pas pu être retiré.");
      return;
    }

    router.push(close);
    router.refresh();
  }

  return (
    <>
      <Link aria-label="Fermer" className="v2-scrim" href={close} />
      <aside className="v2-sidepanel v2-lever-panel">
        <header>
          <div>
            <span className="v2-section-label">Déclaration de l’équipe</span>
            <h2>
              {engagement ? "Modifier l’engagement" : "Enregistrer un engagement"}
            </h2>
          </div>
          <Link aria-label="Fermer" href={close}>
            ×
          </Link>
        </header>

        <div className="v2-sidepanel-body">
          {erreur && (
            <p className="v2-auth-error" role="alert">
              {erreur}
            </p>
          )}

          <label className="v2-field" data-wide="true">
            <span>Investisseur</span>
            <span className="v2-control">
              <select
                disabled={engagement !== null}
                onChange={(event) => setInvestorId(event.target.value)}
                value={investorId}
              >
                {investisseurs.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.organisation ? `${i.organisation} — ${i.nom}` : i.nom}
                  </option>
                ))}
              </select>
            </span>
            {engagement && (
              <small className="v2-field-helper">
                Un investisseur porte un seul engagement courant. Pour le
                déplacer, retirez celui-ci et enregistrez-en un autre.
              </small>
            )}
          </label>

          <fieldset className="v2-level-choice">
            <legend>Niveau</legend>
            {NIVEAUX.map((n) => (
              <label data-active={niveau === n.cle} key={n.cle}>
                <input
                  checked={niveau === n.cle}
                  name="level"
                  onChange={() => setNiveau(n.cle)}
                  type="radio"
                />
                <span>
                  <strong>{n.label}</strong>
                  <small>{n.aide}</small>
                </span>
              </label>
            ))}
          </fieldset>

          <div className="v2-wizard-grid">
            <label className="v2-field">
              <span>Montant</span>
              <span className="v2-control">
                <input
                  inputMode="numeric"
                  onChange={(event) => setMontant(event.target.value)}
                  placeholder="80 000 000"
                  value={montant}
                />
              </span>
            </label>
            <label className="v2-field">
              <span>Devise</span>
              <span className="v2-control">
                <input
                  onChange={(event) => setMonnaie(event.target.value)}
                  value={monnaie}
                />
              </span>
            </label>
            <label className="v2-field" data-wide="true">
              <span>Date</span>
              <span className="v2-control">
                <input
                  onChange={(event) => setDate(event.target.value)}
                  type="date"
                  value={date}
                />
              </span>
            </label>
          </div>

          <label className="v2-field" data-wide="true">
            <span>
              Preuve ou référence <small>— facultatif</small>
            </span>
            <span className="v2-control">
              <input
                onChange={(event) => setPreuve(event.target.value)}
                placeholder="Term sheet signé, e-mail du 27-07…"
                value={preuve}
              />
            </span>
          </label>

          <label className="v2-field" data-wide="true">
            <span>
              Responsable <small>— facultatif</small>
            </span>
            <span className="v2-control">
              <input
                onChange={(event) => setResponsable(event.target.value)}
                placeholder="Qui suit cette relation"
                value={responsable}
              />
            </span>
          </label>

          <label className="v2-field v2-configure-textarea">
            <span>Commentaire</span>
            <textarea
              onChange={(event) => setCommentaire(event.target.value)}
              placeholder="Ce qui a été dit, et sous quelle réserve."
              value={commentaire}
            />
          </label>

          <p className="v2-panel-callout">
            <Icon name="shield" />
            Cet engagement est déclaré par votre équipe. Il n’est pas déduit de
            l’activité documentaire de l’investisseur.
          </p>
        </div>

        <footer className="v2-sidepanel-footer">
          {engagement ? (
            <button disabled={busy !== null} onClick={retirer} type="button">
              {busy === "delete" ? "…" : "Retirer"}
            </button>
          ) : (
            <Link href={close}>Annuler</Link>
          )}
          <button
            className="v2-btn"
            disabled={busy !== null || !investorId}
            onClick={enregistrer}
            type="button"
          >
            {busy === "save" ? "Enregistrement…" : "Enregistrer l’engagement"}
          </button>
        </footer>
      </aside>
    </>
  );
}
