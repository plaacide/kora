import { describe, expect, it } from "vitest";

import {
  SEUIL,
  mots,
  suggestForBatch,
  suggestForFile,
} from "./suggestions";

/**
 * Le référentiel réel du modèle OHADA, tel que `apply_checklist_template` le
 * pose. Les tests valent ce que vaut ce jeu : le copier depuis la base plutôt
 * que d'inventer des libellés commodes est ce qui les rend crédibles.
 */
const EXIGENCES = [
  {
    id: "1",
    label: "Statuts à jour et enregistrés",
    description: "Version en vigueur, avec toutes les modifications depuis la création.",
  },
  {
    id: "2",
    label: "Extrait RCCM de moins de 3 mois",
    description: "Un extrait périmé bloque systématiquement un closing.",
  },
  {
    id: "3",
    label: "Registre des actionnaires à jour",
    description: "Table de capitalisation cohérente avec les statuts et les PV.",
  },
  {
    id: "4",
    label: "PV des assemblées des 3 derniers exercices",
    description: "AGO, AGE et conseils. Les décisions structurantes doivent être traçables.",
  },
  {
    id: "5",
    label: "Pacte d'actionnaires en vigueur",
    description: "Le pacte existant conditionne ce qu'un nouvel investisseur peut négocier.",
  },
  {
    id: "6",
    label: "États financiers SYSCOHADA — 3 exercices",
    description: "Bilan, compte de résultat et TAFIRE, référentiel révisé.",
  },
  {
    id: "7",
    label: "Rapport du commissaire aux comptes",
    description: "Rapports général et spécial, avec les réserves éventuelles.",
  },
  {
    id: "8",
    label: "Déclarations de TVA à jour",
    description: "Cohérentes avec le chiffre d'affaires déclaré.",
  },
  {
    id: "9",
    label: "Budget de l'exercice en cours",
    description: "Avec le suivi du réalisé, pour juger de la fiabilité des prévisions.",
  },
  {
    id: "10",
    label: "Politique LBC/FT et screening",
    description: "Anti-blanchiment, vérification sanctions et personnes politiquement exposées.",
  },
  {
    id: "11",
    label: "Politique environnementale et sociale",
    description: "Attendue par les DFI, souvent alignée sur les normes de performance IFC.",
  },
  {
    id: "12",
    label: "Marques OAPI enregistrées",
    description: "Certificats et échéances. Une marque non déposée est un risque.",
  },
];

const meilleure = (fichier: string) =>
  suggestForFile(fichier, EXIGENCES)[0]?.label ?? null;

describe("mots", () => {
  it("retire l'extension, les accents et la ponctuation", () => {
    expect(mots("États financiers — 2025.pdf")).toEqual(["etats", "financiers"]);
  });

  it("écarte les années et numéros de version", () => {
    // « États financiers 2024 » et « … 2025 » satisfont la même exigence :
    // le millésime ne dit rien de la NATURE de la pièce.
    expect(mots("Budget 2026 v3.xlsx")).toEqual(["budget"]);
  });

  it("coupe les sigles composés en éléments distinctifs", () => {
    expect(mots("Politique LBC-FT.pdf")).toContain("lbc");
    expect(mots("Politique LBC-FT.pdf")).toContain("ft");
  });

  it("ne rend rien d'un nom sans mot exploitable", () => {
    expect(mots("2025.pdf")).toEqual([]);
    expect(mots("document.pdf")).toEqual([]);
  });
});

