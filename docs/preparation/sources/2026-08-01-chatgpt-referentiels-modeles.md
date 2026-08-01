# Sanza — Référentiels, modèles et plans de préparation

**Statut :** proposition produit et technique à challenger dans le code  
**Date :** 1er août 2026  
**Branche concernée :** `v2/rebuild`  
**Base de travail :** document « Le parcours Sanza, ses incohérences, et le système de référentiels »

---

## 1. Décision de vocabulaire

Sanza doit distinguer trois niveaux différents.

### 1.1 Référentiel

Le **référentiel** est la bibliothèque interne de Sanza.

Il contient les exigences que Sanza connaît, avec leurs propriétés :

- intitulé canonique ;
- domaine ;
- niveau requis ou recommandé ;
- durée de validité ;
- régime juridique applicable ;
- type d’opération ;
- instrument ;
- type de financeur ;
- juridiction ;
- secteur réglementé éventuel ;
- version de la règle.

Le référentiel n’est pas manipulé directement par le fondateur.

### 1.2 Modèle de préparation

Un **modèle de préparation** est une sélection réutilisable d’exigences conçue pour un besoin donné.

Exemples :

- Levée en capital ;
- Financement bancaire ;
- Financement DFI ou bailleur ;
- Due diligence ;
- Audit financier ;
- Dossier personnalisé.

Le modèle sert de point de départ. Il ne doit pas être présenté comme une liste juridiquement exhaustive.

### 1.3 Plan de préparation

Le **plan de préparation** est la version matérialisée pour une opération précise.

C’est dans ce plan que le fondateur :

- consulte les exigences ;
- rattache des pièces ;
- confirme ou écarte des suggestions ;
- ajoute une exigence ;
- marque une exigence comme non applicable ;
- suit sa progression ;
- ajoute une demande reçue d’un financeur.

Le fonctionnement cible devient :

```text
Référentiel Sanza
        ↓
Modèle de préparation
        ↓
Plan de préparation de l’opération
```

---

## 2. Ce que l’utilisateur voit réellement

L’utilisateur ne doit pas interagir directement avec les trois niveaux.

### Fondateur

Il :

1. indique son besoin ;
2. accepte le modèle recommandé ou en choisit un autre ;
3. travaille ensuite uniquement dans son plan de préparation.

Exemple :

```text
Quel dossier préparez-vous ?

○ Une levée en capital
○ Un financement bancaire
○ Un financement auprès d’un bailleur ou d’une DFI
○ Une due diligence
○ Un audit
○ Un dossier personnalisé
```

Puis :

```text
Nous vous recommandons le modèle « Financement bancaire ».

[Utiliser ce modèle]
[Choisir un autre modèle]
```

Dans l’usage quotidien :

```text
Plan de préparation
Financement bancaire · 19 exigences
```

### Équipe Sanza

L’équipe Sanza administre :

- le référentiel ;
- les modèles de préparation ;
- les règles d’application ;
- les variantes juridictionnelles ;
- les extensions sectorielles ;
- les versions.

---

## 3. Clarification essentielle sur l’OHADA

### 3.1 Définition produit

Dans Sanza, l’OHADA doit être traitée comme :

> **un régime juridique commun qui produit une couche d’exigences juridiques, de gouvernance et de reporting financier.**

L’OHADA n’est pas :

- un financeur ;
- un objectif de financement ;
- une provenance ;
- une banque ;
- une DFI ;
- un type d’opération.

Exemple de profil d’opération :

```text
Régime juridique       OHADA
Pays                   Sénégal
Objectif               Financement
Instrument             Dette
Type de financeur      Banque commerciale
Financeur nommé        Banque Atlantique
```

Le plan peut ensuite être construit par couches :

```text
Socle entreprise / OHADA
+
Variante locale Sénégal
+
Modèle Dette bancaire
+
Exigences particulières de Banque Atlantique
```

### 3.2 Ce que le modèle actuel mélange

Le champ actuel `sources` contient des valeurs comme :

```text
ohada
capital
bank
dfi
```

Ces valeurs ne décrivent pas le même axe :

| Valeur | Sens réel |
|---|---|
| `ohada` | régime juridique |
| `capital` | type d’opération ou d’instrument |
| `bank` | catégorie de financeur |
| `dfi` | catégorie de financeur |

