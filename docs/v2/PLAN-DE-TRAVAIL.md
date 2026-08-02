# Plan de travail — de l'état actuel à la bêta fermée

**Date :** 1er août 2026 · **Branche :** `v2/rebuild`

**La refonte de la Préparation suit le vocabulaire à trois niveaux arrêté le
1er août** — voir `../preparation/DECISIONS.md` pour le détail de chaque
arbitrage, ce qui a été retenu, ce qui a été rejeté et pourquoi.

```text
Référentiel   niveau 1   la bibliothèque interne        → LOT B ✅ table
Modèle        niveau 2   une sélection pour un besoin   → LOT D    table
Plan          niveau 3   la version d'une opération     → existe déjà
```

Le fondateur travaille dans le **Plan**. Il ne manipule jamais le Référentiel ;
il voit en revanche le **nom et la finalité du Modèle** appliqué, et peut en
changer. Les deux premiers niveaux sont des tables, et non du code, parce que
**investisseurs et accélérateurs les alimenteront** — voir `DECISIONS.md` §17.

Les lots C, E, F et G enrichissent le passage du niveau 1 au niveau 3 :
modificateurs, exigences manquantes, extensions sectorielles, structure de la
data room.

Chaque lot se termine par un **protocole de test que vous exécutez vous-même**.
Aucun lot n'est déclaré fini sur ma parole : il l'est quand vous avez vu le
résultat. Un lot ne dépend jamais d'un lot qui le suit.

Trois niveaux d'urgence :

- **🔴 Bloque la bêta** — un utilisateur ne peut pas s'en sortir.
- **🟠 Avant d'ouvrir** — pas bloquant, mais visible et gênant.
- **⚪ Après la bêta** — attend des retours réels ou une dépendance externe.

---

## 0. Ce qui vous appartient, et que je ne peux pas faire

| # | Action | Où | Bloque |
|---|---|---|---|
| V1 | Relever la limite d'envoi d'e-mails | Supabase → Authentication → Rate Limits | 🔴 Lot A |
| V2 | Redéployer la recette | Coolify | 🔴 Lot A |
| V3 | Écrire les exigences dette, DFI, audit, diligence | — | Lot E |
| V4 | Valider les lignes **B** et **C** du document sectoriel | `EXIGENCES-SECTORIELLES.md` §4 | Lot F |

---

## 1. Les décisions ouvertes qui commandent des lots

Aucune n'est technique. Tant qu'elles ne sont pas prises, le lot correspondant
n'est pas commencé.

| # | Décision | Lot bloqué | Ma recommandation |
|---|---|---|---|
| ~~D1~~ | ~~Modèles : table ou constante TypeScript ?~~ | — | **Tranchée : table.** J'avais recommandé la constante, sur l'hypothèse d'un auteur unique. Investisseurs et accélérateurs alimenteront le Référentiel : aucun d'eux ne peut attendre un déploiement pour corriger sa liste. Voir `DECISIONS.md` §17. |
| D2 | Correspondance `audit →` et `diligence →` | D | À trancher avec V3, c'est le même travail. |
| D3 | Voies fintech : 4 exigences alternatives, ou 1 exigence qui les énumère ? | F | Une seule, qui énumère. |
| D4 | `complete_onboarding(p_create_room: true)` — le brief dit l'inverse (B-05) | C | Garder la création : un onboarding qui ne produit rien est pire. |
| D5 | Sort des fichiers Storage à la suppression (B-06) | ⚪ | Non exposé aujourd'hui — décider avant d'exposer. |

---

## LOT A — 🔴 Rendre l'inscription possible

**Le seul vrai bloquant.** Aujourd'hui les e-mails partent de Supabase en
anglais, et leur lien passe par `/verify` qui consomme le jeton sans transmettre
`token_hash`.

Le code est déjà corrigé et poussé. **Il ne reste que V1 et V2.**

### Votre test

1. Créer un compte avec une adresse jamais utilisée.
2. **L'e-mail arrive en français, expédié par Sanza** — pas par
   `noreply@mail.app.supabase.io`.
3. Cliquer le lien → vous arrivez sur `/v2/onboarding`, connecté.
4. Recliquer le même lien → un message clair, pas « lien invalide » alors que
   vous êtes connecté.
