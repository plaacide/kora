# SANZA — Architecture Pricing, Plans & Entitlements

**Document d’implémentation destiné à Claude Code**  
**Version : 1.1 — 29 juillet 2026**

---


> **Révision tarifaire — version 1.1 :** tous les prix commerciaux présentés dans ce document ont été réduits de **25 %** par rapport à la version initiale. Les fonctionnalités, limites d’usage et principes d’architecture restent inchangés.

---

## 1. Objectif du document

Ce document définit l’architecture produit et technique nécessaire pour intégrer dans Sanza :

- la segmentation des clients ;
- les plans tarifaires ;
- les fonctionnalités incluses dans chaque plan ;
- les limites d’usage ;
- les règles d’upgrade et de downgrade ;
- la gestion des abonnements ;
- la gestion des droits par fonctionnalité ;
- la structure des écrans de tarification ;
- la structure Supabase ;
- les règles de sécurité et de contrôle d’accès.

L’objectif n’est pas seulement de créer un écran de pricing.

L’objectif est de construire un système d’abonnement robuste, configurable et évolutif qui pourra être utilisé dans tout Sanza sans dupliquer les règles métier dans chaque écran.

---

# 2. Principe produit central

Sanza sert trois catégories de clients différentes.

Chaque catégorie achète une valeur différente et doit donc disposer de ses propres plans, limites et messages commerciaux.

## 2.1 Entreprises

Cibles :

- startups ;
- PME ;
- entreprises en recherche de financement ;
- fondateurs ;
- équipes financières ou administratives.

Valeur achetée :

- préparation au financement ;
- organisation des documents ;
- création d’une data room ;
- partage sécurisé ;
- suivi des investisseurs ;
- accompagnement pendant la diligence.

## 2.2 Programmes d’accompagnement

Cibles :

- incubateurs ;
- accélérateurs ;
- ONG ;
- fondations ;
- agences publiques ;
- programmes financés par des bailleurs ;
- cabinets accompagnant plusieurs entreprises.

Valeur achetée :

- gestion d’une cohorte ;
- suivi de plusieurs entreprises ;
- standardisation des documents ;
- suivi du niveau de préparation ;
- collecte de données ;
- reporting consolidé.

## 2.3 Financeurs

Cibles :

- fonds de capital-risque ;
- fonds d’impact ;
- banques ;
- institutions financières ;
- institutions de développement ;
- agences de financement ;
- programmes de subventions.

Valeur achetée :

- collecte des dossiers ;
- conduite de la diligence ;
- analyse des entreprises ;
- affectation des analystes ;
- préparation des décisions ;
- piste d’audit ;
- suivi des entreprises financées.

---

# 3. Architecture commerciale

La page de tarification doit contenir trois onglets principaux :

1. **Entreprises**
2. **Programmes**
3. **Financeurs**

Chaque onglet affiche uniquement les plans correspondant à la cible sélectionnée.

Ne pas afficher les neuf plans simultanément sur une seule page.

---

# 4. Plans pour les entreprises

## 4.1 Plan Ready

**Code interne :** `business_ready`  
**Prix mensuel :** 0 FCFA  
**Prix annuel :** 0 FCFA  
**Objectif :** permettre à une entreprise de commencer sa préparation.

### Fonctionnalités

- création du profil entreprise ;
- diagnostic de préparation au financement ;
- score de readiness ;
- checklist générale ;
- structure de data room préconfigurée ;
- dépôt de documents ;
- suivi des documents manquants ;
- partage limité du pitch deck ;
- accès limité aux modèles ;
- une opération en mode préparation ;
- historique d’activité basique.

### Limites

- 1 utilisateur interne ;
- 1 opération en préparation ;
- 1 Go de stockage ;
- 5 visiteurs externes maximum ;
- pas de NDA automatisé ;
- pas de permissions granulaires ;
- pas de journal d’audit exportable ;
- pas de pipeline investisseurs complet ;
- pas de personnalisation avancée.

---

## 4.2 Plan Raise

**Code interne :** `business_raise`  
**Prix mensuel :** 21 750 FCFA  
**Prix annuel :** 217 500 FCFA  
**Badge :** Recommandé  
**Objectif :** gérer une levée ou une opération de financement active.

### Fonctionnalités

Toutes les fonctionnalités de Ready, plus :

- une opération de financement active ;
- checklist adaptée au pays ;
- checklist adaptée au type de financeur ;
- data room complète ;
- visiteurs externes illimités ;
- vérification des adresses électroniques ;
- NDA avant accès ;
- expiration des accès ;
- contrôle des téléchargements ;
- filigrane standard ;
- demandes de documents ;
- indexation automatique ;
- gestion des versions ;
- notifications d’ouverture ;
- suivi des consultations ;
- pipeline investisseurs ;
- tâches et prochaines étapes ;
- logo et identité visuelle de l’entreprise ;
- modèles de dossiers adaptés au financement recherché.

