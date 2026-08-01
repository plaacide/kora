import { describe, expect, it } from "vitest";

import {
  ecartDeRepartition,
  fourchetteTicket,
  libelleInstrumentLevee,
  libelleLead,
  libelleStade,
  repartition,
} from "./levee";

/**
 * `Intl` sépare le nombre de son suffixe par une espace INSÉCABLE ÉTROITE
 * (U+202F), invisible à la lecture et différente d'une espace ordinaire. Coller
 * ce caractère dans les attentes rendrait les tests illisibles — et cassants,
 * car ICU en change au fil des versions de Node. On compare donc à espaces
 * normalisées : ce qui nous intéresse est le texte, pas l'octet.
 */
const memeTexte = (valeur: string | null) =>
  valeur?.replace(/[\u00a0\u202f\u2009]/g, " ") ?? null;

describe("les libellés", () => {
  it("traduisent les clés de la base", () => {
    expect(libelleStade("serie_a")).toBe("Série A");
    expect(libelleInstrumentLevee("equity")).toBe("Prise de participation");
    expect(libelleLead("recherche")).toBe("Recherché");
  });

  it("rendent null quand rien n’est renseigné", () => {
    // L'écran décidera quoi dire ; le domaine ne choisit pas son tiret.
    expect(libelleStade(null)).toBeNull();
    expect(libelleLead(null)).toBeNull();
  });

  it("laissent passer une clé inconnue plutôt que de l’effacer", () => {
    // Une valeur venue d'une version antérieure doit rester lisible, même mal
    // habillée — la faire disparaître serait pire.
    expect(libelleStade("serie_c")).toBe("serie_c");
  });
});

describe("fourchetteTicket", () => {
  it("abrège les montants et ne nomme la devise qu’une fois", () => {
    // Sur une ligne de synthèse, « 25 000 000 » se compte au lieu de se lire.
    expect(memeTexte(fourchetteTicket(25_000_000, 150_000_000, "XOF"))).toBe(
      "25 M – 150 M XOF",
    );
  });

  it("dit « à partir de » quand seul le minimum est connu", () => {
    expect(memeTexte(fourchetteTicket(25_000_000, null, "XOF"))).toBe(
      "à partir de 25 M XOF",
    );
  });

  it("dit « jusqu’à » quand seul le maximum est connu", () => {
    expect(memeTexte(fourchetteTicket(null, 150_000_000, "EUR"))).toBe(
      "jusqu’à 150 M EUR",
    );
  });

  it("rend null quand rien n’est renseigné", () => {
    expect(fourchetteTicket(null, null, "XOF")).toBeNull();
  });
});

describe("repartition", () => {
  const usages = [
    { poste: "Réseau", part: 60 },
    { poste: "Équipe", part: 25 },
    { poste: "BFR", part: 15 },
  ];

  it("écrit la répartition dans l’ordre donné", () => {
    // Sans tri : le fondateur les a saisis dans l'ordre de ses priorités, et
    // les réordonner par montant changerait ce qu'il a voulu dire.
    expect(repartition(usages)).toBe("Réseau 60 % · Équipe 25 % · BFR 15 %");
  });

  it("ignore les postes vides ou à zéro", () => {
    expect(
      repartition([...usages, { poste: "  ", part: 0 }, { poste: "Divers", part: 0 }]),
    ).toBe("Réseau 60 % · Équipe 25 % · BFR 15 %");
  });

  it("rend null sur une répartition vide", () => {
    expect(repartition([])).toBeNull();
  });
});

describe("ecartDeRepartition", () => {
  it("ne dit rien quand la somme tombe juste", () => {
    expect(
      ecartDeRepartition([
        { poste: "Réseau", part: 60 },
        { poste: "Équipe", part: 40 },
      ]),
    ).toBeNull();
  });

  it("signale un total incomplet sans le refuser", () => {
    // Un fondateur peut n'avoir affecté que 80 % au moment où il remplit :
    // c'est à signaler, pas à interdire.
    expect(
      ecartDeRepartition([
        { poste: "Réseau", part: 50 },
        { poste: "Équipe", part: 30 },
      ]),
    ).toBe(-20);
  });

  it("signale un dépassement", () => {
    expect(
      ecartDeRepartition([
        { poste: "Réseau", part: 70 },
        { poste: "Équipe", part: 50 },
      ]),
    ).toBe(20);
  });

  it("rend null quand aucun poste n’est nommé", () => {
    expect(ecartDeRepartition([])).toBeNull();
  });
});
