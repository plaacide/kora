import { describe, expect, it } from "vitest";

import {
  blocagePublication,
  type FaitsDealroom,
  libelleAccord,
  statutAffiche,
  tonStatut,
} from "./dealroom";

function faits(p: Partial<FaitsDealroom> = {}): FaitsDealroom {
  return { enAttente: 0, entreprises: 3, statut: "brouillon", ...p };
}

describe("statutAffiche", () => {
  it("dit « Prête à publier » quand tous les accords sont là", () => {
    expect(statutAffiche(faits())).toBe("Prête à publier");
  });

  it("reste « Brouillon » tant qu'un accord manque", () => {
    expect(statutAffiche(faits({ enAttente: 1 }))).toBe("Brouillon");
  });

  it("NE DIT PAS « prête » d'une Dealroom vide", () => {
    // Zéro entreprise, donc zéro accord manquant : sans la condition sur le
    // nombre d'entreprises, une Dealroom qu'on vient de créer s'annoncerait
    // prête. Publier une Dealroom vide ne dit rien à personne.
    expect(statutAffiche(faits({ entreprises: 0 }))).toBe("Brouillon");
  });

  it("laisse « Publiée » et « Archivée » l'emporter sur tout", () => {
    expect(statutAffiche(faits({ enAttente: 2, statut: "publiee" }))).toBe(
      "Publiée",
    );
    expect(statutAffiche(faits({ statut: "archivee" }))).toBe("Archivée");
  });
});

describe("tonStatut", () => {
  it("ne colore que ce qui mérite d'être remarqué", () => {
    expect(tonStatut("Publiée")).toBe("green");
    expect(tonStatut("Prête à publier")).toBe("blue");
    expect(tonStatut("Brouillon")).toBeUndefined();
    expect(tonStatut("Archivée")).toBeUndefined();
  });
});

describe("blocagePublication", () => {
  it("dit COMBIEN d'entreprises manquent, et non « impossible »", () => {
    // L'écran 22 promet que « Publier » reste désactivé ET dit pourquoi. Un
    // bouton grisé sans raison est une impasse : on ne sait pas qui relancer.
    expect(blocagePublication(faits({ enAttente: 3 }))).toBe(
      "3 entreprises n’ont pas encore donné leur accord.",
    );
  });

  it("accorde le singulier", () => {
    expect(blocagePublication(faits({ enAttente: 1 }))).toBe(
      "Une entreprise n’a pas encore donné son accord.",
    );
  });

  it("réclame d'abord une entreprise", () => {
    expect(blocagePublication(faits({ entreprises: 0 }))).toBe(
      "Ajoutez au moins une entreprise avant de publier.",
    );
  });

  it("ne bloque rien quand tout est en ordre", () => {
    expect(blocagePublication(faits())).toBeNull();
  });

  it("ne bloque pas une Dealroom déjà publiée", () => {
    expect(blocagePublication(faits({ enAttente: 2, statut: "publiee" }))).toBeNull();
  });
});

describe("libelleAccord", () => {
  it("distingue RETIRÉ de REFUSÉ", () => {
    // Un accord retiré a existé, et l'entreprise figurait peut-être déjà dans
    // une page publique. Les confondre effacerait ce qui s'est passé.
    expect(libelleAccord("retire").texte).toBe("Retiré");
    expect(libelleAccord("refuse").texte).toBe("Refusé");
  });

  it("nomme l'attente en ambre", () => {
    expect(libelleAccord("attente")).toEqual({ texte: "En attente", ton: "amber" });
  });

  it("retombe sur l'attente devant un statut inconnu", () => {
    expect(libelleAccord("n’importe quoi").texte).toBe("En attente");
  });
});