describe("suggestForFile — les cas que le fondateur dépose vraiment", () => {
  it("reconnaît les statuts", () => {
    expect(meilleure("Statuts — société.pdf")).toBe("Statuts à jour et enregistrés");
  });

  it("reconnaît un sigle qui ne désigne qu'une exigence", () => {
    expect(meilleure("Extrait RCCM 2026.pdf")).toBe("Extrait RCCM de moins de 3 mois");
  });

  it("reconnaît le pacte d'actionnaires malgré le registre voisin", () => {
    // « actionnaires » apparaît dans deux exigences : c'est « pacte » qui
    // départage, et c'est bien ce que la rareté doit produire.
    expect(meilleure("Pacte actionnaires.pdf")).toBe("Pacte d'actionnaires en vigueur");
  });

  it("distingue le registre des actionnaires du pacte", () => {
    expect(meilleure("Registre des actionnaires.xlsx")).toBe(
      "Registre des actionnaires à jour",
    );
  });

  it("reconnaît les états financiers", () => {
    expect(meilleure("Etats financiers 2025.pdf")).toBe(
      "États financiers SYSCOHADA — 3 exercices",
    );
  });

  it("reconnaît une pièce nommée par son sigle seul", () => {
    expect(meilleure("SYSCOHADA.pdf")).toBe("États financiers SYSCOHADA — 3 exercices");
  });

  it("reconnaît le budget", () => {
    expect(meilleure("Budget 2026 approuvé.pdf")).toBe("Budget de l'exercice en cours");
  });

  it("reconnaît les marques OAPI", () => {
    expect(meilleure("Marques OAPI.pdf")).toBe("Marques OAPI enregistrées");
  });

  it("reconnaît les PV d'assemblées", () => {
    expect(meilleure("PV assemblées 2025.pdf")).toBe(
      "PV des assemblées des 3 derniers exercices",
    );
  });
});

describe("suggestForFile — ce qu'il ne doit PAS proposer", () => {
  it("ne rattache pas « Politique RGPD » à une politique du référentiel", () => {
    // Le piège du mot commun : « politique » apparaît dans deux exigences et
    // n'en désigne aucune. Sans pondération par la rareté, ce test échoue.
    const trouve = meilleure("Politique RGPD.pdf");
    expect(trouve).not.toBe("Politique LBC/FT et screening");
    expect(trouve).not.toBe("Politique environnementale et sociale");
  });

  it("ne propose rien pour une pièce étrangère au référentiel", () => {
    expect(suggestForFile("Photo bureau Dakar.jpg", EXIGENCES)).toEqual([]);
    expect(suggestForFile("Notes réunion lundi.docx", EXIGENCES)).toEqual([]);
  });

  it("ne propose rien quand le nom ne porte aucun mot", () => {
    expect(suggestForFile("2025.pdf", EXIGENCES)).toEqual([]);
  });

  it("ne propose rien sans référentiel", () => {
    expect(suggestForFile("Statuts.pdf", [])).toEqual([]);
  });

  it("ne rend jamais plus de trois pistes", () => {
    for (const nom of ["Statuts actionnaires exercices rapport budget.pdf"]) {
      expect(suggestForFile(nom, EXIGENCES).length).toBeLessThanOrEqual(3);
    }
  });

  it("ne rend que des scores au-dessus du seuil", () => {
    const toutes = EXIGENCES.flatMap(() =>
      suggestForFile("Pacte actionnaires.pdf", EXIGENCES),
    );
    expect(toutes.every((s) => s.score >= SEUIL)).toBe(true);
  });
});

describe("suggestForFile — explicabilité", () => {
  it("dit quels mots ont produit la correspondance", () => {
    const [premiere] = suggestForFile("Extrait RCCM 2026.pdf", EXIGENCES);
    expect(premiere.matched).toContain("rccm");
  });
});

describe("suggestForBatch", () => {
  it("n'attribue pas deux fois la même exigence", () => {
    // Deux pièces qui se disputent une exigence produiraient un écran où
    // confirmer l'une invalide l'autre.
    const lot = suggestForBatch(
      ["Statuts.pdf", "Statuts consolidés.pdf"],
      EXIGENCES,
    );
    const retenues = lot
      .map((entree) => entree.suggestion?.requirementId)
      .filter(Boolean);
    expect(new Set(retenues).size).toBe(retenues.length);
  });

  it("rend les pièces dans l'ordre où elles ont été déposées", () => {
    const noms = ["Budget 2026.pdf", "Statuts.pdf", "Marques OAPI.pdf"];
    expect(suggestForBatch(noms, EXIGENCES).map((e) => e.fileName)).toEqual(noms);
  });

  it("laisse sans suggestion la pièce qu'il ne reconnaît pas", () => {
    const lot = suggestForBatch(["Statuts.pdf", "Photo bureau.jpg"], EXIGENCES);
    expect(lot[0].suggestion).not.toBeNull();
    expect(lot[1].suggestion).toBeNull();
  });
});