### Limites

- 3 utilisateurs internes ;
- 1 opération active ;
- 10 Go de stockage ;
- permissions au niveau de la data room et des dossiers ;
- pas de permissions avancées document par document ;
- pas de comparaison avancée entre investisseurs ;
- pas de workflow interne de validation complexe.

---

## 4.3 Plan Close

**Code interne :** `business_close`  
**Prix mensuel :** 59 250 FCFA  
**Prix annuel :** 592 500 FCFA  
**Objectif :** gérer plusieurs diligences ou transactions complexes.

### Fonctionnalités

Toutes les fonctionnalités de Raise, plus :

- trois opérations actives ;
- permissions par groupe ;
- permissions par dossier ;
- permissions par document ;
- groupes d’investisseurs ;
- filigrane dynamique nominatif ;
- journal d’audit complet ;
- export du journal d’audit ;
- espace questions-réponses ;
- analytique avancée ;
- comparaison de l’engagement des investisseurs ;
- workflows de diligence ;
- validation interne des documents ;
- modèles juridiques avancés ;
- modèles OHADA ;
- modèles Ghana ;
- modèles Nigeria ;
- support prioritaire ;
- accompagnement initial à la configuration.

### Limites

- 8 utilisateurs internes ;
- 3 opérations actives ;
- 50 Go de stockage.

---

# 5. Plans pour les programmes

## 5.1 Plan Cohort

**Code interne :** `program_cohort`  
**Prix indicatif :** 1 125 000 FCFA par cohorte  
**Durée incluse :** 6 mois  
**Objectif :** gérer une cohorte unique.

### Fonctionnalités

- 25 espaces entreprises ;
- fonctionnalités Raise pour chaque entreprise ;
- onboarding groupé ;
- invitations en masse ;
- checklist commune ;
- jalons et échéances ;
- demandes documentaires groupées ;
- tableau de bord de préparation ;
- score de readiness par entreprise ;
- commentaires des équipes programme ;
- affectation des entreprises aux experts ;
- suivi des pièces manquantes ;
- export Excel ;
- export PDF ;
- rapport de fin de cohorte.

### Limites

- 25 entreprises actives ;
- 5 utilisateurs programme ;
- 1 cohorte ;
- 1 programme ;
- 6 mois.

---

## 5.2 Plan Portfolio

**Code interne :** `program_portfolio`  
**Prix indicatif :** 4 125 000 FCFA par an  
**Objectif :** gérer plusieurs cohortes et un portefeuille d’entreprises.

### Fonctionnalités

Toutes les fonctionnalités de Cohort, plus :

- jusqu’à 100 entreprises actives ;
- plusieurs cohortes ;
- plusieurs programmes ;
- plusieurs pays ;
- modèles de diligence personnalisés ;
- segmentation des entreprises ;
- comparaison entre cohortes ;
- historique des progrès ;
- tableau de bord consolidé ;
- indicateurs par sexe ;
- indicateurs par secteur ;
- indicateurs par pays ;
- indicateurs par maturité ;
- campagnes de demandes documentaires ;
- rôles avancés ;
- portail personnalisé ;
- exports automatisés ;
- rapports partenaires et bailleurs.

### Limites

- 100 entreprises actives ;
- 15 utilisateurs programme ;
- stockage mutualisé configurable ;
- nombre de programmes configurable.

---

## 5.3 Plan Network

**Code interne :** `program_network`  
**Prix indicatif :** à partir de 9 000 000 FCFA par an  
**Type de vente :** devis  
**Objectif :** répondre aux besoins des grands programmes multi-pays.

### Fonctionnalités

Toutes les fonctionnalités de Portfolio, plus :

- volume d’entreprises personnalisé ;
- environnements séparés par pays ;
- marque blanche ;
- authentification unique ;
- intégrations CRM ;
- intégrations avec les outils de suivi-évaluation ;
- API ;
- modèles spécifiques au bailleur ;
- exigences de sécurité personnalisées ;
- accompagnement au déploiement ;
- formation des équipes ;
- gestionnaire de compte dédié ;
- engagement de niveau de service ;
- support prioritaire institutionnel.

---

# 6. Plans pour les financeurs

## 6.1 Plan Diligence

**Code interne :** `funder_diligence`  
**Prix indicatif :** 3 375 000 FCFA par an  
**Objectif :** centraliser et conduire les diligences.

### Fonctionnalités

