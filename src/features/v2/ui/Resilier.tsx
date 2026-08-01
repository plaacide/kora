"use client";

import { useState } from "react";

import type { Abonnement } from "@/features/v2/billing/types";
import { dateJournal } from "@/features/v2/domain/journal";

import { messageDErreur, type Resultat } from "@/features/v2/domain/erreurs";
import { Icon } from "./Icon";

/**
 * Résilier — écran 77, transcrit.
 *
 * LE ROUGE N'EST PAS UN DÉTAIL. J'avais peint « Confirmer la résiliation » en
 * orange, la couleur d'action primaire du produit — celle de « Continuer »,
 * « Enregistrer », « Payer ». Un geste destructif porté par la couleur du
 * geste qu'on fait vingt fois par jour se clique par habitude. Le handoff
 * tranche : rouge plein, et « Garder mon abonnement » en gris à côté.
 *
 * LES TROIS ASSURANCES VIENNENT AVANT LE CHAMP, pas après. Quelqu'un qui hésite
 * les lit avant de décider ; les mettre sous le formulaire reviendrait à
 * rassurer une fois la décision prise.
 *
 * Et jamais « Êtes-vous sûr ? » — on dit ce qui se passe, pourquoi, et ce
 * qu'on peut faire ensuite.
 */

const ASSURANCES = [
  "Aucune donnée n’est supprimée, ni maintenant ni après. Vos opérations, vos " +
    "pièces et votre journal restent consultables.",
  "Après l’échéance, votre espace passe en lecture seule — seules les créations " +
    "au-delà du plan gratuit se ferment.",
  "Vous pouvez vous réabonner à tout moment et tout retrouver.",
];

export function Resilier({
  abonnement,
  onReprendre,
  onResilier,
}: {
  abonnement: Abonnement;
  /** Revenir sur une résiliation annoncée, tant que le terme n'est pas passé. */
  onReprendre: () => Promise<Resultat>;
  onResilier: (motif: string) => Promise<Resultat>;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [motif, setMotif] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const terme = abonnement.finPeriode ? dateJournal(abonnement.finPeriode) : null;

  // DÉJÀ RÉSILIÉ : on ne propose pas de recommencer, on offre le retour. Le
  // texte promet qu'on peut se réabonner à tout moment — sans ce bouton, cette
  // promesse obligerait à écrire au support.
  if (abonnement.resiliationEnFinDePeriode) {
    return (
      <section className="v2-plan-card v2-plan-resiliation">
        <div>
          <b>Résiliation</b>
          <p>
            Votre abonnement prend fin{terme ? ` le ${terme}` : ""}. D’ici là,
            rien ne change — et vous pouvez encore revenir sur cette décision.
          </p>
        </div>
        <button
          className="v2-btn"
          disabled={envoi}
          onClick={async () => {
            setEnvoi(true);
            setErreur(null);
            const resultat = await onReprendre();
            setEnvoi(false);
            if (!resultat.ok) setErreur(messageDErreur(resultat.code));
          }}
          type="button"
        >
          {envoi ? "…" : "Reprendre mon abonnement"}
        </button>
        {erreur && (
          <p className="v2-auth-error" role="alert">
            {erreur}
          </p>
        )}
      </section>
    );
  }

  return (
    <>
      <section className="v2-plan-card v2-plan-resiliation">
        <div>
          <b>Résiliation</b>
          <p>
            Votre abonnement court jusqu’au terme déjà réglé, puis l’espace
            passe en lecture seule — rien n’est supprimé.
          </p>
        </div>
        <button className="v2-btn v2-btn-grey" onClick={() => setOuvert(true)} type="button">
          Résilier mon abonnement
        </button>
      </section>

      {ouvert && (
        <>
          <button
            aria-label="Fermer"
            className="v2-scrim"
            onClick={() => setOuvert(false)}
            type="button"
          />
          <div aria-modal="true" className="v2-dialog v2-dialog-lg" role="dialog">
            <header>
              <h2>Résilier votre abonnement&nbsp;?</h2>
              <p>
                Votre plan reste entier
                {terme ? (
                  <>
                    {" "}
                    jusqu’au <b>{terme}</b>
                  </>
                ) : (
                  " jusqu’au terme de la période en cours"
                )}{" "}
                — la période réglée vous est due. Rien n’est coupé aujourd’hui.
              </p>
            </header>

            <div className="v2-dialog-lg-body">
              <ul className="v2-check-list">
                {ASSURANCES.map((phrase) => (
                  <li key={phrase}>
                    <Icon name="check" />
                    <span>{phrase}</span>
                  </li>
                ))}
              </ul>

              <label className="v2-field" data-wide="true">
                <span>
                  Ce qui vous fait partir <small> · facultatif</small>
                </span>
                <span className="v2-control" data-multiline="true">
                  <textarea
                    onChange={(event) => setMotif(event.target.value)}
                    placeholder="Trop cher, levée terminée, une fonction qui manque…"
                    rows={3}
                    value={motif}
                  />
                </span>
                <small className="v2-field-helper">
                  Personne ne vous rappellera pour vous retenir — c’est pour
                  savoir ce qu’il faut corriger.
                </small>
              </label>

              {erreur && (
                <p className="v2-auth-error" role="alert">
                  {erreur}
                </p>
              )}
            </div>

            <footer>
              <button
                className="v2-btn v2-btn-grey"
                onClick={() => setOuvert(false)}
                type="button"
              >
                Garder mon abonnement
              </button>
              <button
                className="v2-btn v2-btn-danger"
                disabled={envoi}
                onClick={async () => {
                  setEnvoi(true);
                  setErreur(null);
                  const resultat = await onResilier(motif);
                  setEnvoi(false);
                  if (!resultat.ok) {
                    setErreur(messageDErreur(resultat.code));
                    return;
                  }
                  setOuvert(false);
                }}
                type="button"
              >
                {envoi ? "Enregistrement…" : "Confirmer la résiliation"}
              </button>
            </footer>
          </div>
        </>
      )}
    </>
  );
}
