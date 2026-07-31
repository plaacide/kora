import { describe, expect, it } from "vitest";

import {
  dateJournal,
  familleDe,
  grouperParJour,
  nomActeur,
  nomCourt,
  titreDuJour,
  verbeDe,
} from "./journal";

describe("dateJournal", () => {
  it("rend la forme dense de la maquette", () => {
    expect(dateJournal("2026-05-12T09:30:00Z")).toBe("12-05-2026");
  });

  it("complète les chiffres seuls", () => {
    expect(dateJournal("2026-01-03T09:30:00Z")).toBe("03-01-2026");
  });
});

describe("nomCourt", () => {
  it("laisse un nom court intact", () => {
    expect(nomCourt("Statuts.pdf")).toBe("Statuts.pdf");
  });

  it("garde l’extension en rognant le milieu", () => {
    const court = nomCourt(
      "Attestation de régularité sociale CNSS 2026 définitive.pdf",
      32,
    );
    expect(court.endsWith(".pdf")).toBe(true);
    expect(court.length).toBeLessThan(32);
    expect(court).toContain("…");
  });

  it("ne prend pas un nom à points pour une extension", () => {
    const court = nomCourt("Rapport.final.version.très.longue.et.bavarde", 24);
    expect(court.endsWith("…")).toBe(true);
  });
});

describe("nomActeur", () => {
  it("préfère le nom complet quand il existe", () => {
    expect(nomActeur("amara@nimba.sn", "Amara Diallo")).toBe("Amara Diallo");
  });

  it("retombe sur la partie avant l’arobase, pas l’adresse entière", () => {
    expect(nomActeur("amara.diallo@nimba.sn")).toBe("amara.diallo");
  });

  it("tient sans acteur", () => {
    expect(nomActeur(null)).toBe("—");
  });
});

describe("familleDe", () => {
  it("range les gestes de préparation ensemble, quel qu'en soit le nom", () => {
    expect(familleDe("checklist.document_linked")).toBe("preparation");
    expect(familleDe("checklist.item_added")).toBe("preparation");
  });

  it("sépare consultation et téléchargement", () => {
    expect(familleDe("document.page_viewed")).toBe("consultations");
    expect(familleDe("document.downloaded")).toBe("telechargements");
  });

  it("rend null pour une action sans famille plutôt que de la ranger au hasard", () => {
    expect(familleDe("deal.created")).toBeNull();
  });
});

describe("verbeDe", () => {
  it("rend le nom brut d'une action inconnue au lieu de la masquer", () => {
    expect(verbeDe("truc.inconnu")).toBe("truc.inconnu");
  });
});

describe("titreDuJour", () => {
  const maintenant = new Date("2026-07-31T15:00:00Z");

  it("nomme aujourd'hui et hier", () => {
    expect(titreDuJour("2026-07-31T09:00:00Z", maintenant)).toContain("Aujourd’hui");
    expect(titreDuJour("2026-07-30T09:00:00Z", maintenant)).toContain("Hier");
  });

  it("donne la date seule au-delà", () => {
    const titre = titreDuJour("2026-07-28T09:00:00Z", maintenant);
    expect(titre).not.toContain("Hier");
    expect(titre).toContain("28 juillet 2026");
  });
});

describe("grouperParJour", () => {
  const maintenant = new Date("2026-07-31T15:00:00Z");
  const entree = (id: number, at: string) => ({
    id,
    actor: "Test",
    role: "Équipe",
    action: "document.uploaded",
    cible: "x.pdf",
    at,
  });

  it("coupe par journée sans changer l'ordre reçu", () => {
    const journees = grouperParJour(
      [
        entree(1, "2026-07-31T14:00:00Z"),
        entree(2, "2026-07-31T09:00:00Z"),
        entree(3, "2026-07-30T18:00:00Z"),
      ],
      maintenant,
    );

    expect(journees).toHaveLength(2);
    expect(journees[0].entrees.map((e) => e.id)).toEqual([1, 2]);
    expect(journees[1].entrees.map((e) => e.id)).toEqual([3]);
  });

  it("ne rouvre pas une journée déjà fermée", () => {
    // Des entrées désordonnées ne doivent pas fusionner deux blocs distants :
    // dans un journal d'audit, l'ordre reçu EST l'information.
    const journees = grouperParJour(
      [
        entree(1, "2026-07-31T14:00:00Z"),
        entree(2, "2026-07-30T18:00:00Z"),
        entree(3, "2026-07-31T08:00:00Z"),
      ],
      maintenant,
    );

    expect(journees).toHaveLength(3);
  });
});
