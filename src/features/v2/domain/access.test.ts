import { describe, expect, it } from "vitest";

import {
  correspondAuFiltre,
  etatAcces,
  fermetureDescendante,
  perimetre,
  perimetreLabel,
} from "./access";

const arbre = [
  { id: "corporate", parentId: null },
  { id: "financier", parentId: null },
  { id: "financier-2025", parentId: "financier" },
  { id: "financier-2025-q1", parentId: "financier-2025" },
  { id: "juridique", parentId: null },
];

const pieces = new Map([
  ["corporate", 8],
  ["financier", 4],
  ["financier-2025", 3],
  ["financier-2025-q1", 2],
  ["juridique", 6],
]);

describe("fermetureDescendante", () => {
  it("emporte toute la descendance d’un dossier accordé", () => {
    expect([...fermetureDescendante(arbre, ["financier"])].sort()).toEqual([
      "financier",
      "financier-2025",
      "financier-2025-q1",
    ]);
  });

  it("ignore un identifiant qui ne désigne aucun dossier connu", () => {
    expect(fermetureDescendante(arbre, ["fantome"]).size).toBe(0);
  });

  it("ne boucle pas sur un cycle", () => {
    const cycle = [
      { id: "a", parentId: "b" },
      { id: "b", parentId: "a" },
    ];
    expect(fermetureDescendante(cycle, ["a"]).size).toBe(2);
  });
});

describe("perimetre", () => {
  it("compte les pièces des sous-dossiers, pas seulement du dossier accordé", () => {
    expect(perimetre(arbre, pieces, ["financier"])).toEqual({
      folders: 3,
      documents: 9,
    });
  });

  it("ne compte pas deux fois un dossier accordé ET hérité", () => {
    expect(perimetre(arbre, pieces, ["financier", "financier-2025"])).toEqual({
      folders: 3,
      documents: 9,
    });
  });

  it("rend zéro quand plus rien n’est accordé", () => {
    expect(perimetreLabel(perimetre(arbre, pieces, []))).toBe("—");
  });

  it("accorde le pluriel au périmètre", () => {
    expect(perimetreLabel({ folders: 1, documents: 1 })).toBe("1 dossier · 1 pièce");
    expect(perimetreLabel({ folders: 2, documents: 9 })).toBe("2 dossiers · 9 pièces");
  });
});

describe("etatAcces", () => {
  const maintenant = new Date("2026-07-31T12:00:00Z");
  const dans = (jours: number) =>
    new Date(maintenant.getTime() + jours * 86_400_000).toISOString();

  it("dégrade un accès accepté dont l’échéance est passée", () => {
    expect(etatAcces("accepted", dans(-1), maintenant)).toBe("expired");
  });

  it("signale une échéance à moins de sept jours", () => {
    expect(etatAcces("accepted", dans(5), maintenant)).toBe("expiring");
    expect(etatAcces("accepted", dans(30), maintenant)).toBe("active");
  });

  it("laisse la révocation primer sur tout le reste", () => {
    expect(etatAcces("revoked", dans(30), maintenant)).toBe("revoked");
  });

  it("n’annonce pas « expire bientôt » pour une invitation jamais acceptée", () => {
    expect(etatAcces("nda_pending", dans(2), maintenant)).toBe("nda_pending");
  });

  it("tient sans échéance", () => {
    expect(etatAcces("accepted", null, maintenant)).toBe("active");
  });
});

describe("correspondAuFiltre", () => {
  it("range « expire bientôt » parmi les accès actifs", () => {
    expect(correspondAuFiltre("expiring", "actifs")).toBe(true);
  });

  it("sépare l’attente des accès clos", () => {
    expect(correspondAuFiltre("sent", "attente")).toBe(true);
    expect(correspondAuFiltre("sent", "clos")).toBe(false);
    expect(correspondAuFiltre("revoked", "clos")).toBe(true);
  });

  it("laisse tout passer sur « tous »", () => {
    expect(correspondAuFiltre("revoked", "tous")).toBe(true);
  });
});
