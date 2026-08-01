import { expect, test } from "@playwright/test";

/**
 * L'étape 3 de l'onboarding — le choix d'objectif.
 *
 * CE QUE CES TESTS EMPÊCHENT DE REVENIR. Les cartes étaient des `<button>`
 * pilotés par un `useState`, alors que la feuille de style stylise la sélection
 * avec `:has(input:checked)`. Cliquer ne changeait donc RIEN à l'écran, et le
 * formulaire partait toujours avec le premier objectif quel que soit le choix.
 * Un écran qui ignore silencieusement ce qu'on lui dit est pire qu'un écran
 * cassé : on ne s'en aperçoit qu'au moment où le plan généré ne correspond à
 * rien.
 */

test.describe("Onboarding — choix de l’objectif", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/v2/onboarding/operation");
    if (!page.url().includes("/onboarding/operation")) {
      test.skip(true, "Le compte de recette a déjà terminé son onboarding.");
    }
  });

  test("le clic change ce que l’écran montre", async ({ page }) => {
    const cartes = page.locator(".v2-objective");
    // Six, comme l'écran « Nouvelle opération » : les deux listes ont été
    // réunies dans le domaine.
    await expect(cartes).toHaveCount(6);

    const premiere = cartes.nth(0);
    const seconde = cartes.nth(1);

    // Un groupe radio doit partir avec un choix : sans lui, le formulaire
    // s'envoie sans objectif et la base en invente un.
    await expect(premiere.locator("input")).toBeChecked();

    await seconde.click();

    await expect(seconde.locator("input")).toBeChecked();
    await expect(premiere.locator("input")).not.toBeChecked();

    // La coche ne s'affiche que sur la carte retenue — c'est le signal visible
    // qui manquait entièrement.
    await expect(seconde.locator(".v2-objective-check")).toBeVisible();
    await expect(premiere.locator(".v2-objective-check")).toBeHidden();
  });

  test("le clavier parcourt les cartes aux flèches", async ({ page }) => {
    // Gratuit avec de vrais boutons radio, impossible avec les `<button>`
    // qu'il y avait avant.
    const inputs = page.locator(".v2-objective input");
    await inputs.nth(0).focus();
    await page.keyboard.press("ArrowDown");

    await expect(inputs.nth(1)).toBeChecked();
  });

  test("l’objectif choisi est bien celui qui part", async ({ page }) => {
    const cartes = page.locator(".v2-objective");
    await cartes.nth(2).click();
    const attendu = await cartes.nth(2).locator("input").inputValue();

    const envoi = page.waitForRequest(
      (r) => r.method() === "POST" && r.url().includes("/onboarding/operation"),
    );
    await page.getByRole("button", { name: /^continuer$/i }).click();
    const requete = await envoi;

    expect(requete.postData() ?? "").toContain(attendu);
  });
});
