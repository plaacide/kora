# Brancher Genius Pay

Documentation du prestataire : <https://pay.genius.ci/doc>

## Ce qui est en place

| Pièce | Où |
|---|---|
| Le prestataire | `src/features/v2/billing/providers/geniuspay.ts` |
| Signature des notifications | testée, 15 cas, `geniuspay.test.ts` |
| La route qui reçoit | `src/app/api/v2/billing/webhook/route.ts` |
| L'application en base | `apply_billing_event()`, migration `20260803220000` |

Aucun écran ne nomme Genius Pay. Le §18 est tenu : on change de prestataire en
changeant une variable d'environnement.

## Les variables à poser

Dans `.env.local` en local, dans Coolify pour le déploiement. **Elles ne doivent
jamais entrer dans le dépôt, ni dans une conversation.**

```
SANZA_BILLING_PROVIDER=geniuspay
GENIUSPAY_API_KEY=sk_sandbox_…      → en-tête X-API-Key
GENIUSPAY_API_SECRET=ss_sandbox_…   → en-tête X-API-Secret
GENIUSPAY_WEBHOOK_SECRET=whsec_…
```

⚠️ **Les préfixes réels sont `sk_` et `ss_`.** Leur documentation annonce
`pk_`/`sk_` ; le tableau de bord délivre autre chose. Recopier dans l'ordre des
en-têtes, sans se fier au préfixe.

⚠️ **Leurs réponses sont enveloppées** dans `{"success":true,"data":{…}}`,
alors que leur documentation les montre plates. `charge()` désencapsule, et
accepte les deux formes. C'est ce décalage qui a fait échouer le premier
paiement sur une réponse pourtant valide.

Sans `SANZA_BILLING_PROVIDER`, c'est le mode manuel qui s'applique — virement et
facture. C'est volontaire : le produit doit fonctionner sans dépendre de
personne.

**Le mode réel se déduit du préfixe de la clé**, pas d'une variable séparée :
`_sandbox_` ou `_live_`. Deux sources pour un même fait finissent par se
contredire, et ce jour-là on encaisse pour de vrai en croyant tester.

## L'adresse à déclarer chez eux

```
https://<votre-domaine>/api/v2/billing/webhook
```

Le secret `whsec_` s'affiche à la création du webhook, **une seule fois**.

Événements réellement proposés par leur tableau de bord (août 2026) :
`payment.success`, `payment.failed`, `payment.initiated`, `payment.cancelled`,
`payment.refunded`, `cashout.*`.

⚠️ **AUCUN ÉVÉNEMENT `subscription.*` N'EST PROPOSÉ.** Leur documentation décrit
pourtant une API d'abonnements complète. Le code sait déjà les traduire, mais
tant qu'ils ne sont pas exposés, **la reconduction automatique n'existe pas** :
chaque échéance est un paiement à part entière. Question posée à leur support.

Leur guide demande aussi une **réponse en moins de 5 secondes**. La route s'y
tient : elle vérifie une signature et appelle une seule fonction en base.

## Ce qui protège l'argent

1. **La signature.** `HMAC-SHA256(timestamp + "." + corps)`, comparée en temps
   constant, sur le corps brut. Une notification non signée n'ouvre rien.
2. **La fenêtre de cinq minutes**, dans les deux sens. Une notification
   authentique capturée hier ne rouvre pas un plan aujourd'hui.
3. **Le cloisonnement bac à sable / réel.** Un événement `sandbox` reçu par une
   installation `live` est rejeté. Sans ce contrôle, un compte d'essai chez eux
   suffirait à s'offrir le plan le plus cher.
4. **L'idempotence en base.** L'unicité `(provider, external_event_id)` de
   `billing_events` est le juge — pas un `if` dans l'application, que deux
   notifications simultanées franchiraient toutes les deux.
5. **`apply_billing_event` est fermée** à `anon` et à `authenticated`. Vérifié :
   les deux reçoivent « permission denied ».
6. **L'organisation et le plan viennent de NOS métadonnées**, jamais du corps
   librement composé par l'appelant.

## Carte ou mobile money — ce que leur API permet vraiment

| | Téléphone | Carte | Reconduction |
|---|---|---|---|
| `POST /payments` | facultatif | **oui** (`payment_method: "card"`) | non |
| `POST /subscriptions` | **obligatoire** | **aucune option** | oui |

Leur API d'abonnement est **mobile money uniquement**. La carte existe, mais
paiement par paiement.

Cette asymétrie vit dans `billing/moyens.ts`, testée : le numéro n'est réclamé
que par le moyen qui l'exige, et aucun écran ne promet une reconduction à qui
paie par carte.

**Le numéro est demandé AU MOMENT DE PAYER**, jamais à l'inscription ni dans le
profil — décision du fondateur, et la bonne : quelqu'un qui paie par carte n'a
aucune raison de laisser son numéro, et le réclamer d'avance serait collecter
une donnée personnelle dont on ne se servira jamais. Il n'est pas conservé.

## Ce qui reste ouvert

- **Le renouvellement est-il un vrai prélèvement ?** Leur documentation ne le
  dit pas, et mentionne « réessayer une facture », ce qui évoque une relance.
  En mobile money, Wave et Orange demandent souvent une confirmation à chaque
  débit. **Aucune phrase de l'application ne dit « automatique »** — un test le
  vérifie sur chaque message d'échéance. À réécrire quand ils répondront, et
  pas avant.
- **L'identifiant d'événement.** Ils n'en envoient pas. On reconstitue
  `type:référence`, ce qui rend un rejeu inoffensif. À revoir s'ils en publient
  un vrai.
- **Rien n'a été essayé contre leur API réelle**, faute de clés — ni dans un
  navigateur, faute de session. Le premier paiement en bac à sable sera le
  premier vrai test.

## Leur serveur MCP

Configuré sur le projet, mais **il ne se charge qu'au démarrage d'une session** —
il faudra relancer Claude Code pour en disposer. Il vit sur `geniuspay.ci`,
tandis que l'API marchande vit sur `pay.genius.ci` : deux domaines, une erreur
d'hôte donne un 403 qui ressemble à une clé refusée.

Leur outil `inspect_recent_errors` prend la clé secrète **en paramètre** : ne
jamais lui donner une clé `_live_`.