5. `GET /api/health` → `configuration_manquante: []`.

Si le point 2 échoue, le crochet n'est pas branché : voir `KNOWN-ISSUES.md` B-01.

---

## LOT B — ✅ Niveau 1 · Sortir le référentiel de la procédure stockée

**Livré le 1er août** — `8fb2556`. Le catalogue est la table
`checklist_catalog`. Équivalence prouvée par empreinte md5 : voir l'en-tête
de `supabase/migrations/20260804120000_catalogue_des_exigences.sql`.

Les 22 exigences vivaient éclatées sur trois objets joints par la chaîne de
l'intitulé. Elles sont désormais une table : interrogeable, modifiable sans
redéploiement, et prête à recevoir un jour les contributions d'un accélérateur.

Les deux fonctions auxiliaires et l'enum mort `checklist_category` ont disparu.

**Ce lot n'a rien changé à l'écran** — c'était sa qualité, et c'est ce qui a été
vérifié :

| Contrôle | Résultat |
|---|---|
| Empreinte du catalogue, avant → après | `f367704828…` = `f367704828…` |
| Plan d'une opération créée avant vs après | `d2a321f624…` = `d2a321f624…` |
| Second appel sur la même opération | 0 exigence créée |
| Rattachement aux dossiers | 22 sur 22 |
| Tests · `tsc` | 346 passent · aucune erreur |

### Votre test

Créer une opération : 22 exigences, mêmes intitulés, mêmes domaines, mêmes
niveaux, mêmes badges qu'avant. Ajouter une exigence à la main : elle apparaît.

---

## LOT C — ✅ Niveau 1 → 3 · Les modificateurs qui n'attendaient personne

**Livré le 1er août** — `14340cc` et `a3d8f89`. Trois axes sur quatre : la
forme juridique, le pays et le stade. Le quatrième est tombé à l'épreuve des
faits, voir « L'échéance » plus bas.

| Mesure sur la recette | Résultat |
|---|---|
| Différences entre une SA ivoirienne et une SARL sénégalaise | **5** |
| Exigences pour une entreprise individuelle | **17** au lieu de 22 |
| Doublons après changement de forme juridique | **0** |
| Intitulé réécrit à la main après réapplication | **intact** |

### L'échéance — modificateur abandonné, et pourquoi

`startups.horizon` contient une **date** — « 30 novembre 2026 » — pas une durée.
Or les exigences n'ont pas d'échéance individuelle : **une date unique ne peut
pas ordonner une liste**. Le modificateur, tel qu'il était écrit, n'avait aucun
comportement définissable.

Ce qui serait réellement utile est autre chose, et plus grand : croiser
`freshness_days` avec la date d'échéance pour signaler les pièces qui auront
expiré le jour venu — « Extrait RCCM, 90 jours, à redemander avant le 30
novembre ». C'est une fonctionnalité à part entière, pas un tri. Reportée au
lot K.

---

## ~~LOT C — les quatre modificateurs~~ *(rédaction d'origine, conservée)*

Ce lot produit la **première adaptation réelle** du produit, sans dépendre de
votre travail éditorial. Il utilise des données déjà collectées à l'onboarding.

### Ce que je fais

| Entrée | Effet | Exemple visible |
|---|---|---|
| `forme_juridique` | 3 exigences réécrites | SARL → « Registre des **associés** et répartition des **parts sociales** » |
| | | SA → commissaire aux comptes **requis**, sans condition |
| | | Entreprise individuelle → les deux disparaissent |
| `stage` | requis ↔ recommandé | Pré-amorçage → « États financiers 3 exercices » passe en **recommandé** |
| `country` | terminologie | Sénégal → **NINEA** · Côte d'Ivoire → **IFU** |
| `horizon` | ordre d'affichage | Échéance 30 jours → les requises d'abord |

Et : **OHADA quitte `sources`** pour devenir le socle appliqué à toute
opération. Un régime juridique n'est pas un financeur, et l'écran le présentait
en badge à côté de « Banque » et « DFI ».

