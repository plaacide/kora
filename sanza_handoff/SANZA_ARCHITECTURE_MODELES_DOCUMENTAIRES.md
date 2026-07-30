# SANZA — Architecture des modèles documentaires

**Destinataire : Claude Code**  
**Objectif : intégrer dans Sanza des structures documentaires configurables pour la levée de fonds, la gouvernance, la founder due diligence et les fusions-acquisitions.**

---

## 1. Principe général

Ne pas coder quatre arborescences indépendantes directement dans le frontend.

Construire un moteur documentaire basé sur :

```text
socle commun
+ type d’opération
+ juridiction
+ type de financeur
+ secteur
+ exigences personnalisées
```

Une entreprise peut avoir plusieurs opérations.

Chaque opération possède :

- une seule data room principale ;
- une structure documentaire générée ;
- une checklist ;
- des exigences obligatoires, recommandées, conditionnelles ou facultatives ;
- ses propres invités, permissions, NDA, questions et événements d’audit.

```text
Entreprise
└── Opération
    └── Data room
        ├── Dossiers
        ├── Exigences
        ├── Pièces
        ├── Permissions
        ├── Questions
        └── Journal
```

---

# 2. Modèles à supporter

Créer les modèles initiaux suivants :

```text
fundraising
board_due_diligence
founder_due_diligence
mergers_acquisitions
```

Ils doivent être versionnés, composables et administrables.

---

# 3. Socle documentaire commun

```text
00. Présentation
01. Société et existence juridique
02. Capital et actionnariat
03. Finance
04. Fiscalité
05. Activité commerciale
06. Produit et technologie
07. Propriété intellectuelle
08. Équipe et ressources humaines
09. Contrats
10. Gouvernance
11. Conformité et risques
12. ESG et impact
13. Annexes
```

Le moteur doit pouvoir :

- activer ou désactiver une section ;
- ajouter un sous-dossier ;
- modifier un libellé ;
- modifier l’ordre ;
- ajouter une exigence ;
- renforcer le niveau d’une exigence ;
- appliquer une règle selon le pays, le financeur ou le secteur.

---

# 4. Modèle Levée de fonds

```text
00. Présentation de l’opération
    ├── Teaser
    ├── Pitch deck
    ├── Executive summary
    ├── Montant recherché
    ├── Utilisation des fonds
    ├── Calendrier
    └── Investisseurs ciblés

01. Société et existence juridique
    ├── Statuts à jour
    ├── RCCM ou certificat d’immatriculation
    ├── Identifiant fiscal
    ├── Bénéficiaires effectifs
    ├── Adresse du siège
    ├── Organigramme juridique
    ├── Filiales
    └── Autorisations d’exercer

02. Capital et actionnariat
    ├── Cap table actuelle
    ├── Cap table fully diluted
    ├── Historique des émissions
    ├── Registre des actionnaires
    ├── Pactes d’actionnaires
    ├── SAFE et convertibles
    ├── Stock-options
    ├── Droits préférentiels
    └── Cap table post-opération

03. Documents de la levée
    ├── Term sheet
    ├── Lettre d’intention
    ├── Contrat de souscription
    ├── Pacte d’actionnaires proposé
    ├── Droits des investisseurs
    ├── Accord de vote
    ├── Droits de préemption
    ├── Droits de sortie conjointe
    ├── Résolutions
    └── Conditions préalables au closing

04. Finance
    ├── États financiers historiques
    ├── Comptes de gestion mensuels
    ├── Budget
    ├── Prévisions 3 à 5 ans
    ├── Trésorerie
    ├── Dettes
    ├── Relevés bancaires
    ├── Balance âgée clients
    ├── Balance âgée fournisseurs
    ├── Burn rate
    └── Runway

05. Fiscalité
    ├── Déclarations fiscales
    ├── Attestations de régularité
    ├── Contrôles et redressements
    ├── TVA
    ├── Impôt sur les sociétés
    ├── Retenues à la source
    ├── Prix de transfert
    └── Risques fiscaux

06. Activité commerciale et traction
    ├── Business model
    ├── Politique tarifaire
    ├── Revenus par produit
    ├── Revenus par pays
    ├── Revenus par client
    ├── Pipeline commercial
    ├── Principaux clients
    ├── Churn
    ├── Rétention
    ├── CAC
    ├── LTV
    ├── Marges
    └── Études de marché

07. Produit, technologie et données
    ├── Présentation produit
    ├── Roadmap
    ├── Architecture technique
    ├── Dépendances critiques
    ├── Hébergement
    ├── Cybersécurité
    ├── Continuité d’activité
    ├── Incidents techniques
    ├── Protection des données
    └── Sauvegardes

08. Propriété intellectuelle
    ├── Marques
    ├── Brevets
    ├── Noms de domaine
    ├── Code source
    ├── Cessions de propriété intellectuelle
    ├── Licences logicielles
    ├── Open source
    └── Litiges

09. Équipe et ressources humaines
    ├── Organigramme
    ├── Biographies des dirigeants
    ├── Contrats des fondateurs
    ├── Contrats des salariés clés
    ├── Rémunérations
    ├── Plans d’intéressement
    ├── Déclarations sociales
    ├── Litiges sociaux
    └── Plan de recrutement

10. Contrats
    ├── Clients
    ├── Fournisseurs critiques
    ├── Partenaires
    ├── Distribution
    ├── Prêts
    ├── Baux
    ├── Assurances
    ├── Changement de contrôle
    └── Exclusivités

11. Gouvernance
    ├── Conseil d’administration
    ├── Comités
    ├── Procès-verbaux
    ├── Résolutions des actionnaires
    ├── Délégations de pouvoirs
    ├── Matières réservées
    ├── Conflits d’intérêts
    └── Transactions avec parties liées

12. Conformité et risques
    ├── KYC
    ├── Bénéficiaires effectifs
    ├── AML
    ├── Anti-corruption
    ├── Sanctions
    ├── PEP
    ├── Licences réglementaires
    ├── Contentieux
    ├── Assurances
    └── Protection des consommateurs

13. Impact et ESG
    ├── Théorie du changement
    ├── Indicateurs d’impact
    ├── Données femmes et jeunes
    ├── Emplois créés
    ├── Politique environnementale et sociale
    ├── Santé et sécurité
    └── Plan d’amélioration ESG
```