- portail de réception des entreprises ;
- pipeline des opportunités ;
- création de listes de documents ;
- modèles selon le type de financement ;
- invitations des entreprises ;
- collecte sécurisée ;
- suivi des pièces reçues ;
- demandes de clarification ;
- questions-réponses ;
- affectation des dossiers ;
- notes internes ;
- statut de diligence ;
- permissions par membre ;
- journal d’audit ;
- export du dossier final ;
- tableau de bord du pipeline.

### Limites

- 75 dossiers par an ;
- 10 utilisateurs internes ;
- 1 entité ou véhicule ;
- 1 environnement principal.

---

## 6.2 Plan Capital Operations

**Code interne :** `funder_capital_ops`  
**Prix indicatif :** 9 000 000 FCFA par an  
**Objectif :** gérer plusieurs véhicules, programmes et processus d’investissement.

### Fonctionnalités

Toutes les fonctionnalités de Diligence, plus :

- plusieurs véhicules ;
- plusieurs programmes ;
- diligence juridique ;
- diligence financière ;
- diligence fiscale ;
- diligence opérationnelle ;
- workflows de validation ;
- comité d’investissement ;
- préparation des notes d’investissement ;
- scoring personnalisé ;
- modèles par pays ;
- gestion des conflits d’intérêts ;
- suivi des conditions préalables ;
- suivi des décaissements ;
- suivi post-investissement ;
- collecte périodique de rapports ;
- tableaux de bord portefeuille ;
- exports vers les outils internes ;
- API.

### Limites

- 300 dossiers par an ;
- 25 utilisateurs internes ;
- plusieurs véhicules ;
- plusieurs pays.

---

## 6.3 Plan Institution

**Code interne :** `funder_institution`  
**Prix indicatif :** à partir de 18 750 000 FCFA par an  
**Type de vente :** devis  
**Objectif :** répondre aux exigences des banques, institutions de développement et grands financeurs.

### Fonctionnalités

Toutes les fonctionnalités de Capital Operations, plus :

- authentification unique ;
- environnement privé ;
- rôles personnalisés ;
- politiques de sécurité personnalisées ;
- intégrations avec les systèmes bancaires ;
- intégrations CRM ;
- résidence des données négociée ;
- workflows de conformité spécifiques ;
- pistes d’audit renforcées ;
- rapports réglementaires ;
- migration de données ;
- support institutionnel ;
- formation ;
- gestionnaire de compte dédié ;
- engagement contractuel de disponibilité.

---

# 7. Principes d’architecture obligatoires

## 7.1 Ne pas coder les droits directement dans les composants

Interdiction d’écrire dans les composants des règles telles que :

```ts
if (plan === "raise") {
  // show feature
}
```

Toute vérification doit passer par une couche centralisée d’entitlements.

Exemple :

```ts
canUseFeature(workspaceId, "dynamic_watermark")
checkLimit(workspaceId, "active_deals")
getPlanEntitlements(planCode)
```

---

## 7.2 Séparer les concepts suivants

Le système doit distinguer :

- le type de client ;
- le plan ;
- l’abonnement ;
- la facturation ;
- les fonctionnalités ;
- les limites ;
- l’usage réel ;
- les options supplémentaires ;
- les permissions utilisateurs.

Ces concepts ne doivent pas être fusionnés dans une seule table.

---

## 7.3 Les visiteurs externes ne sont jamais facturés

Une entreprise ou une institution paie pour son espace de travail.

Les investisseurs, experts, partenaires, membres de comité ou visiteurs invités ne doivent pas être obligés de payer pour consulter les documents.

Le système doit donc distinguer :

- utilisateurs internes ;
- utilisateurs externes ;
- invités ;
- visiteurs anonymes autorisés ;
- membres d’une équipe ;
- administrateurs.

---

# 8. Modèle de données Supabase recommandé

## 8.1 Table `customer_segments`

```sql
id uuid primary key
code text unique not null
name text not null
description text
created_at timestamptz default now()
updated_at timestamptz default now()
```

Valeurs :

- `business`
- `program`
- `funder`

---

## 8.2 Table `plans`

```sql
id uuid primary key
segment_id uuid references customer_segments(id)
code text unique not null
name text not null
description text
billing_type text not null
is_free boolean default false
is_custom_pricing boolean default false
is_active boolean default true
display_order integer default 0
badge text
created_at timestamptz default now()
updated_at timestamptz default now()
```

Valeurs possibles pour `billing_type` :

- `monthly`
- `annual`
- `cohort`
- `custom`

---

## 8.3 Table `plan_prices`

