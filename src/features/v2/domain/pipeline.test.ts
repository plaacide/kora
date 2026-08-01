import { describe, expect, it } from "vitest";

import {
  colonnes,
  compteRetires,
  engagementTon,
  etapeLabel,
  filtrerPipeline,
  type InvestisseurPipeline,
  relancesDues,
  responsablesDuPipeline,
  ticketsCumules,
} from "./pipeline";

const investisseur = (
  patch: Partial<InvestisseurPipeline> = {},
): InvestisseurPipeline => ({
  id: "i1",
  nom: "Amina Diallo",
  organisation: "Sahel Growth",
  email: null,
  ticket: null,
  etape: "a_cibler",
  engagement: "aucun",
  categorie: null,
  fonction: null,
  pays: null,
  source: null,
  responsable: null,
  prochaineAction: null,
  dateRelance: null,
  notes: null,
  acces: null,
  ...patch,
});

describe("colonnes", () => {
  it("garde les sept étapes, même vides", () => {
    const cols = colonnes([investisseur({ etape: "diligence" })]);
    expect(cols).toHaveLength(7);
    expect(cols.filter((c) => c.investisseurs.length > 0)).toHaveLength(1);
  });

  it("suit l’ordre du parcours, pas celui des données", () => {
    const cols = colonnes([
      investisseur({ id: "a", etape: "engage" }),
      investisseur({ id: "b", etape: "a_cibler" }),
    ]);
    expect(cols[0].etape).toBe("a_cibler");
    expect(cols.at(-1)?.etape).toBe("engage");
  });

  it("additionne les tickets d’une colonne", () => {
    const cols = colonnes([
      investisseur({ id: "a", etape: "diligence", ticket: 100 }),
      investisseur({ id: "b", etape: "diligence", ticket: 50 }),
    ]);
    expect(cols.find((c) => c.etape === "diligence")?.ticket).toBe(150);
  });

  it("ne range pas un statut inconnu au hasard", () => {
    const cols = colonnes([investisseur({ etape: "bizarre" })]);
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
});

describe("les deux axes", () => {
  it("ne peint pas « retiré » comme une alerte", () => {
    expect(engagementTon("retire")).toBe("neutral");
    expect(engagementTon("confirme")).toBe("green");
  });

  it("laisse un retiré dans son étape, avec son engagement", () => {
    const cols = colonnes([
      investisseur({ etape: "diligence", engagement: "retire" }),
    ]);
    const diligence = cols.find((c) => c.etape === "diligence");
    expect(diligence?.investisseurs).toHaveLength(1);
    expect(diligence?.investisseurs[0].engagement).toBe("retire");
  });

  it("ne compte pas le ticket d’un retiré dans le cumul", () => {
    expect(
      ticketsCumules([
        investisseur({ id: "a", ticket: 300 }),
        investisseur({ id: "b", ticket: 500, engagement: "retire" }),
      ]),
    ).toBe(300);
  });
});

describe("relancesDues", () => {
  const maintenant = new Date("2026-08-02T12:00:00Z");

  it("ne retient que les échéances atteintes, la plus ancienne d’abord", () => {
    const dues = relancesDues(
      [
        investisseur({ id: "demain", dateRelance: "2026-08-05" }),
        investisseur({ id: "hier", dateRelance: "2026-08-01" }),
        investisseur({ id: "vieux", dateRelance: "2026-07-20" }),
      ],
      maintenant,
    );

    expect(dues.map((d) => d.id)).toEqual(["vieux", "hier"]);
  });

  it("ne relance pas un investisseur retiré", () => {
    expect(
      relancesDues(
        [investisseur({ dateRelance: "2026-07-01", engagement: "retire" })],
        maintenant,
      ),
    ).toHaveLength(0);
  });
});

describe("les filtres du pipeline", () => {
  const base = {
    id: "1",
    nom: "Fonds A",
    organisation: null,
    email: null,
    ticket: null,
    etape: "contacte",
    engagement: "tiede",
    categorie: null,
    fonction: null,
    pays: null,
    source: null,
    responsable: null,
    prochaineAction: null,
    dateRelance: null,
    notes: null,
    acces: null,
  } satisfies InvestisseurPipeline;

  const le = (n: number) => new Date(2026, 7, n).toISOString();
  const maintenant = new Date(2026, 7, 15);

  it("replie les retirés par défaut", () => {
    const liste = [base, { ...base, id: "2", engagement: "retire" }];
    expect(filtrerPipeline(liste, {}, maintenant)).toHaveLength(1);
  });

  it("les rouvre à la demande", () => {
    const liste = [base, { ...base, id: "2", engagement: "retire" }];
    expect(filtrerPipeline(liste, { avecRetires: true }, maintenant)).toHaveLength(2);
  });

  it("ne garde que les relances échues", () => {
    const liste = [
      { ...base, id: "hier", dateRelance: le(10) },
      { ...base, id: "demain", dateRelance: le(20) },
      { ...base, id: "jamais" },
    ];
    const dus = filtrerPipeline(liste, { relanceEnRetard: true }, maintenant);
    expect(dus.map((i) => i.id)).toEqual(["hier"]);
  });

  it("distingue avec et sans accès", () => {
    const liste = [
      { ...base, id: "ouvert", acces: "Accès actif" },
      { ...base, id: "ferme" },
    ];
    expect(filtrerPipeline(liste, { acces: "avec" }, maintenant).map((i) => i.id))
      .toEqual(["ouvert"]);
    expect(filtrerPipeline(liste, { acces: "sans" }, maintenant).map((i) => i.id))
      .toEqual(["ferme"]);
  });

  it("combine les critères", () => {
    const liste = [
      { ...base, id: "cible", categorie: "fonds", responsable: "Awa" },
      { ...base, id: "autre", categorie: "fonds", responsable: "Kofi" },
      { ...base, id: "encore", categorie: "business_angel", responsable: "Awa" },
    ];
    const trouves = filtrerPipeline(
      liste,
      { categorie: "fonds", responsable: "Awa" },
      maintenant,
    );
    expect(trouves.map((i) => i.id)).toEqual(["cible"]);
  });

  it("compte les retirés même quand ils sont repliés", () => {
    const liste = [base, { ...base, id: "2", engagement: "retire" }];
    expect(compteRetires(liste)).toBe(1);
  });

  it("ne propose que les responsables réellement présents", () => {
    const liste = [
      { ...base, id: "1", responsable: "Kofi" },
      { ...base, id: "2", responsable: "Awa" },
      { ...base, id: "3", responsable: "Kofi" },
      { ...base, id: "4", responsable: "  " },
      { ...base, id: "5" },
    ];
    expect(responsablesDuPipeline(liste)).toEqual(["Awa", "Kofi"]);
  });
});
