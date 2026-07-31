import { describe, expect, it } from "vitest";

import {
  actionLabel,
  compter,
  correspondAuFiltre,
  correspondAuFinanceur,
  estAActualiser,
  etatAffiche,
  grouper,
  grouperParDossier,
  prochaineAction,
  requises,
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
  const maintenant = new Date("2026-08-01T12:00:00Z");
  const ilYA = (jours: number) =>
    new Date(maintenant.getTime() - jours * 86_400_000).toISOString();

  it("sépare prêtes, à fournir et à actualiser", () => {
    expect(
      compter(
        [
          exigence({ id: "a", status: "done" }),
          exigence({ id: "b", status: "in_progress" }),
          exigence({ id: "c", status: "todo" }),
          exigence({
            id: "d",
            status: "done",
            freshnessDays: 90,
            lastProofAt: ilYA(120),
          }),
        ],
        maintenant,
      ),
    ).toEqual({ pretes: 1, aFournir: 2, aActualiser: 1 });
  });

  it("ne compte nulle part le non-applicable", () => {
    const c = compter(
      [exigence({ id: "a", status: "not_applicable" })],
      maintenant,
    );
    expect(c.pretes + c.aFournir + c.aActualiser).toBe(0);
  });
});

describe("correspondAuFiltre", () => {
  const maintenant = new Date("2026-08-01T12:00:00Z");
  const ilYA = (jours: number) =>
    new Date(maintenant.getTime() - jours * 86_400_000).toISOString();

  const perimee = exigence({
    status: "done",
    freshnessDays: 90,
    lastProofAt: ilYA(120),
  });

  it("« Requises » filtre un niveau, pas un statut", () => {
    expect(
      correspondAuFiltre(
        exigence({ level: "required", status: "done" }),
        "requises",
        maintenant,
      ),
    ).toBe(true);
    expect(
      correspondAuFiltre(exigence({ level: "optional" }), "requises", maintenant),
    ).toBe(false);
  });

  it("sort une pièce périmée des « Prêtes » et la remet « À traiter »", () => {
    expect(correspondAuFiltre(perimee, "pretes", maintenant)).toBe(false);
    expect(correspondAuFiltre(perimee, "a-traiter", maintenant)).toBe(true);
    expect(correspondAuFiltre(perimee, "a-actualiser", maintenant)).toBe(true);
  });

  it("ne met pas le non-applicable dans « À traiter »", () => {
    expect(
      correspondAuFiltre(
        exigence({ status: "not_applicable" }),
        "a-traiter",
        maintenant,
      ),
    ).toBe(false);
  });

  it("laisse tout passer sur « toutes »", () => {
    expect(
      correspondAuFiltre(exigence({ status: "not_applicable" }), "toutes", maintenant),
    ).toBe(true);
  });
});

