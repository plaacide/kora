import type { NextConfig } from "next";
import path from "node:path";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Sortie autonome : un serveur Node minimal, embarqué tel quel dans l'image
  // Docker (Next.js + LibreOffice dans un seul conteneur).
  output: "standalone",
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Binding natif (canvas) + pdfjs : à charger au runtime Node, pas à bundler.
  serverExternalPackages: ["@napi-rs/canvas", "pdfjs-dist"],
  // pdfjs charge son worker par un import dynamique construit à l'exécution :
  // le traceur de Next ne le voit pas et `pdf.worker.mjs` manque dans la sortie
  // standalone. En local on ne s'en aperçoit pas (node_modules complet est là) ;
  // en conteneur, TOUT rendu échoue sur « Setting up fake worker failed ».
  // On force donc l'inclusion du worker — et des polices standard, chargées de
  // la même manière pour les PDF qui n'embarquent pas leurs fontes.
  outputFileTracingIncludes: {
    "/api/viewer/**": [
      "./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs",
      "./node_modules/pdfjs-dist/standard_fonts/**/*",
    ],
  },
};

export default withNextIntl(nextConfig);
