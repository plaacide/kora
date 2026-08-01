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

### 3.2 Une exigence ne peut pas dire d'où elle vient

`checklist_items` n'a aucune colonne de provenance. Conséquence directe :
l'écran d'import de liste reçue (« Demandé par Banque Atlantique ») **est resté
une maquette** — non par oubli, mais parce que le modèle ne sait pas porter
l'information. Sans elle, une exigence importée devient indiscernable d'une
exigence standard, et l'on ne peut plus répondre à « qu'est-ce que la banque m'a
demandé, précisément ? ».

C'est aussi ce qui bloque le cas **plusieurs financeurs en parallèle** — une
levée et un prêt sur la même entreprise, avec deux listes qui se recoupent
partiellement.

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

## 5. Le système de référentiels

### 5.1 Ce qui existe déjà et qu'on ne refait pas

Trois affordances sont **posées et fonctionnelles** — il ne manque que le modèle
derrière :

- `applyTemplateAction` — « Poser le référentiel sur une opération qui n'a pas
  encore d'exigences ». Le bouton existe, il applique LE référentiel unique.
- `create_data_room(p_template)` — le point d'entrée à la création.
- `addRequirementAction` — l'ajout à la main, avec domaine et niveau.

**Le travail n'est donc pas d'inventer un parcours, mais de remplacer un
booléen par un choix.**

### 5.2 Le modèle proposé

```text
referentiels
  id, nom, description
  objectif          levee | dette | dfi | diligence | audit | autre | NULL
  pays              code ou NULL
  secteur           libellé ou NULL
  actif

referentiel_items
  referentiel_id
  domaine, intitule, description, niveau (requis | recommande)
  ordre

referentiel_dossiers
  referentiel_id
  chemin, ordre
```

`NULL` signifie **« s'applique à tout »**. Un référentiel OHADA porte
`objectif = NULL, pays = NULL` et vaut partout en zone OHADA ; un référentiel
« Prêt bancaire UEMOA » porte `objectif = 'dette', pays = NULL`. La sélection
retient tous ceux qui correspondent, et **cumule** — c'est ce qui permet à une
entreprise ivoirienne demandant un prêt de recevoir le socle OHADA *plus* les
pièces bancaires, sans dupliquer le socle dans chaque référentiel.

Deux règles à ne pas manquer :

- **La déduplication se fait sur l'intitulé normalisé.** Deux référentiels
  demandent « Statuts à jour » ; l'exigence doit apparaître une fois, en
  portant ses deux provenances.
- **Le référentiel appliqué est enregistré sur l'opération.** Sans cela, on ne
  saura jamais pourquoi telle exigence est là, ni quoi faire quand le
  référentiel évolue.

### 5.3 Où ça se branche, dans l'ordre

**À la création — le cas principal.** `create_data_room` reçoit déjà `objectif`.
Elle a besoin de deux paramètres de plus, `p_pays` et `p_secteur`, qu'elle peut
d'ailleurs lire seule sur `startups`. C'est le seul changement structurel.

**À l'onboarding — rien à faire.** Le pays, le secteur et l'objectif sont déjà
collectés aux étapes 2 et 3, avant la création. Le tunnel n'a pas à bouger : ce
sont les données qu'il récolte depuis toujours qui deviennent enfin utiles.

**Sur l'écran Préparation — l'ajout visible.** Le bouton « Appliquer un
référentiel » existe ; il ouvre aujourd'hui une action muette. Il devient un
choix : les référentiels applicables, ceux déjà appliqués, et un aperçu de ce
que l'ajout apporterait. C'est là que se règle le cas du second financeur,
arrivé après coup.

**Sur l'import de liste — plus tard, et sans l'IA.** Une fois la provenance
posée, importer devient : coller une liste, la rapprocher des exigences
existantes, créer les manquantes en les attribuant à ce financeur. L'extraction
automatique d'un PDF est un autre chantier, et n'est pas nécessaire pour que
l'écran serve.

### 5.4 Ce que je ferais en premier

1. **Poser la provenance sur `checklist_items`.** Une colonne, aucune interface.
   Elle débloque tout le reste et ne casse rien.
2. **Créer deux référentiels seulement** — le socle OHADA actuel, et un dossier
   bancaire. Deux suffisent à prouver que le cumul fonctionne ; six inventés
   d'un coup ne se valideraient auprès de personne.
3. **Brancher la sélection à la création**, avec le référentiel enregistré.
4. **Puis l'écran de choix**, une fois qu'il y a réellement quelque chose à
   choisir.

### 5.5 Ce que je ne ferais pas

**Ne pas faire du référentiel un réglage de compte.** Il appartient à
l'opération : la même entreprise peut préparer une levée et un prêt la même
semaine, avec deux listes distinctes.

**Ne pas laisser modifier un référentiel appliqué.** Ce qui a été appliqué est
figé sur l'opération ; faire évoluer le référentiel propose une mise à jour, ne
l'impose pas. Sans quoi une exigence peut disparaître d'un dossier en cours de
diligence, et personne ne saura pourquoi.

**Ne pas les rendre modifiables par le client au départ.** Un référentiel est
une affirmation sur ce qu'un financeur demande — c'est le métier de Sanza. Les
ouvrir trop tôt produirait des listes fausses portant votre marque.

---

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
