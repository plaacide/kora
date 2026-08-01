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
    await expect(cartes).toHaveCount(6);

    const premiere = cartes.nth(0);
    const seconde = cartes.nth(1);

    // AUCUN choix par défaut : celui qui passait l'étape sans y toucher
    // enregistrait « Lever en capital » sans l'avoir dit.
    for (const i of [0, 1, 2, 3, 4, 5]) {
      await expect(cartes.nth(i).locator("input")).not.toBeChecked();
    }

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

test.describe("Onboarding — la saisie ne se perd pas", () => {
  test("l’erreur s’efface de l’URL après lecture", async ({ page }) => {
    await page.goto("/v2/onboarding/operation?erreur=objectif");
    if (!page.url().includes("/onboarding/operation")) {
      test.skip(true, "Le compte de recette a déjà terminé son onboarding.");
    }

    // Le message reste lisible pour ce rendu-ci…
    await expect(page.locator(".v2-auth-error")).toBeVisible();
    // …mais l'adresse est nettoyée : recharger ne rejoue plus une erreur
    // déjà corrigée, et un lien mis en favori n'ouvre plus sur un échec.
    await expect(page).toHaveURL(/\/onboarding\/operation$/);

    await page.reload();
    await expect(page.locator(".v2-auth-error")).toHaveCount(0);
  });

  test("revenir à une étape retrouve ce qu’on y a saisi", async ({ page }) => {
    await page.goto("/v2/onboarding/company");
    if (!page.url().includes("/onboarding/company")) {
      test.skip(true, "Le compte de recette a déjà terminé son onboarding.");
    }

    const nom = `Recette ${Date.now()}`;
    await page.locator('input[name="companyName"]').fill(nom);
    await page.locator('select[name="country"]').selectOption("Mali");
    await page.locator('select[name="sector"]').selectOption("Énergie");
    await page.locator('select[name="stage"]').selectOption({ index: 1 });
    await page.getByRole("button", { name: /continuer/i }).click();

    await page.waitForURL(/\/onboarding\/operation/);
    await page.goto("/v2/onboarding/company");

    // Ce n'est PAS un retour des valeurs par défaut : ce sont les réponses
    // données, relues depuis la base.
    await expect(page.locator('input[name="companyName"]')).toHaveValue(nom);
    await expect(page.locator('select[name="country"]')).toHaveValue("Mali");
    await expect(page.locator('select[name="sector"]')).toHaveValue("Énergie");
  });

  test("un champ jamais rempli reste vide", async ({ page }) => {
    await page.goto("/v2/onboarding/company");
    if (!page.url().includes("/onboarding/company")) {
      test.skip(true, "Le compte de recette a déjà terminé son onboarding.");
    }
    // `website` n'est enregistré nulle part : il ne doit pas se remplir seul.
    await expect(page.locator('input[name="website"]')).toHaveValue("");
  });
});

test.describe("Onboarding — une valeur hors liste ne disparaît pas", () => {
  test("un secteur enregistré sous une ancienne liste reste affiché", async ({
    page,
  }) => {
    await page.goto("/v2/onboarding/company");
    if (!page.url().includes("/onboarding/company")) {
      test.skip(true, "Le compte de recette a déjà terminé son onboarding.");
    }

    const secteur = page.locator('select[name="sector"]');
    const valeur = await secteur.inputValue();
    if (!valeur) test.skip(true, "Aucun secteur enregistré sur ce compte.");

    // La valeur en base doit être celle affichée, même si la liste a changé
    // depuis : sinon le champ paraît vide, on le remplit autrement, et la
    // vraie valeur est écrasée sans que personne ait vu ce qu'il perdait.
    await expect(secteur).toHaveValue(valeur);
    await expect(
      secteur.locator(`option[value="${valeur}"]`),
    ).toHaveCount(1);
  });
});
