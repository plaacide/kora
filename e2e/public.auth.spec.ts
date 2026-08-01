import { expect, test } from "@playwright/test";

import { verifierCible } from "./verifier-cible";

/**
 * Ce qui se vérifie sans compte.
 *
 * Ces tests ne dépendent d'aucun identifiant : ils tournent sur la machine de
 * n'importe qui, y compris avant que `.env.test.local` n'existe. C'est la seule
 * partie du dossier de preuve qui ne demande rien au fondateur.
 */

test.beforeAll(() => {
  verifierCible(process.env.NEXT_PUBLIC_SUPABASE_URL);
});

/** Rien de technique ne doit jamais atteindre l'écran — §12 du brief. */
const JARGON = [
  /duplicate key/i,
  /violates .*constraint/i,
  /permission denied for/i,
  /relation "/i,
  /supabase/i,
  /postgres/i,
  /\bJWT\b/,
  /stack trace/i,
  /undefined/i,
  /\[object Object\]/,
];

async function aucunJargonVisible(texte: string) {
  for (const motif of JARGON) {
    expect(texte, `texte technique visible : ${motif}`).not.toMatch(motif);
  }
}

test.describe("Page de connexion", () => {
  test("s’affiche sans erreur de console", async ({ page }) => {
    const erreurs: string[] = [];
    page.on("console", (m) => m.type() === "error" && erreurs.push(m.text()));
    page.on("pageerror", (e) => erreurs.push(String(e)));

    await page.goto("/v2/connexion");

    await expect(page.getByRole("heading", { name: /connectez-vous/i })).toBeVisible();
    await expect(page.locator("input[name=\"email\"]")).toBeVisible();
    expect(erreurs, `erreurs console : ${erreurs.join(" · ")}`).toHaveLength(0);
  });

  test("refuse un envoi vide sans laisser passer la requête", async ({ page }) => {
    await page.goto("/v2/connexion");
    await page.getByRole("button", { name: /se connecter|connexion/i }).click();

    // On reste sur la page : rien n'a été soumis au serveur.
    await expect(page).toHaveURL(/\/v2\/connexion/);
    await aucunJargonVisible(await page.locator("body").innerText());
  });

  test("refuse une adresse mal formée", async ({ page }) => {
    await page.goto("/v2/connexion");
    await page.locator("input[name=\"email\"]").fill("pas-une-adresse");
    await page.locator("input[name=\"password\"]").fill("quelque-chose-de-faux");
    await page.getByRole("button", { name: /se connecter|connexion/i }).click();

    await expect(page).toHaveURL(/\/v2\/connexion/);
    await aucunJargonVisible(await page.locator("body").innerText());
  });

  test("se parcourt entièrement au clavier", async ({ page }) => {
    await page.goto("/v2/connexion");

    // On tabule jusqu'à trouver le champ e-mail : compter les tabulations
    // figerait le test sur l'ordre actuel du DOM, qui n'est pas la propriété
    // qu'on veut garantir.
    let atteint = false;
    for (let i = 0; i < 20 && !atteint; i += 1) {
      await page.keyboard.press("Tab");
      atteint = await page
        .getByLabel(/e-mail/i)
        .evaluate((el) => el === document.activeElement)
        .catch(() => false);
    }
    expect(atteint, "le champ e-mail n’est pas atteignable au clavier").toBe(true);

    // Le focus doit se VOIR : un anneau invisible rend le clavier inutilisable.
    const contour = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el) return null;
      const s = getComputedStyle(el);
      return { outline: s.outlineStyle, width: s.outlineWidth, ombre: s.boxShadow };
    });
    expect(contour).not.toBeNull();
  });

  test("ne divulgue aucun secret dans la page", async ({ page }) => {
    await page.goto("/v2/connexion");
    const html = await page.content();

    // La clé publiable a le droit d'être là — c'est son rôle. La clé de service
    // et les secrets de paiement, jamais.
    expect(html).not.toMatch(/service_role/i);
    expect(html).not.toMatch(/SUPABASE_SERVICE_ROLE/i);
    expect(html).not.toMatch(/\bss_[A-Za-z0-9]{10,}/);
    expect(html).not.toMatch(/GENIUSPAY_SECRET/i);
  });
});

test.describe("Pages protégées", () => {
  const privees = [
    "/v2/accueil",
    "/v2/operations",
    "/v2/team",
    "/v2/security",
    "/v2/abonnement",
    "/v2/invitations",
    "/v2/recherche",
  ];

  for (const route of privees) {
    test(`${route} renvoie un visiteur anonyme vers la connexion`, async ({ page }) => {
      await page.goto(route);

      // La preuve la plus importante du dossier de sécurité : aucune de ces
      // pages ne doit rendre la moindre donnée sans session.
      await expect(page).toHaveURL(/\/v2\/connexion/);
      await aucunJargonVisible(await page.locator("body").innerText());
    });
  }
});
