import { describe, expect, it } from "vitest";

import { badgeEtat, bandeauEtat, etatAbonnement, limiteLaPlusTendue } from "./etat";
import type { Abonnement, Consommation, Plan, StatutAbonnement } from "./types";

const PLAN: Plan = {
  id: "p",
  code: "business_raise",
  nom: "Raise",
  description: null,
  segment: "business",
  gratuit: false,
  surDevis: false,
  badge: null,
  ordre: 2,
  prix: [],
};

function abo(
  statut: StatutAbonnement,
  resiliationEnFinDePeriode = false,
): Abonnement {
  return {
    id: "a",
    plan: PLAN,
    statut,
    intervalle: "month",
    debutPeriode: null,
    finPeriode: "2026-09-01T00:00:00Z",
    finEssai: null,
    resiliationEnFinDePeriode,
  };
}

const date = (iso: string) => (iso.startsWith("2026-09") ? "1er septembre 2026" : iso);

describe("etatAbonnement", () => {
  it("sans abonnement, c’est le plan gratuit", () => {
    expect(etatAbonnement(null)).toBe("gratuit");
  });

  it("distingue l’impayé du résilié", () => {
    // Les deux finissent par restreindre, mais l'un doit de l'argent et
    // l'autre non. Les confondre traiterait un client parti proprement comme
    // un mauvais payeur.
    expect(etatAbonnement(abo("past_due"))).toBe("impaye");
    expect(etatAbonnement(abo("cancelled"))).toBe("termine");
  });

  it("voit une résiliation annoncée sur un abonnement encore actif", () => {
    // `cancel_at_period_end` ne change pas le statut : l'abonnement reste
    // servi. C'est justement ce qu'il faut montrer.
    expect(etatAbonnement(abo("active", true))).toBe("resiliation_annoncee");
    expect(etatAbonnement(abo("active", false))).toBe("actif");
  });

  it("reconnaît l’essai et l’attente de paiement", () => {
    expect(etatAbonnement(abo("trialing"))).toBe("essai");
    expect(etatAbonnement(abo("pending"))).toBe("paiement_en_attente");
  });

  it("traite un contrat manuel comme un abonnement actif", () => {
    expect(etatAbonnement(abo("manual_contract"))).toBe("actif");
  });
});

describe("badgeEtat", () => {
  it("annonce la date de fin plutôt que de dire « Actif »", () => {
    const badge = badgeEtat("resiliation_annoncee", "2026-09-01T00:00:00Z", date);
    expect(badge.label).toBe("Résilié — actif jusqu’au 1er septembre 2026");
    expect(badge.tone).toBe("amber");
  });

  it("reste lisible quand la date manque", () => {
    expect(badgeEtat("resiliation_annoncee", null, date).label).toContain("terme");
  });

  it("réserve le rouge à l’impayé", () => {
    expect(badgeEtat("impaye", null, date).tone).toBe("red");
    // Une limite atteinte ou une attente de paiement ne sont pas des fautes.
    expect(badgeEtat("paiement_en_attente", null, date).tone).toBe("amber");
    expect(badgeEtat("actif", null, date).tone).toBe("green");
  });
});

describe("bandeauEtat", () => {
  it("ne dit rien quand tout va bien", () => {
    // Un écran qui porte en permanence un encart apprend à ne plus être lu.
    expect(bandeauEtat("actif")).toBeNull();
    expect(bandeauEtat("gratuit")).toBeNull();
    expect(bandeauEtat("essai")).toBeNull();
  });

  it("promet qu’aucun montant n’a été débité sur un échec", () => {
    const b = bandeauEtat("impaye");
    expect(b?.explication).toContain("Aucun montant");
    expect(b?.action).toBe("reessayer");
  });

  it("dit de ne PAS repayer pendant une validation", () => {
    // Le cas le plus coûteux : quelqu'un qui repaie parce qu'on ne lui a pas
    // dit d'attendre.
    expect(bandeauEtat("paiement_en_attente")?.explication).toContain("repayer");
    expect(bandeauEtat("paiement_en_attente")?.action).toBeNull();
  });

  it("offre le retour en arrière sur une résiliation annoncée", () => {
    expect(bandeauEtat("resiliation_annoncee")?.action).toBe("reprendre");
  });

  it("rassure sur les données à la fin d’un abonnement", () => {
    const b = bandeauEtat("termine");
    expect(b?.explication).toContain("intacts");
    expect(b?.action).toBe("souscrire");
  });
});

describe("limiteLaPlusTendue", () => {
  const c = (code: string, utilise: number, limite: number | null): Consommation => ({
    code,
    nom: code,
    limite,
    utilise,
    part: null,
    depasse: limite !== null && utilise > limite,
  });

  it("ne trouve rien tant qu’aucune limite n’est atteinte", () => {
    expect(limiteLaPlusTendue([c("active_deals", 1, 3)])).toBeNull();
  });

  it("nomme la limite atteinte, pour que la sortie proposée parle", () => {
    const trouvee = limiteLaPlusTendue([c("internal_users", 1, 3), c("active_deals", 1, 1)]);
    expect(trouvee?.code).toBe("active_deals");
  });

  it("choisit la plus dépassée quand plusieurs le sont", () => {
    const trouvee = limiteLaPlusTendue([c("a", 2, 2), c("b", 9, 3)]);
    expect(trouvee?.code).toBe("b");
  });

  it("ignore l’illimité", () => {
    expect(limiteLaPlusTendue([c("external_visitors", 900, null)])).toBeNull();
  });
});
