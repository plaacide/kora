"use client";

import { useState } from "react";

import { moisOfferts, prixAffiche } from "@/features/v2/billing/format";
import type { Plan } from "@/features/v2/billing/types";
import { dateJournal } from "@/features/v2/domain/journal";

import { Icon } from "./Icon";

/**
 * « Passer au plan X » — écran 75, transcrit.
 *
 * UNE MODALE ET NON UNE SECTION. Choisir un plan interrompt ce qu'on faisait :
 * l'écran le dit en posant un voile sur la page. Une section dépliée en ligne,
 * comme dans ma première version, laisse croire qu'on peut continuer à lire
 * autour — alors qu'il n'y a plus qu'une décision à prendre.
 *
 * SANZA NE COLLECTE AUCUNE DONNÉE DE PAIEMENT. Pas de moyen, pas de numéro :
 * Genius Pay les demande sur sa page, où il connaît les opérateurs du pays du
 * payeur. Le bouton dit « Continuer vers le paiement » et non « Payer » —
 * parce que c'est exactement ce qu'il fait : il emmène ailleurs.
 *
 * LE MONTANT AFFICHÉ EST CELUI DÛ AUJOURD'HUI. Aujourd'hui c'est le tarif
 * plein : rien ne calcule encore de prorata côté base. Le jour où ce sera le
 * cas, seule la valeur changera — la ligne « À régler aujourd'hui » est déjà
 * là, et c'est elle que le handoff veut voir.
 */
export function PlanCheckout({
  onFermer,
  onPayer,
  plan,
  prochaineEcheance,
}: {
  onFermer: () => void;
  onPayer: (choix: {
    planCode: string;
    intervalle: "month" | "year";
  }) => Promise<{ ok: boolean; error?: string; url?: string; instruction?: string }>;
  plan: Plan;
  /** La date de la prochaine échéance, telle que la base la connaîtra. */
  prochaineEcheance: string | null;
}) {
  const [intervalle, setIntervalle] = useState<"month" | "year">("month");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [instruction, setInstruction] = useState<string | null>(null);

  const mensuel = prixAffiche(plan, "month");
  const annuel = prixAffiche(plan, "year");
  const choisi = intervalle === "year" ? annuel : mensuel;
  const offerts = moisOfferts(plan);

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
      // On ne relâche PAS le bouton : la page va disparaître, et un bouton
      // redevenu cliquable pendant la redirection invite à payer deux fois.
      window.location.href = resultat.url;
      return;
    }

    setEnvoi(false);
    setInstruction(resultat.instruction ?? "Votre demande est enregistrée.");
  }

  return (
    <>
      <button aria-label="Fermer" className="v2-scrim" onClick={onFermer} type="button" />
      <div aria-modal="true" className="v2-dialog v2-dialog-lg" role="dialog">
        <header>
          <span className="v2-nav-label">Votre abonnement</span>
          <h2>Passer au plan {plan.nom}</h2>
        </header>

        {instruction ? (
          <>
            <div className="v2-dialog-lg-body">
              <p className="v2-panel-callout">
                <Icon name="check" />
                {instruction}
              </p>
            </div>
            <footer>
              <button className="v2-btn" onClick={onFermer} type="button">
                Fermer
              </button>
            </footer>
          </>
        ) : (
          <>
            <div className="v2-dialog-lg-body">
              <div className="v2-field" data-wide="true">
                <span>Facturation</span>
                <div className="v2-billing-choices">
                  <button
                    data-selected={intervalle === "month"}
                    onClick={() => setIntervalle("month")}
                    type="button"
                  >
                    <b>Mensuelle</b>
                    <span>{mensuel.principal} / mois</span>
                  </button>
                  <button
                    data-selected={intervalle === "year"}
                    onClick={() => setIntervalle("year")}
                    type="button"
                  >
                    <b>Annuelle</b>
                    <span>
                      {annuel.principal} / an
                      {offerts ? ` · ${offerts} mois offerts` : ""}
                    </span>
                  </button>
                </div>
              </div>

              <div className="v2-kv-rows">
                <div>
                  <span>Plan</span>
                  <span>
                    {plan.nom}
                    {plan.description ? ` · ${plan.description}` : ""}
                  </span>
                </div>
                <div>
                  <span>Prochaine échéance</span>
                  <span>
                    {prochaineEcheance
                      ? dateJournal(prochaineEcheance)
                      : intervalle === "year"
                        ? "dans un an"
                        : "dans un mois"}
                  </span>
                </div>
                <div data-fort="true">
                  <span>À régler aujourd’hui</span>
                  <span>{choisi.principal}</span>
                </div>
              </div>

              <p className="v2-dialog-band">
                Le paiement se fait sur la page sécurisée de <b>Genius Pay</b>.
                Vous y choisirez votre moyen de paiement — mobile money (Wave,
                Orange Money, MTN, Moov) ou carte bancaire. Sanza ne conserve
                aucune donnée de paiement.
              </p>

              <p className="v2-dialog-note">
                Nous vous préviendrons avant chaque échéance. Sans paiement,
                votre espace passe en lecture seule — rien n’est supprimé.
              </p>

              {/* CE QUE L'ATTENTE ATTEND. Leur API a mis jusqu'à 21 secondes à
                  répondre le 1er août. Un bouton qui dit « Ouverture… » sans
                  rien d'autre laisse croire à un blocage, et l'on recommence —
                  ce qui crée une transaction de plus à chaque fois. */}
              {envoi && (
                <p className="v2-dialog-note" role="status">
                  Nous préparons votre paiement chez Genius Pay. Cela peut
                  prendre quelques secondes — ne fermez pas cette fenêtre.
                </p>
              )}

              {erreur && (
                <p className="v2-auth-error" role="alert">
                  {erreur}
                </p>
              )}
            </div>

            <footer>
              <button
                className="v2-btn-quiet"
                disabled={envoi}
                onClick={onFermer}
                type="button"
              >
                Annuler
              </button>
              <button className="v2-btn" disabled={envoi} onClick={soumettre} type="button">
                {envoi ? "Préparation…" : "Continuer vers le paiement →"}
              </button>
            </footer>
          </>
        )}
      </div>
    </>
  );
}
