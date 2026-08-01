import { describe, expect, it } from "vitest";

import { SECTEURS } from "./secteurs";

/**
 * Cinq secteurs, c'était trop peu : la logistique et le BTP n'avaient rien à
 * cocher. Trente-six, c'était pire : il fallait tout lire pour cocher.
 */

describe("les secteurs", () => {
  it("tiennent en une liste qu’on lit d’un coup d’œil", () => {
    expect(SECTEURS.length).toBeGreaterThanOrEqual(7);
    expect(SECTEURS.length).toBeLessThanOrEqual(10);
  });

  it("couvrent les activités que cinq laissaient dehors", () => {
    const tout = SECTEURS.join(" ").toLowerCase();
    for (const activite of ["logistique", "btp", "télécoms", "commerce"]) {
      expect(tout, activite).toContain(activite);
    }
  });

  it("n’ont aucun doublon", () => {
    expect(new Set(SECTEURS).size).toBe(SECTEURS.length);
  });

  it("laissent une échappatoire, en dernier", () => {
    // Un champ fermé sans issue se contourne en salissant le champ voisin ;
    // la placer ailleurs qu'à la fin en ferait un choix comme un autre.
    expect(SECTEURS.at(-1)).toBe("Autre secteur");
  });
});
