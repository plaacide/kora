import { describe, expect, it } from "vitest";

import {
  avancement,
  depassee,
  echeanceCourte,
  etatSuivi,
  joursRestants,
  ordreDeSuivi,
  repartition,
} from "./challenges";

const MAINTENANT = new Date("2026-10-16T09:00:00Z");
const HIER = "2026-10-15";
const DEMAIN = "2026-10-17";

describe("etatSuivi", () => {
  it("dit « Terminé » quand tous les critères requis sont faits", () => {
    expect(etatSuivi({ faits: 4, requis: 4 }, DEMAIN, MAINTENANT)).toBe("Terminé");
  });

  it("dit « Terminé » AVANT « en retard », même échéance dépassée", () => {
    // Une entreprise qui a tout fourni la veille n'est pas en retard le
    // lendemain. L'inverse adresserait un reproche à quelqu'un qui n'a plus
    // rien à faire — et ferait relancer pour rien.
    expect(etatSuivi({ faits: 4, requis: 4 }, HIER, MAINTENANT)).toBe("Terminé");
  });

  it("dit « En retard » quand l'échéance est passée et qu'il reste à faire", () => {
    expect(etatSuivi({ faits: 3, requis: 4 }, HIER, MAINTENANT)).toBe("En retard");
  });

  it("dit « En cours » dès qu'un critère est fait, avant l'échéance", () => {
    expect(etatSuivi({ faits: 1, requis: 4 }, DEMAIN, MAINTENANT)).toBe("En cours");
  });

  it("dit « À faire » quand rien n'a bougé", () => {
    expect(etatSuivi({ faits: 0, requis: 4 }, DEMAIN, MAINTENANT)).toBe("À faire");
  });

  it("n'est jamais en retard SANS échéance", () => {
    expect(etatSuivi({ faits: 0, requis: 4 }, null, MAINTENANT)).toBe("À faire");
  });

  it("est terminé d'emblée quand aucun critère n'est requis", () => {
    // Un Challenge peut n'être fait que de critères facultatifs : 0 sur 0,
    // il n'y a rien à attendre.
    expect(etatSuivi({ faits: 0, requis: 0 }, HIER, MAINTENANT)).toBe("Terminé");
  });
});

describe("depassee", () => {
  it("laisse le jour de l'échéance ENTIER", () => {
    // Comparer à minuit mettrait tout le monde en retard dès le matin du jour
    // dit. C'est le défaut déjà corrigé côté invitations.
    expect(depassee("2026-10-16", new Date("2026-10-16T23:00:00Z"))).toBe(false);
  });

  it("bascule le lendemain", () => {
    expect(depassee("2026-10-16", new Date("2026-10-17T00:30:00Z"))).toBe(true);
  });
});

describe("joursRestants", () => {
  it("compte le jour en cours comme restant", () => {
    expect(joursRestants("2026-10-16", new Date("2026-10-16T09:00:00Z"))).toBe(1);
  });

  it("devient négatif après l'échéance", () => {
    expect(joursRestants("2026-10-14", MAINTENANT)).toBeLessThan(0);
  });
});

describe("repartition", () => {
  it("range les huit entreprises de l'écran 09b dans les quatre compteurs", () => {
    const entreprises = [
      { faits: 4, requis: 4 },
      { faits: 4, requis: 4 },
      { faits: 2, requis: 4 },
      { faits: 0, requis: 4 },
    ];
    expect(repartition(entreprises, DEMAIN, MAINTENANT)).toEqual({
      aFaire: 1,
      enCours: 1,
      enRetard: 0,
      terminees: 2,
    });
  });

  it("bascule les inachevées en retard une fois l'échéance passée", () => {
    const entreprises = [
      { faits: 4, requis: 4 },
      { faits: 2, requis: 4 },
      { faits: 0, requis: 4 },
    ];
    expect(repartition(entreprises, HIER, MAINTENANT)).toEqual({
      aFaire: 0,
      enCours: 0,
      enRetard: 2,
      terminees: 1,
    });
  });
});

describe("avancement", () => {
  it("mesure les CRITÈRES, pas les entreprises terminées", () => {
    // Sept entreprises à un critère près afficheraient 0 % si l'on comptait
    // les seules entreprises finies — alors que l'effort est presque abouti.
    expect(avancement([{ faits: 3, requis: 4 }, { faits: 3, requis: 4 }])).toBe(75);
  });

  it("ne dépasse jamais 100 % si un facultatif gonfle le compte", () => {
    expect(avancement([{ faits: 6, requis: 4 }])).toBe(100);
  });

  it("rend null quand il n'y a rien à mesurer", () => {
    expect(avancement([])).toBeNull();
    expect(avancement([{ faits: 0, requis: 0 }])).toBeNull();
  });
});

describe("echeanceCourte", () => {
  it("écrit « 15 octobre », sans l'année", () => {
    expect(echeanceCourte("2026-10-15")).toBe("15 octobre");
  });

  it("le dit quand il n'y en a pas", () => {
    expect(echeanceCourte(null)).toBe("sans échéance");
  });
});

describe("ordreDeSuivi", () => {
  it("met les RETARDS en tête — écran 14", () => {
    const liste = [
      { faits: 4, nom: "Terminée", requis: 4 },
      { faits: 0, nom: "Rien faite", requis: 4 },
      { faits: 2, nom: "En cours", requis: 4 },
    ];
    // Échéance passée : les deux inachevées sont en retard, donc devant.
    expect(ordreDeSuivi(liste, HIER, MAINTENANT).map((e) => e.nom)).toEqual([
      "En cours",
      "Rien faite",
      "Terminée",
    ]);
  });

  it("départage deux états égaux par le NOM, pour un ordre stable", () => {
    const liste = [
      { faits: 1, nom: "Zoe", requis: 4 },
      { faits: 1, nom: "Adam", requis: 4 },
    ];
    expect(ordreDeSuivi(liste, DEMAIN, MAINTENANT).map((e) => e.nom)).toEqual([
      "Adam",
      "Zoe",
    ]);
  });
});
