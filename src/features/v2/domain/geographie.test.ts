import { describe, expect, it } from "vitest";

import { PAYS, ZONES, paysAvecZone, paysParZone, zoneDuPays } from "./geographie";

describe("zoneDuPays", () => {
  it("rattache un pays à sa zone", () => {
    expect(zoneDuPays("Ghana")).toBe("Afrique de l’Ouest");
    expect(zoneDuPays("Kenya")).toBe("Afrique de l’Est");
  });

  it("rend null pour un pays hors liste plutôt que de deviner", () => {
    expect(zoneDuPays("Atlantide")).toBeNull();
    expect(zoneDuPays(null)).toBeNull();
  });
});

describe("paysAvecZone", () => {
  it("écrit la forme de la maquette", () => {
    expect(paysAvecZone("Ghana")).toBe("Ghana · Afrique de l’Ouest");
  });

  it("laisse lisible une valeur saisie avant que la liste existe", () => {
    expect(paysAvecZone("Atlantide")).toBe("Atlantide");
  });
});

describe("paysParZone", () => {
  it("suit l’ordre des zones, pas l’alphabet", () => {
    expect(paysParZone().map((g) => g.zone)).toEqual([...ZONES]);
  });

  it("n’oublie aucun pays en route", () => {
    const total = paysParZone().reduce((n, g) => n + g.pays.length, 0);
    expect(total).toBe(PAYS.length);
  });

  it("ne range pas deux fois le même pays", () => {
    const tous = paysParZone().flatMap((g) => g.pays);
    expect(new Set(tous).size).toBe(tous.length);
  });
});
