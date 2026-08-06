import { describe, expect, it } from "vitest";

import {
  estPrete,
  type LignePortefeuille,
  nombreEntreprises,
  nombrePretes,
  preparationMoyenne,
  priorites,
  SEUIL_PRETE,
  tendance,
  volumeRecherche,
} from "./portefeuille";

function ligne(
  startupOrg: string,
  readiness: number | null,
  amount: number | null = null,
  currency: string | null = null,
  manques: readonly string[] = [],
): LignePortefeuille {
  return {
    startupOrg,
    startupName: startupOrg,
    dealId: `${startupOrg}-${readiness ?? "x"}-${amount ?? "0"}`,
    amount,
    currency,
    readiness,
    manques,
  };
}

describe("estPrete", () => {
  it("retient le seuil que l'écran 07 affiche", () => {
    expect(SEUIL_PRETE).toBe(75);
  });

  it("compte le seuil lui-même comme prête", () => {
    expect(estPrete(75)).toBe(true);
  });

  it("écarte juste en dessous", () => {
    expect(estPrete(74)).toBe(false);
  });

  it("ne prend pas une préparation absente pour un zéro", () => {
    expect(estPrete(null)).toBe(false);
  });
});

describe("nombreEntreprises", () => {
  it("compte les entreprises, pas les opérations", () => {
    // La promesse de la V2 : une entreprise peut mener plusieurs opérations.
    // Compter les lignes gonflerait le portefeuille sans que rien ne le dise.
    const lignes = [ligne("a", 40), ligne("a", 80), ligne("b", 10)];
    expect(nombreEntreprises(lignes)).toBe(2);
  });

  it("rend zéro sur un portefeuille vide", () => {
    expect(nombreEntreprises([])).toBe(0);
  });
});

describe("nombrePretes", () => {
  it("compte une entreprise une seule fois, même avec deux opérations prêtes", () => {
    const lignes = [ligne("a", 80), ligne("a", 90), ligne("b", 20)];
    expect(nombrePretes(lignes)).toBe(1);
  });

  it("suffit d'UNE opération au seuil pour que l'entreprise le soit", () => {
    const lignes = [ligne("a", 12), ligne("a", 75)];
    expect(nombrePretes(lignes)).toBe(1);
  });
});

describe("preparationMoyenne", () => {
  it("fait la moyenne des opérations mesurées", () => {
    expect(preparationMoyenne([ligne("a", 50), ligne("b", 70)])).toBe(60);
  });

  it("ÉCARTE les opérations sans préparation au lieu de les compter pour zéro", () => {
    // Une entreprise qui vient d'arriver ferait chuter toute la moyenne, et le
    // programme lirait un recul là où il y a une arrivée.
    expect(preparationMoyenne([ligne("a", 60), ligne("b", null)])).toBe(60);
  });

  it("arrondit à l'entier, comme l'écran l'affiche", () => {
    expect(preparationMoyenne([ligne("a", 50), ligne("b", 51)])).toBe(51);
  });

  it("rend null quand rien n'est mesurable, plutôt que 0 %", () => {
    expect(preparationMoyenne([ligne("a", null)])).toBeNull();
    expect(preparationMoyenne([])).toBeNull();
  });
});

describe("tendance", () => {
  it("rend un écart en POINTS, pas en pourcentage", () => {
    // 52 → 58 : +6 points et +11,5 %. Le paquet a choisi les points.
    expect(tendance(58, 52)).toBe(6);
  });

  it("dit les reculs", () => {
    expect(tendance(40, 55)).toBe(-15);
  });

  it("rend null sans point de comparaison", () => {
    expect(tendance(58, null)).toBeNull();
    expect(tendance(null, 52)).toBeNull();
  });
});

