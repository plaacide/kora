"use client";

import { useState } from "react";

import { economieAnnuelle, prixAffiche } from "@/features/v2/billing/format";
import type { Plan } from "@/features/v2/billing/types";

import { messageDErreur, type Resultat } from "@/features/v2/domain/erreurs";
import { Icon } from "./Icon";
import { PlanCheckout } from "./PlanCheckout";

/**
 * Le choix d'un autre plan, puis son paiement.
 *
 * CE QUI MANQUAIT. La section existait, elle listait les plans du segment — et
 * se terminait par « le changement de plan en ligne n'est pas encore ouvert,
 * écrivez-nous ». Toute la plomberie était pourtant là : les RPC, les actions
 * serveur, le prestataire. Il n'y avait aucun bouton pour les appeler.
 *
 * Un seul plan est ouvert à la fois : afficher trois formulaires de paiement
 * côte à côte inviterait à en remplir deux.
 */
export function ChangerDePlan({
  autres,
  onPayer,
  onRevenirAuGratuit,
  prochaineEcheance,
}: {
  autres: readonly Plan[];
  onPayer: (choix: {
    planCode: string;
    intervalle: "month" | "year";
  }) => Promise<Resultat<{ url?: string; instruction?: string }>>;
  /** Redescendre vers le plan gratuit : aucun paiement, une annonce. */
  onRevenirAuGratuit: (planCode: string) => Promise<Resultat>;
  prochaineEcheance: string | null;
}) {
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [descente, setDescente] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  // La bascule vit DANS l'en-tête de la carte, avec son avantage : le handoff
  // refuse le « −17 % » en texte vert isolé, qui flotte sans dire à quoi il
  // s'applique.
  const [intervalle, setIntervalle] = useState<"month" | "year">("month");

  const planOuvert = autres.find((p) => p.code === ouvert) ?? null;
  const remise = autres.map(economieAnnuelle).find((e) => e !== null) ?? null;

  return (
    <>
      <section className="v2-plan-card">
        <header className="v2-checkout-header">
          <span className="v2-nav-label">Changer de plan</span>
          <div className="v2-segmented">
            <button
              data-active={intervalle === "month"}
              onClick={() => setIntervalle("month")}
              type="button"
            >
              Mensuel
            </button>
            <button
              data-active={intervalle === "year"}
              onClick={() => setIntervalle("year")}
              type="button"
            >
              Annuel{remise !== null ? ` · −${remise} %` : ""}
            </button>
          </div>
        </header>

        <div className="v2-plan-rows">
          {autres.map((autre) => {
            const p = prixAffiche(autre, intervalle);
            return (
              <div key={autre.code}>
                <div>
                  <b>
                    {autre.nom}
                    {autre.badge && <span className="v2-tag">{autre.badge}</span>}
                  </b>
                  <p>{autre.description}</p>
                </div>
                <div className="v2-plan-rows-prix">
                  <strong>{p.principal}</strong>
                  {p.detail && <span>{p.detail}</span>}
                </div>
                <div className="v2-plan-rows-action">
                  {/* On ne fait PAS payer un plan gratuit : le prestataire
                      refuse sous 200 XOF, et y revenir est une descente, pas
                      un achat. Et « Choisir » reste GRIS — l'orange est
                      réservé à l'action primaire de la page. */}
                  {autre.gratuit ? (
                    <button
                      className="v2-btn v2-btn-grey v2-btn-sm"
                      disabled={descente === autre.code}
                      // LE RÉSULTAT ÉTAIT IGNORÉ. La promesse partait sans
                      // qu'on l'attende : en cas de refus — droits
                      // insuffisants, plan inconnu — le bouton clignotait et
                      // rien ne changeait, sans un mot d'explication. Un geste
                      // qui échoue en silence est pire qu'un geste absent.
                      onClick={async () => {
                        setDescente(autre.code);
                        setErreur(null);
                        const resultat = await onRevenirAuGratuit(autre.code);
                        setDescente(null);
                        if (!resultat.ok) {
                          setErreur(messageDErreur(resultat.code));
                        }
                      }}
                      type="button"
                    >
                      {descente === autre.code ? "…" : "Revenir à ce plan"}
                    </button>
                  ) : autre.surDevis ? (
                    <span className="v2-plan-rows-devis">Sur devis</span>
                  ) : (
                    <button
                      className="v2-btn v2-btn-grey v2-btn-sm"
                      onClick={() => setOuvert(autre.code)}
                      type="button"
                    >
                      Choisir
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {erreur && (
          <p className="v2-auth-error" role="alert">
            {erreur}
          </p>
        )}

        <p className="v2-plan-rows-note">
          <Icon name="shield" />
          Passer à un plan inférieur ne supprime aucune donnée. La période déjà
          réglée court jusqu’à son terme ; seules les créations au-delà de la
          nouvelle limite sont refusées ensuite.
        </p>
      </section>

      {planOuvert && (
        <PlanCheckout
          onFermer={() => setOuvert(null)}
          onPayer={onPayer}
          plan={planOuvert}
          prochaineEcheance={prochaineEcheance}
        />
      )}
    </>
  );
}
