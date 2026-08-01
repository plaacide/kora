import { describe, expect, it } from "vitest";

import {
  intentCanCarryRaise,
  INTENTIONS,
  intentObjective,
  libelleObjectif,
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

  it("replie sur levee ce qu’il ne connaît pas", () => {
    // CE TEST CONSACRAIT UN DÉFAUT. Il affirmait que « audit » devait valoir
    // « levee », parce que la contrainte CHECK n'acceptait que quatre valeurs —
    // et documentait ainsi comme voulu le fait que le rail annonce « Levée en
    // capital » sur une opération d'audit. La migration `20260801180000` a
    // rendu les six valeurs légitimes ; seul l'inconnu se replie désormais.
    expect(intentObjective("valeur-jamais-vue")).toBe("levee");
    // « other » était l'ancien nom de « autre » : il n'est plus reconnu, et
    // c'est sans conséquence — cette valeur ne vit que le temps d'un envoi de
    // formulaire, jamais en base.
    expect(intentObjective("other")).toBe("levee");
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

describe("les six intentions", () => {
  it("proposent partout la même liste", () => {
    expect(INTENTIONS).toHaveLength(6);
    expect(INTENTIONS.map((i) => i.valeur)).toEqual([
      "equity", "debt", "dfi", "diligence", "audit", "autre",
    ]);
  });

  it("n’enregistrent plus « audit » et « autre » comme une levée", () => {
    // C'était le défaut : la base ne connaissait que quatre valeurs, ces deux
    // intentions y retombaient, et le rail annonçait « Levée en capital » sur
    // une opération d'audit — à laquelle une levée était ouverte en prime.
    expect(intentObjective("audit")).toBe("audit");
    expect(intentObjective("autre")).toBe("autre");
  });

  it("gardent la correspondance des quatre premières", () => {
    expect(intentObjective("equity")).toBe("levee");
    expect(intentObjective("debt")).toBe("dette");
    expect(intentObjective("dfi")).toBe("dfi");
    expect(intentObjective("diligence")).toBe("diligence");
  });

  it("retombent sur « levee » pour une intention inconnue", () => {
    // Mieux vaut l'objectif par défaut qu'un enregistrement refusé.
    expect(intentObjective("nimportequoi")).toBe("levee");
  });

  it("donnent un libellé à chacun des six objectifs", () => {
    for (const intention of INTENTIONS) {
      const libelle = libelleObjectif(intention.objectif);
      expect(libelle, intention.valeur).toBeTruthy();
      // Le libellé ne doit pas être le code brut : c'est le repli, pas le but.
      expect(libelle, intention.valeur).not.toBe(intention.objectif);
    }
  });

  it("n’ouvrent une levée que pour les trois objectifs de financement", () => {
    // `complete_onboarding` ouvre une ligne dans `raises` pour levee, dette et
    // dfi. Audit, diligence et autre n'ont pas de levée à ouvrir.
    const porteuses = INTENTIONS.filter((i) => intentCanCarryRaise(i.valeur));
    expect(porteuses.map((i) => i.valeur)).toEqual(["equity", "debt", "dfi"]);
  });
});
