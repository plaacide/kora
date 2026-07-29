# Déploiement de Sanza V2

## Flux de livraison

1. Les changements V2 sont développés et validés localement.
2. Chaque lot est commité sur la branche `v2/rebuild`.
3. Un push sur `v2/rebuild` déclenche le webhook GitHub de Coolify.
4. Coolify construit l’image avec le `Dockerfile`, puis remplace le conteneur
   staging si le build et le healthcheck réussissent.
5. La recette est accessible sur `https://v2.sanza.africa`.

La production reste branchée sur son environnement et sa branche propres.

## Configuration Coolify staging

- Projet : `sanza`
- Environnement : `staging`
- Application : `sanza-v2-staging`
- Dépôt : `plaacide/kora`
- Branche : `v2/rebuild`
- Build pack : `Dockerfile`
- Port exposé : `8080`
- Déploiement automatique : activé
- HTTPS forcé : activé
- Healthcheck : `GET /api/health`, code attendu `200`

## Variables obligatoires

Les valeurs sont gérées dans Coolify et ne doivent jamais être commitées.

- `SANZA_V2_ENABLED=true`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Le projet Supabase staging doit rester distinct du projet de production.

## Vérifications avant publication

```bash
npx tsc --noEmit
npx eslint src/app/api/health/route.ts
npm run build
```

Après le push, vérifier dans Coolify que le déploiement correspond au SHA du
commit GitHub, puis ouvrir `https://v2.sanza.africa/v2`.

## Retour arrière

En cas de régression, utiliser l’onglet **Rollback** de l’application Coolify
pour redéployer le dernier conteneur sain. Ne jamais modifier l’application de
production pour corriger un incident staging.