```sql
id uuid primary key
plan_id uuid references plans(id) on delete cascade
currency text not null default 'XOF'
billing_interval text not null
unit_amount bigint
billing_period_count integer default 1
country_code text
is_active boolean default true
effective_from timestamptz
effective_to timestamptz
created_at timestamptz default now()
updated_at timestamptz default now()
```

Ne jamais stocker les montants en nombre décimal.

Pour le FCFA, stocker le montant entier.

Exemple :

```txt
21750
```

---

## 8.4 Table `features`

```sql
id uuid primary key
code text unique not null
name text not null
description text
category text
value_type text not null
created_at timestamptz default now()
updated_at timestamptz default now()
```

Valeurs possibles pour `value_type` :

- `boolean`
- `integer`
- `string`
- `json`

Exemples de codes :

- `readiness_assessment`
- `country_checklists`
- `nda_gating`
- `dynamic_watermark`
- `audit_log`
- `advanced_analytics`
- `investor_pipeline`
- `q_and_a`
- `custom_branding`
- `api_access`
- `sso`
- `white_label`
- `priority_support`

---

## 8.5 Table `plan_entitlements`

```sql
id uuid primary key
plan_id uuid references plans(id) on delete cascade
feature_id uuid references features(id) on delete cascade
is_enabled boolean default false
limit_value integer
config jsonb
created_at timestamptz default now()
updated_at timestamptz default now()
unique(plan_id, feature_id)
```

Exemples :

```json
{
  "feature": "active_deals",
  "is_enabled": true,
  "limit_value": 1
}
```

```json
{
  "feature": "external_visitors",
  "is_enabled": true,
  "limit_value": null,
  "config": {
    "unlimited": true
  }
}
```

---

## 8.6 Table `subscriptions`

```sql
id uuid primary key
workspace_id uuid not null
plan_id uuid references plans(id)
status text not null
billing_interval text
current_period_start timestamptz
current_period_end timestamptz
trial_start timestamptz
trial_end timestamptz
cancel_at_period_end boolean default false
external_customer_id text
external_subscription_id text
created_at timestamptz default now()
updated_at timestamptz default now()
```

Valeurs possibles pour `status` :

- `trialing`
- `active`
- `past_due`
- `paused`
- `cancelled`
- `expired`
- `pending`
- `manual_contract`

---

## 8.7 Table `subscription_addons`

```sql
id uuid primary key
subscription_id uuid references subscriptions(id) on delete cascade
addon_code text not null
quantity integer default 1
unit_amount bigint
currency text default 'XOF'
starts_at timestamptz
ends_at timestamptz
created_at timestamptz default now()
updated_at timestamptz default now()
```

Exemples d’options :

- utilisateur interne supplémentaire ;
- entreprise supplémentaire ;
- stockage supplémentaire ;
- cohorte supplémentaire ;
- dossier supplémentaire ;
- marque blanche ;
- onboarding premium.

---

## 8.8 Table `usage_counters`

```sql
id uuid primary key
workspace_id uuid not null
feature_code text not null
period_start timestamptz not null
period_end timestamptz not null
used_value bigint default 0
updated_at timestamptz default now()
unique(workspace_id, feature_code, period_start, period_end)
```

Exemples :

- nombre d’opérations actives ;
- nombre d’entreprises actives ;
- nombre de dossiers analysés ;
- nombre d’utilisateurs internes ;
- stockage utilisé ;
- nombre de signatures ;
- nombre de rapports générés.

---

## 8.9 Table `billing_events`

```sql
id uuid primary key
workspace_id uuid
subscription_id uuid references subscriptions(id)
event_type text not null
provider text
external_event_id text
payload jsonb
processed_at timestamptz
created_at timestamptz default now()
unique(provider, external_event_id)
```

Cette table doit assurer l’idempotence des webhooks.

---

## 8.10 Table `invoices`

```sql
id uuid primary key
workspace_id uuid not null
subscription_id uuid references subscriptions(id)
invoice_number text unique
status text not null
currency text default 'XOF'
subtotal bigint
discount_amount bigint default 0
tax_amount bigint default 0
total_amount bigint
due_at timestamptz
paid_at timestamptz
external_invoice_id text
invoice_url text
created_at timestamptz default now()
updated_at timestamptz default now()
```

---

# 9. Relations avec les workspaces

Chaque organisation Sanza doit être rattachée à un workspace.

Le workspace doit contenir au minimum :

```sql
id uuid primary key
name text not null
slug text unique not null
segment_code text not null
owner_user_id uuid not null
country_code text
legal_name text
created_at timestamptz default now()
updated_at timestamptz default now()
```

Le `segment_code` détermine l’expérience de base :

- `business`
- `program`
- `funder`

Le plan ne doit pas être stocké directement dans le workspace.