Le nom `sources` donne donc une mauvaise lecture.

Ce champ décrit davantage une **applicabilité** qu’une provenance.

Noms possibles :

```text
applicable_to
contexts
applicability
financeur_types
```

Aucun renommage ne doit être fait aveuglément avant l’audit de tous les usages existants.

### 3.3 La vraie provenance

La provenance doit répondre à :

> Qui a ajouté ou demandé cette exigence ?

Exemples :

```text
Référentiel Sanza
Ajoutée par le fondateur
Demandée par Banque Atlantique
Demandée par Proparco
Importée depuis une liste PDF
Ajoutée par un programme
```

Elle doit rester distincte de l’applicabilité.

---

## 4. Ce que la checklist alimente

La checklist actuelle alimente directement la fonctionnalité **Préparation**.

Le flux cible est :

```text
Catalogue d’exigences
        ↓
Application d’un modèle de préparation
        ↓
Exigences matérialisées pour l’opération
        ↓
Écran Préparation
```

L’écran Préparation affiche ensuite :

- les exigences à fournir ;
- les exigences prêtes ;
- celles à actualiser ;
- celles qui sont non applicables ;
- les exigences requises ou recommandées ;
- les domaines ;
- les pièces rattachées ;
- la progression.

Une mauvaise sélection en amont produit donc :

```text
Mauvais modèle
→ mauvais plan de préparation
→ progression peu pertinente
→ recommandations peu fiables
```

---

## 5. Challenge de la proposition actuelle

### 5.1 Le filtrage sur `sources` est utile, mais insuffisant

Filtrer les 23 exigences existantes selon l’objectif est une bonne première étape.

Cela permet de retirer des exigences non pertinentes.

Mais cela ne permet pas d’ajouter les exigences absentes du catalogue.

Exemple pour une dette bancaire :

- capacité de remboursement ;
- échéancier des dettes ;
- sûretés ;
- garanties ;
- historique bancaire ;
- utilisation du crédit ;
- contrats soutenant les flux futurs.

Conclusion :

> Le filtrage de la colonne existante est la première étape d’un vrai système de référentiels. Il corrige rapidement la promesse, mais ne constitue pas encore le système complet.

### 5.2 Certains mappings sont encore des hypothèses

Les correspondances suivantes ne doivent pas être considérées comme définitives :

```text
diligence  → ohada + capital
audit      → ohada
autre      → ohada
```

Une due diligence peut couvrir :

- juridique ;
- fiscal ;
- social ;
- commercial ;
- technologique ;
- cybersécurité ;
- propriété intellectuelle ;
- contrats ;
- litiges.

Un audit financier peut couvrir :

- grand livre ;
- balance générale ;
- rapprochements bancaires ;
- inventaires ;
- créances ;
- dettes ;
- déclarations fiscales ;
- justificatifs comptables.

Pour `autre`, proposer plutôt :

```text
○ Commencer avec un socle général
○ Choisir un modèle existant
○ Commencer sans modèle
```

### 5.3 L’objectif seul ne suffit pas

Le plan documentaire peut dépendre de plusieurs axes :

```text
objectif
+ instrument
+ type de financeur
+ régime juridique
+ pays
+ secteur réglementé
+ stade de l’opération
```

Il ne faut pas pour autant créer une matrice complète de toutes les combinaisons.

---

## 6. Architecture recommandée par couches

Le plan de préparation doit être construit par couches cumulatives.

```text
Socle entreprise
+
Régime juridique
+
Modèle d’opération
+
Type de financeur
+
Variante locale
+
Extension secteur réglementé
+
Demandes particulières
```

### 6.1 Socle entreprise

Exigences généralement utiles quelle que soit l’opération :

- identité juridique ;
- gouvernance ;
- immatriculation ;
- structure actionnariale ;
- informations financières principales.

### 6.2 Régime juridique

Exemple :

```text
OHADA
```

Cette couche détermine une partie des exigences juridiques et comptables.

### 6.3 Modèle d’opération

Exemples :

```text
Levée en capital
Dette bancaire
DFI / bailleur
Audit
Due diligence
```

### 6.4 Type de financeur

Exemples :

