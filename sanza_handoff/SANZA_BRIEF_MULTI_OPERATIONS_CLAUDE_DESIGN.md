# SANZA — Brief d’implémentation multi-opérations

**Destinataire : Claude Design / Claude Code**  
**Périmètre : parcours Fondateur**

## 1. Mission

Faire évoluer Sanza afin qu’une même entreprise puisse gérer plusieurs opérations de financement ou de diligence, sans reconstruire le flow actuel de la data room.

Règle produit :

> Une entreprise peut avoir plusieurs opérations.  
> Chaque opération possède une seule data room principale.  
> Le nombre d’opérations actives simultanément dépend du plan.

Exemples : Levée Seed 2026, Série A 2027, prêt bancaire, diligence IFC, subvention, audit.

Ne pas créer plusieurs data rooms dans une même opération pour montrer des contenus différents. Utiliser les permissions, groupes d’invités, niveaux d’accès et expirations.

---

## 2. Ce qui reste inchangé

Une fois dans une opération, conserver les flows existants :

- arborescence et dépôt des pièces ;
- visionneuse ;
- préparation et checklist ;
- autorisations et invitations ;
- NDA ;
- questions-réponses ;
- journal et versions ;
- pipeline de levée ;
- sécurité.

La nouvelle couche est :

```text
Entreprise
→ Opérations
→ Opération sélectionnée
→ Flow actuel de la data room
```

Le document Fondateur actuel prévoit déjà une liste `/espaces` avec les états aucune, une ou plusieurs data rooms. Il faut supprimer la contradiction avec la phrase « UNE opération » et faire de l’opération le contexte supérieur de la data room.

---

## 3. Modèle obligatoire

```text
Workspace / Entreprise
├── Opération
│   ├── Vue d’ensemble
│   ├── Préparation
│   ├── Partage et accès
│   ├── Levée ou financement
│   ├── Activité
│   └── Data room
└── Opération archivée
    └── Lecture seule
```

Règles :

1. Une entreprise possède plusieurs opérations.
2. Une opération possède une data room principale.
3. Une invitation appartient à une data room précise.
4. Questions, NDA, permissions et consultations sont rattachés à la data room.
5. Le pipeline appartient à l’opération.
6. L’archivage ne supprime rien.
7. Le downgrade ne supprime rien.
8. Les invités externes ne sont pas des sièges payants.

---

## 4. Navigation

### Navigation globale

```text
Accueil
Opérations
Invitations et demandes
Recherche
Équipe
Sécurité
Aide
```

Ne pas garder « Ma levée » comme entrée globale.  
Ne pas ajouter « Data rooms » comme deuxième entrée globale.

### Navigation dans une opération

```text
← Toutes les opérations

Série A 2026
Capital · Active

PILOTER
Vue d’ensemble
Préparation
Partage et accès
Ma levée
Activité

DOCUMENTS
Data room
├── Société
├── Gouvernance
├── Finance
├── Fiscalité
├── Commercial
└── Équipe
```

Pour une diligence, masquer « Ma levée ».

---

## 5. Routes

Remplacer les routes sans contexte :

```text
/data-room
/deal
/permissions
/checklist
/qa
/audit
```

par :

```text
/operations
/operations/new
/operations/[operationId]
/operations/[operationId]/preparation
/operations/[operationId]/data-room
/operations/[operationId]/permissions
/operations/[operationId]/questions
/operations/[operationId]/invitations
/operations/[operationId]/audit
/operations/[operationId]/nda
/operations/[operationId]/versions
/operations/[operationId]/deal
```

Si `/espaces` est conservé, toutes les routes internes doivent contenir `operationId`.

---

# 6. Nouveaux écrans

## Écran 1 — Opérations, état vide

**Route :** `/operations`

> # Opérations  
> Retrouvez ici vos levées, financements et diligences.
>
> ## Aucune opération  
> Créez votre première opération pour préparer une levée, un financement bancaire ou une diligence.
>
> `Créer une opération`
>
> *Votre data room restera privée jusqu’à ce que vous décidiez de la partager.*