**Le panneau « Basé sur ».** Dès que le plan varie, il doit dire pourquoi —
c'est la contrepartie honnête des huit promesses retirées (`DECISIONS.md` §15) :

```text
Plan de préparation · 22 exigences

Basé sur :
  le socle juridique OHADA
  votre forme juridique — SARL
  votre stade — Pré-amorçage
  votre échéance — 3 mois
```

Aucun chiffre annoncé avant que le plan existe : le compte est calculé, jamais
promis.

### Votre test

1. Onboarding avec **SARL / Sénégal / Pré-amorçage** → ouvrir la Préparation.
   - « Registre des **associés** », pas « des actionnaires ».
   - « Déclaration fiscale (**NINEA**) », pas « (NINEA/IFU) ».
   - « États financiers — 3 exercices » en **Recommandé**.
2. Recommencer en **SA / Côte d'Ivoire / Série A**.
   - « Registre des **actionnaires** ».
   - « (**IFU**) ».
   - Commissaire aux comptes en **Requis**, sans « si seuils atteints ».
   - États financiers en **Requis**.
3. **Aucun badge « OHADA » à côté de « Banque »** dans les filtres.
4. Modifier l'échéance → l'ordre du plan change.

**C'est le lot où vous verrez pour la première fois deux entreprises recevoir
deux plans différents.**

---

## LOT D — 🟠 Niveau 2 · Les modèles de préparation *(attend D2)*

`objectif → modèle`, et le catalogue filtré en conséquence.

**Attention — ce lot ne doit pas partir seul.** Filtrer les 22 exigences
actuelles donnerait à un dossier bancaire une liste de levée en capital amputée
de quatre lignes : la promesse deviendrait *plus crédible tout en restant
fausse*. **Le Lot D se livre avec le Lot E, ou pas du tout.**

### Ce que je fais

**Les 6 modèles en table**, pas en constante — décision inversée, voir §1. Un
modèle porte un nom, une finalité, une version, et la liste des exigences qu'il
retient. La table est prête pour un propriétaire le jour où un accélérateur
contribuera ; **la colonne n'est pas ajoutée aujourd'hui**, ajouter une colonne
reste bon marché, réécrire la logique de sélection ne l'est pas.

- `apply_checklist_template(p_deal, p_objectif)` filtre sur `sources`.
- **Pas d'écran de recommandation.** Le fondateur vient de répondre « un
  financement bancaire » ; lui afficher « nous recommandons le modèle Financement
  bancaire » lui renvoie sa propre réponse. Le plan s'applique directement.
- **Mais le modèle n'est pas caché** : son nom, sa finalité, le nombre
  d'exigences et un lien **Changer de modèle** sont visibles. Ce sont les
  *règles internes* qui restent invisibles, pas le modèle lui-même.
- **La question contextuelle du financeur, pour la levée seule.** Le type est
  déductible pour `dette`, `dfi`, `audit`, `diligence` — pas pour une levée, où
  fonds, investisseurs individuels et institution de développement n'attendent
  pas les mêmes pièces. Une question posée **là où l'ambiguïté existe**, et
  nulle part ailleurs.
- Changer de modèle **ne supprime jamais rien** : les exigences retirées passent
  en « non prioritaire », les pièces déposées restent.

---

## LOT E — 🟠 Les exigences manquantes *(attend V3)*

Le catalogue actuel est **un catalogue de levée en capital avec des étiquettes
bancaires posées dessus**. Pour une dette il manque au minimum : sûretés
proposées, échéancier des dettes existantes, capacité de remboursement,
historique bancaire, contrats soutenant les flux futurs.

C'est votre expertise, pas la mienne. Je fournis la structure et je saisis.

### Votre test (D + E ensemble)

1. Deux opérations, même entreprise : une **levée**, une **dette bancaire**.
2. Les deux plans sont **visiblement différents**, et le second contient les
   pièces qu'une banque demande vraiment.
3. Changer l'objectif d'une opération existante → rien n'est supprimé, les
   pièces déjà déposées sont intactes.
4. Chaque exigence peut dire **pourquoi elle est là**.

---

## LOT F — 🟠 Extensions sectorielles *(attend V4, D3)*

