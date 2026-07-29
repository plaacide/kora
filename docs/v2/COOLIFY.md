# Sanza V2 — environnement Coolify

## Isolation

Créer une application Coolify distincte de la production :

- dépôt : `plaacide/kora` ;
- branche : `v2/rebuild` ;
- Dockerfile : `./Dockerfile` ;
- domaine : domaine de recette dédié ;
- projet Supabase : projet V2 de test uniquement.

Ne jamais connecter l’application V2 à la base Supabase de production pendant
la construction.

## Variables

### Build

```text
NEXT_PUBLIC_SUPABASE_URL=<url-du-projet-v2>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<cle-publique-du-projet-v2>
```

Ces deux valeurs sont injectées par le Dockerfile pendant `next build`.

### Runtime

```text
SANZA_V2_ENABLED=true
SUPABASE_SERVICE_ROLE_KEY=<secret-du-projet-v2>
RESEND_API_KEY=<secret-de-test>
EMAIL_FROM=Sanza <noreply@sanza.africa>
```

Les secrets runtime ne doivent jamais porter le préfixe `NEXT_PUBLIC_`.

## Vérifications avant exposition

1. Le domaine de recette utilise HTTPS.
2. Les URL de redirection Auth pointent vers le domaine de recette.
3. Les e-mails de test ne ciblent pas des utilisateurs de production.
4. Storage et RLS utilisent le projet V2.
5. `SANZA_V2_ENABLED` est absent ou à `false` sur l’application V1.
6. Une route V2 renvoie 404 lorsqu’elle est désactivée.
7. Le conteneur écoute sur le port 8080 comme la V1.

## Migrations

Les migrations sont créées depuis le dépôt avec la CLI Supabase et appliquées
au projet V2 avant toute revue de production. Aucun SQL manuel copié dans le
tableau de bord ne devient la source de vérité.
