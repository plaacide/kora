"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  deleteV2Interaction,
  saveV2Interaction,
} from "@/app/v2/(workspace)/operations/[operationId]/lever/actions";
import { dateJournal } from "@/features/v2/domain/journal";
import {
  TYPES_INTERACTION,
  libelleInteraction,
  parDateDecroissante,
  type Interaction,
  type InvestisseurPipeline,
  type TypeInteraction,
} from "@/features/v2/domain/pipeline";

import { Icon } from "./Icon";

function lien(extra: Record<string, string>): string {
  return `?${new URLSearchParams({ view: "pipeline", ...extra })}`;
}

/**
 * Les interactions d'une relation — l'onglet « Interactions » de la maquette 41.
 *
 * Le pipeline disait qu'un investisseur était en diligence ; il ne disait pas
 * CE QUI S'EST PASSÉ. Sans cette liste, « prochaine action : relancer David »
 * est une note qu'on ne peut pas justifier — ni devant son associé, ni devant
 * soi-même trois semaines plus tard.
 */
export function InteractionsSection({
  interactions,
  investisseur,
}: {
  interactions: readonly Interaction[];
  investisseur: InvestisseurPipeline;
}) {
  const siennes = parDateDecroissante(
    interactions.filter((i) => i.investorId === investisseur.id),
  );

  return (
    <section className="v2-interactions">
      <header>
        <span className="v2-nav-label">
          Interactions {siennes.length > 0 && `(${siennes.length})`}
        </span>
        <Link
          className="v2-btn-mini"
          href={lien({
            panel: "interaction",
            investisseur: investisseur.id,
            origine: "panel",
          })}
        >
          <Icon name="plus" />
          Consigner
        </Link>
      </header>

      {siennes.length === 0 ? (
        <p className="v2-field-helper">
          Rien de consigné. Un appel, un e-mail, une réunion — ce que vous
          écrivez ici est ce dont vous vous souviendrez.
        </p>
      ) : (
        <ol>
          {siennes.map((i) => (
            <li key={i.id}>
              <span className="v2-interaction-type">
                {libelleInteraction(i.type)}
              </span>
              <div>
                <strong>{i.resultat || i.resume || "Interaction"}</strong>
                <small>
                  {dateJournal(i.date)}
                  {i.responsable ? ` · par ${i.responsable}` : ""}
                  {i.participants ? ` · avec ${i.participants}` : ""}
                </small>
                {i.resume && i.resultat && <p>{i.resume}</p>}
                {i.prochaineAction && (
                  <small className="v2-interaction-next">
                    <Icon name="clock" />
                    {i.prochaineAction}
                    {i.dateRelance ? ` — ${dateJournal(i.dateRelance)}` : ""}
                  </small>
                )}
              </div>
              <Link
                aria-label="Modifier l’interaction"
                href={lien({
                  panel: "interaction",
                  investisseur: investisseur.id,
                  interaction: i.id,
                  origine: "panel",
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

/**
 * Écran 42 — consigner une interaction.
 *
 * SANZA N'ENVOIE NI NE DÉTECTE D'E-MAIL, et l'écran le dit. La nuance décide
 * de l'usage : un fondateur qui croirait sa boîte lue cesserait de consigner,
 * et le pipeline se viderait sans que personne s'en aperçoive.
 */
export function InteractionPanel({
  interaction,
  investisseur,
  operationId,
  origine,
}: {
  /** `null` pour une nouvelle interaction. */
  interaction: Interaction | null;
  investisseur: InvestisseurPipeline;
  operationId: string;
  /**
   * D'où l'on vient — la fiche ou le formulaire de la relation.
   *
   * Sans elle, enregistrer une interaction ouverte depuis la fiche renvoyait
   * au FORMULAIRE de modification : on se retrouvait devant des champs qu'on
   * n'avait pas demandés, et l'interaction qu'on venait d'écrire n'était nulle
   * part en vue.
   */
  origine: "fiche" | "panel";
}) {
  const router = useRouter();
  const retour =
    origine === "fiche"
      ? lien({ fiche: investisseur.id, onglet: "interactions" })
      : lien({ panel: investisseur.id });

  const [type, setType] = useState<TypeInteraction>(
    interaction?.type ?? "appel",
  );
  const [date, setDate] = useState(
    interaction?.date ?? new Date().toISOString().slice(0, 10),
  );
  const [responsable, setResponsable] = useState(
    interaction?.responsable ?? investisseur.responsable ?? "",
  );
  const [participants, setParticipants] = useState(
    interaction?.participants ?? "",
  );
  const [resume, setResume] = useState(interaction?.resume ?? "");
  const [resultat, setResultat] = useState(interaction?.resultat ?? "");
  const [prochaineAction, setProchaineAction] = useState(
    interaction?.prochaineAction ?? "",
  );
  const [dateRelance, setDateRelance] = useState(interaction?.dateRelance ?? "");
  const [busy, setBusy] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  async function enregistrer() {
    setBusy("save");
    setErreur(null);

    const res = await saveV2Interaction({
      operationId,
      investorId: investisseur.id,
      id: interaction?.id ?? null,
      type,
      date,
      responsable,
      participants,
      resume,
      resultat,
      prochaineAction,
      dateRelance,
    });

    setBusy(null);
    if (!res.ok) {
      setErreur(res.error ?? "L’interaction n’a pas pu être enregistrée.");
      return;
    }

    router.push(retour);
    router.refresh();
  }

  async function retirer() {
    if (!interaction) return;
    setBusy("delete");
    setErreur(null);

    const res = await deleteV2Interaction({ operationId, id: interaction.id });

    setBusy(null);
    if (!res.ok) {
      setErreur(res.error ?? "L’interaction n’a pas pu être retirée.");
      return;
    }

    router.push(retour);
    router.refresh();
  }

  return (
    <>
      <Link aria-label="Fermer" className="v2-scrim" href={retour} />
      <aside className="v2-sidepanel v2-lever-panel">
        <header>
          <div>
            <span className="v2-section-label">
              {investisseur.organisation
                ? `${investisseur.organisation} — ${investisseur.nom}`
                : investisseur.nom}
            </span>
            <h2>
              {interaction ? "Modifier l’interaction" : "Ajouter une interaction"}
            </h2>
          </div>
          <Link aria-label="Fermer" href={retour}>
            ×
          </Link>
        </header>

        <div className="v2-sidepanel-body">
          {erreur && (
            <p className="v2-auth-error" role="alert">
              {erreur}
            </p>
          )}

          <fieldset className="v2-choice-field">
            <legend>Type</legend>
            <div>
              {TYPES_INTERACTION.map((t) => (
                <button
                  data-active={type === t.cle}
                  key={t.cle}
                  onClick={() => setType(t.cle)}
                  type="button"
                >
                  {t.label}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="v2-panel-grid">
            <label className="v2-field">
              <span>Date</span>
              <span className="v2-control">
                <input
                  onChange={(event) => setDate(event.target.value)}
                  type="date"
                  value={date}
                />
              </span>
            </label>

            <label className="v2-field">
              <span>Responsable</span>
              <span className="v2-control">
                <input
                  onChange={(event) => setResponsable(event.target.value)}
                  placeholder="Ibrahima Sy"
                  value={responsable}
                />
              </span>
            </label>
          </div>

          <label className="v2-field">
            <span>
              Participants <small>— facultatif</small>
            </span>
            <span className="v2-control">
              <input
                onChange={(event) => setParticipants(event.target.value)}
                placeholder="Kwame Mensah, Awa Cissé"
                value={participants}
              />
            </span>
          </label>

          <label className="v2-field">
            <span>Résumé</span>
            <span className="v2-control">
              <textarea
                onChange={(event) => setResume(event.target.value)}
                placeholder="Ce qui a été dit, et ce qu’il faut en retenir."
                value={resume}
              />
            </span>
          </label>

          <label className="v2-field">
            <span>
              Résultat <small>— facultatif</small>
            </span>
            <span className="v2-control">
              <input
                onChange={(event) => setResultat(event.target.value)}
                placeholder="Positif — attend la table de capitalisation"
                value={resultat}
              />
            </span>
          </label>

          {/* Prochaine action et date de relance remontent sur la relation :
              ce sont elles qui alimentent les relances dues du pipeline, et
              les saisir deux fois finirait par les faire diverger. */}
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

          <p className="v2-panel-callout">
            <Icon name="shield" />
            Cette interaction est consignée par votre équipe — Sanza n’envoie ni
            ne détecte d’e-mail.
          </p>
        </div>

        <footer className="v2-sidepanel-footer">
          {interaction ? (
            <button disabled={busy !== null} onClick={retirer} type="button">
              {busy === "delete" ? "…" : "Retirer"}
            </button>
          ) : (
            <Link href={retour}>Annuler</Link>
          )}
          <button
            className="v2-btn"
            disabled={busy !== null}
            onClick={enregistrer}
            type="button"
          >
            {busy === "save" ? "…" : "Enregistrer l’interaction"}
          </button>
        </footer>
      </aside>
    </>
  );
}