Aucun compteur à zéro. Une seule action principale.

## Écran 2 — Opérations, une opération

```text
Opérations                                      + Nouvelle opération

Série A 2026
Levée en capital · Active
72 % de préparation

38 pièces
6 invités
Dernière activité il y a 2 heures

Ouvrir l’opération
```

Ne pas sauter la liste : le bouton `Nouvelle opération` doit rester visible et découvrable.

## Écran 3 — Opérations, plusieurs opérations

```text
Opérations                                      + Nouvelle opération

ACTIVES

Série A 2026
Capital · Active · 72 % prête
6 invités · activité il y a 2 heures

Prêt Ecobank
Dette · Active · 45 % prête
Aucun accès externe

Diligence IFC
Diligence · Active
Échéance dans 12 jours

ARCHIVÉES

Levée Seed 2024
Clôturée le 14 septembre 2024
Lecture seule
```

Menu `•••` pour une active :

- Ouvrir ;
- Modifier ;
- Dupliquer la structure ;
- Clôturer ;
- Archiver ;
- Exporter l’index.

Pour une archivée :

- Ouvrir en lecture seule ;
- Réactiver ;
- Dupliquer la structure.

## Écran 4 — Nouvelle opération, type

**Route :** `/operations/new`, étape 1

> # Que préparez-vous ?  
> Sanza adaptera la préparation et la structure documentaire à votre besoin.

Cartes :

- Lever en capital ;
- Obtenir un financement bancaire ;
- Répondre à une institution ou un bailleur ;
- Répondre à une diligence ;
- Préparer un audit ;
- Autre demande documentaire.

CTA : `Continuer`

Sans sélection, bouton désactivé et raison visible sous le bouton.

## Écran 5 — Nouvelle opération, informations

**Étape 2**

> # Décrivez cette opération  
> Ces informations permettront à Sanza de préparer la bonne liste de pièces.

Champs communs :

- nom de l’opération ;
- pays ou juridiction ;
- type de financeur ;
- stade.

Champs conditionnels :

**Levée :** montant, devise, tour, horizon.  
**Dette :** montant, devise, durée, prêteur, échéance.  
**Diligence :** organisation, objet, échéance.

Réutiliser les informations permanentes de l’entreprise. Ne pas refaire l’onboarding.

## Écran 6 — Nouvelle opération, structure

**Étape 3**

> # Comment souhaitez-vous commencer ?  
> Vous pourrez modifier la structure documentaire ensuite.

Options :

1. structure recommandée par Sanza ;
2. reprendre la structure d’une opération existante ;
3. data room vide.

Lors d’une copie de structure, ne jamais copier :

- les pièces ;
- les invités ;
- les permissions ;
- les NDA ;
- les questions ;
- l’activité.

CTA : `Créer l’opération`

Succès :

> ## Votre opération est prête  
> La data room de « Série A 2026 » a été créée en mode privé.
>
> `Ouvrir l’opération`

## Écran 7 — Accueil avec plusieurs opérations

**Route :** `/dashboard`

> # Bonjour {Prénom}  
> Voici ce qui demande votre attention aujourd’hui.

Afficher au maximum trois actions urgentes :

```text
Diligence IFC
8 pièces à fournir avant le 12 août
Voir la préparation
```

```text
Série A 2026
Amina Diallo attend une réponse depuis 3 jours
Ouvrir la question
```

Puis :

```text
VOS OPÉRATIONS

Série A 2026       72 %       Partagée
Prêt Ecobank       45 %       Privée
Diligence IFC      61 %       Échéance proche
```

Un seul conseil contextuel. Chaque action ouvre directement la bonne opération.

---

# 7. Nouvelles modales

## Modale 1 — Limite du plan

### Raise

> ## Votre plan comprend une opération active  
> « Série A 2026 » est actuellement active. Archivez-la avant d’en commencer une nouvelle, ou passez au plan Close pour gérer plusieurs opérations simultanément.
>
> `Découvrir Close`  
> `Voir l’opération actuelle`