describe("volumeRecherche", () => {
  it("N'ADDITIONNE JAMAIS deux devises", () => {
    // Rien dans ce produit ne convertit une devise : aucun taux, nulle part.
    // Une somme XOF + EUR affichée en euros serait fausse en ayant l'air juste.
    const lignes = [
      ligne("a", null, 500_000, "EUR"),
      ligne("b", null, 300_000_000, "XOF"),
    ];
    expect(volumeRecherche(lignes)).toEqual([
      { devise: "XOF", montant: 300_000_000, operations: 1 },
      { devise: "EUR", montant: 500_000, operations: 1 },
    ]);
  });

  it("cumule à l'intérieur d'une même devise", () => {
    const lignes = [
      ligne("a", null, 200_000, "EUR"),
      ligne("b", null, 300_000, "EUR"),
    ];
    expect(volumeRecherche(lignes)).toEqual([
      { devise: "EUR", montant: 500_000, operations: 2 },
    ]);
  });

  it("ignore les opérations sans montant plutôt que de les compter", () => {
    // L'écran dit « 8 opérations renseignées » : le compte porte sur celles
    // qui portent un montant, pas sur toutes.
    const lignes = [
      ligne("a", null, null, "EUR"),
      ligne("b", null, 0, "EUR"),
      ligne("c", null, 100, "EUR"),
    ];
    expect(volumeRecherche(lignes)).toEqual([
      { devise: "EUR", montant: 100, operations: 1 },
    ]);
  });

  it("range la devise dominante en premier", () => {
    const lignes = [
      ligne("a", null, 10, "EUR"),
      ligne("b", null, 900, "USD"),
      ligne("c", null, 50, "XOF"),
    ];
    expect(volumeRecherche(lignes).map((v) => v.devise)).toEqual([
      "USD",
      "XOF",
      "EUR",
    ]);
  });

  it("rend une liste vide quand rien n'est renseigné", () => {
    expect(volumeRecherche([ligne("a", 50)])).toEqual([]);
  });
});

describe("priorites", () => {
  const avec = (org: string, prep: number | null, nb: number) =>
    ligne(org, prep, null, null, Array.from({ length: nb }, (_, i) => `m${i}`));

  it("s'arrête à trois, comme l'écran l'annonce", () => {
    const lignes = [
      avec("a", 10, 1),
      avec("b", 20, 1),
      avec("c", 30, 1),
      avec("d", 40, 1),
    ];
    expect(priorites(lignes).map((p) => p.nom)).toEqual(["a", "b", "c"]);
  });

  it("met la préparation la plus basse en tête", () => {
    const lignes = [avec("haute", 80, 1), avec("basse", 12, 1)];
    expect(priorites(lignes).map((p) => p.nom)).toEqual(["basse", "haute"]);
  });

  it("fait passer une entreprise SANS préparation mesurée devant les autres", () => {
    // Ne rien savoir d'une entreprise est un motif de la rappeler, pas une
    // raison de l'oublier.
    const lignes = [avec("mesuree", 5, 1), avec("inconnue", null, 1)];
    expect(priorites(lignes)[0]?.nom).toBe("inconnue");
  });

  it("écarte les entreprises qui n'ont aucun manque", () => {
    expect(priorites([avec("a", 30, 0), avec("b", 40, 2)])).toHaveLength(1);
  });

  it("ne fait apparaître une entreprise qu'une fois, par son opération la plus en retard", () => {
    const lignes = [avec("a", 90, 1), avec("a", 20, 3)];
    const res = priorites(lignes);
    expect(res).toHaveLength(1);
    expect(res[0]).toMatchObject({ nom: "a", preparation: 20, manques: 3 });
  });

  it("départage deux ex æquo par le nombre de manques", () => {
    const lignes = [avec("peu", 50, 1), avec("beaucoup", 50, 4)];
    expect(priorites(lignes).map((p) => p.nom)).toEqual(["beaucoup", "peu"]);
  });

  it("garde un ordre STABLE quand tout est à égalité", () => {
    // Un tri instable ferait danser la liste d'un chargement à l'autre, sans
    // qu'aucune donnée n'ait changé.
    const lignes = [avec("zoe", 50, 2), avec("adam", 50, 2)];
    expect(priorites(lignes).map((p) => p.nom)).toEqual(["adam", "zoe"]);
  });

  it("rend une liste vide sur un portefeuille sans manque", () => {
    expect(priorites([])).toEqual([]);
  });
});