Le plan actif doit être obtenu à travers la table `subscriptions`.

---

# 10. Service central d’entitlements

Créer un service unique.

Chemin suggéré :

```txt
/v2/lib/billing/entitlements.ts
```

Fonctions minimales :

```ts
getWorkspaceSubscription(workspaceId)
getWorkspacePlan(workspaceId)
getPlanEntitlements(planCode)
getWorkspaceEntitlements(workspaceId)
hasFeature(workspaceId, featureCode)
getFeatureLimit(workspaceId, featureCode)
getFeatureUsage(workspaceId, featureCode)
canConsume(workspaceId, featureCode, quantity)
consumeUsage(workspaceId, featureCode, quantity)
```

Créer également :

```txt
/v2/lib/billing/plan-catalog.ts
/v2/lib/billing/usage.ts
/v2/lib/billing/pricing.ts
/v2/lib/billing/types.ts
```

---

# 11. Hook React

Créer un hook central :

```txt
/v2/hooks/use-entitlements.ts
```

Exemple :

```ts
const {
  plan,
  subscription,
  entitlements,
  hasFeature,
  getLimit,
  usage,
  canUse,
  isLoading,
} = useEntitlements(workspaceId)
```

Ne pas refaire des requêtes séparées dans chaque composant.

---

# 12. Composants UI requis

## 12.1 Page principale

Route suggérée :

```txt
/v2/settings/billing
```

Sections :

- plan actuel ;
- date de renouvellement ;
- statut de l’abonnement ;
- usage actuel ;
- changement de plan ;
- historique de facturation ;
- méthode de paiement ;
- options supplémentaires ;
- annulation.

---

## 12.2 Modal de changement de plan

Créer une modal similaire à la référence visuelle transmise, mais adaptée à Sanza.

Structure :

- titre ;
- onglets mensuel / annuel lorsque disponible ;
- cartes de plans ;
- badge plan actuel ;
- badge recommandé ;
- liste des fonctions ;
- panneau latéral de résumé ;
- détails de la facturation ;
- montant dû aujourd’hui ;
- bouton de confirmation ;
- lien vers la comparaison complète.

Le panneau latéral doit changer selon la cible.

### Entreprise

Afficher :

- nombre d’utilisateurs internes ;
- nombre d’opérations actives ;
- montant mensuel ou annuel ;
- économie annuelle ;
- montant dû aujourd’hui.

### Programme

Afficher :

- nombre d’entreprises ;
- nombre de cohortes ;
- durée ;
- utilisateurs programme ;
- prix contractuel.

### Financeur

Afficher :

- nombre de dossiers annuels ;
- nombre d’analystes ;
- nombre de véhicules ;
- durée du contrat ;
- prix contractuel.

---

## 12.3 Composants à créer

```txt
/v2/components/billing/pricing-tabs.tsx
/v2/components/billing/plan-card.tsx
/v2/components/billing/plan-feature-list.tsx
/v2/components/billing/plan-comparison.tsx
/v2/components/billing/change-plan-modal.tsx
/v2/components/billing/billing-summary-panel.tsx
/v2/components/billing/current-plan-card.tsx
/v2/components/billing/usage-meter.tsx
/v2/components/billing/addon-selector.tsx
/v2/components/billing/invoice-list.tsx
/v2/components/billing/payment-method-card.tsx
/v2/components/billing/upgrade-gate.tsx
/v2/components/billing/feature-lock.tsx
```

---

# 13. Gating des fonctionnalités

Créer deux composants réutilisables.

## 13.1 `FeatureLock`

```tsx
<FeatureLock
  feature="dynamic_watermark"
  fallback="upgrade"
>
  <DynamicWatermarkSettings />
</FeatureLock>
```

## 13.2 `UpgradeGate`

```tsx
<UpgradeGate
  feature="advanced_analytics"
  title="Débloquez l’analytique avancée"
  description="Comparez l’engagement de vos investisseurs."
>
  <AnalyticsDashboard />
</UpgradeGate>
```

Ne pas masquer silencieusement toutes les fonctionnalités.

Selon le contexte, une fonctionnalité non incluse peut être :

- visible mais verrouillée ;
- remplacée par un message d’upgrade ;
- totalement cachée lorsque sa présence créerait de la confusion.

---

# 14. Règles d’upgrade

## 14.1 Upgrade immédiat

Lorsqu’un client passe vers un plan supérieur :

- appliquer le nouveau plan immédiatement ;
- recalculer le prorata si nécessaire ;
- mettre à jour les droits après confirmation du paiement ;
- conserver les données existantes ;
- enregistrer l’événement ;
- envoyer une confirmation.

