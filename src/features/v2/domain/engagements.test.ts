import { describe, expect, it } from "vitest";

import {
  NIVEAUX,
  niveau,
  phraseRequalification,
  restant,
  ventilation,
  type Engagement,
} from "./engagements";

function engagement(partiel: Partial<Engagement>): Engagement {
  return {
    id: "e1",
    investorId: "i1",
    investisseur: "Amina Diallo",
    organisation: "Sahel Growth Fund",
    niveau: "confirme",
    montant: 0,
    devise: "XOF",
    date: "2026-07-27",
    preuve: null,
    commentaire: null,
    responsable: null,
    modifieLe: "2026-07-27T10:00:00Z",
    requalifie: false,
    ...partiel,
  };
}

describe("ventilation", () => {
  it("sépare confirmés et soft-commits", () => {
    const v = ventilation([
      engagement({ id: "a", niveau: "confirme", montant: 120_000_000 }),
      engagement({ id: "b", niveau: "soft_commit", montant: 80_000_000 }),
    ]);

    expect(v.confirme).toEqual({ montant: 120_000_000, investisseurs: 1 });
    expect(v.soft).toEqual({ montant: 80_000_000, investisseurs: 1 });
    expect(v.securise).toBe(200_000_000);
  });

  it("n'additionne JAMAIS les intérêts indicatifs au montant sécurisé", () => {
    const v = ventilation([
      engagement({ id: "a", niveau: "confirme", montant: 120_000_000 }),
      engagement({ id: "b", niveau: "interet", montant: 500_000_000 }),
    ]);

    expect(v.securise).toBe(120_000_000);
    expect(v.interet.montant).toBe(500_000_000);
  });

  it("rend des totaux à zéro sans engagement", () => {
    const v = ventilation([]);
    expect(v.securise).toBe(0);
    expect(v.confirme.investisseurs).toBe(0);
  });

  it("compte les investisseurs, pas les montants non nuls", () => {
    const v = ventilation([
      engagement({ id: "a", niveau: "confirme", montant: 0 }),
      engagement({ id: "b", niveau: "confirme", montant: 10 }),
    ]);

    expect(v.confirme.investisseurs).toBe(2);
    expect(v.confirme.montant).toBe(10);
  });
});

describe("restant", () => {
  it("retranche le sécurisé de la cible", () => {
    expect(restant(500_000_000, 200_000_000)).toBe(300_000_000);
  });

  it("ne descend pas sous zéro quand la levée dépasse sa cible", () => {
    expect(restant(100, 250)).toBe(0);
  });

  it("traite une cible absente comme zéro", () => {
    expect(restant(null, 50)).toBe(0);
  });
});

describe("niveaux", () => {
  it("ne compte que soft-commit et confirmé", () => {
    expect(NIVEAUX.filter((n) => n.compte).map((n) => n.cle)).toEqual([
      "soft_commit",
      "confirme",
    ]);
  });

  it("retombe sur l'intérêt indicatif devant une valeur inconnue", () => {
    expect(niveau("n'importe quoi").cle).toBe("interet");
  });
});

describe("phraseRequalification", () => {
  const base = {
    id: "1",
    investisseur: "Sahel Growth Fund",
    preuve: null,
    auteur: "Amara",
    at: "2026-07-27T10:00:00Z",
    retire: false,
  };

  it("dit « enregistré » à la première déclaration", () => {
    expect(
      phraseRequalification({
        ...base,
        avant: null,
        apres: { niveau: "soft_commit", montant: 80_000_000 },
      }),
    ).toBe("Soft-commit déclaré (80\u00a0M) enregistré");
  });

  it("dit « requalifié en » quand un état précède", () => {
    expect(
      phraseRequalification({
        ...base,
        avant: { niveau: "interet", montant: 100_000_000 },
        apres: { niveau: "confirme", montant: 120_000_000 },
      }),
    ).toBe("intérêt indicatif (100\u00a0M) requalifié en engagement confirmé (120\u00a0M)");
  });

  it("dit « retiré » sans détailler l'état effacé", () => {
    expect(
      phraseRequalification({
        ...base,
        retire: true,
        avant: null,
        apres: { niveau: "confirme", montant: 0 },
      }),
    ).toBe("engagement retiré");
  });
});
