import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Les worktrees git vivent sous .claude/ et contiennent une COPIE
    // complète de src/. Sans cette exclusion, chaque fichier est analysé
    // deux fois : `npm run lint` doublait son compte, et le contrôle
    // « lint à la base » devenait ininterprétable — 11 problèmes ou 22 selon
    // qu'un worktree existe ou non.
    ".claude/**",
  ]),
]);

export default eslintConfig;
