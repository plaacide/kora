import type { NextConfig } from "next";
import path from "node:path";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Binding natif (canvas) + pdfjs : à charger au runtime Node, pas à bundler.
  serverExternalPackages: ["@napi-rs/canvas", "pdfjs-dist"],
};

export default withNextIntl(nextConfig);