---

# 5. Modèle Board & Governance Due Diligence

```text
00. Présentation de la gouvernance
    ├── Organigramme de gouvernance
    ├── Structure actionnariale
    ├── Présentation du conseil
    └── Principaux enjeux

01. Base juridique
    ├── Statuts
    ├── Pacte d’actionnaires
    ├── Règlement intérieur du conseil
    ├── Matières réservées
    └── Délégations de pouvoirs

02. Composition du conseil
    ├── Liste des administrateurs
    ├── Biographies
    ├── Lettres de nomination
    ├── Durée des mandats
    ├── Indépendance
    ├── Matrice de compétences
    ├── Diversité
    └── Vacances de sièges

03. Fonctionnement du conseil
    ├── Calendrier annuel
    ├── Ordres du jour
    ├── Board packs
    ├── Procès-verbaux
    ├── Résolutions écrites
    ├── Présences
    ├── Suivi des décisions
    └── Actions en attente

04. Comités
    ├── Comité d’audit
    ├── Comité des risques
    ├── Comité de rémunération
    ├── Comité de nomination
    ├── Mandats
    ├── Composition
    └── Procès-verbaux

05. Direction et supervision
    ├── Répartition conseil-direction
    ├── Objectifs de la direction
    ├── Évaluation du CEO
    ├── Plan de succession
    ├── Rémunérations
    └── Transactions avec les dirigeants

06. Conflits d’intérêts
    ├── Déclarations d’intérêts
    ├── Registre des conflits
    ├── Parties liées
    ├── Abstentions
    └── Procédures d’approbation

07. Risques et contrôle interne
    ├── Registre des risques
    ├── Politique de gestion des risques
    ├── Contrôles internes
    ├── Audit interne
    ├── Audit externe
    ├── Cybersécurité
    └── Continuité d’activité

08. Éthique et conformité
    ├── Code de conduite
    ├── Anti-corruption
    ├── Dispositif d’alerte
    ├── Enquêtes internes
    ├── Sanctions disciplinaires
    └── Formations obligatoires

09. Responsabilité des administrateurs
    ├── Assurance dirigeants
    ├── Lettres d’indemnisation
    ├── Litiges impliquant des administrateurs
    └── Déclarations réglementaires

10. Évaluation et plan d’amélioration
    ├── Évaluation du conseil
    ├── Évaluation des comités
    ├── Lacunes identifiées
    ├── Actions correctives
    ├── Responsables
    └── Échéances
```

---

# 6. Modèle Founder Due Diligence

