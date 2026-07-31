import { describe, expect, it } from "vitest";

import {
  CATALOGUE,
  disponibles,
  famillesRecommandees,
  pourquoiCesIndicateurs,
  recommandes,
  trimestreEchu,
  type Financeur,
  type Instrument,
} from "./updates";

const INSTRUMENTS: Instrument[] = ["capital", "dette", "dfi"];
const FINANCEURS: Financeur[] = ["vc", "banque", "dfi"];

describe("famillesRecommandees", () => {
  it("donne la croissance à un VC sur du capital", () => {
    expect(famillesRecommandees("capital", "vc")).toEqual(["Croissance"]);
  });

  it("donne le remboursement à une banque sur de la dette", () => {
    expect(famillesRecommandees("dette", "banque")).toEqual(["Remboursement"]);
  });

  it("donne remboursement, impact, ESG et gouvernance à une DFI", () => {
    expect(famillesRecommandees("dfi", "dfi")).toEqual([
      "Remboursement",
      "Impact",
      "ESG",
      "Gouvernance",
    ]);
  });

  it("ajoute le remboursement dès que l'opération est en dette, même face à un VC", () => {
    expect(famillesRecommandees("dette", "vc")).toContain("Remboursement");
    expect(famillesRecommandees("dette", "vc")).toContain("Croissance");
  });

  it("ne rend jamais une liste vide, quelle que soit l'audience", () => {
    for (const instrument of INSTRUMENTS) {
      for (const financeur of FINANCEURS) {
        expect(famillesRecommandees(instrument, financeur).length).toBeGreaterThan(0);
      }
    }
  });
});

describe("recommandes et disponibles", () => {
  it("partagent le catalogue sans doublon ni oubli", () => {
    for (const instrument of INSTRUMENTS) {
      for (const financeur of FINANCEURS) {
        const suggeres = recommandes(instrument, financeur);
        const autres = disponibles(instrument, financeur);

        expect(suggeres.length + autres.length).toBe(CATALOGUE.length);
        expect(
          suggeres.filter((s) => autres.some((a) => a.cle === s.cle)),
        ).toEqual([]);
      }
    }
  });

  it("suggère le DSCR à une banque et pas à un VC en capital", () => {
    expect(recommandes("dette", "banque").map((d) => d.cle)).toContain("dscr");
    expect(recommandes("capital", "vc").map((d) => d.cle)).not.toContain("dscr");
  });

  it("suggère les émissions évitées à une DFI", () => {
    expect(recommandes("dfi", "dfi").map((d) => d.cle)).toContain("emissions");
  });
});

describe("pourquoiCesIndicateurs", () => {
  it("nomme l'audience et ce que la suggestion couvre", () => {
    const phrase = pourquoiCesIndicateurs("dette", "dfi");
    expect(phrase).toContain("une DFI ou un investisseur à impact");
    expect(phrase).toContain("la capacité de remboursement");
    expect(phrase).toContain("l’impact mesuré");
  });

  it("énumère sans virgule pendante quand une seule famille s'applique", () => {
    expect(pourquoiCesIndicateurs("capital", "vc")).toContain(
      "porte sur la croissance et la trajectoire.",
    );
  });
});

describe("trimestreEchu", () => {
  it("propose le trimestre précédent", () => {
    expect(trimestreEchu(new Date("2026-08-02T12:00:00Z"))).toBe("T2 2026");
  });

  it("bascule sur T4 de l'année d'avant en janvier", () => {
    expect(trimestreEchu(new Date("2026-01-15T12:00:00Z"))).toBe("T4 2025");
  });

  it("rend T3 au premier jour d'octobre", () => {
    expect(trimestreEchu(new Date("2026-10-01T12:00:00Z"))).toBe("T3 2026");
  });
});

describe("catalogue", () => {
  it("n'a aucune clé en double", () => {
    const cles = CATALOGUE.map((d) => d.cle);
    expect(new Set(cles).size).toBe(cles.length);
  });

  it("porte une définition sur chaque indicateur", () => {
    for (const d of CATALOGUE) {
      expect(d.definition.trim().length).toBeGreaterThan(10);
    }
  });
});