### Close

> ## Vos trois opérations actives sont utilisées  
> Archivez une opération terminée avant d’en commencer une nouvelle.
>
> `Voir mes opérations`

Le bouton `Nouvelle opération` peut ouvrir cette modale. Ne pas le masquer sans explication.

## Modale 2 — Clôturer ou archiver

### Clôturer

> ## Clôturer « Série A 2026 » ?  
> La data room, les accès, les NDA, les consultations et les engagements resteront consultables.
>
> ○ Conserver les accès jusqu’à leur expiration  
> ○ Révoquer les accès maintenant
>
> `Clôturer l’opération`  
> `Continuer à travailler`

### Archiver

> ## Archiver « Série A 2026 » ?  
> L’opération passera en lecture seule et ne comptera plus dans votre limite. Aucun document ne sera supprimé.
>
> `Archiver l’opération`  
> `Conserver active`

## Modale 3 — Choix pour un dealroom

> ## Quelle opération souhaitez-vous présenter ?  
> Le programme verra les informations autorisées de cette opération. Il ne verra aucun document sans votre accord.

```text
● Série A 2026
  Capital · Active · 72 % prête

○ Prêt Ecobank
  Dette · Active · 45 % prête
```

CTA : `Présenter cette opération`

Un mandat ou un consentement ne doit jamais s’appliquer automatiquement à toutes les opérations.

---

# 8. Écrans actuels à modifier

## Bienvenue

Conserver le principe actuel : aucune data room n’est créée automatiquement à la fin de l’onboarding.

Au premier clic sur `Créer ma data room`, créer ensemble la première opération et sa data room privée.

Après la première opération, utiliser `Nouvelle opération`.

## Vue d’ensemble de l’opération

Toujours garder visible :

- nom ;
- type ;
- statut ;
- préparation ;
- échéance ;
- prochaine action ;
- activité.

## Partage et accès

Titre :

```text
Créer un accès
```

Contexte :

```text
Série A 2026
Vous allez ouvrir une partie de cette data room à un invité.
```

Vérification finale :

```text
OPÉRATION
Série A 2026

DESTINATAIRE
Amina Diallo
Sahel Growth Fund

CONTENU
Société
Finance
Commercial

SÉCURITÉ
Lecture filigranée
NDA obligatoire
Expiration le 30 septembre 2026
```

## Invitations et demandes

Chaque ligne doit afficher l’opération :

```text
Amina Diallo demande un accès
Série A 2026
Il y a 2 heures
```

Ajouter un filtre par opération.

## Recherche

Chaque résultat affiche son chemin :

```text
Business plan 2026.pdf
Série A 2026 › Commercial
```

## Activité et questions

Hors contexte d’une opération, toujours afficher le nom de l’opération.

## Abonnement

Afficher :

```text
Opérations actives
2 sur 3
```

Limites :

- Ready : 1 en préparation ;
- Raise : 1 active ;
- Close : 3 actives ;
- sur mesure : configurable.

Les archives ne comptent pas.

## Programme, cohorte et dealroom

L’entreprise rejoint une cohorte, mais l’opération présentée, le mandat et l’accès documentaire restent liés à une opération précise.

---

# 9. Sélecteur rapide

Le nom de l’opération peut ouvrir :

```text
VOS OPÉRATIONS

● Série A 2026
  Prêt Ecobank
  Diligence IFC

Voir toutes les opérations
+ Nouvelle opération
```

Ce menu est un raccourci. La page `/operations` reste la gestion principale.

---

# 10. Données

## `operations`

```sql
id uuid primary key
workspace_id uuid not null
name text not null
operation_type text not null
status text not null
country_code text
funder_type text
target_amount bigint
currency text
deadline date
closed_at timestamptz
archived_at timestamptz
created_at timestamptz default now()
updated_at timestamptz default now()
```

Statuts : `draft`, `active`, `closed`, `archived`.

## `data_rooms`