```text
00. Cadre de la diligence
    ├── Consentement du fondateur
    ├── Périmètre des vérifications
    ├── Politique de confidentialité
    └── Personnes autorisées

01. Identité et KYC
    ├── Pièce d’identité
    ├── Adresse
    ├── Nationalités
    ├── Bénéficiaires effectifs
    └── Résidence fiscale

02. Parcours professionnel
    ├── CV
    ├── Expériences précédentes
    ├── Entreprises fondées
    ├── Mandats de direction
    ├── Mandats d’administrateur
    └── Réalisations principales

03. Formation
    ├── Diplômes
    ├── Certifications
    ├── Formations professionnelles
    └── Vérifications correspondantes

04. Références
    ├── Anciens employeurs
    ├── Anciens investisseurs
    ├── Cofondateurs
    ├── Clients ou partenaires
    └── Synthèses d’entretiens

05. Intérêts économiques
    ├── Participation dans l’entreprise
    ├── Participations externes
    ├── Activités parallèles
    ├── Mandats externes
    ├── Prêts du fondateur
    └── Transactions avec la société

06. Intégrité et réputation
    ├── Sanctions
    ├── PEP
    ├── Contentieux
    ├── Faillites
    ├── Enquêtes réglementaires
    └── Informations publiques défavorables

07. Propriété intellectuelle
    ├── Cession des inventions
    ├── Cession du code
    ├── Projets antérieurs
    ├── Obligations envers d’anciens employeurs
    └── Conflits de propriété intellectuelle

08. Relation avec l’entreprise
    ├── Contrat du fondateur
    ├── Rémunération
    ├── Vesting
    ├── Clauses de départ
    ├── Confidentialité
    ├── Non-sollicitation
    └── Engagement de temps

09. Gouvernance et comportement
    ├── Répartition des responsabilités
    ├── Relation entre cofondateurs
    ├── Processus de décision
    ├── Gestion des conflits
    ├── Historique des départs
    └── Plan de succession

10. Déclarations du fondateur
    ├── Questionnaire d’intégrité
    ├── Déclaration de conflits
    ├── Déclaration de litiges
    ├── Déclaration de participations
    ├── Confirmation d’exactitude
    └── Signature

11. Conclusions
    ├── Points confirmés
    ├── Points à clarifier
    ├── Risques identifiés
    ├── Mesures de mitigation
    ├── Conditions préalables
    └── Décision
```

Règles obligatoires :

- consentement explicite ;
- finalité visible ;
- accès nominatif ;
- permissions renforcées ;
- journal d’audit obligatoire ;
- révocation ;
- durée de conservation ;
- aucune exposition dans un dealroom ;
- aucun lien public ;
- aucune indexation externe.

---

# 7. Modèle Fusion-acquisition

