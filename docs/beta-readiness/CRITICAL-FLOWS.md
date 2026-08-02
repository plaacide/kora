# Les parcours critiques

**Date :** 2 août 2026

Un parcours est **critique** quand son échec laisse l'utilisateur sans issue :
il ne peut ni terminer, ni contourner, ni comprendre ce qui s'est passé. Ils
sont classés par ce coût, pas par leur fréquence.

Chaque parcours porte son état d'éprouve : `automatisé`, `à la main`, ou
`jamais`.

---

## C1 — S'inscrire et confirmer son adresse · **automatisé (partiel)**

```text
/v2/inscription → e-mail → /auth/confirm → /v2/onboarding
```

| Étape | Éprouve |
|---|---|
| Le formulaire valide et conserve la saisie après un échec | ✅ 21 tests publics |
| Le mot de passe ne revient jamais du serveur | ✅ test dédié |
| La destination reste dans la V2 | ✅ 3 tests |
| L'e-mail part réellement | ✅ à la main, 2 août — Resend `200`, expéditeur `noreply@sanza.africa` |
| Le lien confirme et ouvre la session | ✅ à la main |
| Le lien déjà consommé ne dit pas « invalide » à quelqu'un de connecté | ⚠️ code corrigé, **non éprouvé automatiquement** |

**Deux pannes réelles, corrigées.** Le crochet e-mail renvoyait 500 parce que
`EMAIL_FROM` était l'adresse de test partagée de Resend. Et les liens déjà
envoyés portent `next=/onboarding` pour toujours : l'onboarding V1 redirige
désormais vers celui de la V2 — c'est ce qui rattrape les messages déjà dans les
boîtes.

**Ce qui reste fragile :** la limite d'envoi Supabase. Deux `429 email rate
limit exceeded` observés le 1er août.

---

## C2 — L'onboarding · **automatisé**

```text
Entreprise → Objectif → Détails → Plan
```

| Étape | Éprouve |
|---|---|
| L'objectif se choisit à la souris **et au clavier** | ✅ |
| L'objectif choisi est bien celui qui part | ✅ |
| La saisie survit à un aller-retour entre étapes | ✅ |
| La forme juridique est restituée | ✅ — c'était le défaut du 1er août |
| Un champ jamais rempli reste vide | ✅ |
| Une valeur hors liste ne disparaît pas | ⚠️ échec dû à un correctif non déployé |
| L'étape « Détails » est sautée hors financement | ❌ jamais |

Ces tests n'ont pu tourner qu'à partir du 2 août : ils exigeaient un compte
**sans organisation**, et le compte installé y est redirigé. Ils s'ignoraient
d'eux-mêmes, sans que rien ne le signale.

---

## C3 — Le plan de préparation · **partiellement automatisé**

| Étape | Éprouve |
|---|---|
| Le plan se pose à la création de l'opération | ✅ en base, 22 exigences |
| Il varie selon la forme juridique, le pays, le stade | ✅ en base — 5 différences mesurées entre une SA ivoirienne et une SARL sénégalaise |
| Une entreprise individuelle en reçoit 17 et non 22 | ✅ en base |
| Changer de forme juridique ne crée pas de doublon | ✅ en base |
| Un intitulé réécrit à la main survit | ✅ en base |
| **L'écran affiche bien ces variantes** | ❌ jamais — aucun test n'ouvre la Préparation |
| Rattacher une pièce à une exigence | ❌ jamais |

**C'est le trou le plus visible de ce document.** Toute l'adaptation du plan est
prouvée en base et par observation manuelle, jamais par un test d'écran.

---

## C4 — La data room et le partage · **jamais**

Déposer une pièce, créer un dossier, inviter, ouvrir la salle côté destinataire,
révoquer un accès. **Aucun test.** C'est le cœur du produit, et le principal
risque de fuite.

---

## C5 — L'abonnement et le paiement · **à la main, une fois**

Éprouvé le 1er août : paiement Wave de 21 750 XOF, crochet signé reçu 11 s
après, plan ouvert sans intervention. La signature HMAC, la fenêtre de 5
minutes, le cloisonnement bac à sable et l'idempotence sont vérifiés par des
tests unitaires.

**Le renouvellement automatique n'est pas confirmé** — aucune phrase du produit
ne l'annonce, et un test le vérifie.

---

## C6 — Se déconnecter · **automatisé**

Le menu s'ouvre, se ferme à Échap en rendant le focus, se ferme au clic
extérieur, et la déconnexion ramène à la connexion **de la V2** — non de la V1.
Quatre tests.

---

## Ce que ce classement dit

Les parcours **d'entrée** — inscription, onboarding, déconnexion — sont les
mieux couverts. Les parcours **de valeur** — préparation à l'écran, data room,
partage — ne le sont pas du tout.

C'est l'inverse de ce qu'on voudrait, et c'est le fait le plus important à
retenir avant d'ouvrir la bêta.
