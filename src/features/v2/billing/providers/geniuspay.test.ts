import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";

import { signatureValide, traduireEvenement } from "./geniuspay";

/**
 * La signature de webhook est le seul rempart entre un inconnu et l'activation
 * gratuite d'un plan payant. Elle mérite d'être éprouvée sur ce qu'un attaquant
 * tenterait vraiment, pas seulement sur le cas qui marche.
 */

const SECRET = "whsec_sandbox_pour_le_test";
const MAINTENANT = 1_800_000_000;

function signer(corps: string, timestamp: number, secret = SECRET): string {
  return createHmac("sha256", secret).update(`${timestamp}.${corps}`).digest("hex");
}

describe("signatureValide", () => {
  const corps = JSON.stringify({ event: "payment.success", data: { reference: "MTX-1" } });

  it("accepte une notification correctement signée", () => {
    expect(
      signatureValide({
        corps,
        signature: signer(corps, MAINTENANT),
        timestamp: String(MAINTENANT),
        secret: SECRET,
        maintenant: MAINTENANT,
      }),
    ).toBe(true);
  });

  it("refuse un corps modifié après signature", () => {
    // Le scénario réel : on intercepte une notification authentique de 200 XOF
    // et on remplace le montant. La signature ne suit pas.
    const falsifie = corps.replace("MTX-1", "MTX-999");

    expect(
      signatureValide({
        corps: falsifie,
        signature: signer(corps, MAINTENANT),
        timestamp: String(MAINTENANT),
        secret: SECRET,
        maintenant: MAINTENANT,
      }),
    ).toBe(false);
  });

  it("refuse une signature calculée avec un autre secret", () => {
    expect(
      signatureValide({
        corps,
        signature: signer(corps, MAINTENANT, "whsec_le_mauvais"),
        timestamp: String(MAINTENANT),
        secret: SECRET,
        maintenant: MAINTENANT,
      }),
    ).toBe(false);
  });

  it("refuse un rejeu au-delà de cinq minutes", () => {
    const vieux = MAINTENANT - 301;

    expect(
      signatureValide({
        corps,
        signature: signer(corps, vieux),
        timestamp: String(vieux),
        secret: SECRET,
        maintenant: MAINTENANT,
      }),
    ).toBe(false);
  });

  it("accepte encore à la limite des cinq minutes", () => {
    const limite = MAINTENANT - 300;

    expect(
      signatureValide({
        corps,
        signature: signer(corps, limite),
        timestamp: String(limite),
        secret: SECRET,
        maintenant: MAINTENANT,
      }),
    ).toBe(true);
  });

  it("refuse un horodatage dans le futur", () => {
    // Une horloge en avance est aussi suspecte qu'une horloge en retard : sans
    // borne haute, il suffirait de dater dans dix ans pour signer une fois et
    // rejouer indéfiniment.
    const futur = MAINTENANT + 3600;

    expect(
      signatureValide({
        corps,
        signature: signer(corps, futur),
        timestamp: String(futur),
        secret: SECRET,
        maintenant: MAINTENANT,
      }),
    ).toBe(false);
  });

  it("refuse une notification sans signature ni horodatage", () => {
    expect(
      signatureValide({
        corps,
        signature: undefined,
        timestamp: String(MAINTENANT),
        secret: SECRET,
        maintenant: MAINTENANT,
      }),
    ).toBe(false);

    expect(
      signatureValide({
        corps,
        signature: signer(corps, MAINTENANT),
        timestamp: undefined,
        secret: SECRET,
        maintenant: MAINTENANT,
      }),
    ).toBe(false);
  });

  it("refuse un horodatage qui n’est pas un nombre", () => {
    expect(
      signatureValide({
        corps,
        signature: signer(corps, MAINTENANT),
        timestamp: "bientôt",
        secret: SECRET,
        maintenant: MAINTENANT,
      }),
    ).toBe(false);
  });

  it("refuse une signature de longueur inattendue sans lever", () => {
    // `timingSafeEqual` lève sur des longueurs différentes : une signature
    // tronquée ferait tomber la route au lieu de rejeter proprement.
    expect(() =>
      signatureValide({
        corps,
        signature: "ab",
        timestamp: String(MAINTENANT),
        secret: SECRET,
        maintenant: MAINTENANT,
      }),
    ).not.toThrow();

    expect(
      signatureValide({
        corps,
        signature: "ab",
        timestamp: String(MAINTENANT),
        secret: SECRET,
        maintenant: MAINTENANT,
      }),
    ).toBe(false);
  });

  it("distingue deux corps de même longueur", () => {
    // Garde-fou contre une comparaison qui ne porterait que sur la taille.
    const autre = JSON.stringify({ event: "payment.success", data: { reference: "MTX-2" } });
    expect(autre.length).toBe(corps.length);

    expect(
      signatureValide({
        corps: autre,
        signature: signer(corps, MAINTENANT),
        timestamp: String(MAINTENANT),
        secret: SECRET,
        maintenant: MAINTENANT,
      }),
    ).toBe(false);
  });
});

describe("traduireEvenement", () => {
  it("traduit un paiement réussi", () => {
    expect(traduireEvenement("payment.success")).toBe("payment.succeeded");
  });

  it("traduit un renouvellement d’abonnement", () => {
    expect(traduireEvenement("subscription.payment_succeeded")).toBe("subscription.renewed");
  });

  it("traduit une résiliation", () => {
    expect(traduireEvenement("subscription.cancelled")).toBe("subscription.cancelled");
  });

  it("range les échecs, expirations et impayés du même côté", () => {
    for (const nom of [
      "payment.failed",
      "payment.expired",
      "payment.cancelled",
      "subscription.payment_failed",
      "subscription.past_due",
    ]) {
      expect(traduireEvenement(nom)).toBe("payment.failed");
    }
  });

  it("ne se casse pas sur un événement qu’ils ajouteraient demain", () => {
    // Un prestataire enrichit ses notifications sans prévenir. L'inconnu doit
    // être reçu et ignoré, jamais faire échouer la réception.
    expect(traduireEvenement("payment.partially_refunded")).toBe("unknown");
    expect(traduireEvenement("")).toBe("unknown");
  });
});
