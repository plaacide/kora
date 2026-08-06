import { describe, expect, it } from "vitest";

import {
  badge,
  ecart,
  type FilBrut,
  initiales,
  quand,
  sansReponse,
} from "./questions";

const MAINTENANT = new Date("2026-08-06T12:00:00Z");

function ilYA(heures: number): string {
  return new Date(MAINTENANT.getTime() - heures * 3_600_000).toISOString();
}

function fil(p: Partial<FilBrut> = {}): FilBrut {
  return {
    type: "question",
    statut: "open",
    creeLe: ilYA(48),
    reponduLe: null,
    ...p,
  };
}

describe("badge", () => {
  it("dit « En attente » d'une question sans réponse", () => {
    expect(badge(fil())).toEqual({ texte: "En attente", ton: "amber" });
  });

  it("dit « Répondu » d'une question répondue", () => {
    expect(badge(fil({ reponduLe: ilYA(20), statut: "answered" }))).toEqual({
      texte: "Répondu",
      ton: "green",
    });
  });

  it("croit la RÉPONSE plutôt que le statut, s'ils se contredisent", () => {
    // Un statut resté à « open » avec une réponse en base décrit un fil
    // répondu. Afficher « en attente » ferait relancer une entreprise qui a
    // déjà répondu — la pire des deux erreurs possibles.
    expect(badge(fil({ reponduLe: ilYA(3), statut: "open" })).texte).toBe(
      "Répondu",
    );
  });

  it("ne met JAMAIS une suggestion en attente, quel que soit son statut", () => {
    // Une suggestion n'attend rien. La compter comme une question ferait
    // porter à l'entreprise une dette qu'on lui a explicitement épargnée.
    for (const statut of ["open", "answered", "read"]) {
      expect(badge(fil({ statut, type: "suggestion" }))).toEqual({
        texte: "Suggestion",
        ton: "neutral",
      });
    }
  });
});

describe("ecart", () => {
  it("dit « à l’instant » sous l'heure", () => {
    expect(ecart(ilYA(0.5), MAINTENANT)).toBe("à l’instant");
  });

  it("compte en heures dans la journée", () => {
    expect(ecart(ilYA(3), MAINTENANT)).toBe("il y a 3 h");
  });

  it("dit « hier » et non « il y a 1 jours »", () => {
    expect(ecart(ilYA(25), MAINTENANT)).toBe("hier");
  });

  it("compte en jours au-delà", () => {
    expect(ecart(ilYA(96), MAINTENANT)).toBe("il y a 4 jours");
  });
});

describe("quand", () => {
  it("date une question ouverte par son ENVOI", () => {
    expect(quand(fil(), MAINTENANT)).toBe("envoyée il y a 2 jours");
  });

  it("date une question répondue par sa RÉPONSE, pas par son envoi", () => {
    // « envoyée il y a 2 jours » sur un fil répondu hier dirait le contraire
    // de ce qui s'est passé : le programme croirait attendre encore.
    const f = fil({ creeLe: ilYA(48), reponduLe: ilYA(25) });
    expect(quand(f, MAINTENANT)).toBe("répondu hier");
  });

  it("date une suggestion sans verbe — elle n'attend rien", () => {
    expect(quand(fil({ creeLe: ilYA(96), type: "suggestion" }), MAINTENANT)).toBe(
      "il y a 4 jours",
    );
  });
});

describe("sansReponse", () => {
  it("ne compte que les questions qui attendent vraiment", () => {
    const fils = [
      fil(),
      fil({ reponduLe: ilYA(2) }),
      fil({ type: "suggestion" }),
      fil(),
    ];
    expect(sansReponse(fils)).toBe(2);
  });

  it("rend zéro sur un fil vide", () => {
    expect(sansReponse([])).toBe(0);
  });
});

describe("initiales", () => {
  it("prend deux lettres, jamais plus", () => {
    expect(initiales("Sahel Dairy Company")).toBe("SD");
  });

  it("se contente d'une seule quand le nom n'a qu'un mot", () => {
    expect(initiales("CoolBricks")).toBe("C");
  });

  it("ne rend jamais une chaîne vide", () => {
    expect(initiales("   ")).toBe("—");
  });
});
