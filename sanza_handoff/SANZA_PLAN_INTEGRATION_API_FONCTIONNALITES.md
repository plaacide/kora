# SANZA — Plan d’intégration des API et fonctionnalités

**Destinataire : Claude Code**  
**Objectif : connecter progressivement les API, services externes et fonctionnalités critiques de Sanza, avec des gates de validation claires et une stratégie de test complète.**

---

# 1. Principe général

Ne pas connecter toutes les API en parallèle.

Chaque intégration doit dépendre d’une fondation déjà stable et testée.

Ordre recommandé :

```text
Environnements
→ Tests et observabilité
→ Authentification et sécurité
→ Workspaces, rôles et RLS
→ Opérations et data rooms
→ Stockage documentaire
→ Modèles et checklists
→ Permissions et invitations
→ E-mails transactionnels
→ NDA et preuves
→ Visionneuse et filigrane
→ Journal d’audit
→ Billing et entitlements
→ GeniusPay
→ Programmes et cohortes
→ Financeurs et diligence
→ Recherche
→ IA et automatisations
```

Règle de progression :

```text
une intégration
→ tests unitaires
→ tests d’intégration
→ tests end-to-end
→ staging
→ validation
→ merge
→ intégration suivante
```

Ne jamais intégrer plusieurs fournisseurs externes dans une même branche.

---

# 2. Environnements

Créer trois environnements strictement séparés :

| Environnement | Usage |
|---|---|
| Local | Développement quotidien |
| Staging | Tests avec API Sandbox |
| Production | Utilisateurs réels |

Chaque environnement doit avoir :

- son projet Supabase ;
- ses clés API ;
- ses webhooks ;
- son stockage ;
- ses utilisateurs de test ;
- ses variables d’environnement ;
- ses données de démonstration ;
- ses logs ;
- ses feature flags.

Ne jamais utiliser une clé de production en local ou en staging.

Les clés GeniusPay déjà exposées doivent être révoquées et régénérées avant intégration.

---

# 3. Gate initiale obligatoire

Avant toute API externe, ces commandes doivent réussir :

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Si une commande échoue, corriger avant de continuer.

Créer un rapport de dette technique incluant :

- erreurs TypeScript ;
- composants non branchés ;
- boutons décoratifs ;
- mocks encore actifs ;
- routes incomplètes ;
- TODO critiques ;
- tests manquants ;
- risques de régression.

---

# 4. Observabilité et infrastructure de test

À faire avant les intégrations.

## 4.1 Logs structurés

Chaque appel externe doit enregistrer :

```text
provider
operation
request_id
workspace_id
user_id
status
duration_ms
error_code
created_at
```

Ne jamais enregistrer :

- clé API ;
- secret ;
- mot de passe ;
- pièce d’identité ;
- contenu complet d’un document ;
- token d’accès ;
- données bancaires sensibles.

## 4.2 Gestion centralisée des erreurs

Créer un service unique pour :

- erreurs frontend ;
- erreurs serveur ;
- erreurs Supabase ;
- erreurs fournisseur ;
- erreurs webhooks ;
- erreurs réseau ;
- timeouts.

## 4.3 Feature flags

Créer au minimum :

```text
ENABLE_GENIUSPAY
ENABLE_TRANSACTIONAL_EMAIL
ENABLE_DOCUMENT_CONVERSION
ENABLE_NDA
ENABLE_AI_CLASSIFICATION
ENABLE_PROGRAMS
ENABLE_FUNDER_PORTAL
ENABLE_SEARCH
```

Chaque intégration doit pouvoir être désactivée sans redéploiement majeur.

## 4.4 Mocks et fixtures

Créer :

- comptes de test ;
- workspaces de test ;
- opérations de test ;
- documents fictifs ;
- webhooks simulés ;
- réponses API simulées ;
- erreurs simulées ;
- données de billing fictives.

## Gate

Ne pas continuer tant que :

- une erreur frontend est traçable ;
- une erreur serveur est traçable ;
- un appel externe peut être mocké ;
- une feature peut être coupée par flag ;
- un `request_id` permet de suivre un appel de bout en bout.

---

# 5. Authentification, workspaces, rôles et RLS

C’est la première fondation métier.

## 5.1 Fonctionnalités

Connecter et tester :

