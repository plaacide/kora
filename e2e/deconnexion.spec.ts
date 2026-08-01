import { readFileSync } from "node:fs";

import { expect, test } from "@playwright/test";

/**
 * La déconnexion — le geste que la V2 n'avait pas.
 *
 * Ces tests demandent une session : ils tournent dans le projet
 * `chrome-desktop`, qui dépend de `auth.setup.ts`. Sans `.env.test.local`, ils
 * ne s'exécutent pas.
 */

test.describe("Menu du compte", () => {
  test("l’avatar ouvre un menu qui nomme le compte", async ({ page }) => {
    await page.goto("/v2/accueil");

    const avatar = page.locator("button.v2-avatar");
    await expect(avatar, "l’avatar n’est pas un bouton").toBeVisible();
    await expect(avatar).toHaveAttribute("aria-haspopup", "menu");
    await expect(avatar).toHaveAttribute("aria-expanded", "false");

    await avatar.click();

    const menu = page.locator(".v2-compte-menu");
    await expect(menu).toBeVisible();
    await expect(avatar).toHaveAttribute("aria-expanded", "true");

    // L'adresse en entier : sur un poste partagé, deux initiales ne disent pas
    // de quel compte on s'apprête à sortir.
    await expect(page.locator(".v2-compte-email")).toContainText("@");
    await expect(
      menu.getByRole("menuitem", { name: /se déconnecter/i }),
    ).toBeVisible();
  });

  test("Échap referme le menu et rend le focus à l’avatar", async ({ page }) => {
    await page.goto("/v2/accueil");
    const avatar = page.locator("button.v2-avatar");

    await avatar.click();
    await expect(page.locator(".v2-compte-menu")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.locator(".v2-compte-menu")).toHaveCount(0);
    await expect(avatar).toBeFocused();
  });

  test("un clic à l’extérieur referme le menu", async ({ page }) => {
    await page.goto("/v2/accueil");

    await page.locator("button.v2-avatar").click();
    await expect(page.locator(".v2-compte-menu")).toBeVisible();

    await page.locator("body").click({ position: { x: 700, y: 400 } });
    await expect(page.locator(".v2-compte-menu")).toHaveCount(0);
  });
});

test.describe("Se déconnecter", () => {
  // Ce test PERD la session : il tourne en dernier, dans son propre contexte,
  // pour ne pas invalider `.session.json` des autres.
  test.use({ storageState: { cookies: [], origins: [] } });

  test("ramène à la connexion de la V2, et non à celle de la V1", async ({
    page,
    context,
  }) => {
    // On rouvre une session dans ce contexte isolé.
    const session = JSON.parse(readFileSync("e2e/.session.json", "utf8"));
    await context.addCookies(session.cookies);

    await page.goto("/v2/accueil");
    await page.locator("button.v2-avatar").click();
    await page
      .locator(".v2-compte-menu")
      .getByRole("menuitem", { name: /se déconnecter/i })
      .click();

    // La V1 renvoie vers `/connexion`. Sortir de la V2 pour atterrir dans
    // l'autre produit est exactement ce qu'on a corrigé sur les liens d'e-mail.
    await page.waitForURL(/\/v2\/connexion/);
    await expect(page).toHaveURL(/\/v2\/connexion/);

    // Et la session est bien morte : une page privée ne se rouvre plus.
    await page.goto("/v2/operations");
    await expect(page).toHaveURL(/\/v2\/connexion/);
  });
});

test.describe("Bandeau de l’onboarding", () => {
  /**
   * L'onboarding n'offrait aucune sortie : ni aide, ni déconnexion. C'est
   * pourtant le moment où l'on se trompe le plus de compte — on vient de
   * s'inscrire, parfois avec la mauvaise adresse, et rien ne permettait de
   * revenir en arrière.
   *
   * Ces tests ne s'exécutent que si le compte de recette n'a PAS terminé son
   * onboarding ; sinon la route redirige vers l'espace de travail.
   */
  test("porte le logo, l’aide et la déconnexion", async ({ page }) => {
    await page.goto("/v2/onboarding/company");

    if (!page.url().includes("/onboarding")) {
      test.skip(true, "Le compte de recette a déjà terminé son onboarding.");
    }

    const entete = page.locator(".v2-onboard-head");

    // Le vrai logo, et non le carré à lettre « S » qui traînait ici.
    await expect(entete.locator("svg")).toBeVisible();
    await expect(entete.getByLabel("Sanza")).toBeVisible();

    await expect(entete.getByText(/connecté en tant que/i)).toBeVisible();

    const aide = entete.getByRole("link", { name: /besoin d’aide/i });
    await expect(aide).toHaveAttribute("href", /^mailto:contact@sanza\.africa/);

    await expect(
      entete.getByRole("button", { name: /se déconnecter/i }),
    ).toBeVisible();
  });

  test("la déconnexion depuis l’onboarding ramène à la connexion V2", async ({
    page,
  }) => {
    await page.goto("/v2/onboarding/company");
    if (!page.url().includes("/onboarding")) {
      test.skip(true, "Le compte de recette a déjà terminé son onboarding.");
    }

    await page
      .locator(".v2-onboard-head")
      .getByRole("button", { name: /se déconnecter/i })
      .click();

    await page.waitForURL(/\/v2\/connexion/);
  });
});
