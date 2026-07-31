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

### Paiement — Genius Pay

À ajouter au **runtime**, jamais au build : ces valeurs ne doivent pas entrer
dans l'image Docker, qui se pousse et se partage.

```text
SANZA_BILLING_PROVIDER=geniuspay
GENIUSPAY_API_KEY=<pk_sandbox_… en recette, pk_live_… en production>
GENIUSPAY_API_SECRET=<sk_… correspondant>
GENIUSPAY_WEBHOOK_SECRET=<whsec_… du webhook déclaré chez eux>
```

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

Événements : `payment.success`, `payment.failed`, `payment.expired`,
`subscription.payment_succeeded`, `subscription.payment_failed`,
`subscription.past_due`, `subscription.cancelled`.

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

## Migrations

Les migrations sont créées depuis le dépôt avec la CLI Supabase et appliquées
au projet V2 avant toute revue de production. Aucun SQL manuel copié dans le
tableau de bord ne devient la source de vérité.
