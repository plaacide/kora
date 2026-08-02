import { expect, test as setup } from "@playwright/test";

import { identifiantsNeufs, verifierCible } from "./verifier-cible";

/**
 * Ouvrir une session sur le compte NEUF, celui qui n'a pas d'organisation.
 *
 * Il doit atterrir sur l'onboarding et NON sur le poste de pilotage. Si ce
 * n'était pas le cas, les tests du parcours s'ignoreraient en silence : on
 * échoue ici plutôt que de laisser neuf tests disparaître sans un mot.
 */
setup("ouvrir une session neuve", async ({ page }) => {
  verifierCible(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const { email, motDePasse } = identifiantsNeufs();

  await page.goto("/v2/connexion");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(motDePasse);
  await page.getByRole("button", { name: /se connecter|connexion/i }).click();

  await page.waitForURL(/\/v2\/(accueil|onboarding)/, { timeout: 30_000 });

  await expect(
    page,
    "le compte neuf a une organisation : relancez `node e2e/creer-compte-essai.mjs`",
  ).toHaveURL(/\/v2\/onboarding/);

  await page.context().storageState({ path: "e2e/.session-neuve.json" });
});
