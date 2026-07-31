import { describe, expect, it } from "vitest";

import {
  colonnes,
  etapeLabel,
  etapeTon,
  ticketsCumules,
  type InvestisseurPipeline,
} from "./pipeline";

const investisseur = (
  patch: Partial<InvestisseurPipeline> = {},
): InvestisseurPipeline => ({
  id: "i1",
  nom: "Amina Diallo",
  organisation: "Sahel Growth",
  email: null,
  ticket: null,
  statut: "invite",
  acces: null,
  ...patch,
});

describe("colonnes", () => {
  it("garde les six étapes, même vides", () => {
    const cols = colonnes([investisseur({ statut: "diligence" })]);
    expect(cols).toHaveLength(6);
    expect(cols.filter((c) => c.investisseurs.length > 0)).toHaveLength(1);
  });

  it("suit l’ordre du parcours, pas celui des données", () => {
    const cols = colonnes([
      investisseur({ id: "a", statut: "engage" }),
      investisseur({ id: "b", statut: "invite" }),
    ]);
    expect(cols[0].statut).toBe("invite");
    expect(cols.at(-1)?.statut).toBe("refuse");
  });

  it("additionne les tickets d’une colonne", () => {
    const cols = colonnes([
      investisseur({ id: "a", statut: "diligence", ticket: 100 }),
      investisseur({ id: "b", statut: "diligence", ticket: 50 }),
    ]);
    expect(cols.find((c) => c.statut === "diligence")?.ticket).toBe(150);
  });

  it("ne range pas un statut inconnu au hasard", () => {
    const cols = colonnes([investisseur({ statut: "bizarre" })]);
    expect(cols.every((c) => c.investisseurs.length === 0)).toBe(true);
  });
});

describe("ticketsCumules", () => {
  it("ignore les tickets absents plutôt que de les compter à zéro faux", () => {
    expect(
      ticketsCumules([
        investisseur({ id: "a", ticket: 300 }),
        investisseur({ id: "b", ticket: null }),
      ]),
    ).toBe(300);
  });
});

describe("etapeLabel", () => {
  it("rend la valeur brute d’une étape inconnue", () => {
    expect(etapeLabel("bizarre")).toBe("bizarre");
  });

  it("ne peint pas « écarté » comme un échec", () => {
    expect(etapeTon("refuse")).toBe("neutral");
    expect(etapeTon("engage")).toBe("green");
  });
});