describe("correspondAuFinanceur", () => {
  it("ne filtre rien sans financeur choisi", () => {
    expect(correspondAuFinanceur(exigence({ sources: [] }), "")).toBe(true);
  });

  it("retient une exigence réclamée par plusieurs financeurs", () => {
    const item = exigence({ sources: ["bank", "dfi"] });
    expect(correspondAuFinanceur(item, "dfi")).toBe(true);
    expect(correspondAuFinanceur(item, "capital")).toBe(false);
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

describe("grouperParDossier", () => {
  const arbre = [
    { id: "fin", name: "Financier", parentId: null, indexPath: "2" },
    { id: "fin25", name: "Exercice 2025", parentId: "fin", indexPath: "2.1" },
    { id: "corp", name: "Corporate", parentId: null, indexPath: "1" },
  ];

  it("suit l’ordre de la data room, pas l’alphabet", () => {
    const groupes = grouperParDossier(arbre, [
      { id: "d1", name: "a.pdf", folderId: "fin" },
      { id: "d2", name: "b.pdf", folderId: "corp" },
    ]);

    expect(groupes.map((g) => g.chemin)).toEqual(["Corporate", "Financier"]);
  });

  it("écrit le chemin complet d’un sous-dossier", () => {
    const groupes = grouperParDossier(arbre, [
      { id: "d1", name: "a.pdf", folderId: "fin25" },
    ]);

    expect(groupes[0].chemin).toBe("Financier / Exercice 2025");
  });

  it("classe 2.10 après 2.2, pas avant", () => {
    const profond = [
      { id: "a", name: "Deux", parentId: null, indexPath: "2.2" },
      { id: "b", name: "Dix", parentId: null, indexPath: "2.10" },
    ];
    const groupes = grouperParDossier(profond, [
      { id: "d1", name: "x.pdf", folderId: "b" },
      { id: "d2", name: "y.pdf", folderId: "a" },
    ]);

    expect(groupes.map((g) => g.chemin)).toEqual(["Deux", "Dix"]);
  });

  it("range les pièces sans dossier à la fin, signalées", () => {
    const groupes = grouperParDossier(arbre, [
      { id: "d1", name: "a.pdf", folderId: null },
      { id: "d2", name: "b.pdf", folderId: "corp" },
    ]);

    expect(groupes.at(-1)?.chemin).toBe("Racine — non rangées");
  });

  it("traite un dossier inconnu comme une pièce non rangée", () => {
    const groupes = grouperParDossier(arbre, [
      { id: "d1", name: "a.pdf", folderId: "fantome" },
    ]);

    expect(groupes).toHaveLength(1);
    expect(groupes[0].chemin).toBe("Racine — non rangées");
  });

  it("ne boucle pas sur une arborescence cyclique", () => {
    const cycle = [
      { id: "a", name: "A", parentId: "b", indexPath: "1" },
      { id: "b", name: "B", parentId: "a", indexPath: "2" },
    ];
    const groupes = grouperParDossier(cycle, [
      { id: "d1", name: "x.pdf", folderId: "a" },
    ]);

    expect(groupes).toHaveLength(1);
  });
});

describe("prochaineAction", () => {
  const maintenant = new Date("2026-08-01T12:00:00Z");
  const ilYA = (jours: number) =>
    new Date(maintenant.getTime() - jours * 86_400_000).toISOString();

  it("commence par poser le référentiel quand il n’y a rien", () => {
    expect(prochaineAction([], 0, maintenant)).toEqual({ type: "referentiel" });
  });

  it("fait passer une pièce périmée AVANT une exigence requise manquante", () => {
    const action = prochaineAction(
      [
        exigence({ id: "manquante", level: "required", status: "todo" }),
        exigence({
          id: "perimee",
          level: "required",
          status: "done",
          freshnessDays: 90,
          lastProofAt: ilYA(120),
        }),
      ],
      0,
      maintenant,
    );

    expect(action.type).toBe("actualiser");
    expect(action.type === "actualiser" && action.exigence.id).toBe("perimee");
  });

  it("préfère le requis au recommandé", () => {
    const action = prochaineAction(
      [
        exigence({ id: "reco", level: "recommended", status: "todo" }),
        exigence({ id: "req", level: "required", status: "todo" }),
      ],
      0,
      maintenant,
    );

    expect(action.type === "deposer" && action.exigence.id).toBe("req");
  });

  it("propose de partager quand tout le requis est prêt et que personne n’a accès", () => {
    const action = prochaineAction(
      [exigence({ level: "required", status: "done" })],
      0,
      maintenant,
    );

    expect(action).toEqual({ type: "partager" });
  });

  it("ne propose plus de partager dès qu’un accès existe", () => {
    const action = prochaineAction(
      [exigence({ level: "required", status: "done" })],
      1,
      maintenant,
    );

    expect(action).toEqual({ type: "rien" });
  });

  it("ne réclame pas une exigence marquée non applicable", () => {
    const action = prochaineAction(
      [exigence({ level: "required", status: "not_applicable" })],
      1,
      maintenant,
    );

    expect(action.type).not.toBe("deposer");
  });
});

describe("requises", () => {
  it("écarte le recommandé et l’optionnel des compteurs", () => {
    const liste = requises([
      exigence({ id: "a", level: "required" }),
      exigence({ id: "b", level: "recommended" }),
      exigence({ id: "c", level: "optional" }),
    ]);

    expect(liste.map((item) => item.id)).toEqual(["a"]);
  });
});
