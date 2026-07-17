# ---------------------------------------------------------------------------
# Kora — image unique : Next.js (sortie standalone) + LibreOffice headless.
#
# La conversion bureautique (xlsx/pptx/docx -> PDF) tourne EN PROCESS via
# `soffice` : pas de service distant. Le fichier ne quitte jamais le conteneur.
# ---------------------------------------------------------------------------

# --- Étape 1 : build ---
FROM node:22-bookworm-slim AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# `output: "standalone"` (next.config.ts) produit .next/standalone.
RUN npm run build

# --- Étape 2 : runtime ---
FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
# LibreOffice a besoin d'un HOME inscriptible pour son profil.
ENV HOME=/tmp
ENV PORT=8080

# LibreOffice + polices. --no-install-recommends : ni GUI ni dictionnaires.
RUN apt-get update && apt-get install -y --no-install-recommends \
      libreoffice-calc \
      libreoffice-impress \
      libreoffice-writer \
      fonts-liberation \
      fonts-dejavu \
    && rm -rf /var/lib/apt/lists/*

# Le serveur standalone embarque ses dépendances Node ; on copie aussi les
# assets statiques et le dossier public.
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 8080
CMD ["node", "server.js"]