Santé et Services financiers uniquement — 2 secteurs sur 10. Voir
`EXIGENCES-SECTORIELLES.md`.

### Votre test

1. Entreprise **Santé** → autorisation d'ouverture, inscription à l'Ordre.
2. Entreprise **Services financiers** → agrément, LBC/FT avec CENTIF.
3. Entreprise **Commerce** → **aucun ajout**. C'est le comportement attendu.

---

## LOT G — 🟠 La structure de la data room

**Je ne l'avais pas traité, et c'est un oubli de mes documents précédents.** La
promesse retirée parlait de « structure documentaire », pas seulement du plan.

`apply_dataroom_template(p_deal)` ne lit pas plus l'objectif que sa jumelle : les
dossiers sont identiques pour tout le monde. À traiter avec D et E, avec la même
règle — **aucun dossier existant n'est supprimé ou déplacé**.

---

## LOT H — ✅ Fermer le hors-périmètre *(B-02)*

**Livré** — `ef94371`. Et deux affirmations de ma documentation étaient
fausses : des liens menaient bel et bien à ces écrans, et `cohort_links`
existe. Le sous-système cohorte a ses quatre tables et sept fonctions ; il lui
manque une lecture, `mes_invitations`, que `inbox()` appelait et qui **n'existe
pas en base** — l'erreur était avalée à chaque affichage.

### Rédaction d'origine

`CohortJoin`, le panneau cohorte des invitations et `ImportList` affichent des
fixtures (« Nimba Solar », « Banque Atlantique ») et s'ouvrent par une URL
devinée. Une heure de travail.

**Votre test :** ouvrir les trois URL → une page « indisponible », jamais une
fixture.

---

## LOT I — ✅ Accessibilité des formulaires *(B-03, B-04)*

**Livré** — `1e8013a`. Les six champs à erreur d'`Auth.tsx` portent
`aria-describedby` et `aria-invalid` appariés ; le curseur va sur le premier
champ fautif dans les quatre formulaires d'authentification et dans la levée,
dont les douze champs saisissables sont reliés au schéma.

### Rédaction d'origine

- `aria-describedby` : **zéro occurrence dans toute la V2**. Un lecteur d'écran
  annonce le champ invalide, jamais le message qui dit quoi corriger.
- `aria-invalid` n'existe que sur la connexion.
- Aucun formulaire ne place le focus sur le premier champ fautif, alors que les
  actions renvoient déjà `res.champ`.

**Votre test :** soumettre l'inscription vide → le focus saute au premier champ
fautif. Avec VoiceOver (⌘F5), le message d'erreur est lu avec le champ.

---

## LOT J — ✅ La preuve, pas la promesse

**Livré les 1er et 2 août.** Les quatre documents sont écrits et adossés à des
mesures : 34 tests au vert contre la recette déployée, l'accès invité éprouvé
sur trois documents piégés, les limites de plan éprouvées à l'écran. Deux
comptes d'essai créés sans qu'aucun mot de passe soit saisi ni affiché.

**Reste ouvert :** le Storage. La RLS borne les lignes, pas les fichiers.

### Rédaction d'origine

Le dossier `docs/beta-readiness/` a `KNOWN-ISSUES.md`, et rien d'autre. Quatre
documents manquent, et ils **dépendent tous d'essais en navigateur qui n'ont
jamais tourné** : la suite Playwright authentifiée attend `.env.test.local`.

| Document | Contenu | Dépend de |
|---|---|---|
| `CRITICAL-FLOWS.md` | Les parcours critiques, pas à pas | — |
| `TEST-RESULTS.md` | Ce qui a tourné, et le résultat | Playwright authentifié |
| `SECURITY-REPORT.md` | RLS, permissions, limites de plan | idem |
| `BETA-READINESS-REPORT.md` | La synthèse | les trois autres |

**Les limites de plan n'ont jamais été éprouvées dans un navigateur** —
vérifiées en SQL sous identité authentifiée, jamais à l'écran.

### Ce qu'il me faut

Un compte d'essai sur la recette. **Je ne veux pas votre mot de passe** : créez
`e2e/.env.test.local` (déjà ignoré par git) avec un compte dédié, ou
autorisez-moi à en créer un par l'API d'administration.

