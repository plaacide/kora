# Sanza V2 — environnement Coolify

## Isolation

**`jourzsgjnutktsrgxkoo` N'EST PLUS UNE RECETTE : la V2 deviendra la
production.** Décisions du fondateur le 1er août 2026 — « oublie la production
parce qu'on utilisera ce que tu as avec la V2 », puis « la V2 deviendra la
production ». Le projet `bileqzpguyynkktndazs` est abandonné et n'a aucune
donnée à reprendre : Sanza est en pré-lancement.

**Sa base sera vidée avant l'ouverture** — « oublie ces données, le moment venu
nous commencerons de zéro ». Écrire librement dedans est donc autorisé : comptes
d'essai, organisations, documents, suite de tests, franchissement de limites de
plan. Il n'y a rien à préserver.

La suite Playwright préfixe malgré tout ce qu'elle crée par `ZZ-TEST` — par
hygiène, pour qu'on distingue à tout moment un essai d'une saisie manuelle, pas
parce qu'une purge sélective serait nécessaire.

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
SEND_EMAIL_HOOK_SECRET=<v1,whsec_… généré par Supabase>
```

Les secrets runtime ne doivent jamais porter le préfixe `NEXT_PUBLIC_`.

### `SEND_EMAIL_HOOK_SECRET` — l'oubli qui coûte cher

Cette variable manquait à ce document, et elle n'a donc jamais été posée en
recette. Symptôme constaté le 1er août : Supabase, faute de crochet, expédiait
ses gabarits par défaut — en anglais, depuis `noreply@mail.app.supabase.io` —
dont le lien passe par SON point d'entrée `/verify` et n'atteint jamais
`/auth/confirm` avec un `token_hash`.

Elle se génère dans **Authentication → Hooks → Send Email Hook**, en déclarant :

```text
https://<domaine-de-cet-environnement>/api/auth/email-hook
```

L'ORDRE COMPTE. Dès que le crochet est activé, Supabase cesse d'envoyer
lui-même : tant que le secret n'est pas déployé ici, la route répond 500 et
AUCUN e-mail ne part. Créer le crochet, copier le secret, redéployer — sans
s'interrompre entre les trois.

Pour vérifier après déploiement :

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST \
  https://<domaine>/api/auth/email-hook \
  -H "content-type: application/json" -d '{}'
```

`401` est le bon résultat — signature refusée, donc le secret est lu. `500`
signifie que la variable manque encore, et `404` que la route n'est pas
déployée.

### Paiement — Genius Pay

À ajouter au **runtime**, jamais au build : ces valeurs ne doivent pas entrer
dans l'image Docker, qui se pousse et se partage.

```text
SANZA_BILLING_PROVIDER=geniuspay
GENIUSPAY_API_KEY=<sk_sandbox_… en recette, sk_live_… en production>
GENIUSPAY_API_SECRET=<ss_… correspondant>
GENIUSPAY_WEBHOOK_SECRET=<whsec_… du webhook déclaré chez eux>
```

⚠️ **Les préfixes réels sont `sk_` et `ss_`**, et non `pk_`/`sk_` comme
l'annonce leur documentation. `GENIUSPAY_API_KEY` porte la valeur de l'en-tête
`X-API-Key`, `GENIUSPAY_API_SECRET` celle de `X-API-Secret` — recopier dans
l'ordre de leur tableau de bord, sans se fier au préfixe.

Sans `SANZA_BILLING_PROVIDER`, c'est le mode manuel qui s'applique — virement et
facture. Une valeur inconnue fait échouer au démarrage plutôt que de retomber
silencieusement sur le manuel : une faute de frappe passerait sinon inaperçue
jusqu'au jour où un client ne pourrait pas payer.

**Le bac à sable et le réel se déduisent du préfixe de la clé**, `_sandbox_` ou
`_live_`. L'application refuse toute notification dont l'environnement ne
correspond pas au sien. Conséquence concrète : **la recette et la production
doivent avoir chacune leur webhook déclaré chez Genius Pay**, avec son propre
`whsec_`. Croiser les deux ne fait pas une erreur bruyante — cela fait des
paiements qui n'ouvrent rien.

### Le webhook à déclarer chez Genius Pay

```text
https://<domaine-de-cette-application>/api/v2/billing/webhook
```

Le secret `whsec_` n'existe pas avant le webhook : il s'affiche à sa création,
**une seule fois**.

Événements réellement proposés par leur tableau de bord (août 2026) :
`payment.success`, `payment.failed`, `payment.cancelled`, `payment.refunded`.
Cocher aussi `payment.initiated` ne coûte rien — l'application le reçoit et
l'ignore, une intention de paiement n'ouvrant aucun plan.

⚠️ **Aucun événement `subscription.*` n'est proposé**, alors que leur
documentation décrit une API d'abonnements. La reconduction automatique n'est
donc pas disponible : on est en paiement par paiement. À leur demander.

**Cette route n'est PAS coupée par `SANZA_V2_ENABLED`** — le drapeau ne couvre
que les pages sous `/v2`. C'est délibéré : un paiement encaissé ne doit pas se
perdre parce qu'un écran est désactivé. La signature reste le seul contrôle
d'accès, et elle suffit.

## Vérifications avant exposition

1. Le domaine de recette utilise HTTPS.
2. Les URL de redirection Auth pointent vers le domaine de recette.
3. Les e-mails de test ne ciblent pas des utilisateurs de production.
4. Storage et RLS utilisent le projet V2.
5. `SANZA_V2_ENABLED` est absent ou à `false` sur l’application V1.
6. Une route V2 renvoie 404 lorsqu’elle est désactivée.
7. Le conteneur écoute sur le port 8080 comme la V1.
8. En recette, les clés Genius Pay portent bien `_sandbox_`. Une clé `_live_`
   sur un domaine de recette encaisse pour de vrai.
9. Le webhook déclaré chez Genius Pay pointe vers CE domaine, et son `whsec_`
   est celui de CET environnement.
10. Le Send Email Hook est déclaré dans Supabase et pointe vers CE domaine, et
    `SEND_EMAIL_HOOK_SECRET` porte le secret de CE crochet. La sonde `curl`
    ci-dessus renvoie `401`, jamais `500`.

## Migrations

Les migrations sont créées depuis le dépôt avec la CLI Supabase et appliquées
au projet V2 avant toute revue de production. Aucun SQL manuel copié dans le
tableau de bord ne devient la source de vérité.
