import { describe, expect, it } from "vitest";

import { validerLevee } from "./levee-schema";

/**
 * Ce que ces tests protègent : une levée peut être INACHEVÉE sans être FAUSSE.
 * Refuser un enregistrement partiel ferait perdre au fondateur ce qu'il vient
 * de saisir ; accepter une fourchette inversée lui ferait afficher
 * « 25 M – 5 M XOF » à ses investisseurs.
 */

describe("ce qui passe", () => {
  it("accepte une levée vide", () => {
    expect(validerLevee({})).toEqual([]);
  });

  it("accepte une levée à peine commencée", () => {
    expect(validerLevee({ nom: "Amorçage 2026" })).toEqual([]);
  });

  it("accepte un usage des fonds incomplet", () => {
    // 80 % affectés : le fondateur n'a pas fini, ce n'est pas une erreur.
    const problemes = validerLevee({
      usagesFonds: [
        { poste: "Réseau", part: 60 },
        { poste: "Équipe", part: 20 },
      ],
    });
    expect(problemes).toEqual([]);
  });

  it("accepte une fourchette dont une seule borne est posée", () => {
    expect(validerLevee({ ticketMin: 25_000_000 })).toEqual([]);
    expect(validerLevee({ ticketMax: 25_000_000 })).toEqual([]);
  });

  it("accepte zéro comme montant engagé", () => {
    // Une levée ouverte n'a rien d'engagé le premier jour.
    expect(validerLevee({ montantEngage: 0 })).toEqual([]);
  });
});

describe("ce qui est refusé", () => {
  it("refuse une fourchette inversée", () => {
    const problemes = validerLevee({ ticketMin: 150_000_000, ticketMax: 25_000_000 });
    expect(problemes).toContainEqual({
      champ: "ticketMin",
      code: "levee.ticket_incoherent",
    });
  });

  it("refuse un montant négatif", () => {
    expect(validerLevee({ montantCible: -1 })).toContainEqual({
      champ: "montantCible",
      code: "levee.montant_invalide",
    });
  });

  it("refuse un montant que l’écran rendrait en notation scientifique", () => {
    expect(validerLevee({ montantCible: 1e21 })).toContainEqual({
      champ: "montantCible",
      code: "levee.montant_invalide",
    });
  });

  it("refuse une part de capital hors de zéro à cent", () => {
    expect(validerLevee({ partCapital: 250 })).toContainEqual({
      champ: "partCapital",
      code: "levee.part_capital_invalide",
    });
    expect(validerLevee({ partCapital: -5 })).toContainEqual({
      champ: "partCapital",
      code: "levee.part_capital_invalide",
    });
  });

  it("refuse une devise, un stade ou un instrument inventés", () => {
    expect(validerLevee({ devise: "BTC" })).toContainEqual({
      champ: "devise",
      code: "levee.devise_inconnue",
    });
    expect(validerLevee({ stade: "serie_z" })).toContainEqual({
      champ: "stade",
      code: "levee.stade_inconnu",
    });
    expect(validerLevee({ instrument: "troc" })).toContainEqual({
      champ: "instrument",
      code: "levee.instrument_inconnu",
    });
  });

  it("refuse une échéance illisible", () => {
    // Elle devenait `null` en base, sans un mot : le fondateur croyait avoir
    // posé une date.
    expect(validerLevee({ echeance: "31/02/2026" })).toContainEqual({
      champ: "echeance",
      code: "levee.echeance_invalide",
    });
  });

  it("refuse une répartition au-delà de cent", () => {
    const problemes = validerLevee({
      usagesFonds: [
        { poste: "Réseau", part: 70 },
        { poste: "Équipe", part: 50 },
      ],
    });
    expect(problemes).toContainEqual({
      champ: "usagesFonds",
      code: "levee.usage_depasse",
    });
  });

  it("refuse une part d’usage négative", () => {
    const problemes = validerLevee({
      usagesFonds: [{ poste: "Réseau", part: -10 }],
    });
    expect(problemes).toContainEqual({
      champ: "usagesFonds",
      code: "levee.usage_negatif",
    });
  });

  it("refuse un nom d’une seule lettre", () => {
    expect(validerLevee({ nom: "A" })).toContainEqual({
      champ: "nom",
      code: "levee.nom_requis",
    });
  });
});

describe("plusieurs problèmes à la fois", () => {
  it("les rend tous plutôt que le premier", () => {
    // Corriger un champ pour découvrir le suivant, trois fois de suite, est la
    // façon la plus sûre de faire abandonner quelqu'un.
    const problemes = validerLevee({
      montantCible: -1,
      partCapital: 250,
      devise: "BTC",
    });
    expect(problemes.length).toBeGreaterThanOrEqual(3);
  });

  it("ne signale qu’une fois le même champ", () => {
    const problemes = validerLevee({ partCapital: 250 });
    const champs = problemes.map((p) => p.champ);
    expect(new Set(champs).size).toBe(champs.length);
  });
});