- inscription ;
- confirmation d’e-mail ;
- connexion ;
- mot de passe oublié ;
- réinitialisation ;
- 2FA ;
- sessions ;
- création du workspace ;
- invitation dans une équipe ;
- rôles ;
- permissions internes ;
- Supabase RLS.

## 5.2 Rôles minimaux

```text
owner
admin
member
viewer
external_guest
program_manager
analyst
sanza_admin
```

Ne pas confondre :

- permissions utilisateurs ;
- entitlements commerciaux ;
- permissions documentaires ;
- rôles système.

## 5.3 Tests obligatoires

Créer :

```text
Entreprise A
Entreprise B
```

Vérifier que :

- A ne voit aucune donnée de B ;
- changer un ID dans l’URL ne donne aucun accès ;
- un invité ne voit que ce qui est partagé ;
- un membre ne modifie pas la facturation sans droit ;
- un utilisateur supprimé perd l’accès immédiatement ;
- un owner reste protégé contre une suppression accidentelle ;
- les RLS couvrent toutes les tables sensibles.

## Gate

Ne pas continuer si l’isolation multi-tenant n’est pas parfaite.

---

# 6. Opérations et data rooms

Modèle cible :

```text
workspace
└── operations[]
    └── data_room
```

## 6.1 Fonctionnalités

Implémenter :

- création d’une opération ;
- plusieurs opérations ;
- une data room principale par opération ;
- clôture ;
- archivage ;
- réactivation ;
- duplication de structure ;
- limite selon plan ;
- lecture seule des archives.

## 6.2 Tests

Tester :

- première opération ;
- deuxième opération ;
- limite Raise ;
- limite Close ;
- archivage ;
- réactivation ;
- downgrade sans suppression ;
- navigation directe par URL ;
- isolation entre opérations.

## Gate

Le système doit supporter :

```text
Entreprise A
├── Levée Seed 2026
├── Prêt Ecobank
└── Diligence IFC
```

Chaque opération doit être isolée.

---

# 7. Stockage et upload documentaire

Connecter ensuite Supabase Storage ou le fournisseur retenu.

## 7.1 Fonctionnalités minimales

- création de dossier ;
- upload ;
- téléchargement interne ;
- suppression ;
- renommage ;
- déplacement ;
- versioning ;
- validation de format ;
- validation de taille ;
- checksum ;
- nettoyage des fichiers orphelins ;
- liens signés temporaires ;
- clés de stockage non prévisibles.

## 7.2 États techniques

```text
queued
uploading
processing
ready
failed
quarantined
```

## 7.3 Sécurité

Prévoir :

- validation MIME côté serveur ;
- limite de taille côté serveur ;
- antivirus ou quarantaine ;
- suppression sûre ;
- bucket privé ;
- politiques RLS ;
- URL signée courte durée ;
- interdiction d’accès direct public.

## 7.4 Tests

Tester :

- PDF ;
- Word ;
- Excel ;
- PowerPoint ;
- image ;
- fichier trop lourd ;
- format interdit ;
- upload interrompu ;
- upload multiple ;
- doublon ;
- suppression ;
- accès par une autre entreprise ;
- 20 fichiers simultanés ;
- caractères spéciaux ;
- fichier corrompu.

## Gate

Ne pas connecter la visionneuse avant que l’upload soit stable.

---

# 8. Moteur de modèles et checklists

Connecter ensuite le moteur documentaire.

## 8.1 Modèles initiaux

- levée de fonds ;
- board due diligence ;
- founder due diligence ;
- fusion-acquisition ;
- OHADA ;
- pays ;
- financeur ;
- secteur.

## 8.2 Sortie attendue

```text
folders
requirements
requirement_levels
sources
display_order
applied_modules
warnings
```

## 8.3 Ordre de test

Commencer par :

```text
Levée
+ OHADA
+ Fonds VC
```

Puis ajouter progressivement les autres modules.

## 8.4 Tests

- aucune exigence dupliquée ;
- source conservée ;
- personnalisation locale ;
- versioning ;
- exigence non applicable ;
- association d’une pièce ;
- suppression d’une pièce ;
- recalcul de préparation ;
- mise à jour de modèle sans impact rétroactif.

## Gate

Le moteur doit produire une structure stable et explicable.

---

# 9. Permissions et accès documentaires

Connecter seulement après stockage et modèles.

## 9.1 Fonctionnalités

