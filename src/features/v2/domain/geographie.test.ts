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

describe("le périmètre mondial", () => {
  it("couvre le monde et non plus la seule Afrique", () => {
    expect(PAYS.length).toBeGreaterThanOrEqual(180);
  });

  it("propose les juridictions d’immatriculation courantes", () => {
    // Une entreprise africaine s'immatricule couramment ailleurs : le
    // formulaire n'en proposait que cinq, tous africains.
    const noms = PAYS.map(([p]) => p);
    for (const attendu of [
      "Maurice", "Luxembourg", "États-Unis", "France",
      "Royaume-Uni", "Pays-Bas", "Émirats arabes unis", "Singapour",
    ]) {
      expect(noms, attendu).toContain(attendu);
    }
  });

  it("ne laisse plus qu’« Autre pays » dans International", () => {
    // Tant qu'il contenait la France et les États-Unis, ce groupe ne
    // regroupait rien.
    const international = PAYS.filter(([, z]) => z === "International");
    expect(international.map(([p]) => p)).toEqual(["Autre pays"]);
  });

  it("range la France en Europe et non plus à l’international", () => {
    expect(zoneDuPays("France")).toBe("Europe");
    expect(zoneDuPays("États-Unis")).toBe("Amériques");
    expect(zoneDuPays("Singapour")).toBe("Asie");
  });

  it("n’a aucun doublon sur cent quatre-vingts entrées", () => {
    const noms = PAYS.map(([p]) => p);
    expect(new Set(noms).size).toBe(noms.length);
  });
});
