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
};

export default withNextIntl(nextConfig);