```text
00. Présentation de la transaction
    ├── Teaser
    ├── Information memorandum
    ├── NDA
    ├── Lettre d’intention
    ├── Offre indicative
    ├── Exclusivité
    ├── Structure de transaction
    └── Calendrier

01. Société et groupe
    ├── Statuts
    ├── Immatriculations
    ├── Organigramme juridique
    ├── Filiales
    ├── Participations
    ├── Joint-ventures
    └── Bénéficiaires effectifs

02. Capital et titres
    ├── Cap table
    ├── Registre des actionnaires
    ├── Catégories de titres
    ├── Options et convertibles
    ├── Nantissements
    ├── Droits préférentiels
    └── Restrictions de transfert

03. Documents de transaction
    ├── Share Purchase Agreement
    ├── Asset Purchase Agreement
    ├── Disclosure schedules
    ├── Garanties d’actif et de passif
    ├── Escrow
    ├── Earn-out
    ├── Transition Services Agreement
    └── Conditions de closing

04. Finance
    ├── États financiers
    ├── Quality of earnings
    ├── Dette nette
    ├── Besoin en fonds de roulement
    ├── Trésorerie
    ├── Revenus
    ├── Marges
    ├── Prévisions
    ├── Engagements hors bilan
    └── Ajustements de prix

05. Fiscalité
    ├── Déclarations
    ├── Contrôles
    ├── Redressements
    ├── Passifs fiscaux
    ├── Prix de transfert
    ├── Retenues
    ├── TVA
    └── Structuration fiscale

06. Commercial
    ├── Clients principaux
    ├── Concentration du chiffre d’affaires
    ├── Contrats clients
    ├── Pipeline
    ├── Rétention
    ├── Politique tarifaire
    ├── Concurrence
    └── Marché

07. Opérations et actifs
    ├── Sites
    ├── Équipements
    ├── Stocks
    ├── Fournisseurs
    ├── Chaîne d’approvisionnement
    ├── Logistique
    ├── Immobilier
    └── Continuité d’activité

08. Produit, technologie et cybersécurité
    ├── Produits
    ├── Architecture
    ├── Code source
    ├── Dette technique
    ├── Hébergement
    ├── Sécurité
    ├── Incidents
    ├── Protection des données
    └── Plan de migration

09. Propriété intellectuelle
    ├── Marques
    ├── Brevets
    ├── Droits d’auteur
    ├── Domaines
    ├── Licences
    ├── Cessions
    └── Litiges

10. Ressources humaines
    ├── Effectifs
    ├── Salariés clés
    ├── Rémunérations
    ├── Avantages
    ├── Retraites
    ├── Contentieux sociaux
    ├── Plans de rétention
    ├── Changement de contrôle
    └── Restructuration envisagée

11. Contrats matériels
    ├── Clients
    ├── Fournisseurs
    ├── Partenaires
    ├── Distribution
    ├── Dette
    ├── Baux
    ├── Exclusivités
    ├── Résiliation
    └── Changement de contrôle

12. Réglementaire et concurrence
    ├── Licences
    ├── Agréments
    ├── Autorisations
    ├── Contrôle des concentrations
    ├── Investissement étranger
    ├── Protection des consommateurs
    └── Échanges avec les régulateurs

13. Conformité
    ├── Anti-corruption
    ├── AML/KYC
    ├── Sanctions
    ├── Protection des données
    ├── Alertes internes
    ├── Enquêtes
    └── Politiques internes

14. Contentieux et assurances
    ├── Litiges en cours
    ├── Litiges potentiels
    ├── Réclamations
    ├── Arbitrages
    ├── Polices d’assurance
    └── Sinistres

15. ESG et environnement
    ├── Permis environnementaux
    ├── Santé et sécurité
    ├── Incidents
    ├── Passifs environnementaux
    ├── Conditions de travail
    └── Plan d’action ESG

16. Intégration et séparation
    ├── Plan des 100 premiers jours
    ├── Synergies
    ├── Organisation cible
    ├── Systèmes à intégrer
    ├── Données à migrer
    ├── Services transitoires
    ├── Coûts d’intégration
    └── Risques d’exécution

17. Approbations et closing
    ├── Approbation du conseil
    ├── Approbation des actionnaires
    ├── Consentements contractuels
    ├── Autorisations réglementaires
    ├── Conditions préalables
    ├── Fonds de closing
    ├── Closing checklist
    └── Closing binder

18. Post-closing
    ├── Obligations restantes
    ├── Ajustement de prix
    ├── Earn-out
    ├── Indemnisation
    ├── Libération de l’escrow
    ├── Transfert des accès
    └── Suivi de l’intégration
```

---

# 8. Modèle de données recommandé

## `document_templates`

```sql
id uuid primary key
code text unique not null
name text not null
description text
operation_type text not null
version integer not null default 1
is_active boolean default true
created_at timestamptz default now()
updated_at timestamptz default now()
```

## `template_sections`

```sql
id uuid primary key
template_id uuid references document_templates(id) on delete cascade
parent_id uuid references template_sections(id) on delete cascade
code text not null
name text not null
description text
display_order integer not null
is_required boolean default false
is_active boolean default true
metadata jsonb
created_at timestamptz default now()
updated_at timestamptz default now()
```

## `template_requirements`

```sql
id uuid primary key
template_section_id uuid references template_sections(id) on delete cascade
code text not null
name text not null
description text
requirement_level text not null
document_type text
allowed_formats text[]
is_repeatable boolean default false
validation_rules jsonb
metadata jsonb
display_order integer not null
created_at timestamptz default now()
updated_at timestamptz default now()
```

Niveaux :

```text
required
recommended
conditional
optional
```

## `template_modules`

```sql
id uuid primary key
code text unique not null
name text not null
module_type text not null
description text
is_active boolean default true
created_at timestamptz default now()
updated_at timestamptz default now()
```

Types :

```text
core
operation
jurisdiction
funder
sector
custom
```

## `operation_template_configurations`

```sql
id uuid primary key
operation_id uuid not null
base_template_id uuid references document_templates(id)
selected_modules jsonb not null
generated_version integer not null
generated_at timestamptz default now()
created_at timestamptz default now()
updated_at timestamptz default now()
```

