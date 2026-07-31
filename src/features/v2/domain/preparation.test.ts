import { describe, expect, it } from "vitest";

import {
  actionLabel,
  compter,
  correspondAuFiltre,
  estAActualiser,
  etatAffiche,
  grouper,
  statutLabel,
  type ExigenceBrute,
} from "./preparation";

const exigence = (patch: Partial<ExigenceBrute> = {}): ExigenceBrute => ({
  id: "e1",
  domain: "company_registration",
  level: "required",
  sources: [],
  label: "Statuts à jour",
  description: "",
  status: "todo",
  position: 1,
  folderId: null,
  folderName: null,
  freshnessDays: null,
  expectedPeriod: null,
  acceptedFormats: null,
  lastProofAt: null,
  proofs: 0,
  pending: 0,
  ...patch,
});

describe("grouper", () => {
  it("range les domaines dans l’ordre où le dossier se construit", () => {
    const groupes = grouper([
      exigence({ id: "a", domain: "impact_esg" }),
      exigence({ id: "b", domain: "finance_and_accounting" }),
      exigence({ id: "c", domain: "company_registration" }),
    ]);

    expect(groupes.map((groupe) => groupe.domain)).toEqual([
      "company_registration",
      "finance_and_accounting",
      "impact_esg",
    ]);
  });

  it("remonte le requis avant le recommandé, quelle que soit la position", () => {
    const groupes = grouper([
      exigence({ id: "a", level: "optional", position: 1 }),
      exigence({ id: "b", level: "required", position: 9 }),
      exigence({ id: "c", level: "recommended", position: 2 }),
    ]);

    expect(groupes[0].items.map((item) => item.id)).toEqual(["b", "c", "a"]);
  });

  it("ne compte pas le non-applicable comme dû", () => {
    const groupes = grouper([
      exigence({ id: "a", status: "done" }),
      exigence({ id: "b", status: "not_applicable" }),
      exigence({ id: "c", status: "todo" }),
    ]);

    expect(groupes[0].ready).toBe(1);
    expect(groupes[0].due).toBe(2);
  });

  it("trie les exigences d’un même niveau par position", () => {
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

  it("place un domaine inconnu à la fin plutôt que de le perdre", () => {
    const groupes = grouper([
      exigence({ id: "a", domain: "inconnu" }),
      exigence({ id: "b", domain: "company_registration" }),
    ]);

    expect(groupes.map((groupe) => groupe.domain)).toEqual([
      "company_registration",
      "inconnu",
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

describe("suggestion en attente", () => {
  const maintenant = new Date("2026-08-01T12:00:00Z");

  it("passe devant le statut stocké : elle appelle un geste", () => {
    const suggeree = exigence({ status: "todo", pending: 1, proofs: 0 });
    expect(etatAffiche(suggeree, maintenant).label).toBe("Pièce à confirmer");
    expect(actionLabel(suggeree)).toBe("Confirmer");
  });

  it("s’efface dès qu’une preuve confirmée existe", () => {
    const mixte = exigence({ status: "done", pending: 1, proofs: 1 });
    expect(etatAffiche(mixte, maintenant).label).toBe("Prête");
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

  it("connaît « non applicable »", () => {
    expect(statutLabel("not_applicable").label).toBe("Non applicable");
  });
});

describe("estAActualiser", () => {
  const maintenant = new Date("2026-08-01T12:00:00Z");
  const ilYA = (jours: number) =>
    new Date(maintenant.getTime() - jours * 86_400_000).toISOString();

  it("signale une preuve plus vieille que sa durée de validité", () => {
    expect(
      estAActualiser(
        { status: "done", freshnessDays: 90, lastProofAt: ilYA(120) },
        maintenant,
      ),
    ).toBe(true);
  });

  it("laisse tranquille une preuve encore fraîche", () => {
    expect(
      estAActualiser(
        { status: "done", freshnessDays: 90, lastProofAt: ilYA(30) },
        maintenant,
      ),
    ).toBe(false);
  });

  it("ne périme jamais une exigence sans durée de validité", () => {
    expect(
      estAActualiser(
        { status: "done", freshnessDays: null, lastProofAt: ilYA(3000) },
        maintenant,
      ),
    ).toBe(false);
  });

  it("ne s’applique qu’à une exigence prête", () => {
    expect(
      estAActualiser(
        { status: "todo", freshnessDays: 90, lastProofAt: ilYA(120) },
        maintenant,
      ),
    ).toBe(false);
  });

  it("bascule l’état affiché sans toucher au statut stocké", () => {
    const vieille = exigence({
      status: "done",
      freshnessDays: 90,
      lastProofAt: ilYA(120),
    });

    expect(etatAffiche(vieille, maintenant).label).toBe("À actualiser");
    expect(vieille.status).toBe("done");
  });
});