- invités ;
- groupes ;
- accès par data room ;
- accès par dossier ;
- accès par pièce ;
- lecture ;
- lecture filigranée ;
- téléchargement ;
- dépôt ;
- expiration ;
- révocation ;
- héritage des permissions ;
- exception plus restrictive.

## 9.2 Matrice minimale

| Niveau | Lire | Filigrane | Télécharger | Déposer |
|---|---:|---:|---:|---:|
| Aucun | Non | Non | Non | Non |
| Lecture filigranée | Oui | Oui | Non | Non |
| Lecture | Oui | Non | Non | Non |
| Téléchargement | Oui | Selon règle | Oui | Non |
| Modification | Oui | Selon règle | Selon règle | Oui |

## 9.3 Personas de test

- fondateur owner ;
- membre ;
- viewer ;
- invité investisseur ;
- analyste fonds ;
- programme ;
- admin Sanza.

## 9.4 Tests

- accès expiré ;
- révocation pendant une session ;
- déplacement d’un dossier ;
- nouvelle pièce ;
- héritage ;
- override plus restrictif ;
- téléchargement refusé ;
- invitation dupliquée ;
- permission incorrecte dans l’URL ;
- accès croisé entre workspaces.

## Gate

Ne pas connecter l’e-mail d’invitation avant que l’objet invitation soit fiable.

---

# 10. E-mails transactionnels

Connecter quand invitations et comptes sont réellement fonctionnels.

## 10.1 Cas initiaux

- confirmation d’adresse ;
- mot de passe oublié ;
- invitation équipe ;
- invitation data room ;
- rappel ;
- NDA à signer ;
- question reçue ;
- accès révoqué ;
- paiement confirmé.

## 10.2 Architecture recommandée

```text
événement métier
→ outbox
→ worker ou Edge Function
→ fournisseur e-mail
→ statut de livraison
```

États :

```text
queued
sent
delivered
bounced
failed
```

Ne pas envoyer directement depuis le frontend.

## 10.3 Tests

- adresse valide ;
- adresse invalide ;
- bounce ;
- double envoi ;
- relance ;
- lien expiré ;
- lien utilisé ;
- mauvaise adresse connectée ;
- français ;
- anglais ;
- fournisseur indisponible.

## Gate

Chaque e-mail doit être idempotent et traçable.

---

# 11. NDA, consentement et preuves

Connecter après permissions et e-mails.

## 11.1 Données minimales

- identité ;
- e-mail ;
- texte exact ;
- version ;
- horodatage ;
- consentement explicite ;
- hash ;
- preuve ;
- journal ;
- IP et user agent uniquement si juridiquement appropriés.

## 11.2 Règles

- aucun accès avant signature si NDA obligatoire ;
- preuve immuable ;
- révocation d’accès sans suppression de preuve ;
- version du NDA conservée ;
- plusieurs signataires ;
- lien expirant.

## 11.3 Tests

- acceptation ;
- refus ;
- expiration ;
- nouvelle version ;
- accès révoqué ;
- contournement URL ;
- preuve téléchargeable ;
- preuve non modifiable ;
- double signature ;
- session mobile.

## Gate

Le contrôle NDA doit être vérifié côté serveur.

---

# 12. Visionneuse, conversion et filigrane

Ordre de support :

```text
PDF
→ images
→ Word
→ PowerPoint
→ Excel
```

## 12.1 Fonctionnalités

- aperçu PDF ;
- pagination ;
- miniatures ;
- filigrane dynamique ;
- contrôle de téléchargement ;
- document suivant ;
- erreur de rendu ;
- conversion asynchrone ;
- état `processing`.

## 12.2 Tests

- 1 page ;
- 200 pages ;
- PDF protégé ;
- fichier corrompu ;
- caractères spéciaux ;
- adresse longue dans filigrane ;
- révocation pendant lecture ;
- expiration ;
- mobile ;
- réseau lent.

## Gate

La visionneuse ne doit jamais contourner les permissions.

---

# 13. Journal d’audit et analytics

Événements initiaux :

```text
document_uploaded
document_viewed
document_downloaded
document_deleted
folder_created
access_granted
access_revoked
nda_signed
question_created
answer_published
operation_created
operation_archived
subscription_changed
```

Chaque événement doit contenir :

- acteur ;
- workspace ;
- opération ;
- data room ;
- objet ;
- horodatage ;
- source ;
- métadonnées non sensibles.