## 14.2 Upgrade depuis un essai

Lorsqu’un client en période d’essai souscrit :

- terminer l’essai ;
- activer le plan choisi ;
- conserver tous les contenus ;
- lancer la période payante ;
- afficher une confirmation claire.

---

# 15. Règles de downgrade

Le downgrade ne doit pas supprimer automatiquement des données.

Exemple :

Une entreprise dispose de trois opérations actives et passe du plan Close au plan Raise.

Le système doit :

- conserver les trois opérations ;
- empêcher la création d’une nouvelle opération ;
- demander à l’utilisateur d’archiver deux opérations ;
- limiter l’accès aux fonctions premium après la date effective ;
- conserver les journaux d’audit existants en lecture seule ;
- ne jamais supprimer un fichier sans validation explicite.

Le downgrade prend effet à la fin de la période déjà payée, sauf intervention administrative.

---

# 16. Règles en cas d’impayé

Statut `past_due` :

- afficher une alerte ;
- laisser une période de grâce ;
- empêcher les nouvelles actions sensibles après la période de grâce ;
- conserver l’accès en lecture ;
- ne pas supprimer les données.

Après expiration :

- workspace en lecture seule ;
- documents conservés selon la politique de rétention ;
- possibilité de réactivation.

---

# 17. Essais gratuits

## Entreprises

Proposition :

- essai de 14 jours du plan Raise ;
- aucune carte obligatoire au départ ;
- retour automatique au plan Ready à la fin de l’essai ;
- conservation des données ;
- fonctions premium verrouillées après l’essai.

## Programmes et financeurs

Pas d’essai libre automatique.

Prévoir :

- démonstration ;
- pilote ;
- contrat manuel ;
- activation par administrateur.

---

# 18. Paiements et contrats

L’architecture doit permettre plusieurs modes :

- paiement en ligne ;
- virement bancaire ;
- facture manuelle ;
- contrat annuel ;
- contrat par cohorte ;
- activation administrative ;
- code promotionnel ;
- remise négociée.

Ne pas dépendre exclusivement d’un seul prestataire de paiement.

Créer une abstraction :

```ts
interface BillingProvider {
  createCustomer()
  createCheckoutSession()
  createSubscription()
  cancelSubscription()
  updateSubscription()
  getInvoice()
  handleWebhook()
}
```

Prestataires potentiels :

- Stripe ;
- PayDunya ;
- CinetPay ;
- Flutterwave ;
- paiement manuel ;
- virement bancaire.

---

# 19. Sécurité Supabase et RLS

Toutes les tables de facturation doivent avoir des politiques RLS.

## Utilisateur standard

Peut lire :

- son abonnement ;
- son plan ;
- ses factures ;
- son usage ;
- ses options.

Ne peut pas :

- modifier le prix ;
- changer directement son plan dans la base ;
- modifier ses droits ;
- modifier une facture ;
- modifier les événements de paiement.

## Administrateur Sanza

Peut :

- gérer les plans ;
- gérer les prix ;
- modifier les entitlements ;
- activer un contrat manuel ;
- ajouter une remise ;
- suspendre un abonnement ;
- consulter les événements.

Toutes les actions sensibles doivent passer par :

- une Edge Function ;
- une API serveur ;
- ou une action serveur sécurisée.

---

# 20. Edge Functions recommandées

```txt
supabase/functions/create-checkout-session
supabase/functions/change-subscription
supabase/functions/cancel-subscription
supabase/functions/resume-subscription
supabase/functions/billing-webhook
supabase/functions/create-manual-contract
supabase/functions/recalculate-usage
supabase/functions/generate-invoice
```

Chaque fonction doit :

- vérifier l’utilisateur ;
- vérifier son rôle ;
- vérifier le workspace ;
- être idempotente ;
- journaliser les actions ;
- ne jamais faire confiance au prix envoyé par le frontend.

---

# 21. Catalogue des fonctionnalités

Créer un catalogue initial structuré par catégorie.

## Préparation

- `company_profile`
- `readiness_assessment`
- `readiness_score`
- `general_checklist`
- `country_checklists`
- `funder_specific_checklists`
- `document_templates`

## Data room

- `data_room`
- `document_upload`
- `automatic_indexing`
- `document_versioning`
- `folder_permissions`
- `document_permissions`
- `download_controls`
- `nda_gating`
- `email_verification`
- `access_expiration`
- `standard_watermark`
- `dynamic_watermark`
- `screenshot_protection`
- `q_and_a`
- `audit_log`
- `audit_log_export`

## Financement

- `fundraising_operation`
- `investor_pipeline`
- `investor_tracking`
- `tasks`
- `next_steps`
- `engagement_analytics`
- `advanced_analytics`
- `investor_comparison`

