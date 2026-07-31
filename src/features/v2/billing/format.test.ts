import { describe, expect, it } from "vitest";

import {
  economieAnnuelle,
  joursRestants,
  libelleStatut,
  prixAffiche,
  quantite,
} from "./format";
import type { Plan } from "./types";

function plan(partiel: Partial<Plan>): Plan {
  return {
    id: "p",
    code: "business_raise",
    nom: "Raise",
    description: null,
    segment: "business",
    gratuit: false,
    surDevis: false,
    badge: null,
    ordre: 1,
    prix: [],
    ...partiel,
  };
}

describe("prixAffiche", () => {
  it("dit « Gratuit » plutôt que zéro", () => {
    expect(prixAffiche(plan({ gratuit: true }), "month").principal).toBe(
      "Gratuit",
    );
  });

  it("dit « Sur devis » et donne le plancher", () => {
    const p = plan({
      surDevis: true,
      prix: [
        { devise: "XOF", intervalle: "custom", montant: 9000000, periodes: 1 },
      ],
    });
    const rendu = prixAffiche(p, "month");
    expect(rendu.principal).toBe("Sur devis");
    expect(rendu.detail).toContain("à partir de");
  });

  it("ramène l'annuel à un mensuel, parce que c'est ainsi qu'on compare", () => {
    const p = plan({
      prix: [
        { devise: "XOF", intervalle: "year", montant: 217500, periodes: 1 },
      ],
    });
    expect(prixAffiche(p, "year").detail).toContain("18\u202f125");
  });

  it("n'invente ni mensuel ni annuel pour une cohorte", () => {
    const p = plan({
      prix: [
        { devise: "XOF", intervalle: "cohort", montant: 1125000, periodes: 6 },
      ],
    });
    expect(prixAffiche(p, "month").detail).toBe("par cohorte · 6 mois inclus");
  });
});

describe("economieAnnuelle", () => {
  it("calcule la remise de l'engagement annuel", () => {
    const p = plan({
      prix: [
        { devise: "XOF", intervalle: "month", montant: 21750, periodes: 1 },
        { devise: "XOF", intervalle: "year", montant: 217500, periodes: 1 },
      ],
    });
    expect(economieAnnuelle(p)).toBe(17);
  });

  it("ne promet rien quand il n'y a rien à gagner", () => {
    const p = plan({
      prix: [
        { devise: "XOF", intervalle: "month", montant: 1000, periodes: 1 },
        { devise: "XOF", intervalle: "year", montant: 12000, periodes: 1 },
      ],
    });
    expect(economieAnnuelle(p)).toBeNull();
  });
});

describe("joursRestants", () => {
  it("compte les jours d'essai", () => {
    expect(
      joursRestants("2026-08-14T00:00:00Z", new Date("2026-08-01T00:00:00Z")),
    ).toBe(13);
  });

  it("rend zéro sur un essai déjà fini, jamais un négatif", () => {
    expect(
      joursRestants("2026-07-01T00:00:00Z", new Date("2026-08-01T00:00:00Z")),
    ).toBe(0);
  });

  it("rend null sans échéance", () => {
    expect(joursRestants(null, new Date())).toBeNull();
  });
});

describe("quantite", () => {
  it("écrit le stockage en gigaoctets", () => {
    expect(quantite("storage_gb", 0.02)).toBe("0,02 Go");
  });

  it("écrit un compte sans unité", () => {
    expect(quantite("internal_users", 1200)).toBe("1\u202f200");
  });
});

describe("libelleStatut", () => {
  it("traduit l'essai", () => {
    expect(libelleStatut("trialing").label).toBe("Essai en cours");
  });
});
