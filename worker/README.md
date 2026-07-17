# Kora — worker de conversion bureautique

Convertit Excel / PowerPoint / Word en PDF, **sur notre infrastructure**, pour
que la visionneuse puisse les filigraner comme un PDF natif. Le fichier source
ne part jamais chez un tiers : c'est ce qui distingue Kora d'un simple embed
Google/Office Online.

## Ce que c'est

Un conteneur minimal : LibreOffice headless + un serveur HTTP d'une seule
route. On lui `POST` des octets, il renvoie un PDF.

```
POST /convert
  Header  X-Worker-Token: <WORKER_TOKEN>
  Body    octets du fichier (application/octet-stream)
  Query   ?ext=xlsx      (extension d'origine, pour aider LibreOffice)
  →  200  application/pdf
  →  401  jeton absent/incorrect
  →  415  format non convertible
  →  500  échec de conversion
```

## Pourquoi pas sur Vercel

Vercel exécute des fonctions serverless : pas de binaire LibreOffice (~400 Mo),
pas de système de fichiers durable pour son profil. Le worker vit donc à part.
Hébergeurs adaptés, scale-to-zero (ne coûte rien quand personne ne consulte) :

- **Fly.io** — `fly launch` depuis ce dossier, `fly scale count 1 --region cdg`.
- **Railway / Render** — pointer sur ce dossier, ils lisent le `Dockerfile`.

Coût réel attendu : ~5-10 $/mois, l'essentiel du temps à zéro.

## Déploiement (résumé)

1. Créer le compte chez l'hébergeur (étape à faire par vous).
2. Définir un secret partagé `WORKER_TOKEN` (une chaîne aléatoire longue).
3. Déployer ce dossier (le `Dockerfile` fait tout).
4. Dans l'app Next.js (Vercel), ajouter les variables d'environnement :
   - `DOC_WORKER_URL` = l'URL publique du worker
   - `DOC_WORKER_TOKEN` = le même secret que `WORKER_TOKEN`

Sans ces variables, l'app fonctionne : elle affiche simplement « aperçu
bureautique bientôt disponible » sur les fichiers Office, sans planter.
