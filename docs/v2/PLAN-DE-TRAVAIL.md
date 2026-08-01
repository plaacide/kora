# Plan de travail — de l'état actuel à la bêta fermée

**Date :** 1er août 2026 · **Branche :** `v2/rebuild`

**La refonte de la Préparation suit le vocabulaire à trois niveaux arrêté le
1er août** — voir `../preparation/DECISIONS.md` pour le détail de chaque
arbitrage, ce qui a été retenu, ce qui a été rejeté et pourquoi.

```text
Référentiel   niveau 1   la bibliothèque interne        → LOT B
Modèle        niveau 2   une sélection pour un besoin   → LOT D
Plan          niveau 3   la version d'une opération     → existe déjà
                         (le seul niveau que le fondateur voit)
```

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
| D1 | Modèles de préparation : **table** ou **constante TypeScript** ? | D | Constante — tant que vous êtes seul à les écrire, une table vous oblige à construire une administration pour vous-même. |
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

Les 22 exigences sont un littéral JSONB dans `apply_checklist_template`. Tant
que c'est le cas : aucun versionnement, aucune administration, et chaque mot
corrigé est une migration.

**Ce lot ne change strictement rien à l'écran.** C'est sa qualité : il est
vérifiable par l'absence de différence.

### Ce que je fais

1. Table `checklist_catalog` — les 22 exigences, avec `domain`, `level`,
   `sources`, `freshness_days`, `expected_period`, `accepted_formats`.
2. `apply_checklist_template` lit la table au lieu du littéral.
3. Supprimer l'enum `checklist_category`, mort : aucune colonne ne l'utilise,
   zéro occurrence dans `src/`.
4. Un test qui compare le plan produit avant et après.

### Votre test

1. Créer une opération **avant** que je livre → noter les exigences.
2. Après livraison, créer une opération identique.
3. **Les deux plans doivent être rigoureusement identiques.** Même nombre, mêmes
   intitulés, mêmes domaines, mêmes niveaux.
4. Ajouter une exigence à la main : elle apparaît toujours.

---

## LOT C — 🟠 Niveau 1 → 3 · Les quatre modificateurs qui n'attendent personne

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

## LOT D — 🟠 Niveau 2 · Les modèles de préparation *(attend D1, D2)*

`objectif → modèle`, et le catalogue filtré en conséquence.

**Attention — ce lot ne doit pas partir seul.** Filtrer les 22 exigences
actuelles donnerait à un dossier bancaire une liste de levée en capital amputée
de quatre lignes : la promesse deviendrait *plus crédible tout en restant
fausse*. **Le Lot D se livre avec le Lot E, ou pas du tout.**

### Ce que je fais

- Les 6 modèles, selon D1.
- `apply_checklist_template(p_deal, p_objectif)` filtre sur `sources`.
- Pas d'écran de recommandation : le fondateur vient de répondre « un financement
  bancaire », lui afficher « nous recommandons le modèle Financement bancaire »
  est une mise en scène. Le plan s'applique, avec un lien **Changer de modèle**.
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

## LOT H — 🟠 Fermer le hors-périmètre *(B-02)*

`CohortJoin`, le panneau cohorte des invitations et `ImportList` affichent des
fixtures (« Nimba Solar », « Banque Atlantique ») et s'ouvrent par une URL
devinée. Une heure de travail.

**Votre test :** ouvrir les trois URL → une page « indisponible », jamais une
fixture.

---

## LOT I — 🟠 Accessibilité des formulaires *(B-03, B-04)*

- `aria-describedby` : **zéro occurrence dans toute la V2**. Un lecteur d'écran
  annonce le champ invalide, jamais le message qui dit quoi corriger.
- `aria-invalid` n'existe que sur la connexion.
- Aucun formulaire ne place le focus sur le premier champ fautif, alors que les
  actions renvoient déjà `res.champ`.

**Votre test :** soumettre l'inscription vide → le focus saute au premier champ
fautif. Avec VoiceOver (⌘F5), le message d'erreur est lu avec le champ.

---

## LOT J — 🔴 La preuve, pas la promesse

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
