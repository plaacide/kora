"use client";

import { useState } from "react";

import type { Abonnement } from "@/features/v2/billing/types";
import { dateJournal } from "@/features/v2/domain/journal";

import { Icon } from "./Icon";

/**
 * Résilier — le seul geste d'abonnement qui ne dépend d'aucun prestataire.
 *
 * Arrêter un abonnement ne demande à personne d'encaisser. Ce bouton pouvait
 * donc exister bien avant Genius Pay, et il manquait quand même : les RPC et
 * l'action serveur étaient là, rien ne les appelait.
 *
 * TROIS CHOSES QUE CET ÉCRAN DOIT DIRE AVANT QUE LE CLIC N'ARRIVE, parce
 * qu'elles décident si quelqu'un résilie ou renonce :
 *
 *   1. la date exacte jusqu'à laquelle le service reste dû — §15, ce qui est
 *      payé est servi jusqu'au bout ;
 *   2. que RIEN n'est supprimé, jamais — §16, l'espace passe en lecture, il
 *      ne se vide pas ;
 *   3. qu'on peut revenir en arrière tant que la date n'est pas passée.
 *
 * Une résiliation qu'on croit destructrice ne se prend pas : elle se subit en
 * silence, puis se termine par un impayé et un client qui ne répond plus.
 */
export function Resilier({
  abonnement,
  onResilier,
}: {
  abonnement: Abonnement;
  onResilier: (motif: string) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [motif, setMotif] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  // Déjà résiliée : on ne propose pas de le refaire, on dit où on en est.
  if (abonnement.resiliationEnFinDePeriode) {
    return (
      <section className="v2-plan-card">
        <div className="v2-nav-label">Résiliation</div>
        <p className="v2-panel-callout">
          <Icon name="clock" />
          Votre abonnement prend fin
          {abonnement.finPeriode ? ` le ${dateJournal(abonnement.finPeriode)}` : ""}.
          D’ici là, rien ne change. Ensuite, votre espace reste consultable et
          aucune donnée n’est supprimée.
        </p>
        <p className="v2-roles-note">
          <Icon name="help" />
          Pour revenir sur cette décision, choisissez de nouveau votre plan
          ci-dessus — la reprise annule la résiliation.
        </p>
      </section>
    );
  }

  if (!ouvert) {
    return (
      <section className="v2-plan-card">
        <div className="v2-nav-label">Résiliation</div>
        <p className="v2-field-helper">
          Vous pouvez arrêter votre abonnement à tout moment. Il court jusqu’au
          terme que vous avez déjà réglé.
        </p>
        <div className="v2-form-actions">
          <span />
          <div>
            <button
              className="v2-onboard-back"
              onClick={() => setOuvert(true)}
              type="button"
            >
              Résilier mon abonnement
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="v2-plan-card">
      <div className="v2-nav-label">Résilier</div>

      <p className="v2-panel-callout">
        <Icon name="shield" />
        {abonnement.finPeriode ? (
          <>
            Votre plan reste entier jusqu’au{" "}
            <strong>{dateJournal(abonnement.finPeriode)}</strong> — la période
            que vous avez réglée vous est due. Rien n’est coupé aujourd’hui.
          </>
        ) : (
          <>
            Votre plan reste entier jusqu’au terme de la période en cours. Rien
            n’est coupé aujourd’hui.
          </>
        )}
      </p>

      <p className="v2-roles-note">
        <Icon name="folder" />
        <strong>Aucune donnée n’est supprimée</strong>, ni maintenant ni après.
        Vos opérations, vos pièces et votre journal restent en place et
        consultables. Seules les créations au-delà du plan gratuit se ferment.
      </p>

      <label className="v2-field">
        <span>
          Ce qui vous fait partir <small> — facultatif</small>
        </span>
        <span className="v2-control">
          <input
            onChange={(event) => setMotif(event.target.value)}
            placeholder="Trop cher, levée terminée, une fonction qui manque…"
            value={motif}
          />
        </span>
        <small className="v2-field-helper">
          Personne ne vous rappellera pour vous retenir. C’est pour savoir ce
          qu’il faut corriger.
        </small>
      </label>

      {erreur && (
        <p className="v2-auth-error" role="alert">
          {erreur}
        </p>
      )}

      <div className="v2-form-actions">
        <button
          className="v2-onboard-back"
          onClick={() => {
            setOuvert(false);
            setErreur(null);
          }}
          type="button"
        >
          Garder mon abonnement
        </button>
        <div>
          <button
            className="v2-btn"
            disabled={envoi}
            onClick={async () => {
              setEnvoi(true);
              setErreur(null);
              const resultat = await onResilier(motif);
              setEnvoi(false);
              if (!resultat.ok) {
                setErreur(resultat.error ?? "La résiliation n’a pas abouti.");
                return;
              }
              setOuvert(false);
            }}
            type="button"
          >
            {envoi ? "Enregistrement…" : "Confirmer la résiliation"}
          </button>
        </div>
      </div>
    </section>
  );
}
