import { expect, test as setup } from "@playwright/test";

import { identifiants, verifierCible } from "./verifier-cible";

/**
 * Ouvre une session une seule fois et la range dans `e2e/.session.json`.
 *
 * POURQUOI PAS UNE CONNEXION PAR TEST. Supabase Auth applique une limite de
 * tentatives par adresse ; une centaine de connexions d'affilée déclencherait
 * « Trop de tentatives » au milieu de la suite, et les échecs qui suivraient
 * n'auraient rien à voir avec les écrans testés.
 *
 * Le mot de passe transite par `process.env` et n'est jamais écrit nulle part :
 * ni en clair ici, ni dans la trace — Playwright masque la saisie d'un champ
 * `type="password"` dans ses captures, et `.session.json` ne contient que des
 * jetons, pas l'identifiant d'origine.
 */
setup("ouvrir une session", async ({ page }) => {
  verifierCible(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const { email, motDePasse } = identifiants();

  await page.goto("/v2/connexion");

  await page.locator("input[name=\"email\"]").fill(email);
  await page.locator("input[name=\"password\"]").fill(motDePasse);
  await page.getByRole("button", { name: /se connecter|connexion/i }).click();

  // On attend le poste de pilotage, pas seulement l'absence d'erreur : une
  // connexion refusée laisse la page en place sans rien changer d'autre.
  await page.waitForURL(/\/v2\/(accueil|connexion\/2fa|onboarding)/, {
    timeout: 30_000,
  });

  if (page.url().includes("/2fa")) {
    throw new Error(
      "Le compte de test exige un second facteur. Les tests ne peuvent pas le " +
        "fournir : utilisez un compte de recette sans double authentification.",
    );
  }

  await expect(page).toHaveURL(/\/v2\/(accueil|onboarding)/);
  await page.context().storageState({ path: "e2e/.session.json" });
});