```text
Banque commerciale
Fonds de capital-risque
DFI
Bailleur
Acheteur stratégique
Auditeur
```

### 6.5 Variante locale

Ne pas créer immédiatement un référentiel complet par pays.

Utiliser :

```text
Socle OHADA commun
+
terminologie locale
+
autorité compétente
+
quelques exigences propres au pays
```

### 6.6 Secteurs réglementés seulement

Ne pas créer dix secteurs multipliés par six objectifs.

Commencer uniquement par les secteurs où la réglementation change réellement les pièces :

- finance ;
- assurance ;
- énergie ;
- santé ;
- télécommunications ;
- éducation réglementée.

---

## 7. Modèle de données cible à challenger

### 7.1 Profil de l’opération

```text
purpose
instrument
counterparty_type
legal_regime
country
jurisdiction
sector
stage
```

### 7.2 Catalogue d’exigences

```text
id
canonical_name
domain
level
freshness_days
applicable_purposes[]
applicable_instruments[]
applicable_counterparties[]
applicable_legal_regimes[]
applicable_jurisdictions[]
applicable_sectors[]
version
```

### 7.3 Modèle de préparation

```text
id
name
description
purpose
instrument
counterparty_type
status
version
```

### 7.4 Liaison modèle ↔ exigence

```text
preparation_template_items
- template_id
- requirement_id
- default_level
- condition
- order_index
```

### 7.5 Exigence matérialisée dans une opération

```text
operation_requirement
- operation_id
- requirement_id
- template_id
- origin_type
- origin_name
- reason
- rule_version
- requested_by_type
- requested_by_name
- level
- status
```

Cette structure est une cible. Claude doit d’abord auditer le schéma réel et réutiliser ce qui existe déjà avant de proposer des migrations.

---

## 8. Comportement lors d’un changement de modèle ou d’objectif

Aucune exigence existante ne doit être supprimée automatiquement.

Exemple :

```text
Levée en capital
→ Dette bancaire
```

Sanza doit afficher :

```text
Votre besoin de financement a changé.

12 nouvelles exigences sont recommandées.
4 exigences actuelles ne semblent plus prioritaires.

[Examiner les changements]
[Mettre à jour le plan]
[Conserver le plan actuel]
```

Règles :

- conserver les pièces déjà déposées ;
- conserver l’historique ;
- ne pas supprimer silencieusement une exigence ;
- ajouter les nouvelles exigences après confirmation ;
- permettre de marquer les anciennes comme non prioritaires ou non applicables.

---

## 9. Versionnement et traçabilité

Chaque exigence générée doit pouvoir expliquer pourquoi elle est apparue.

Exemple :

```text
Origine
Modèle Sanza — Dette bancaire v1.2

Ajoutée parce que
Vous préparez un financement bancaire.
```

À conserver idéalement :

```text
template_id
template_version
rule_version
added_at
origin_type
reason
```

Une mise à jour du référentiel ne doit pas modifier silencieusement les plans existants.

---

## 10. Copie recommandée dans l’interface

Éviter une formulation trop absolue comme :

```text
19 pièces, parce que vous préparez un dossier bancaire.
```

Préférer :

```text
Plan initial pour un financement bancaire — 19 exigences
```

Texte secondaire :

```text
Ce plan vous donne une base de préparation. Vous pourrez le compléter selon les demandes de votre banque.
```

Actions :

```text
[Comprendre ce plan]
[Personnaliser]
```

Pour expliquer une exigence :

```text
Pourquoi cette exigence ?

Cette pièce fait partie du socle juridique OHADA et est généralement demandée dans un dossier de financement bancaire.
```

---

## 11. Priorité avant la bêta

Deux chantiers doivent rester distincts.

### 11.1 Fiabilité de la bêta

Priorité absolue :

- erreurs ;
- validations ;
- fixtures ;
- double clic ;
- permissions ;
- RLS ;
- tests navigateur.

### 11.2 Promesse de Préparation

Avant la bêta, choisir l’une des deux options suivantes.

#### Option A — Correctif minimal fonctionnel

Mettre en place :

```text
objectif / instrument
→ choix d’un modèle de préparation
→ filtrage du catalogue existant
→ socle OHADA lorsque pertinent
→ message transparent dans l’écran
```