## `operation_requirements`

```sql
id uuid primary key
operation_id uuid not null
data_room_id uuid not null
template_requirement_id uuid references template_requirements(id)
section_id uuid
code text not null
name text not null
description text
requirement_level text not null
status text not null
source text not null
metadata jsonb
created_at timestamptz default now()
updated_at timestamptz default now()
```

Statuts :

```text
to_provide
in_progress
provided
not_applicable
waived
```

Sources :

```text
template
jurisdiction
funder
sector
custom
```

---

# 9. Moteur de génération

Créer un service central :

```text
/lib/templates/generate-operation-structure.ts
```

Entrée :

```ts
type GenerateOperationStructureInput = {
  operationId: string
  operationType: string
  countryCode?: string
  jurisdictionCode?: string
  funderType?: string
  sectorCode?: string
  selectedTemplateCode?: string
  customModules?: string[]
}
```

Ordre d’application :

```text
1. socle commun
2. module opération
3. module juridiction
4. module financeur
5. module secteur
6. personnalisation utilisateur
```

Sortie :

```ts
type GeneratedOperationStructure = {
  folders: GeneratedFolder[]
  requirements: GeneratedRequirement[]
  appliedModules: AppliedModule[]
  warnings: string[]
}
```

Chaque exigence doit conserver sa source.

---

# 10. Règles de fusion

1. une personnalisation de l’organisation prime ;
2. une exigence réglementaire ne peut pas être supprimée silencieusement ;
3. le module juridiction prime sur le socle commun ;
4. le module financeur peut renforcer une exigence ;
5. le module secteur peut ajouter des exigences ;
6. ne jamais dupliquer une même exigence ;
7. conserver toutes les sources et renforcements.

Exemple :

```text
États financiers
Source initiale : socle commun
Renforcé par : DFI
Période demandée : 3 exercices
Niveau : obligatoire
```

---

# 11. Expérience utilisateur

Lors de la création d’une opération :

```text
1. type d’opération
2. pays ou juridiction
3. type de financeur
4. secteur
5. prévisualisation
6. génération
```

Prévisualisation :

```text
Structure recommandée

13 dossiers
48 exigences obligatoires
21 exigences recommandées

Modules appliqués
- Levée de fonds
- OHADA
- Fonds VC
- Fintech
```

Actions :

```text
Créer cette structure
Personnaliser
Retour
```

Après génération :

```text
Votre structure documentaire est prête

48 exigences obligatoires
21 exigences recommandées
0 pièce déposée
```

Ne jamais utiliser « dossier incomplet » comme jugement.

---

# 12. Personnalisation

L’utilisateur peut :

- ajouter un dossier ;
- renommer ;
- déplacer ;
- ajouter une exigence ;
- marquer une exigence non applicable ;
- ajouter une note ;
- associer une pièce.

Une personnalisation d’opération ne doit jamais modifier le modèle global.

---

# 13. Permissions spécifiques

## Levée

Permissions classiques par investisseur ou groupe.

## Board Due Diligence

Accès limité aux administrateurs, secrétariat du conseil, auditeurs et parties autorisées.

## Founder Due Diligence

- accès nominatif ;
- permissions renforcées ;
- audit obligatoire ;
- aucun partage public ;
- aucune apparition dans un dealroom.

## M&A

Prévoir :

- clean teams ;
- groupes d’acheteurs ;
- conseils juridiques ;
- conseils financiers ;
- accès par phase ;
- dossiers restreints ;
- journal renforcé.

---

# 14. Administration

Créer une interface permettant de :

- créer un modèle ;
- créer une version ;
- ajouter un dossier ;
- ajouter une exigence ;
- définir un niveau ;
- ajouter une juridiction ;
- ajouter un module financeur ;
- ajouter un module secteur ;
- prévisualiser ;
- publier ;
- désactiver ;
- comparer deux versions.

Ne jamais modifier rétroactivement une opération existante sans action explicite.

---

# 15. Versioning

Lorsqu’une opération est créée :

- enregistrer la version utilisée ;
- ne pas mettre à jour automatiquement ;
- proposer une mise à jour ;
- afficher les différences ;
- permettre d’accepter ou refuser.

Exemple :

```text
Une nouvelle version du modèle Levée OHADA est disponible.

3 nouvelles exigences
1 exigence renommée
0 suppression automatique
```