## Programmes

- `cohort_management`
- `portfolio_management`
- `bulk_invites`
- `bulk_document_requests`
- `company_assignment`
- `cohort_comparison`
- `consolidated_reporting`
- `program_branding`
- `multi_country`
- `white_label`

## Financeurs

- `application_portal`
- `deal_pipeline`
- `diligence_workflow`
- `analyst_assignment`
- `internal_notes`
- `investment_committee`
- `investment_memo`
- `custom_scoring`
- `conditions_precedent`
- `disbursement_tracking`
- `portfolio_monitoring`
- `periodic_reporting`

## Institutionnel

- `api_access`
- `sso`
- `custom_security_policies`
- `data_residency`
- `sla`
- `dedicated_account_manager`
- `custom_integrations`

---

# 22. Seed initial des plans

Créer un fichier de seed versionné :

```txt
supabase/seed/billing-plans.sql
```

Ce fichier doit créer :

- les trois segments ;
- les neuf plans ;
- les prix ;
- les fonctionnalités ;
- les entitlements ;
- les limites.

Ne pas créer les données manuellement uniquement depuis Supabase Studio.

---

# 23. Configuration frontend

Créer une configuration lisible par le frontend.

```txt
/v2/config/billing/plan-display.ts
```

Cette configuration peut contenir :

- textes marketing ;
- ordre d’affichage ;
- badge ;
- sous-titre ;
- liste courte des points forts ;
- CTA ;
- couleur ou variante visuelle.

Les droits et limites réels doivent rester dans la base.

Le frontend ne doit jamais utiliser la configuration d’affichage comme source de vérité pour autoriser une action.

---

# 24. API interne

Routes suggérées :

```txt
GET    /api/billing/plans
GET    /api/billing/subscription
GET    /api/billing/entitlements
GET    /api/billing/usage
GET    /api/billing/invoices
POST   /api/billing/checkout
POST   /api/billing/change-plan
POST   /api/billing/cancel
POST   /api/billing/resume
POST   /api/billing/addons
```

Réponses normalisées :

```ts
type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
}
```

---

# 25. États UX obligatoires

Prévoir les états suivants :

- chargement ;
- aucun abonnement ;
- essai en cours ;
- abonnement actif ;
- paiement en attente ;
- paiement échoué ;
- contrat manuel ;
- annulation programmée ;
- plan expiré ;
- changement de plan en cours ;
- erreur réseau ;
- erreur fournisseur de paiement ;
- limite atteinte ;
- fonctionnalité non disponible.

---

# 26. Analytics produit

Événements à suivre :

```txt
pricing_viewed
segment_tab_changed
billing_interval_changed
plan_selected
upgrade_started
upgrade_completed
upgrade_failed
downgrade_started
downgrade_completed
trial_started
trial_expired
feature_locked_viewed
upgrade_cta_clicked
usage_limit_reached
invoice_downloaded
subscription_cancelled
subscription_resumed
```

Ajouter dans les propriétés :

- workspace_id ;
- segment ;
- plan actuel ;
- plan ciblé ;
- pays ;
- monnaie ;
- source de l’action ;
- fonctionnalité concernée.

---

# 27. Administration Sanza

Créer une interface d’administration distincte permettant de :

- créer un plan ;
- désactiver un plan ;
- modifier les textes ;
- ajouter un prix ;
- définir une période de validité ;
- ajouter une fonctionnalité ;
- modifier une limite ;
- créer une remise ;
- activer un abonnement manuel ;
- consulter les contrats ;
- voir les abonnements expirant bientôt ;
- consulter les erreurs de webhook ;
- relancer un traitement ;
- consulter l’usage.

Les modifications des prix et entitlements doivent être journalisées.

---

# 28. Compatibilité multi-pays et multi-devises

L’architecture doit supporter :

- XOF ;
- GHS ;
- NGN ;
- USD ;
- EUR.

Pour le lancement, l’affichage par défaut peut rester en FCFA pour les marchés francophones.

Le plan et les droits ne doivent pas dépendre de la devise.

La devise concerne uniquement le prix.

---

# 29. Architecture de dossiers recommandée

```txt
/v2
  /app
    /settings
      /billing
    /pricing
    /api
      /billing
  /components
    /billing
  /config
    /billing
  /hooks
    use-entitlements.ts
    use-subscription.ts
    use-usage.ts
  /lib
    /billing
      entitlements.ts
      plan-catalog.ts
      pricing.ts
      usage.ts
      provider.ts
      types.ts
      validators.ts
  /types
    billing.ts

/supabase
  /functions
    create-checkout-session
    change-subscription
    cancel-subscription
    billing-webhook
    create-manual-contract
    recalculate-usage
  /migrations
  /seed
    billing-plans.sql
```

