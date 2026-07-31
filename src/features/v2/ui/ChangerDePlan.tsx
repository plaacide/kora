"use client";

import { useState } from "react";

import { economieAnnuelle, prixAffiche } from "@/features/v2/billing/format";
import type { MoyenDePaiement } from "@/features/v2/billing/moyens";
import type { Plan } from "@/features/v2/billing/types";

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
}: {
  autres: readonly Plan[];
  onPayer: (choix: {
    planCode: string;
    intervalle: "month" | "year";
    moyen: MoyenDePaiement;
    telephone: string;
  }) => Promise<{ ok: boolean; error?: string; url?: string; instruction?: string }>;
}) {
  const [ouvert, setOuvert] = useState<string | null>(null);

  const planOuvert = autres.find((p) => p.code === ouvert) ?? null;

  if (planOuvert) {
    return (
      <PlanCheckout
        onFermer={() => setOuvert(null)}
        onPayer={onPayer}
        plan={planOuvert}
      />
    );
  }

  return (
    <section className="v2-plan-card">
      <div className="v2-nav-label">Changer de plan</div>
      <div className="v2-plan-others">
        {autres.map((autre) => {
          const p = prixAffiche(autre, "month");
          const economie = economieAnnuelle(autre);
          return (
            <div key={autre.code}>
              <div>
                <strong>
                  {autre.nom}
                  {autre.badge && <span className="v2-tag">{autre.badge}</span>}
                </strong>
                <small>{autre.description}</small>
                {economie !== null && (
                  <small className="v2-plan-economie">
                    {economie} % d’économie à l’année
                  </small>
                )}
              </div>
              <div className="v2-plan-others-prix">
                <strong>{p.principal}</strong>
                {p.detail && <small>{p.detail}</small>}
                <button
                  className="v2-btn"
                  onClick={() => setOuvert(autre.code)}
                  type="button"
                >
                  Choisir
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <p className="v2-roles-note">
        <Icon name="shield" />
        Passer à un plan inférieur ne supprime aucune donnée : le plan que vous
        avez réglé court jusqu’à son terme, et seules les créations au-delà de la
        nouvelle limite sont refusées ensuite.
      </p>
    </section>
  );
}
