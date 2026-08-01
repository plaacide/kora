import { describe, expect, it } from "vitest";

import { GROUPES_SECTEUR, SECTEURS, secteursParGroupe } from "./secteurs";

/**
 * L'onboarding proposait cinq secteurs, écrits en dur. Une entreprise de
 * logistique, de BTP ou de télécoms n'avait rien à cocher — et le champ étant
 * obligatoire, elle en choisissait un au hasard.
 */

describe("les secteurs", () => {
  it("couvrent bien plus que les cinq d’origine", () => {
    expect(SECTEURS.length).toBeGreaterThanOrEqual(30);
  });

  it("gardent les cinq d’origine, pour ne pas orpheliner l’existant", () => {
    // Des comptes portent déjà ces valeurs : les renommer les rendrait
    // introuvables sans que rien ne le signale.
    const noms = SECTEURS.map(([n]) => n);
    for (const ancien of ["Énergie", "Agriculture", "Santé"]) {
      expect(noms, ancien).toContain(ancien);
    }
  });

  it("n’ont aucun doublon", () => {
    const noms = SECTEURS.map(([n]) => n);
    expect(new Set(noms).size).toBe(noms.length);
  });

  it("appartiennent tous à un groupe déclaré", () => {
    for (const [nom, groupe] of SECTEURS) {
      expect(GROUPES_SECTEUR, nom).toContain(groupe);
    }
  });

  it("se rangent sans en perdre en route", () => {
    const total = secteursParGroupe().reduce((n, g) => n + g.secteurs.length, 0);
    expect(total).toBe(SECTEURS.length);
  });

  it("laissent une échappatoire", () => {
    // Un champ fermé sans issue se contourne en salissant le champ voisin.
    expect(SECTEURS.map(([n]) => n)).toContain("Autre secteur");
  });
});
