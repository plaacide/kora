"use client";

import { useState } from "react";

import { economieAnnuelle, prixAffiche } from "@/features/v2/billing/format";
import type { Plan } from "@/features/v2/billing/types";

import { Icon } from "./Icon";

/**
 * Payer un plan — un choix, un prix, un bouton.
 *
 * CE QUE CET ÉCRAN NE DEMANDE PLUS, ET POURQUOI. Il réclamait le moyen de
 * paiement et le numéro de téléphone. Genius Pay redemande exactement les deux
 * sur sa propre page : on faisait donc saisir deux fois la même chose, en
 * collectant au passage une donnée personnelle dont on n'a aucun usage — le
 * numéro ne servait qu'à être transmis puis oublié.
 *
 * Ne reste ici que ce qui NOUS appartient : quel plan, et sur quel rythme. Le
 * reste est le métier du prestataire, et sa page le fait mieux que nous — elle
 * connaît les opérateurs disponibles dans le pays du payeur, ce que nous ne
 * saurions pas deviner.
 *
 * CE QU'IL NE PROMET PAS : aucune phrase ne dit « automatique ». Genius Pay ne
 * confirme pas que le renouvellement est un prélèvement, et son tableau de bord
 * n'expose aucun événement d'abonnement. Chaque échéance est, à ce jour, un
 * paiement à part entière.
 */
export function PlanCheckout({
  onFermer,
  onPayer,
  plan,
}: {
  onFermer: () => void;
  onPayer: (choix: {
    planCode: string;
    intervalle: "month" | "year";
  }) => Promise<{ ok: boolean; error?: string; url?: string; instruction?: string }>;
  plan: Plan;
}) {
  const [intervalle, setIntervalle] = useState<"month" | "year">("month");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [instruction, setInstruction] = useState<string | null>(null);

  const prix = prixAffiche(plan, intervalle);
  const economie = economieAnnuelle(plan);

  async function soumettre() {
    setEnvoi(true);
    setErreur(null);

    const resultat = await onPayer({ planCode: plan.code, intervalle });

    if (!resultat.ok) {
      setEnvoi(false);
      setErreur(resultat.error ?? "Le paiement n’a pas pu être ouvert.");
      return;
    }

    if (resultat.url) {
      // Le paiement se termine chez le prestataire. On ne remet pas `envoi` à
      // faux : la page va disparaître, et un bouton qui redevient cliquable
      // pendant la redirection invite à payer deux fois.
      window.location.href = resultat.url;
      return;
    }

    setEnvoi(false);
    setInstruction(resultat.instruction ?? "Votre demande est enregistrée.");
  }

  if (instruction) {
    return (
      <section className="v2-plan-card">
        <div className="v2-nav-label">Paiement demandé</div>
        <p className="v2-panel-callout">
          <Icon name="check" />
          {instruction}
        </p>
        <div className="v2-form-actions">
          <span />
          <div>
            <button className="v2-btn" onClick={onFermer} type="button">
              Fermer
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="v2-plan-card">
      <header className="v2-checkout-header">
        <div>
          <span className="v2-nav-label">Passer au plan</span>
          <h2>{plan.nom}</h2>
        </div>
        <div className="v2-segmented">
          {(["month", "year"] as const).map((valeur) => (
            <button
              data-active={intervalle === valeur}
              key={valeur}
              onClick={() => setIntervalle(valeur)}
              type="button"
            >
              {valeur === "year" ? "Annuel" : "Mensuel"}
            </button>
          ))}
        </div>
      </header>

      <div className="v2-plan-price">
        <strong>{prix.principal}</strong>
        {prix.detail && <span>{prix.detail}</span>}
        {intervalle === "year" && economie !== null && (
          <span className="v2-plan-economie">{economie} % d’économie</span>
        )}
      </div>

      <p className="v2-field-helper">
        Vous réglez {intervalle === "year" ? "un an" : "un mois"} d’avance.
        L’opérateur ou la carte se choisit à l’étape suivante, sur la page
        sécurisée de notre prestataire. Nous vous préviendrons avant l’échéance
        suivante.
      </p>

      {erreur && (
        <p className="v2-auth-error" role="alert">
          {erreur}
        </p>
      )}

      <div className="v2-form-actions">
        <button className="v2-onboard-back" onClick={onFermer} type="button">
          Annuler
        </button>
        <div>
          <button className="v2-btn" disabled={envoi} onClick={soumettre} type="button">
            {envoi ? "Ouverture…" : `Payer ${prix.principal}`}
          </button>
        </div>
      </div>
    </section>
  );
}
