import { defineConfig, devices } from "@playwright/test";

/**
 * Les tests de bout en bout de la V2.
 *
 * IDENTIFIANTS. Aucun mot de passe ne figure dans ce dépôt. Le compte de test
 * vit dans `.env.test.local`, que git ignore et que seul le fondateur écrit.
 * Les tests lisent `process.env` et ne connaissent jamais la valeur.
 *
 * BASE. Ces tests écrivent pour de vrai — organisations, opérations,
 * invitations. Ils visent la base de STAGING (`jourzsgjnutktsrgxkoo`) et jamais
 * la production. `verifier-cible.ts` refuse de démarrer si l'URL ne correspond
 * pas : une suite qui créerait des données chez de vrais clients ferait plus de
 * dégâts qu'elle n'en éviterait.
 */

// Les variables vivent dans `.env.test.local` ; on les charge sans dépendance
// supplémentaire, Node 20+ sachant le faire seul depuis `--env-file`. Ici on
// reste explicite pour que le fichier manquant se voie tout de suite.
import { config as chargerEnv } from "dotenv";

chargerEnv({ path: ".env.test.local", quiet: true });
chargerEnv({ path: ".env.local", quiet: true });

const PORT = Number(process.env.E2E_PORT ?? 3001);
const BASE = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  // Un seul worker : les tests partagent une organisation de staging, et
  // franchir une limite de plan en parallèle donnerait des comptes faux.
  workers: 1,
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: [
    ["html", { outputFolder: "docs/beta-readiness/evidence/playwright-report", open: "never" }],
    ["json", { outputFile: "docs/beta-readiness/evidence/resultats.json" }],
    ["list"],
  ],
  outputDir: "docs/beta-readiness/evidence/traces",
  timeout: 60_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: BASE,
    // Vidéo et trace SYSTÉMATIQUES, pas seulement sur échec : le dossier de
    // preuve demande de montrer les parcours qui passent, pas seulement ceux
    // qui cassent.
    video: "on",
    trace: "on",
    screenshot: "on",
    locale: "fr-FR",
    timezoneId: "Africa/Abidjan",
  },

  projects: [
    { name: "connexion", testMatch: /auth\.setup\.ts/ },
    {
      name: "chrome-desktop",
      dependencies: ["connexion"],
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
        storageState: "e2e/.session.json",
      },
      testIgnore: [/auth\.setup\.ts/, /public\./, /mobile\./],
    },
    {
      name: "mobile",
      dependencies: ["connexion"],
      use: { ...devices["iPhone 13"], storageState: "e2e/.session.json" },
      testMatch: /mobile\./,
    },
    {
      // Ce qui se vérifie sans compte : la page de connexion, ses erreurs, le
      // clavier. Aucun `storageState`, donc aucune dépendance.
      name: "public",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /public\./,
    },
  ],
});
