import { describe, expect, it } from "vitest";

import { effectif, periode, statutInvitation, tonStatut } from "./cohorte";

const MAINTENANT = new Date("2026-08-06T12:00:00Z");

function invitation(jours: number, ouverte = false, acceptee = false) {
  const creee = new Date(MAINTENANT.getTime() - jours * 86_400_000);
  return {
    status: acceptee ? ("accepted" as const) : ("pending" as const),
    createdAt: creee.toISOString(),
    openedAt: ouverte ? creee.toISOString() : null,
    acceptedAt: acceptee ? creee.toISOString() : null,
  };
}

describe("statutInvitation", () => {
  it("dit « Envoyée » tant qu'elle est jeune et sans écho", () => {
    expect(statutInvitation(invitation(2), MAINTENANT)).toBe("Envoyée");
  });

  it("dit « À relancer » passé quatorze jours sans écho", () => {
    expect(statutInvitation(invitation(20), MAINTENANT)).toBe("À relancer");
  });

  it("dit « Expirée » passé trente jours", () => {
    expect(statutInvitation(invitation(31), MAINTENANT)).toBe("Expirée");
  });

  /**
   * LA RÈGLE QUI COMPTE. Une invitation ouverte mais restée sans suite depuis
   * vingt jours n'est PAS « à relancer » : l'écran 04 dit qu'elle est la plus
   * prometteuse de la liste, et qu'un appel y vaut mieux qu'un e-mail. Si
   * l'ordre des tests s'inversait, on relancerait par écrit celui qu'il
   * fallait appeler.
   */
  it("préfère « Lien ouvert » à « À relancer »", () => {
    expect(statutInvitation(invitation(20, true), MAINTENANT)).toBe(
      "Lien ouvert",
    );
  });

  it("mais l'expiration l'emporte sur tout le reste", () => {
    expect(statutInvitation(invitation(40, true), MAINTENANT)).toBe("Expirée");
  });

  it("une invitation acceptée ne peut plus expirer", () => {
    expect(statutInvitation(invitation(90, false, true), MAINTENANT)).toBe(
      "Acceptée",
    );
  });
});

describe("tonStatut", () => {
  it("réserve le rouge à ce qui est perdu", () => {
    expect(tonStatut("Expirée")).toBe("red");
    expect(tonStatut("À relancer")).toBe("amber");
    expect(tonStatut("Envoyée")).toBe("neutral");
  });
});

describe("periode", () => {
  it("n'écrit l'année qu'une fois quand les deux bornes la partagent", () => {
    expect(periode("2026-03-01", "2026-12-31")).toBe("mars → décembre 2026");
  });

  it("l'écrit deux fois quand la cohorte franchit l'année", () => {
    expect(periode("2024-09-01", "2025-06-30", "—")).toBe(
      "septembre 2024 — juin 2025",
    );
  });

  it("ne prétend pas connaître une date absente", () => {
    expect(periode(null, null)).toBe("période non renseignée");
    expect(periode("2026-03-01", null)).toBe("à partir de mars 2026");
  });
});

describe("effectif", () => {
  it("compte les places quand la cohorte est vide", () => {
    expect(effectif(0, 15)).toBe("0 / 15 places");
  });

  it("compte les entreprises dès qu'il y en a", () => {
    expect(effectif(12, 15)).toBe("12 entreprises");
    expect(effectif(1, 15)).toBe("1 entreprise");
  });
});
