# Sanza

Plateforme sécurisée de préparation, partage et suivi des opérations de
financement.

## Développement

Installer les dépendances puis lancer Next.js :

```bash
npm ci
npm run dev
```

L’application utilise Next.js 16, React 19, TypeScript, Tailwind CSS,
next-intl et Supabase.

## Reconstruction V2

La V2 est développée sur la branche `v2/rebuild` et isolée sous `/v2`.
Elle est activée localement par défaut. En environnement de production ou de
recette, définir :

```text
SANZA_V2_ENABLED=true
```

La structure ne remplace pas encore l’interface V1. Les écrans V2 actuels sont
des contrats fonctionnels neutres destinés à être remplacés par les maquettes
validées.

Documentation :

- `docs/v2/ARCHITECTURE.md`
- `docs/v2/ROUTES.md`
- `docs/v2/DATA-MODEL.md`
- `docs/v2/DELIVERY-PLAN.md`
- `docs/v2/COOLIFY.md`

## Vérifications

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Le déploiement cible une image Docker autonome sur Coolify. Les variables
Supabase publiques doivent être fournies au build ; les secrets restent
uniquement au runtime.
