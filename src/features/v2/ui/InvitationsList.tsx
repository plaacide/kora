"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { decideV2Request } from "@/app/v2/(workspace)/invitations/actions";
import { dateJournal } from "@/features/v2/domain/journal";
import type { Boite, DemandeDetail, EntreeBoite } from "@/features/v2/server/inbox";
import { EmptyMedallion } from "./EmptyArt";
import { messageDErreur } from "@/features/v2/domain/erreurs";
import { Icon } from "./Icon";

/**
 * Écran 65 — la boîte de réception.
 *
 * Le pendant de Partage et accès : là on envoie, ici on reçoit. Deux sources
 * s'y mêlent — demandes d'accès et invitations de cohorte — parce qu'un
 * fondateur n'a pas deux boîtes en tête : il a ce qu'il doit traiter, et ce
 * qui l'est déjà.
 *
 * Cet écran vit hors de toute opération : chaque ligne nomme donc la sienne.
 */
export function InvitationsListScreen({
  boite,
  demande,
}: {
  boite: Boite;
  /** La demande ouverte pour examen, si l'URL en désigne une. */
  demande: DemandeDetail | null;
}) {
  const vide = boite.aTraiter.length === 0 && boite.traitees.length === 0;

  return (
    <div className="v2-inbox">
      {vide ? (
        <section className="v2-drop-empty">
          <EmptyMedallion icon="inbox" />
          <h2>Rien à traiter</h2>
          <p>
            Les demandes d’accès à vos data rooms et les invitations reçues
            d’un programme arrivent ici. Ce que vous envoyez, vous, se suit
            depuis Partage et accès de chaque opération.
          </p>
        </section>
      ) : (
        <>
          {boite.aTraiter.length > 0 && (
            <section>
              <h2>À traiter</h2>
              <ul>
                {boite.aTraiter.map((entree) => (
                  <Ligne entree={entree} key={entree.id} />
                ))}
              </ul>
            </section>
          )}

          {boite.traitees.length > 0 && (
            <section>
              <h2>Traitées récemment</h2>
              <ul>
                {boite.traitees.map((entree) => (
                  <Ligne entree={entree} key={entree.id} />
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {demande && <RequestPanel demande={demande} />}
    </div>
  );
}

function Ligne({ entree }: { entree: EntreeBoite }) {
  return (
    <li>
      <span className="v2-person-avatar">{entree.initiales}</span>
      <div>
        <strong>{entree.titre}</strong>
        <small>{entree.contexte}</small>
      </div>
      <time>{dateJournal(entree.at)}</time>
      <Link className="v2-btn" data-variant="secondary" href={entree.action.href}>
        {entree.action.label}
      </Link>
    </li>
  );
}

/**
 * Écran 26 — examiner une demande d'accès.
 *
 * Accorder ne pose pas une étiquette : `decide_access_request` crée les
 * permissions réelles sur les dossiers de l'opération. C'est dit à l'écran,
 * parce que le fondateur doit savoir qu'il ouvre une porte et non qu'il range
 * un message.
 */
function RequestPanel({ demande }: { demande: DemandeDetail }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [note, setNote] = useState("");

  async function decider(decision: "granted" | "refused") {
    setBusy(decision);
    setErreur(null);

    const res = await decideV2Request({
      requestId: demande.id,
      decision,
      note,
    });

    setBusy(null);
    if (!res.ok) {
      setErreur(messageDErreur(res.code));
      return;
    }

    router.push("/v2/invitations");
    router.refresh();
  }

  return (
    <>
      <Link aria-label="Fermer" className="v2-scrim" href="/v2/invitations" />
      <aside className="v2-sidepanel">
        <header>
          <div>
            <span className="v2-panel-eyebrow">Demande d’accès</span>
            <h2>{demande.investisseur}</h2>
          </div>
          <Link aria-label="Fermer" href="/v2/invitations">×</Link>
        </header>

        <div className="v2-sidepanel-body">
          {erreur && (
            <p className="v2-auth-error" role="alert">
              {erreur}
            </p>
          )}

          <div className="v2-detail-grid">
            <div>
              <small>Opération demandée</small>
              <strong>{demande.operationName}</strong>
            </div>
            <div>
              <small>Reçue le</small>
              <strong>{dateJournal(demande.createdAt)}</strong>
            </div>
            {demande.instrument && (
              <div>
                <small>Instrument</small>
                <strong>{demande.instrument}</strong>
              </div>
            )}
            {demande.email && (
              <div>
                <small>Adresse</small>
                <strong>{demande.email}</strong>
              </div>
            )}
          </div>

          {demande.message && (
            <section>
              <small>Message joint</small>
              <p className="v2-request-quote">{demande.message}</p>
            </section>
          )}

          <label className="v2-field">
            <span>
              Note interne <small>— facultative, jamais transmise</small>
            </span>
            <span className="v2-control">
              <textarea
                onChange={(event) => setNote(event.target.value)}
                placeholder="Ce qui a motivé la décision."
                rows={3}
                value={note}
              />
            </span>
          </label>

          <p className="v2-panel-note">
            <Icon name="shield" />
            Accorder ouvre réellement les dossiers de l’opération à cette
            adresse — ce n’est pas un simple classement. Pour choisir un
            périmètre plus étroit, refusez ici et créez l’accès depuis Partage
            et accès.
          </p>
        </div>

        <footer className="v2-sidepanel-footer">
          <button
            disabled={busy !== null}
            onClick={() => decider("refused")}
            type="button"
          >
            {busy === "refused" ? "…" : "Refuser"}
          </button>
          <button
            className="v2-btn"
            disabled={busy !== null}
            onClick={() => decider("granted")}
            type="button"
          >
            {busy === "granted" ? "Ouverture…" : "Accorder l’accès"}
          </button>
        </footer>
      </aside>
    </>
  );
}