---

## LOT K — ⚪ Les manques fonctionnels, par coût croissant

| Chantier | État | Note |
|---|---|---|
| **Péremption avant l'échéance** | 🔴 | Croiser `freshness_days` et la date d'échéance : « ce RCCM aura expiré le 30 novembre ». La vraie version du modificateur abandonné au lot C |
| Badges du rail (Partage, Investisseurs, Lever) | 🔴 | Petit |
| Usage des fonds | 🔴 | La colonne existe, la vue l'affiche, **aucun champ ne le saisit** |
| Consultations des mises à jour | 🟡 | `seen_raise_update()` existe, **rien ne l'appelle** |
| Recherche des exigences et dossiers | 🔴 | La recherche ne porte que sur les pièces |
| Codes de récupération | 🔴 | Sécurité |
| Pipeline investisseurs (maquette 10) | 🔴 | **La base est prête** — `raise_investors` existe |
| PDF des factures | 🔴 | Rien ne le produit |
| Vidéos dans la visionneuse | 🔴 | Autre modèle de lecture, filigrane inapplicable |
| Import d'une liste (13) | 🔴 | Attend extraction PDF **et** provenance nominative |
| Cohortes (31-32) | 🔴 | `cohort_links` n'existe pas. **Le seul écran majeur sans aucune existence** |
| Renouvellement réel GeniusPay | 🔴 | Attend leur documentation — aucune phrase ne dit « automatique », un test le vérifie |

---

## Ordre que je recommande

```text
A  ────────────────────────────  vous (V1, V2)
   B  ──────────────────────────  moi, invisible à l'écran
      C  ───────────────────────  moi, première adaptation réelle
         H  I  ─────────────────  moi, pendant que vous écrivez V3
            J  ──────────────────  dès que j'ai un compte d'essai
               D + E + G  ───────  ensemble, jamais séparés
                  F  ────────────  après V4
                     K  ─────────  après la bêta
```

**A, B, C, H, I ne dépendent d'aucune décision ouverte.** Je peux les enchaîner
dès maintenant. Tout le reste attend soit une décision (D1–D5), soit votre
travail (V3, V4), soit un compte d'essai (J).

---

## Ce que ce plan ne couvre pas

- La **traduction anglaise** : `next-intl` est en place, aucun contenu V2 n'est
  traduit.
- La **performance** sous charge : jamais mesurée.
- Le **renouvellement d'abonnement réel**, qui dépend d'un tiers.
- La **relecture juridique** des exigences sectorielles, qui devrait être faite
  par un cabinet local et non par moi.

---

## LOT L — ⚪ Le Référentiel contributif *(après la bêta)*

Investisseurs et accélérateurs pourront apporter, modifier et ajouter des
exigences. **Rien n'est construit maintenant**, mais deux choix sont déjà pris
pour ne pas avoir à les défaire :

- le Référentiel est une **table** (lot B, livré) ;
- les Modèles seront une **table** (lot D) — c'est ce qui a fait renoncer à la
  constante TypeScript.

### Ce que ce lot ajoutera

| | Chantier |
|---|---|
| 1 | Un **propriétaire** sur le catalogue et les modèles — `NULL` = Sanza |
| 2 | Des politiques RLS par organisation — le référentiel d'un accélérateur ne fuite pas chez les autres |
| 3 | La **provenance nominative** sur l'exigence matérialisée : « demandé par votre programme », et non « demandé par Sanza » |
| 4 | Un écran d'administration pour le contributeur |
| 5 | Le retrait propre des exigences d'un contributeur quand la relation prend fin |

### Les quatre questions à trancher avant de commencer

1. Un accélérateur **modifie-t-il** le référentiel Sanza, ou en **superpose-t-il**
   un ? *(La superposition évite qu'un contributeur en dégrade un autre.)*
2. Une exigence ajoutée par un investisseur s'applique-t-elle à **toutes** ses
   opérations, ou seulement à celle qu'il examine ?
3. Le fondateur peut-il **refuser** une exigence imposée par son programme ?
4. Qui arbitre quand deux contributeurs demandent **la même pièce sous deux
   noms** ?

Aucune n'est technique. Toutes changent le produit.