---

# 16. Seed

Créer :

```text
/supabase/seed/document-templates.sql
```

Le seed doit contenir :

- les quatre modèles ;
- le socle commun ;
- les sections ;
- les exigences ;
- les modules initiaux ;
- les niveaux ;
- les ordres.

Ne pas dépendre uniquement de Supabase Studio.

---

# 17. Fichiers recommandés

```text
/lib/templates/
  generate-operation-structure.ts
  merge-template-modules.ts
  resolve-template.ts
  template-types.ts
  template-validation.ts
  template-versioning.ts

/components/templates/
  template-preview.tsx
  template-section-tree.tsx
  requirement-list.tsx
  requirement-badge.tsx
  module-summary.tsx
  template-version-diff.tsx

/app/operations/new/
  template-selection/
  template-preview/

/app/admin/templates/
```

Adapter les chemins à l’architecture réelle.

---

# 18. API interne

```text
GET    /api/templates
GET    /api/templates/[code]
POST   /api/templates/preview
POST   /api/templates/generate
POST   /api/templates/customize
GET    /api/templates/versions
POST   /api/templates/upgrade
```

Le serveur doit recalculer la structure.

Ne jamais faire confiance à un arbre complet envoyé par le frontend.

---

# 19. Sécurité

- modèles globaux modifiables uniquement par les administrateurs Sanza ;
- personnalisations isolées par workspace ;
- opérations isolées par RLS ;
- Founder DD avec permissions renforcées ;
- journaux d’audit non modifiables ;
- vérification serveur de l’appartenance à l’opération ;
- aucune donnée personnelle sensible exposée publiquement.

---

# 20. Tests

## Unitaires

- fusion du socle et du module opération ;
- ajout d’une juridiction ;
- ajout d’un financeur ;
- déduplication ;
- priorité des règles ;
- ordre des dossiers ;
- versioning ;
- exigences conditionnelles.

## Intégration

- création Levée ;
- création Board DD ;
- création Founder DD ;
- création M&A ;
- personnalisation ;
- duplication de structure ;
- upgrade de version ;
- refus d’upgrade.

## Sécurité

- accès à un modèle non publié ;
- modification non autorisée ;
- accès à une autre organisation ;
- accès Founder DD non autorisé ;
- tentative de modification du journal.

---

# 21. Critères d’acceptation

Le travail est conforme lorsque :

- les quatre modèles existent ;
- les modèles sont versionnés ;
- la génération est faite côté serveur ;
- les modules sont composables ;
- les exigences ne sont pas dupliquées ;
- chaque exigence conserve sa source ;
- une opération conserve sa version ;
- aucune mise à jour n’est automatique ;
- Founder DD a des permissions renforcées ;
- M&A supporte plusieurs groupes ;
- l’utilisateur peut personnaliser son opération ;
- l’administration peut publier une version ;
- migrations et seeds sont versionnés ;
- aucun arbre n’est codé en dur dans les composants.

---

# 22. Ordre d’implémentation

## Phase 1 — Audit

Avant de coder :

1. analyser les tables actuelles ;
2. identifier les structures codées en dur ;
3. identifier les routes ;
4. proposer la migration ;
5. lister les fichiers impactés ;
6. signaler les risques.

## Phase 2 — Fondation

1. migrations ;
2. tables de modèles ;
3. modules ;
4. versioning ;
5. seed ;
6. types ;
7. moteur de génération ;
8. tests unitaires.

## Phase 3 — Expérience de création

1. sélection du type ;
2. juridiction ;
3. financeur ;
4. secteur ;
5. prévisualisation ;
6. génération ;
7. personnalisation.

## Phase 4 — Administration

1. liste ;
2. édition ;
3. versioning ;
4. comparaison ;
5. publication.

## Phase 5 — Permissions avancées

1. Founder DD ;
2. Board DD ;
3. clean teams M&A ;
4. audit renforcé.

---

# 23. Instruction finale à Claude Code

Commencer par auditer l’existant.

Ne pas intégrer les structures comme quatre objets statiques dans le frontend.

Construire un moteur documentaire configurable, versionné et composable.

Avant de modifier le code, présenter :

1. l’état actuel ;
2. les hypothèses ;
3. les tables impactées ;
4. la stratégie de migration ;
5. le modèle final ;
6. les risques ;
7. l’ordre d’implémentation.

Après validation, implémenter d’abord le socle commun et le moteur de génération, puis les quatre modèles.