Les actions critiques doivent être journalisées côté serveur.

## Tests

- ordre chronologique ;
- fuseaux horaires ;
- pagination ;
- filtres ;
- export ;
- immutabilité ;
- déduplication ;
- double webhook ;
- événements externes ;
- performances sur gros volume.

## Gate

Aucun événement critique ne doit dépendre uniquement du frontend.

---

# 14. Billing et entitlements

Avant GeniusPay, finaliser :

```text
plans
→ prices
→ subscriptions
→ entitlements
→ usage
→ feature gates
```

## 14.1 Tests

- plan gratuit ;
- plan Raise ;
- plan Close ;
- limite atteinte ;
- upgrade ;
- downgrade ;
- annulation ;
- essai ;
- période de grâce ;
- workspace en lecture seule ;
- opérations archivées non comptées.

## Gate

Les droits du plan doivent fonctionner sans fournisseur de paiement.

---

# 15. GeniusPay

Le MCP GeniusPay sert à lire la documentation et diagnostiquer les erreurs.

Il ne remplace pas l’intégration runtime.

## 15.1 Ordre d’intégration

1. client ou référence ;
2. création de paiement ;
3. checkout ;
4. retour navigateur ;
5. webhook ;
6. vérification serveur ;
7. activation ;
8. reçu ou facture ;
9. échec ;
10. retry ;
11. remboursement si supporté.

## 15.2 Source de vérité

Le frontend ne doit jamais déclarer le paiement réussi.

La source de vérité est :

```text
webhook vérifié
ou
vérification serveur GeniusPay
```

## 15.3 Idempotence

Contrainte unique :

```text
provider + external_event_id
```

## 15.4 Tests Sandbox obligatoires

- succès ;
- refus ;
- abandon ;
- webhook avant retour ;
- retour avant webhook ;
- double webhook ;
- montant incorrect ;
- devise incorrecte ;
- signature invalide ;
- timeout ;
- indisponibilité ;
- abonnement déjà actif ;
- upgrade ;
- downgrade ;
- annulation ;
- essai ;
- paiement manuel ;
- virement.

## Gate

Ne pas activer le paiement réel avant validation complète Sandbox.

---

# 16. Programmes et cohortes

Connecter après le cœur Fondateur.

## Fonctionnalités

- invitation cohorte ;
- consentement ;
- suivi de préparation ;
- visibilité limitée ;
- demandes groupées ;
- reporting ;
- dealroom ;
- choix d’opération ;
- mandat spécifique.

## Tests

- programme sans accès aux documents ;
- consentement retiré ;
- entreprise dans plusieurs cohortes ;
- plusieurs opérations ;
- mauvaise opération ;
- mandat retiré ;
- accès existant ;
- export.

## Gate

Un programme ne doit jamais voir un document sans autorisation explicite.

---

# 17. Financeurs et diligence

Connecter ensuite :

- portail de réception ;
- pipeline ;
- demandes documentaires ;
- affectation analystes ;
- notes internes ;
- scoring ;
- Q&A ;
- comité d’investissement ;
- conditions préalables ;
- décision ;
- suivi portefeuille.

Règle :

> Les notes internes du financeur ne sont jamais visibles de l’entreprise.

## Tests

- financeur A ;
- financeur B ;
- entreprise ;
- programme ;
- analyste ;
- admin.

## Gate

Isolation stricte entre organisations et rôles.

---

# 18. Recherche

Connecter lorsque les permissions sont stables.

Ordre :

```text
métadonnées
→ dossiers
→ pièces
→ invités
→ opérations
→ contenu indexé plus tard
```

Ne pas indexer immédiatement le contenu complet des documents sensibles.

La recherche ne doit jamais révéler :

- nom d’une pièce inaccessible ;
- dossier inaccessible ;
- autre entreprise ;
- autre opération ;
- donnée Founder DD ;
- donnée d’un autre financeur.

## Gate

Tous les résultats doivent être filtrés côté serveur.

---

# 19. IA et automatisations

À connecter en dernier.

Ordre recommandé :

1. suggestion de classement ;
2. détection de type ;
3. extraction de métadonnées ;
4. association à une exigence ;
5. résumé ;
6. incohérences ;
7. assistance à la préparation.

Toujours avec validation humaine.

Interdictions :

- partager automatiquement ;
- modifier une permission ;
- supprimer une pièce ;
- approuver une diligence ;
- décider d’un investissement ;
- envoyer une information sensible sans validation.

