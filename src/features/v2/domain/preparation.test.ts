import { describe, expect, it } from "vitest";

import {
  actionLabel,
  compter,
  correspondAuFiltre,
  grouper,
  statutLabel,
  type ExigenceBrute,
} from "./preparation";

const exigence = (patch: Partial<ExigenceBrute> = {}): ExigenceBrute => ({
  id: "e1",
  category: "ohada",
  label: "Statuts à jour",
  description: "",
  status: "todo",
  position: 1,
  folderId: null,
  folderName: null,
  proofs: 0,
  ...patch,
});

describe("grouper", () => {
  it("range les domaines dans l’ordre du référentiel, pas alphabétique", () => {
    const groupes = grouper([
      exigence({ id: "a", category: "dfi" }),
      exigence({ id: "b", category: "financier" }),
      exigence({ id: "c", category: "ohada" }),
    ]);

    expect(groupes.map((groupe) => groupe.category)).toEqual([
      "ohada",
      "financier",
      "dfi",
    ]);
  });

  it("trie les exigences d’un domaine par position", () => {
    const groupes = grouper([
      exigence({ id: "a", position: 3 }),
      exigence({ id: "b", position: 1 }),
      exigence({ id: "c", position: 2 }),
    ]);

    expect(groupes[0].items.map((item) => item.id)).toEqual(["b", "c", "a"]);
  });

  it("compte les exigences prêtes de chaque domaine", () => {
    const groupes = grouper([
      exigence({ id: "a", status: "done" }),
      exigence({ id: "b", status: "todo" }),
    ]);

    expect(groupes[0].ready).toBe(1);
  });

  it("place une catégorie inconnue à la fin plutôt que de la perdre", () => {
    const groupes = grouper([
      exigence({ id: "a", category: "inconnue" }),
      exigence({ id: "b", category: "ohada" }),
    ]);

    expect(groupes.map((groupe) => groupe.category)).toEqual([
      "ohada",
      "inconnue",
    ]);
  });
});

describe("compter", () => {
  it("sépare les trois états que la base connaît", () => {
    expect(
      compter([
        exigence({ id: "a", status: "done" }),
        exigence({ id: "b", status: "in_progress" }),
        exigence({ id: "c", status: "todo" }),
        exigence({ id: "d", status: "todo" }),
      ]),
    ).toEqual({ pretes: 1, enCours: 1, aFournir: 2 });
  });
});

describe("correspondAuFiltre", () => {
  it("ne mélange pas « en cours » et « à traiter »", () => {
    expect(correspondAuFiltre("in_progress", "a-traiter")).toBe(false);
    expect(correspondAuFiltre("in_progress", "en-cours")).toBe(true);
  });

  it("laisse tout passer sur « toutes »", () => {
    expect(correspondAuFiltre("done", "toutes")).toBe(true);
  });
});

describe("actionLabel", () => {
  it("propose de relire dès qu’une preuve existe, quel que soit le statut", () => {
    expect(actionLabel(exigence({ proofs: 1, status: "todo" }))).toBe(
      "Voir la pièce",
    );
  });

  it("propose de déposer quand un dossier est suggéré", () => {
    expect(actionLabel(exigence({ folderId: "f1" }))).toBe("Déposer une pièce");
  });

  it("propose d’associer quand aucun dossier n’est suggéré", () => {
    expect(actionLabel(exigence())).toBe("Associer une pièce");
  });
});

describe("statutLabel", () => {
  it("retombe sur « à préparer » devant un statut inconnu", () => {
    expect(statutLabel("bizarre").label).toBe("À préparer");
  });
});
