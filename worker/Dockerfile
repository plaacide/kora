# LibreOffice headless + Node. Base Debian slim : LibreOffice y est packagé
# proprement, ce qui évite de recompiler quoi que ce soit.
FROM node:22-bookworm-slim

# --no-install-recommends : on ne veut ni interface graphique ni dictionnaires.
# libreoffice-impress/calc/writer suffisent pour pptx/xlsx/docx.
RUN apt-get update && apt-get install -y --no-install-recommends \
      libreoffice-calc \
      libreoffice-impress \
      libreoffice-writer \
      fonts-liberation \
      fonts-dejavu \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json ./
# Aucune dépendance npm : le serveur n'utilise que la lib standard de Node.
COPY server.mjs ./

ENV PORT=8080
# LibreOffice a besoin d'un HOME inscriptible pour son profil.
ENV HOME=/tmp
EXPOSE 8080

CMD ["node", "server.mjs"]
