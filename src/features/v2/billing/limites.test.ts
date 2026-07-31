import { describe, expect, it } from "vitest";

import { messageDeRefus, refusDeLimite } from "./limites";

describe("refusDeLimite", () => {
  it("reconnaît le refus que renvoie la base", () => {
    const refus = refusDeLimite("limite atteinte : active_deals");
    expect(refus?.code).toBe("active_deals");
    expect(refus?.issue).toContain("Archivez");
  });

  it("propose de passer à Raise pour les visiteurs, qu'il rend illimités", () => {
    expect(refusDeLimite("limite atteinte : external_visitors")?.issue).toContain(
      "Raise",
    );
  });

  it("laisse passer ce qui n'est pas un refus de limite", () => {
    expect(refusDeLimite("droits insuffisants")).toBeNull();
    expect(messageDeRefus("connexion perdue")).toBeNull();
  });

  it("ne brode pas sur une limite qu'on n'a pas mise en mots", () => {
    const refus = refusDeLimite("limite atteinte : quelque_chose_de_neuf");
    expect(refus?.code).toBe("quelque_chose_de_neuf");
    expect(refus?.issue).toBeNull();
  });

  it("survit au message complet de PostgreSQL, contexte compris", () => {
    const brut =
      'ERROR:  P0001: limite atteinte : internal_users\nCONTEXT: PL/pgSQL function assert_within_limit';
    expect(refusDeLimite(brut)?.code).toBe("internal_users");
  });
});

describe("messageDeRefus", () => {
  it("dit ce qui bloque, ce qui ne bouge pas, et comment sortir", () => {
    const message = messageDeRefus("limite atteinte : active_deals") ?? "";
    expect(message).toContain("n’autorise pas une opération de plus");
    expect(message).toContain("ne sont pas touchées");
    expect(message).toContain("réversible");
  });
});
