import { expect, test } from "@playwright/test";

import { verifierCible } from "./verifier-cible";

/**
 * Les limites de plan, éprouvées À L'ÉCRAN.
 *
 * POURQUOI CE FICHIER EXISTE. Elles n'avaient été vérifiées qu'en SQL, sous
 * identité authentifiée. C'était le plus gros trou du dossier de preuve : une
 * limite peut tenir en base et se présenter à l'utilisateur comme une panne —
 * « L'action n'a pas abouti, réessayez » —, ce qui l'envoie buter deux fois de
 * suite sur le même mur sans comprendre.
 *
 * Ce que ces tests vérifient n'est donc pas que la limite existe, mais qu'elle
 * SE DIT : avec son motif, et avec une issue.
 *
 * Le compte installé porte une opération et aucun abonnement — le défaut est
 * alors d'une seule opération active. Créer la seconde doit être refusé.
 */
test.beforeEach(async () => {
  verifierCible(process.env.NEXT_PUBLIC_SUPABASE_URL);
});

test.describe("Limites de plan — une seule opération active", () => {
  test("la seconde opération est refusée, et le refus s’explique", async ({
    page,
  }) => {
    await page.goto("/v2/operations/nouvelle");

    // Étape 1 — ce qu'on prépare.
    await page.getByRole("button", { name: /continuer/i }).click();

    // Étape 2 — le nom. Préfixé, comme toute donnée que la suite écrit : cette
    // base deviendra la production.
    await page
      .locator('input[name="nom"]')
      .fill(`ZZ-TEST limite ${Date.now()}`);
    await page.getByRole("button", { name: /continuer/i }).click();

    // Étape 3 — la structure, puis l'envoi.
    await page.getByRole("button", { name: /créer|terminer|continuer/i }).click();

    // LE REFUS DOIT SE LIRE. On vise le motif et l'issue, pas seulement la
    // présence d'un message : « réessayez » serait un échec de ce test même si
    // la limite avait correctement bloqué la création.
    // `p.v2-auth-error` et RIEN D'AUTRE : `[role="alert"]` attrapait
    // `__next-route-announcer__`, la région vide que Next.js pose sur chaque
    // page. Le test échouait alors sur une chaîne vide sans que le produit soit
    // en cause.
    const message = page.locator("p.v2-auth-error");
    await expect(message).toBeVisible({ timeout: 15_000 });
    await expect(message).toContainText(/plan n’autorise pas|plan n'autorise pas/i);
    await expect(message).toContainText(/archivez|changez de plan/i);

    // Et l'opération existante ne doit pas avoir bougé : un refus n'est pas une
    // panne, il ne touche à rien.
    await page.goto("/v2/operations");
    await expect(page.getByText(/ZZ-TEST limite/)).toHaveCount(0);
  });
});
