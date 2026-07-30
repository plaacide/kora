import { describe, expect, it } from "vitest";

import {
  intentCanCarryRaise,
  intentObjective,
  operationLifecycle,
  operationSupportsInvestorTracking,
  operationType,
  sharingState,
} from "./operation";

describe("operationType", () => {
  it("mappe chaque objectif connu vers son type", () => {
    expect(operationType("levee")).toBe("equity");
    expect(operationType("dette")).toBe("bank_debt");
    expect(operationType("dfi")).toBe("dfi_or_grant");
    expect(operationType("diligence")).toBe("due_diligence");
  });

  it("retombe sur undecided sans objectif", () => {
    expect(operationType(null)).toBe("undecided");
  });

  it("retombe sur undecided pour une valeur inconnue plutôt que d'échouer", () => {
    // Un objectif qui ne serait plus dans la liste db un jour ne doit pas
    // faire planter la liste des opérations — juste rester non déterminé.
    expect(operationType("valeur-jamais-vue")).toBe("undecided");
  });
});

describe("operationLifecycle", () => {
  it("est active sans date d'archivage", () => {
    expect(operationLifecycle(null)).toBe("active");
  });

  it("est archivée dès qu'une date existe, quelle qu'elle soit", () => {
    expect(operationLifecycle("2026-01-01T00:00:00Z")).toBe("archived");
  });
});

describe("sharingState", () => {
  it("est privée sans invité actif", () => {
    expect(sharingState(0)).toBe("private");
  });

  it("est partagée dès le premier invité actif", () => {
    expect(sharingState(1)).toBe("shared");
    expect(sharingState(3)).toBe("shared");
  });
});

describe("intentCanCarryRaise", () => {
  it("accepte les trois intentions qui cherchent un financement", () => {
    expect(intentCanCarryRaise("equity")).toBe(true);
    expect(intentCanCarryRaise("debt")).toBe(true);
    expect(intentCanCarryRaise("dfi")).toBe(true);
  });

  it("refuse une diligence ou un audit — personne n'y recherche un montant", () => {
    expect(intentCanCarryRaise("diligence")).toBe(false);
    expect(intentCanCarryRaise("audit")).toBe(false);
    expect(intentCanCarryRaise("other")).toBe(false);
  });

  it("refuse une intention inconnue plutôt que de proposer une levée à tort", () => {
    expect(intentCanCarryRaise("valeur-jamais-vue")).toBe(false);
  });
});

describe("intentObjective", () => {
  it("mappe les intentions qui ont leur propre objectif en base", () => {
    expect(intentObjective("equity")).toBe("levee");
    expect(intentObjective("debt")).toBe("dette");
    expect(intentObjective("dfi")).toBe("dfi");
    expect(intentObjective("diligence")).toBe("diligence");
  });

  it("replie sur levee les intentions sans objectif dédié", () => {
    // `audit` et `other` n'ont pas de valeur en base : la contrainte CHECK de
    // `deals.objectif` n'en accepte que quatre.
    expect(intentObjective("audit")).toBe("levee");
    expect(intentObjective("other")).toBe("levee");
    expect(intentObjective("valeur-jamais-vue")).toBe("levee");
  });
});

describe("operationSupportsInvestorTracking", () => {
  it("suit toujours les levées en capital", () => {
    expect(
      operationSupportsInvestorTracking({
        type: "equity",
        tracksMultipleFunders: false,
      }),
    ).toBe(true);
  });

  it("suit une diligence uniquement si plusieurs financeurs sont déclarés", () => {
    expect(
      operationSupportsInvestorTracking({
        type: "due_diligence",
        tracksMultipleFunders: false,
      }),
    ).toBe(false);

    expect(
      operationSupportsInvestorTracking({
        type: "due_diligence",
        tracksMultipleFunders: true,
      }),
    ).toBe(true);
  });
});
