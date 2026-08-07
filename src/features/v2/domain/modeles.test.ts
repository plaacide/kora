import { describe, expect, it } from "vitest";

import {
  modeleMajoritaire,
  modeleRecommande,
  motifRecommandation,
} from "./modeles";

describe("modeleRecommande", () => {
  it("reconnaît le vocabulaire de la BASE", () => {
    expect(modeleRecommande("levee")).toBe("Levée de fonds");
    expect(modeleRecommande("dette")).toBe("Dette");
    expect(modeleRecommande("dfi")).toBe("Institutionnel");
  });

  it("reconnaît aussi celui de l'ÉCRAN", () => {
    // L'appelant n'a pas toujours le même sous la main, et une conversion
    // oubliée rendrait silencieusement `null`.
    expect(modeleRecommande("equity")).toBe("Levée de fonds");
    expect(modeleRecommande("debt")).toBe("Dette");
  });

  it("NE RECOMMANDE RIEN pour un audit ou une diligence", () => {
    // Ils sont SUBIS : le calendrier vient du dehors. Proposer d'« avancer
    // étape par étape » à quelqu'un qui n'a pas la main serait creux.
    expect(modeleRecommande("audit")).toBeNull();
    expect(modeleRecommande("diligence")).toBeNull();
    expect(modeleRecommande("other")).toBeNull();
  });

  it("ne recommande rien sans objectif", () => {
    expect(modeleRecommande(null)).toBeNull();
    expect(modeleRecommande(undefined)).toBeNull();
    expect(modeleRecommande("")).toBeNull();
  });
});

describe("motifRecommandation", () => {
  it("dit CE QU'IL LIT, et non « recommandé pour vous »", () => {
    // Une recommandation sans motif est un ordre.
    expect(motifRecommandation("dette")).toBe(
      "Recommandé — cette entreprise prépare un financement bancaire.",
    );
  });

  it("se tait quand il n'y a rien à recommander", () => {
    expect(motifRecommandation("audit")).toBeNull();
  });
});

describe("modeleMajoritaire", () => {
  it("propose le modèle du plus grand nombre, et dit combien", () => {
    const res = modeleMajoritaire(["levee", "levee", "dette"]);
    expect(res).toEqual({ couvre: 2, modele: "Levée de fonds" });
  });

  it("ignore les objectifs sans modèle", () => {
    const res = modeleMajoritaire(["dfi", "audit", "diligence", null]);
    expect(res).toEqual({ couvre: 1, modele: "Institutionnel" });
  });

  it("NE TRANCHE PAS une égalité parfaite", () => {
    // Une recommandation qui bascule d'un chargement à l'autre vaut moins que
    // pas de recommandation du tout.
    expect(modeleMajoritaire(["levee", "dette"])).toBeNull();
  });

  it("rend null quand aucun objectif n'appelle de modèle", () => {
    expect(modeleMajoritaire(["audit", "diligence"])).toBeNull();
    expect(modeleMajoritaire([])).toBeNull();
  });
});