```sql
id uuid primary key
operation_id uuid not null unique
name text not null
status text not null
template_code text
created_at timestamptz default now()
updated_at timestamptz default now()
```

Toutes les tables documentaires doivent être rattachées à `data_room_id` ou `operation_id`.

```text
workspace → operations[] → data_room
```

Ne pas conserver `workspace → data_room unique`.

---

# 11. Sécurité

- vérifier côté serveur l’appartenance de l’opération au workspace ;
- filtrer chaque requête par `operation_id` ou `data_room_id` ;
- ne jamais faire confiance uniquement au frontend ;
- empêcher l’accès à une autre entreprise en modifiant l’URL ;
- vérifier les limites de plan côté serveur ;
- journaliser l’opération dans chaque événement d’audit ;
- rendre l’archivage réversible ;
- ne jamais copier invités, NDA ou permissions lors d’une duplication.

---

# 12. Mobile

Flow :

```text
Opérations
→ Série A 2026
→ Menu de l’opération
→ Préparation / Partage / Levée / Data room
```

Le retour doit dire `← Toutes les opérations`, pas seulement `← Retour`.

Valider en priorité :

- liste des opérations ;
- création ;
- menu contextuel ;
- dashboard multi-opérations ;
- partage ;
- limite du plan.

---

# 13. Nombre d’écrans

## Créations

- 7 nouveaux écrans complets ;
- 3 nouvelles modales.

**Total créé : 10 frames.**

## Adaptations

- 8 écrans actuels à modifier.

**Total desktop à concevoir et valider : 18 frames.**

Détail :

1. Opérations vide  
2. Opérations avec une seule opération  
3. Opérations multiples et archives  
4. Création — type  
5. Création — informations  
6. Création — structure  
7. Accueil multi-opérations  
8. Modale limite  
9. Modale clôture/archivage  
10. Modale choix dealroom  
11. Bienvenue adaptée  
12. Vue d’ensemble adaptée  
13. Partage adapté  
14. Invitations/demandes adaptées  
15. Recherche adaptée  
16. Activité/questions adaptées  
17. Abonnement adapté  
18. Cohorte/dealroom adapté  

Ajouter 6 variantes mobiles prioritaires.

```text
18 frames desktop
+ 6 frames mobiles
= 24 frames de validation
```

Cela ne correspond pas à 24 nouvelles routes : plusieurs frames sont des états, étapes ou modales.

---

# 14. Ordre de travail

Avant de coder, Claude doit présenter :

1. audit Supabase ;
2. routes actuelles ;
3. hypothèses de data room unique ;
4. tables et fichiers impactés ;
5. migration sans perte ;
6. risques de régression.

Puis :

### Phase 1 — Architecture
Créer `operations`, rattacher la data room existante, ajouter RLS et contextualiser les routes.

### Phase 2 — Navigation
Créer `/operations`, le panneau contextuel, le sélecteur et le retour vers toutes les opérations.

### Phase 3 — Interface
Coder les 7 écrans, les 3 modales et adapter les 8 écrans existants.

### Phase 4 — Tests
Tester première et deuxième opération, limites Raise/Close, archivage, réactivation, invitations, recherche, URL manipulée, downgrade et mobile.

---

# 15. Critères d’acceptation

- plusieurs opérations par entreprise ;
- une data room par opération ;
- contexte toujours visible ;
- « Ma levée » contextualisée ;
- opération indiquée dans les actions sensibles ;
- archivage sans suppression ;
- limites expliquées ;
- permissions serveur ;
- routes avec `operationId` ;
- cohérence avec le design system Sanza ;
- aucun bouton décoratif ;
- aucun compteur nul inutile ;
- vouvoiement et vocabulaire canonique ;
- responsive fonctionnel.

## Instruction finale

Ne reconstruisez pas tout le parcours Fondateur.

Ajoutez une couche « Opérations » au-dessus du flow actuel et contextualisez les actions sensibles. Réutilisez strictement le design system existant : navigation, composants, espacements, typographies, couleurs, rayons, cartes, boutons et états.