#### Option B — Transparence temporaire

Retirer immédiatement les phrases affirmant que le plan est déjà adapté.

Utiliser :

```text
Sanza crée un plan de préparation de départ. Vous pourrez l’adapter à votre opération et aux demandes de vos financeurs.
```

Ne pas conserver une promesse d’adaptation si tous les utilisateurs reçoivent encore le même plan.

---

## 12. Instructions à Claude Code

### Objectif

Auditer puis corriger le système de Préparation sans surconstruire ni casser les fonctionnalités déjà branchées.

### Travail demandé

1. Lire le schéma réel, les migrations et tous les usages de :

```text
checklist_items
checklist_category
domain
sources
apply_checklist_template
apply_dataroom_template
create_deal
complete_onboarding
```

2. Confirmer explicitement :

- si `checklist_category` est encore actif ou historique ;
- si `domain` est désormais la classification principale ;
- si `sources` est utilisé comme applicabilité, provenance ou les deux ;
- où sont stockées les exigences modèles ;
- où sont stockées les exigences matérialisées par opération.

3. Ne renommer ni supprimer aucun champ avant d’avoir produit une matrice d’usage :

| Champ | Table | Écrit par | Lu par | Sens actuel | Cible proposée |
|---|---|---|---|---|---|

4. Implémenter en premier une version minimale :

- modèles de préparation fermés ;
- sélection selon l’objectif et, si disponible, l’instrument ;
- application d’un socle OHADA lorsque pertinent ;
- matérialisation dans le plan de l’opération ;
- aucune suppression automatique ;
- copie transparente dans l’interface.

5. Ne pas créer immédiatement :

- un référentiel complet par pays ;
- une matrice secteur × objectif ;
- un système d’import PDF ;
- une provenance nominative complexe ;
- une interface d’administration complète.

6. Ajouter les tests suivants :

```text
Levée en capital ≠ Dette bancaire
Dette bancaire ≠ DFI
Audit ≠ Levée en capital
OHADA est appliqué comme régime juridique, pas comme financeur
Un changement de modèle ne supprime rien
Les pièces déjà rattachées sont conservées
Le même modèle produit un plan déterministe
Une version de modèle est conservée
Aucune fixture n’apparaît
```

7. Ajouter des tests navigateur pour vérifier que l’utilisateur :

- voit le modèle recommandé ;
- peut choisir un autre modèle ;
- voit le plan créé ;
- comprend pourquoi une exigence apparaît ;
- peut personnaliser le plan ;
- ne voit jamais les termes techniques internes `sources`, `ohada`, `bank`, `dfi` comme choix bruts.

8. Mettre à jour la documentation avec :

- le schéma réel ;
- la décision retenue ;
- les migrations ;
- les tests ;
- les limites connues ;
- les éléments volontairement reportés après la bêta.

### Livrables attendus

```text
/docs/preparation/REFERENTIELS-ET-MODELES.md
/docs/preparation/SCHEMA-ACTUEL.md
/docs/preparation/MIGRATION-PLAN.md
/docs/preparation/TEST-REPORT.md
```

### Verdict attendu de Claude

Claude doit conclure par une recommandation argumentée :

```text
A. Corriger maintenant avec le modèle minimal
B. Retirer temporairement la promesse d’adaptation
C. Bloquer la bêta jusqu’à une refonte plus profonde
```

La recommandation ne doit pas être fondée uniquement sur la facilité technique. Elle doit prendre en compte la confiance utilisateur, la cohérence de Préparation et le calendrier de la bêta.

---

## 13. Décisions proposées au fondateur

1. Utiliser les termes :

```text
Référentiel
Modèle de préparation
Plan de préparation
Exigence
```

2. Garder le référentiel invisible pour le fondateur.

3. Permettre au fondateur d’accepter ou de changer le modèle recommandé.

4. Faire du plan de préparation le seul espace de travail quotidien.

5. Traiter l’OHADA comme un régime juridique.

6. Séparer l’applicabilité d’une exigence de sa provenance réelle.

7. Commencer par un modèle minimal avant la bêta, puis enrichir grâce aux retours utilisateurs.

8. Ne jamais présenter le plan initial comme une liste exhaustive ou une garantie de conformité.

