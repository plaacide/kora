# Le parcours Sanza, ses incohérences, et le système de référentiels

**Date :** 1er août 2026 · **Branche :** `v2/rebuild`
**Méthode :** relecture du code et des routes, plus interrogation de la base
`jourzsgjnutktsrgxkoo`. Chaque constat porte sa preuve — un fichier, une
fonction ou une requête. Ce qui relève de l'opinion est annoncé comme tel.

---

## 1. Le parcours tel qu'il existe

```text
INSCRIPTION
  Que représentez-vous ?          entreprise · investisseur · programme
  Nom, poste, e-mail, langue
  → courriel de confirmation

ONBOARDING
  2 · Entreprise      nom, pays, forme juridique, immatriculation,
                      secteur, stade, site, description
  3 · Objectif        6 intentions
  4 · Détails         montant, devise, modalité, échéance
                      ⟶ sauté hors financement
  5 · Plan            l'opération est créée, la data room aussi

POSTE DE PILOTAGE
  Rail global         Accueil · Opérations · Invitations · Recherche
                      Équipe · Sécurité · Abonnement
  Rail opération      Vue d'ensemble · Préparation · Data room
                      Partage et accès · Lever · Activité
```

L'ossature est saine : un objectif déclaré une fois, une opération qui en
hérite, une data room et un plan de préparation qui en découlent. Le découplage
data room ↔ levée — une salle peut exister sans tour de table — est le bon
modèle, et il est déjà en base.

---

## 2. L'incohérence principale : une promesse tenue nulle part

### Ce que les écrans annoncent

Quatre phrases, dans trois écrans différents :

| Écran | Texte |
|---|---|
| Nouvelle opération | « Sanza **adaptera** la préparation et la structure documentaire à votre besoin. » |
| Onboarding — entreprise | « Ces informations permettent d'**adapter** votre plan de préparation. » |
| Onboarding — pays | « La structure documentaire sera **adaptée à ce pays**. » |
| Onboarding — plan | « Sanza **a adapté** les pièces attendues à votre situation. » |

### Ce que fait le code

```sql
-- Aucune des deux ne lit `objectif`. Vérifié par pg_get_functiondef.
apply_checklist_template(p_deal)   →  position('objectif' in …) = 0
apply_dataroom_template(p_deal)    →  position('objectif' in …) = 0
```

`create_deal` les appelle toutes les deux, sans paramètre autre que
l'identifiant de l'opération. **Le pays, le secteur et l'objectif n'entrent
nulle part dans la génération.**

Le seul réglage disponible est un booléen : `create_data_room(p_template)`.
Structure standard, ou rien.

### Ce que ça produit

Un fondateur qui prépare un **audit** et un autre qui lève en **capital**
reçoivent la même arborescence et la même liste d'exigences. Un dossier de
**prêt bancaire** hérite d'un plan pensé pour des investisseurs. Une entreprise
sénégalaise et une camerounaise reçoivent les mêmes pièces OHADA — ce qui tombe
juste par hasard, les deux étant en zone OHADA, mais rien ne le garantit.

**C'est l'écart le plus coûteux du produit**, pour une raison simple : il n'est
visible qu'après coup. On croit avoir répondu à quatre questions utiles, on
découvre à l'écran suivant qu'elles n'ont rien changé. La confiance se perd là.

---

## 3. Les autres incohérences relevées

### 3.1 Les catégories d'exigence ne couvrent pas les objectifs

```sql
create type public.checklist_category as enum ('ohada', 'financier', 'dfi');
```

Trois valeurs, pour six intentions. Un audit légal, une diligence acheteur, une
demande documentaire quelconque n'ont pas de case. Le rangement se fait donc
au jugé, et les compteurs de préparation comptent des choses hétérogènes.

### 3.2 ~~Une exigence ne peut pas dire d'où elle vient~~ — CORRIGÉ, J'AVAIS TORT

