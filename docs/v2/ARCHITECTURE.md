# Sanza V2 — architecture de reconstruction

## Objectif

Construire la V2 dans le dépôt existant sans perturber la V1 en production et
sans figer une interface avant validation des maquettes.

La branche de travail est `v2/rebuild`. Toutes les routes V2 sont isolées sous
`/v2`. En production, elles restent désactivées tant que
`SANZA_V2_ENABLED=true` n’est pas configuré.

## Principes

1. Le produit est organisé autour d’une **opération de financement**, pas
   autour d’une liste de fonctionnalités de data room.
2. Les pages et layouts restent des Server Components par défaut.
3. Les modules métier sont neutres : aucune directive `use client` ou
   `use server`.
4. Les composants interactifs seront ajoutés au plus près de l’interaction
   lorsque les maquettes seront disponibles.
5. Toute écriture passe par une commande serveur ou une RPC auditée. Le
   navigateur ne modifie jamais directement une table.
6. La RLS protège les données même si la navigation masque une fonction.
7. La V2 réutilise l’authentification Supabase et le déploiement Docker
   existants, mais cible un projet Supabase de test séparé.

## Arborescence

```text
src/
├── app/v2/
│   ├── (onboarding)/onboarding/
│   └── (workspace)/
│       ├── operations/
│       ├── invitations/
│       ├── team/
│       └── security/
└── features/v2/
    ├── domain/       # types et règles métier pures
    ├── navigation/   # routes et navigation contextuelle
    ├── server/       # garde de fonctionnalité et session
    └── ui/           # frontières UI remplaçables par les maquettes
```

`app/v2` ne porte que le routage et la composition des écrans. Le métier reste
dans `features/v2`, afin de pouvoir être testé sans Next.js et partagé entre le
serveur et les petits îlots clients.

## Couches

| Couche | Responsabilité | Interdit |
|---|---|---|
| Route | Paramètres URL, composition, redirection | Logique métier durable |
| UI | Présentation et interactions locales | Accès direct à Supabase |
| Application | Cas d’usage, autorisations, transactions | JSX |
| Domaine | États, invariants, décisions pures | Next.js, cookies, secrets |
| Infrastructure | Supabase, Storage, Resend, viewer | Décisions produit |

Les couches `application` et `infrastructure` seront ajoutées fonction par
fonction. Elles ne sont pas créées artificiellement avant le premier cas
d’usage réel.

## Shell attendu

La future interface suit trois profondeurs :

1. rail global clair ;
2. panneau contextuel de l’opération ;
3. espace de travail.

Le détail d’une exigence, d’une pièce ou d’un accès pourra s’ouvrir dans un
panneau droit dont l’état est restaurable. Le shell n’est pas implémenté dans
ce lot : son rendu dépend des maquettes.

## Sécurité

- Authentification obligatoire pour tout `/v2`.
- Adhésion à une organisation obligatoire pour le workspace.
- Onboarding accessible à un utilisateur authentifié sans organisation.
- 2FA vérifiée avec les règles existantes.
- 2FA à rendre obligatoire avant le premier partage externe.
- Rôles internes et invités externes sont deux modèles distincts.
- Les journaux de sécurité et d’activité documentaire restent distincts.

## Décisions reportées

- Schéma SQL final et migrations.
- Correspondance entre les tables V1 et le modèle V2.
- Design du rail, du panneau contextuel et des panneaux droits.
- Stratégie de bascule des URLs V1 vers V2.
- Migration des données de production.

Ces décisions seront prises après validation des maquettes et inventaire
précis des données à conserver.
