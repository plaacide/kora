# Plan de travail — Parcours Programme

**Date :** 5 août 2026, **révisé le 6 août** · **Branche :** `v2/rebuild`

**État au 6 août, fin de journée : LES TRENTE-HUIT ÉCRANS SONT INTÉGRÉS.**
Lots A à I livrés, plus le tunnel d'inscription — versé en cours de route et
seul morceau branché sur la base. Ce qui reste est le branchement, pas
l'intégration. L'état re-dérivé depuis le code est dans
[ARBRE-PROGRAMME.md](ARBRE-PROGRAMME.md).
**Source :** [GAP-PARCOURS-PROGRAMME.md](GAP-PARCOURS-PROGRAMME.md) et
[EVALUATION-PARCOURS-PROGRAMME.md](EVALUATION-PARCOURS-PROGRAMME.md).

L'ordre de travail est celui que vous avez fixé le 29 juillet : **tous les
écrans en dur d'abord, les branchements ensuite**, quand l'ensemble se juge à
l'œil. Ce plan s'y tient. Aucune requête Supabase n'est écrite avant que vous
disiez que les maquettes sont finies.

Conséquence directe : **les quatre ADR ne bloquent aucun écran.** Ils décident
la forme de la base, donc la phase de branchement. On peut les laisser ouverts
et avancer.

Chaque lot se termine par un **protocole de test que vous exécutez vous-même**.
Aucun lot n'est fini sur ma parole. Un lot ne dépend jamais d'un lot qui le suit.

---

## 0. Ce qui vous appartient