**La première version de ce document affirmait que `checklist_items` n'avait
aucune colonne de provenance, et en faisait sa recommandation numéro un.
C'est faux.**

La colonne existe : `sources text[]`. Elle est remplie, affichée en badges dans
l'écran Préparation, filtrable, et le domaine sait même écrire « réclamée par la
banque et le DFI ». Sur les vingt-deux exigences du modèle :

| `sources` | Exemple |
|---|---|
| `{ohada, capital}` | PV des assemblées des 3 derniers exercices |
| `{bank, dfi, capital}` | États financiers SYSCOHADA — 3 exercices |
| `{dfi}` | Plan d'action E&S |
| `{bank}` | Assurances en cours de validité |

Un tableau est donc DÉJÀ le modèle cumulatif que la §5 proposait de concevoir —
en mieux : porté par l'exigence elle-même, sans jointure, et sans risque de
doublon puisqu'une ligne = une exigence.

**Ce qui reste vrai** : le cas « plusieurs financeurs » n'est pas résolu pour
autant, mais pour une autre raison. `sources` porte des CATÉGORIES de financeur
— `bank`, `dfi` — pas des financeurs nommés. « Demandé par Banque Atlantique »
reste impossible, et c'est ce qui bloque l'import de liste reçue.

### 3.3 Le stade est demandé deux fois, l'un écrasait l'autre

« Stade de développement » (entreprise) et « Stade de la levée » (détails)
écrivaient la même colonne, avec des listes différentes. Corrigé le 1er août par
`modalite_financement`, mais le symptôme dit quelque chose : **le modèle de
l'entreprise et celui de l'opération se mélangent**. Voir aussi la devise, la
forme juridique, l'immatriculation et le site — quatre champs saisis et jetés
jusqu'à aujourd'hui.

### 3.4 Le pays sert à l'affichage, jamais au produit

Quatorze pays UEMOA-CEMAC sont proposés à l'immatriculation. La valeur est
stockée, affichée, et n'a **aucun effet** — alors que c'est probablement la
donnée la plus discriminante du marché : le RCCM sénégalais et l'immatriculation
camerounaise n'ont ni le même nom, ni la même pièce justificative.

### 3.5 Trois écrans hors périmètre restent atteignables

`CohortJoin`, le panneau cohorte des invitations et `ImportList` affichent des
données fictives et s'ouvrent par une URL devinée. Aucun lien n'y mène, mais
rien ne les ferme.

---

## 4. Zones d'amélioration, par ordre de valeur

| | Zone | Pourquoi maintenant |
|---|---|---|
| 1 | **Référentiels réels** | Tient la promesse déjà affichée quatre fois |
| 2 | **Provenance des exigences** | Débloque l'import et le multi-financeur |
| 3 | **Réglages d'opération** | `OperationDialog` reste à moitié décoratif |
| 4 | **Accessibilité des formulaires** | `aria-describedby` : zéro occurrence |
| 5 | **Fermer le hors-périmètre** | Une heure de travail, supprime trois faux |

---

## 5. Le système de référentiels — proposition révisée

### 5.1 L'écart réel, une fois l'erreur corrigée

Le modèle existe. Ce qui manque tient en une phrase :

> `apply_checklist_template` insère les vingt-deux exigences **sans jamais
> regarder `sources`**, alors que chacune sait déjà à qui elle s'adresse.

Le compte, mesuré sur la base :

| Objectif | Exigences pertinentes | Sur 23 |
|---|---:|---:|
| Levée en capital | 8 + socle OHADA 7 | 15 |
| Dette bancaire | 12 + socle OHADA 7 | 19 |
| DFI / bailleur | 10 + socle OHADA 7 | 17 |

Un fondateur préparant un prêt voit aujourd'hui « Marques OAPI enregistrées »,
qui ne concerne qu'une levée en capital. Il ne s'agit pas de construire un
système : il s'agit de **filtrer sur une colonne déjà remplie**.

### 5.2 Ce qu'il faut, et rien de plus