---

# 20. Matrice globale

| Phase | Fonctionnalité | Dépendance | Gate |
|---:|---|---|---|
| 0 | Environnements | — | séparation complète |
| 1 | Observabilité | environnements | erreurs traçables |
| 2 | Auth et RLS | Supabase | isolation validée |
| 3 | Opérations | Auth | multi-opérations stable |
| 4 | Stockage | Opérations | upload sécurisé |
| 5 | Modèles | Stockage | génération fiable |
| 6 | Permissions | Documents | matrice validée |
| 7 | E-mails | Invitations | livraison testée |
| 8 | NDA | Permissions | blocage serveur |
| 9 | Visionneuse | Stockage | rendu sécurisé |
| 10 | Audit | Interactions | événements immuables |
| 11 | Billing | Entitlements | droits locaux valides |
| 12 | GeniusPay | Billing | Sandbox validée |
| 13 | Programmes | Fondateur | consentements testés |
| 14 | Financeurs | Opérations | isolation validée |
| 15 | Recherche | Permissions | aucun leak |
| 16 | IA | données stables | validation humaine |

---

# 21. Personas permanents de test

| Persona | Usage |
|---|---|
| Fondateur Ready | limites gratuites |
| Fondateur Raise | 1 opération |
| Fondateur Close | 3 opérations |
| Membre entreprise | permissions internes |
| Invité investisseur | accès externe |
| Programme | cohortes |
| Analyste fonds | diligence |
| Admin Sanza | administration |
| Utilisateur malveillant | tests d’isolation |

Conserver ces comptes en staging.

---

# 22. Niveaux de test

Pour chaque phase :

## 22.1 Tests unitaires

Exemples :

- permission ;
- quota ;
- fusion modèle ;
- validation webhook ;
- score de préparation.

## 22.2 Tests d’intégration

Exemples :

- invitation + e-mail ;
- upload + stockage ;
- NDA + accès ;
- paiement + abonnement.

## 22.3 Tests end-to-end

Tester les parcours complets dans le navigateur.

## 22.4 Tests manuels staging

Utiliser les vraies API Sandbox.

---

# 23. Branches recommandées

Une branche par intégration :

```text
feat/auth-rbac
feat/operations
feat/document-storage
feat/document-templates
feat/document-permissions
feat/transactional-email
feat/nda
feat/document-viewer
feat/audit-log
feat/billing-entitlements
feat/geniuspay
feat/programs
feat/funder-portal
feat/search
feat/ai-classification
```

Ne pas mélanger plusieurs intégrations dans une branche.

---

# 24. Checklist avant merge

Chaque intégration doit avoir :

- lint valide ;
- typecheck valide ;
- tests valides ;
- build valide ;
- tests staging ;
- logs ;
- erreurs ;
- feature flag ;
- documentation ;
- rollback ;
- migration versionnée ;
- RLS vérifiée ;
- secrets sécurisés ;
- aucun bouton décoratif.

---

# 25. Ordre concret pour Sanza maintenant

Puisque les écrans sont presque intégrés :

1. auditer les faux branchements ;
2. stabiliser Supabase ;
3. finaliser Auth, rôles et RLS ;
4. finaliser opérations ;
5. finaliser upload ;
6. brancher modèles documentaires ;
7. brancher permissions ;
8. brancher e-mails ;
9. brancher NDA ;
10. brancher visionneuse ;
11. brancher audit ;
12. finaliser entitlements ;
13. connecter GeniusPay Sandbox ;
14. tester le parcours Fondateur ;
15. connecter Programmes ;
16. connecter Financeurs ;
17. connecter Recherche ;
18. connecter IA ;
19. audit sécurité ;
20. préparation production.

---

# 26. Instruction finale à Claude Code

Avant toute intégration :

1. auditer l’existant ;
2. lister les boutons non branchés ;
3. lister les API déjà présentes ;
4. lister les dépendances installées ;
5. lister les secrets attendus ;
6. lister les tables concernées ;
7. lister les migrations ;
8. identifier les risques ;
9. proposer l’ordre exact ;
10. estimer l’effort.

Ne pas commencer plusieurs intégrations à la fois.

Après validation, travailler phase par phase.

Chaque phase doit être testée, documentée et validée sur staging avant de passer à la suivante.