| # | Action | Bloque |
|---|---|---|
| V1 | Dire si le paquet des maquettes est versé dans git (35 fichiers + CSS, non suivis aujourd'hui) | rien, mais il est perdu si le dossier est nettoyé |
| V2 | Supprimer le doublon `maquettes/parcours-programme/parcours.css` — ou me dire de garder celui-là et d'effacer `maquettes/parcours/` | rien |
| V3 | Trancher Q6 et Q7 : les deux incohérences entre écrans (§2 de la gap analysis) | la cohérence des fixtures, lots C, H, I |
| V4 | Fournir une maquette de **Rapports**, ou accepter qu'il reste un écran d'attente | lot J |
| V5 | Fournir une maquette de la **vue entreprise d'un Challenge**, ou accepter qu'elle attende | le côté fondateur du lot F |

---

## 1. Les décisions ouvertes

### Celles qui bloquent un écran — une seule, et elle est minuscule

| # | Décision | Lot | Ma recommandation |
|---|---|---|---|
| Q2 | **Équipe** et **Abonnement** sont absents du rail programme dessiné. Oubli ou choix ? | A | Les ajouter. Un programme a des collaborateurs et un plan qui mord déjà à l'invitation. Le rail fondateur a reçu Abonnement pour cette raison exacte : un écran qu'aucun chemin ne dessert n'existe pas. **Je les ajoute sauf avis contraire.** |

### Celles qui ne bloquent que le branchement

| # | Décision | Bloque | Ma recommandation |
|---|---|---|---|
| [ADR-002](ADR-002-portee-de-la-dealroom.md) | Dealroom : objet de premier rang ou attribut de cohorte ? Et les consentements existants ? | branchement G, H, I | Objet de premier rang ; les accords ne se migrent pas |
| [ADR-003](ADR-003-critere-connecte-a-sanza.md) | Le critère « connecté à Sanza » | branchement E, F | Lecture énumérée + opération présentée de premier rang + instanciation par copie |
| [ADR-004](ADR-004-canal-de-lecture-du-programme.md) | Un canal de lecture ou trois ? | branchement B, C | Trois, composés dans l'application |
| [ADR-005](ADR-005-investisseur-externe.md) | L'accès investisseur | branchement I | Compte obligatoire, code e-mail en repli |

### Celles que la consigne « en dur » repousse

Q8 (la règle du bloc « Conseil ») ne se pose pas encore : le texte est dans les
écrans, je le recopie. La règle qui le calcule se décidera au branchement.

---

## 2. Ce que « en dur » veut dire ici

- Le markup et le CSS des 34 écrans, fidèles au HTML de référence.
- Les données des écrans recopiées telles quelles, dans un module de fixtures
  **unique et partagé** — une entreprise a les mêmes valeurs sur tous les écrans
  où elle apparaît, comme l'exige le §3 du handoff.
- Aucun `createClient`, aucune RPC, aucune migration.
- Les interactions locales seulement : onglets, filtres, panneau latéral,
  ouverture de modale. Un bouton qui écrirait en base ne fait rien et le dit.
- Les tokens du `parcours.css` mappés **une fois** sur le thème `.v2`, puis
  consommés. Aucune couleur en dur dans un écran.

---

## 3. Les lots

### LOT A — ✅ La coque programme

Le socle sans lequel aucun écran ne s'ouvre.

- Rail par métier : `Shell.tsx` construit aujourd'hui une liste figée. Elle
  devient fonction du métier — Accueil · Portefeuille · Cohortes · Dealrooms ·
  Demandes · Rapports, puis Équipe · Abonnement · Sécurité · Aide en pied.
- Le rail dépliable existe déjà : rien à écrire, les écrans programme sont
  simplement dessinés dépliés.
- Panneau contextuel de cohorte (240 px) avec ses compteurs, sur le modèle
  d'`operationNavigation()`.
- Tokens du `parcours.css` mappés sur `.v2`.
- Routes déclarées dans `v2Routes`, pour qu'aucun écran ne naisse à une adresse
  que rien ne propose.

**Test :** ouvrir `/v2/cohortes` avec un compte programme. Les six destinations
sont là, le rail se déplie et se replie, l'état tient au rechargement.

### LOT B — ✅ Cohortes · écrans 01, 02, 03, 04, 05, 17

Liste vide et remplie, cohorte vide, invitations en attente, entreprises
actives, modale « nouvelle entreprise ».
Les segments (Prêtes / En cours / Décrochent / Nouvelles), le tri, la recherche
et le bloc « Conseil » sont rendus depuis les fixtures.

**Test :** les cinq états s'ouvrent depuis le rail, sans jamais taper une URL à
la main. Les chiffres de l'écran 05 se recoupent : 12 = 3 + 5 + 2 + 2.

### LOT C — ✅ Portefeuille · écrans 06, 07

État vide et rempli, quatre indicateurs, trois priorités maximum.
Dépend de V3 (Q7) pour que la ligne CoolBricks soit cohérente avec les écrans
14 et 15.

**Test :** l'écran vide n'affiche aucun indicateur à zéro. L'écran rempli
n'affiche jamais plus de trois priorités.

### LOT D — ✅ Questions & suggestions · écran 08

Fil par cohorte, trois états (en attente, répondu, suggestion), formulaire de
nouveau message. Pas de saisie en cours, pas de présence, pas d'accusé de
lecture — c'est écrit sur l'écran.

**Test :** une question et une suggestion se distinguent à l'œil sans lire le
libellé du statut.

### LOT E — ✅ Challenges : bibliothèque et création · écrans 09, 09b, 10, 11, 12, 16

État vide, liste des actifs, bibliothèque en trois volets, création de zéro,
personnalisation d'un modèle Sanza, mes modèles.
Les 14 modèles Sanza et leurs catégories vivent dans les fixtures.
Points de vigilance du §4 du handoff : le pied du panneau de l'écran 10, la
grille en trois colonnes de l'écran 16, le « N critères » insécable de l'écran 17.

**Test :** rien ne déborde d'une carte à 1440 px ni à 1280 px. Le critère
structurel de l'écran 12 ne peut pas être supprimé.

### LOT F — ✅ Challenges : assignation et suivi · écrans 13, 14, 15

Sélection d'entreprises avec résumé latéral, détail programme trié retards
d'abord, panneau latéral d'une entreprise suivie.
La vue côté fondateur attend V5.

**Test :** le tri met bien Teranga Health en tête. Aucun critère n'ouvre un
document.

### LOT G — ✅ Dealroom : assistant · écrans 18, 19, 20, 21, 22, 23, 24

État vide, liste à quatre statuts, les quatre étapes, l'aperçu.
L'aperçu des écrans 21, 24 et 28 rend **le même composant** que la vue
investisseur du lot I — pas une seconde implémentation.

**Test :** « Publier » reste désactivé tant que des accords manquent, et
l'écran dit pourquoi.

### LOT H — ✅ Dealroom : gestion · écrans 25, 26, 27, 28

Vue d'ensemble, entreprises publiées, audience, branding après publication.
Dépend de V3 (Q6) pour Kalyx Foods.

**Test :** retirer l'accès d'un investisseur affiche bien qu'un accès data room
déjà accordé n'est pas révoqué.

### LOT I — ✅ Investisseur · écrans 29, 30, 31, 32, 33

Hors de l'application, hors du rail, brandé par Dealroom. L'écran 29 est un
e-mail : il rejoint `docs/emails`.

**Test :** aucun écran ne montre un document ni un nom de pièce. Le pied porte
« Espace privé — accès sur invitation uniquement ».

### LOT J — Rapports ⚪

Aucun écran ne le maquette, alors qu'il est dans le rail global **et** dans la
nav de cohorte. En attendant V4, l'entrée mène à un écran d'attente qui dit ce
qui viendra — le composant existe déjà (`.v2-placeholder`).

---

## 4. Ordre et dépendances

```
A ─┬─► B ─► C
   ├─► D
   ├─► E ─► F
   ├─► G ─► H
   ├─► I        (G rend le même composant d'aperçu)
   └─► J
```

A passe devant tout. Ensuite l'ordre est libre : je propose B, D, E, F, G, H,
I, C, J — le portefeuille après les Challenges et les Dealrooms, parce que ses
colonnes les comptent.

---

## 5. Lot ajouté en cours de route — ✅ L'inscription d'un programme

Écrans 00a à 00d, versés dans le paquet le 6 août : organisation, façon
d'accompagner, première cohorte, espace prêt. Le tunnel réutilise la coque et
le fil d'étapes du fondateur ; seules les questions changent.

**Il n'écrit rien** et **aucun chemin n'y mène** : l'inscription V2 propose
« Un programme » mais ne redirige pas vers lui. À brancher quand vous le
direz — `save_programme()` et `create_cohort()` existent déjà en base.

---

## 6. Ce qui reste

| Lot | Écrans | État |
|---|---|---|
| A à I | les trente-huit | ✅ intégrés |
| J | Rapports | attend une maquette |

**La suite est le branchement**, et c'est là que les quatre ADR mordent. Rien
n'est bloqué pour l'intégration ; tout l'est pour la donnée.

Ordre suggéré, du plus court au plus structurant :

1. **Cohortes et invitations** — le socle existe depuis le 28 juillet et n'est
   appelé nulle part : `cohorts`, `cohort_members`, `cohort_links`,
   `invite_to_cohort`, `create_cohort`.
2. **Portefeuille** — `sae_portfolio()` existe ; il faut trancher
   [ADR-004](ADR-004-canal-de-lecture-du-programme.md).
3. **Questions & suggestions** — `program_threads` existe, il lui manque un
   rattachement à la cohorte.
4. **Challenges** — rien n'existe. Dépend d'[ADR-003](ADR-003-critere-connecte-a-sanza.md).
5. **Dealrooms** — le modèle change de forme. Dépend d'[ADR-002](ADR-002-portee-de-la-dealroom.md).
6. **Investisseur** — dépend d'[ADR-005](ADR-005-investisseur-externe.md).