**1. Une correspondance objectif → financeur.** Quatre valeurs existent dans
`sources` — `ohada`, `capital`, `bank`, `dfi` — pour six objectifs :

```text
levee      → capital + ohada
dette      → bank    + ohada
dfi        → dfi     + ohada
diligence  → ohada   + capital     (un acheteur regarde ce qu'un investisseur regarde)
audit      → ohada                 (à valider : un auditeur demande-t-il autre chose ?)
autre      → ohada                 (le socle, et rien de plus)
```

C'est le seul vrai arbitrage produit, et il tient en six lignes.

**2. `apply_checklist_template` prend l'objectif** et n'insère que les exigences
dont `sources` recoupe la liste. Une fonction, une signature.

**3. L'écran le dit.** Les badges de provenance existent déjà mais personne ne
les remarque. Une phrase en tête de la Préparation — « 19 pièces, parce que vous
préparez un dossier bancaire » — transforme un champ invisible en la
démonstration la plus lisible de la promesse.

### 5.3 Ce que j'abandonne de ma première version

- **Les tables `referentiels` / `referentiel_items`.** Elles dupliqueraient ce
  que `sources` fait déjà, avec une jointure de plus et un modèle moins lisible.
- **Le `NULL` qui vaut « tout ».** Astuce de base de données, pas concept
  produit : personne — pas même l'équipe Sanza — ne peut prédire de tête ce que
  produit une combinaison.
- **La déduplication sur l'intitulé normalisé.** Elle était fragile — « Statuts
  à jour » et « Statuts certifiés conformes » y auraient échappé. Le problème
  disparaît : une ligne porte déjà plusieurs sources.

### 5.4 Ce qui reste ouvert, et qui est le vrai chantier

`sources` porte des **catégories** de financeur, pas des financeurs nommés. Pour
« la Banque Atlantique m'a envoyé cette liste », il faut une notion de
**demandeur** distincte de la catégorie. C'est ce qui débloquerait l'import de
liste reçue — et c'est un chantier réel, contrairement à ce que je proposais.

Je ne le lancerais pas en premier : filtrer d'abord, mesurer si le besoin
remonte ensuite.

### 5.5 Et l'option la moins chère, que je n'avais pas chiffrée

**Supprimer les quatre phrases qui promettent l'adaptation.** Quelques minutes,
zéro migration. Le produit cesse de mentir immédiatement.

Ce n'est pas ce que je recommande — le filtre coûte peu et vaut mieux — mais
c'était une faute de ne pas la mettre sur la table. Si le filtre devait attendre
plus de deux semaines, il faudrait retirer les phrases entre-temps.

## 6. Deux arbitrages qui vous reviennent

**Le pays doit-il vraiment changer les pièces ?** UEMOA et CEMAC sont toutes
deux OHADA : le socle juridique est commun, et les différences portent surtout
sur les noms de documents et les administrations. Un référentiel par pays serait
peut-être une précision inutile — un socle OHADA plus quelques variantes
suffirait.

**Le secteur doit-il en changer aussi ?** Une centrale solaire et une fintech
n'ont pas les mêmes autorisations. Mais dix secteurs × six objectifs, c'est
soixante référentiels à écrire et à tenir à jour. Je commencerais **sans** le
secteur, et je l'ajouterais quand un financeur précis le réclamera.

---

## 7. Ce que ce document n'est pas

Une étude utilisateur. Tout ce qui précède vient du code et de la base — pas
d'entretiens. Les incohérences sont **factuelles** ; l'ordre de priorité et le
modèle proposé sont un **avis**, formé sur ce que le code révèle des intentions
du produit.

Ce qui manquerait pour trancher vraiment : trois ou quatre conversations avec
des fondateurs ayant préparé un dossier bancaire ET une levée, pour savoir si
les deux listes se recoupent autant qu'on le suppose. C'est l'hypothèse sur
laquelle repose tout le mécanisme de cumul.
