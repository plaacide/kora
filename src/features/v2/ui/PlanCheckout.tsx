"use client";

import { useState } from "react";

import { prixAffiche } from "@/features/v2/billing/format";
import type { MoyenDePaiement } from "@/features/v2/billing/moyens";
import { MOYENS, phraseEcheance, refusDeSaisie } from "@/features/v2/billing/moyens";
import type { Plan } from "@/features/v2/billing/types";

import { Icon } from "./Icon";

/**
 * Payer un plan — le numéro n'est demandé qu'au moment où il sert.
 *
 * LE CHOIX QUE CET ÉCRAN INCARNE. Le fondateur a tranché : pas de téléphone
 * dans le profil ni à l'inscription, mais AU MOMENT DE PAYER. C'est la bonne
 * réponse, et pas seulement par économie de champs — quelqu'un qui paie par
 * carte n'a aucune raison de laisser son numéro, et le lui réclamer à
 * l'inscription serait collecter une donnée personnelle dont on ne se servira
 * jamais.
 *
 * D'où la conséquence, qui se voit à l'écran : le champ apparaît quand on
 * choisit le mobile money, et disparaît quand on choisit la carte.
 *
 * CE QU'IL NE PROMET PAS. Aucune phrase ne dit « prélèvement automatique ».
 * Genius Pay ne confirme pas que le renouvellement en est un, et en mobile
 * money l'opérateur demande souvent confirmation à chaque débit. Voir
 * `phraseEcheance`.
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
    moyen: MoyenDePaiement;
    telephone: string;
  }) => Promise<{ ok: boolean; error?: string; url?: string; instruction?: string }>;
  plan: Plan;
}) {
  const [intervalle, setIntervalle] = useState<"month" | "year">("month");
  const [choix, setChoix] = useState<MoyenDePaiement>("mobile_money");
  const [telephone, setTelephone] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [instruction, setInstruction] = useState<string | null>(null);

  const moyenChoisi = MOYENS.find((m) => m.code === choix);
  const prix = prixAffiche(plan, intervalle);

  async function soumettre() {
    const refus = refusDeSaisie({ moyen: choix, telephone });
    if (refus) {
      setErreur(refus);
      return;
    }

    setEnvoi(true);
    setErreur(null);

    const resultat = await onPayer({
      planCode: plan.code,
      intervalle,
      moyen: choix,
      telephone,
    });

    setEnvoi(false);

    if (!resultat.ok) {
      setErreur(resultat.error ?? "Le paiement n’a pas pu être ouvert.");
      return;
    }

    if (resultat.url) {
      // Le paiement se termine chez le prestataire. On quitte l'application :
      // aucune donnée de carte ni de code d'opérateur ne doit transiter ici.
      window.location.href = resultat.url;
      return;
    }

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
          <button className="v2-btn" onClick={onFermer} type="button">
            Fermer
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="v2-plan-card">
      <div className="v2-nav-label">Passer au plan {plan.nom}</div>

      <fieldset className="v2-auth-roles">
        <legend>Facturation</legend>
        <div>
          {(["month", "year"] as const).map((valeur) => (
            <button
              data-selected={intervalle === valeur}
              key={valeur}
              onClick={() => setIntervalle(valeur)}
              type="button"
            >
              {valeur === "year" ? "Annuelle" : "Mensuelle"}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="v2-plan-price">
        <strong>{prix.principal}</strong>
        {prix.detail && <span>{prix.detail}</span>}
      </div>

      <fieldset className="v2-auth-roles">
        <legend>Moyen de paiement</legend>
        <div>
          {MOYENS.map((m) => (
            <button
              data-selected={choix === m.code}
              key={m.code}
              onClick={() => {
                setChoix(m.code);
                setErreur(null);
              }}
              type="button"
            >
              {m.label}
            </button>
          ))}
        </div>
      </fieldset>

      {moyenChoisi && <p className="v2-field-helper">{moyenChoisi.aide}</p>}

      {/* Le champ n'existe que pour le moyen qui l'exige. Le griser plutôt que
          le retirer laisserait croire qu'on le veut quand même. */}
      {moyenChoisi?.exigeTelephone && (
        <label className="v2-field">
          <span>Numéro qui recevra la demande de paiement</span>
          <span className="v2-control">
            <input
              autoComplete="tel"
              inputMode="tel"
              onChange={(event) => {
                setTelephone(event.target.value);
                setErreur(null);
              }}
              placeholder="07 12 34 56 78"
              type="tel"
              value={telephone}
            />
          </span>
          <small className="v2-field-helper">
            Il sert uniquement à ce paiement — nous ne le conservons pas.
          </small>
        </label>
      )}

      {moyenChoisi && !moyenChoisi.porteAbonnement && (
        <p className="v2-panel-note">
          <Icon name="shield" />
          La carte ne permet pas la reconduction chez notre prestataire : chaque
          échéance vous sera présentée. Pour un renouvellement suivi, choisissez
          le mobile money.
        </p>
      )}

      <p className="v2-field-helper">{phraseEcheance(choix, intervalle)}</p>

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
            {envoi ? "Ouverture…" : "Payer"}
          </button>
        </div>
      </div>
    </section>
  );
}