Respecter l’architecture existante du projet si les conventions de dossiers diffèrent, mais conserver cette séparation logique.

---

# 30. Ordre d’implémentation

## Phase 1 — Fondation

1. créer les migrations ;
2. créer les segments ;
3. créer les plans ;
4. créer les fonctionnalités ;
5. créer les entitlements ;
6. créer le seed ;
7. créer les types TypeScript ;
8. créer le service d’entitlements ;
9. créer les politiques RLS ;
10. tester les droits.

## Phase 2 — Interface

1. créer la page pricing ;
2. créer les trois onglets ;
3. créer les cartes de plans ;
4. créer la modal de changement ;
5. créer le panneau de résumé ;
6. créer les composants de verrouillage ;
7. afficher le plan actuel ;
8. afficher les limites et usages.

## Phase 3 — Abonnement

1. intégrer le fournisseur de paiement ;
2. créer le checkout ;
3. gérer les webhooks ;
4. gérer les factures ;
5. gérer l’upgrade ;
6. gérer le downgrade ;
7. gérer l’annulation ;
8. gérer l’essai.

## Phase 4 — Programmes et financeurs

1. contrats manuels ;
2. activation administrative ;
3. options supplémentaires ;
4. limites par entreprise ou dossier ;
5. reporting ;
6. interface admin.

---

# 31. Tests obligatoires

## Tests unitaires

- calcul des entitlements ;
- récupération des limites ;
- vérification d’une fonctionnalité ;
- consommation d’un quota ;
- blocage lorsque le quota est atteint ;
- calcul du prorata ;
- changement de période ;
- gestion d’un plan gratuit.

## Tests d’intégration

- création d’un abonnement ;
- réception d’un webhook ;
- double webhook identique ;
- upgrade ;
- downgrade ;
- annulation ;
- fin d’essai ;
- impayé ;
- contrat manuel.

## Tests end-to-end

- Ready vers Raise ;
- Raise vers Close ;
- Close vers Raise ;
- essai vers plan gratuit ;
- utilisateur programme ;
- utilisateur financeur ;
- feature lock ;
- limite d’usage ;
- téléchargement de facture.

---

# 32. Critères d’acceptation

L’implémentation sera considérée conforme lorsque :

- les trois segments sont disponibles ;
- les plans sont chargés depuis la base ;
- les prix ne sont pas codés en dur dans les composants ;
- les droits sont centralisés ;
- chaque workspace possède un abonnement ;
- les fonctionnalités sont correctement verrouillées ;
- les limites sont vérifiées côté serveur ;
- les visiteurs externes ne sont pas comptés comme sièges payants ;
- l’upgrade fonctionne ;
- le downgrade ne supprime aucune donnée ;
- les webhooks sont idempotents ;
- les politiques RLS sont actives ;
- la page pricing est responsive ;
- la modal respecte le design system Sanza ;
- les états de chargement, erreur et succès sont présents ;
- les migrations et seeds sont versionnés ;
- la fonctionnalité est documentée.

---

# 33. Interdictions

Claude Code ne doit pas :

- coder les plans directement dans chaque écran ;
- utiliser le nom du plan comme unique mécanisme d’autorisation ;
- faire confiance au prix envoyé par le frontend ;
- supprimer des données lors d’un downgrade ;
- facturer les visiteurs externes ;
- mélanger permissions utilisateurs et entitlements commerciaux ;
- contourner les politiques RLS ;
- mettre les clés de paiement dans le frontend ;
- construire uniquement une interface statique sans branchement fonctionnel ;
- modifier les écrans existants sans respecter le design system Sanza ;
- créer une nouvelle architecture parallèle incohérente avec `/v2`.

---

# 34. Instruction finale à Claude Code

Implémenter cette architecture de manière modulaire, sécurisée et réellement fonctionnelle.

Commencer par analyser le projet existant, les migrations Supabase, les conventions de code et l’architecture `/v2`.

Avant toute modification :

1. produire un état des lieux ;
2. identifier les fichiers à créer ou modifier ;
3. identifier les risques de régression ;
4. proposer le plan d’implémentation ;
5. ensuite seulement commencer le code.

Chaque écran créé doit être branché à de vraies données ou à une structure de données prête à être connectée.

Aucun bouton ne doit être purement décoratif.

Toute fonction nécessitant encore une intégration externe doit être clairement identifiée et isolée derrière une interface ou un service.

Le résultat attendu est une fondation durable pour la tarification, les abonnements et les droits d’accès de Sanza.