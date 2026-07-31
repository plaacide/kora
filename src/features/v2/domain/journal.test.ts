import { describe, expect, it } from "vitest";

import { dateJournal, nomActeur, nomCourt } from "./journal";

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
