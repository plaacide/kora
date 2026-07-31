# Arbre des connexions — V2

La boussole du branchement : ce qui lit vraiment la base, ce qui affiche encore
des données écrites en dur, et ce qui manque côté serveur pour finir.

**Dernière vérification : 1er août 2026**, branche `v2/rebuild`. Établie en
re-dérivant depuis le code — quels écrans importent `features/v2/server/*` — et
en interrogeant la base de staging pour l'état réel des migrations. Ce document
se périme : le relire avant de s'y fier.

## Comment lire

| Marque | Sens |
|---|---|
| 🟢 | Branché — l'écran lit ou écrit la vraie base |
| 🟡 | Partiel — une partie lit la base, le reste est en dur |
| 🔴 | Fixture — aucune donnée réelle, tout est écrit dans le fichier |

---

## Entrer dans le produit

```
🟢 Inscription                    signup()              → auth.users, profiles
🟢 Connexion                      login()               → auth.users (+ AAL 2FA)
🟢 Mot de passe oublié / reset    Supabase auth
🟢 Vérification e-mail            Supabase auth
🟢 Onboarding — entreprise        save_startup()        → startups
🟢 Onboarding — objectif          save_startup()        → startups.objectif
🟢 Onboarding — détails           save_startup()        → montant, horizon
🟢 Onboarding — plan généré       complete_onboarding() → organizations, memberships, deals
```

⚠️ `complete_onboarding(p_create_room: true)` crée toujours une opération. Le
brief (`READMETransition.md`, écran 62) demande l'inverse. Arbitrage différé à
la demande du fondateur — à rouvrir quand tout sera connecté.

## Le poste de pilotage

```
🟢 Accueil — tableau de bord      dailyViews()          → audit_log (consultations)
   ├─ 🟢 Consultations récentes   recentReadings()      → page_dwell + documents + deals
   ├─ 🟢 Accès                    accessOverview()      → invitations
   ├─ 🟢 Documents                documentActivity()    → page_dwell groupé par pièce
   └─ 🟢 Invités                  guestActivity()       → page_dwell groupé par personne

🟢 Liste des opérations           listOperations()      → deals + documents + invitations + audit_log
🟢 Créer une opération            create_data_room()    → deals, folders, checklist_items
   └─ 🟢 Levée facultative        create_raise() + save_raise() → raises
```

## À l'intérieur d'une opération

```
🟢 Vue d'ensemble                 operationOverview()
   ├─ 🟢 En-tête                  → deals + raises (montant, devise, échéance)
   ├─ 🟢 Prochaine action         prochaineAction() — périmé, puis requis, puis
   │                                à confirmer, puis partager
   ├─ 🟢 Progression              → requis seul, recommandées comptées à part
   ├─ 🟢 Votre espace             → dossiers, pièces, accès actifs
   ├─ 🟢 À traiter en priorité    → même ordre que la prochaine action
   ├─ 🟢 Dernières pièces         → documents par date de dépôt
   ├─ 🟢 Activité récente         → audit_log, format du journal
   └─ 🔴 Pipeline investisseurs   —                     ATTEND : raise_investors

🟢 Préparation                    listRequirementsFull(), requirementDetail(),
                                  requirementHistory(), attachableDocuments(),
                                  preparationProgress()
   ├─ 🟢 Plan (écran 11)          → 8 domaines, niveaux, financeurs multiples
   ├─ 🟢 Filtres                  → Toutes / À traiter / Requises / À actualiser
   │                                / Prêtes, + par financeur
   ├─ 🟢 Détail (écran 12)        → preuves, état par pièce, journal, statut
   ├─ 🟢 Rattacher une pièce      attach_checklist_document(p_confirmed: true)
   ├─ 🟢 Confirmer / écarter      + dismiss_checklist_suggestion()
   ├─ 🟢 Non applicable           set_checklist_status()
   ├─ 🟢 Ajouter une exigence     add_checklist_item()
   ├─ 🟢 Poser le référentiel     apply_checklist_template()
   └─ 🔴 Import d'une liste (13)  —                     ATTEND : extraction d'un
                                                        PDF + colonne de provenance

🟢 Data room                      listFolders(), listDocuments(), resolveFolderPath()
   ├─ 🟢 Arborescence             → folders (+ compte de pièces, accès invités)
   ├─ 🟢 Table des pièces         → documents + versions + exigences
   ├─ 🟢 Détail, versions, journal → restaurer, remplacer, masquer
   ├─ 🟢 Dépôt (écran 16)         → Storage direct + register_document, % réel
   └─ 🟢 Associations (écran 17)  → suggestions écrites non confirmées

🟢 Partage et accès               listAccesses(), shareableFolders(),
                                  countActiveAccesses(), invitationScope()
   ├─ 🟢 Assistant (écrans 20-23) → createInvitation() : RPC + lien + e-mail
   ├─ 🟢 Périmètre choisi         invitation_folders
   ├─ 🟢 Pièces masquées          documents.hidden_from_guests
   ├─ 🟢 Tableau (écran 24)       → invitations + ndas + permissions + audit_log
   ├─ 🟢 Aperçu invité (écran 25) → ce que l'invité verra vraiment
   └─ 🟢 Révocation               revoke_invitation()

🔴 Lever                          —                     ATTEND : raises, save_raise
🔴 Investisseurs                  —                     ATTEND : raise_investors (table vide)
🔴 Activité (journal)             —                     ATTEND : audit_log par opération
🟢 Visionneuse                    → /api/viewer, filigrane incrusté, audit par page
```

## Le reste du produit

```
🔴 Invitations et demandes        —                     ATTEND : invitations + access_requests
🟢 Activité globale               organizationJournal() → même écran, autre portée
🟢 Recherche                      searchDocuments()     → documents par nom, filtrées
                                                        par opération, chemin complet
🔴 Équipe                         —                     ATTEND : memberships (vocabulaire à trancher)
🔴 Sécurité                       —                     ATTEND : MFA, audit_log
🔴 Abonnement                     —                     ATTEND : décisions produit
```

## Ce que le rail affiche

```
🟢 Préparation  1/16        preparationProgress() — requis seul, comme l'écran
🟢 Bandeau      « Partagée — 1 accès actif »  countActiveAccesses()
🔴 Partage et accès         la maquette 24 montre un badge, pas encore branché
🔴 Investisseurs, Lever     pas de badge
```

---

## Ce qui tient l'ensemble

**Garde d'accès.** `requireV2User()` et `requireV2Workspace()`
(`server/session.ts`) : tout écran du poste de pilotage passe par là. Un écran
qui les oublie est ouvert à tous — c'est la première chose à vérifier en
relecture.

**Isolation.** `supabase/tests/rls_isolation_organisations.sql` — quatorze
contrôles, lecture ET écriture, entre deux entreprises étrangères. À rejouer
après toute migration : une politique se casse en modifiant une AUTRE table.

**Règles pures.** `domain/` — `operation`, `activity`, `documents`, `access`,
`preparation`, `suggestions`, `journal`. 128 tests, sans base ni mock. Toute
logique qui ne fait pas d'entrée-sortie a vocation à y descendre.

## Décisions tranchées

**Le dépôt à la racine** (31 juillet). `documents.folder_id` est nullable : on
dépose d'abord, on range ensuite. Conséquence : une pièce à la racine ne se
partage pas — un accès se pose sur un dossier, sans dossier il n'y a nulle part
où accorder ni retirer un droit. La racine est réservée à l'équipe.

**L'invitation porte son périmètre** (31 juillet). `invitation_folders` :
l'assistant fait choisir les dossiers, l'acceptation n'ouvre que ceux-là. Deux
états à ne pas confondre : **aucun périmètre** vaut « toute la data room, y
compris ce qui sera créé plus tard » ; une **sélection** fige la liste.

**Une pièce se masque sans changer de dossier** (1er août).
`documents.hidden_from_guests` — propriété de la PIÈCE, pas de l'invitation :
elle se décide dans la data room et vaut pour tous les invités. La RLS cache
jusqu'au NOM.

**La lecture d'un invité suit ses droits** (1er août). Vérifié sur un compte
invité réel : avec deux dossiers sur six, il lisait les six dossiers, les
vingt-quatre noms de pièces et leurs clés de stockage. `can_see_deal` ouvrait
toute l'opération dès qu'un droit existait quelque part. Corrigé, checklist
comprise.

**La révocation** (1er août). `revoke_invitation()` passe le statut, supprime
les permissions et journalise. Vérifié : plus rien de visible, jeton rejoué
refusé. L'appartenance `guest` est conservée — elle vaut pour les autres
opérations.

**Une échéance dure jusqu'à la fin du jour dit** (1er août). Le champ date
produisait minuit : l'accès mourait la veille au soir. `fin_de_journee()`
normalise à 23:59:59 — en UTC, exact pour Dakar et Abidjan, une à trois heures
de large à Lagos ou Nairobi.

**Les exigences ont deux axes** (1er août). `domain` range (8 valeurs),
`sources` étiquette (plusieurs), `level` hiérarchise. Quatre états stockés,
`not_applicable` compris. « À actualiser » se DÉDUIT de `freshness_days`.
« En vérification » écarté tant qu'aucun geste ne le produit.

**Le journal ne masque jamais ce qu'il ne sait pas nommer** (1er août). Une
action sans traduction française s'affiche telle quelle. Un journal d'audit qui
cache ce qu'il ne comprend pas ne prouve plus rien. Même raison pour l'onglet
« Questions » de la maquette 30, qui n'existe pas ici : aucune fonctionnalité
de questions, donc aucune action à filtrer, donc un onglet toujours vide qui
ferait douter des autres.

**Les compteurs portent sur le REQUIS** (1er août). Les maquettes 09 et 11
affichent « 18 prêtes · 4 à fournir · 2 à actualiser » à côté de « 18 sur 24
exigences requises » : 18 + 4 + 2 = 24. Le recommandé est compté à part
(« 9/13 »). Mélanger les deux ferait paraître un dossier plus en retard qu'il
n'est.

**Une suggestion n'est pas une preuve** (1er août). Elle est écrite dès le
dépôt, non confirmée : elle survit à un onglet refermé et ne compte pas dans le
score. `sync_checklist_status` ne regarde que les liens confirmés.

## Ce qui reste en attente

1. **Écran 13 — import d'une liste reçue.** Rien n'extrait d'exigences d'un
   PDF, et `checklist_items` n'a pas où retenir « demandé par telle banque ».
2. **La juridiction.** La maquette 11 pose un filtre « Par juridiction » et la
   12 affiche « OHADA — Sénégal ». Rien ne la porte. Probablement une propriété
   de l'OPÉRATION, pas de chaque exigence.
3. **« Modèle disponible »** (maquette 12) : aucune bibliothèque de gabarits.
4. **« Demander à l'équipe »** (maquette 12) : pas de messagerie interne.
5. **`doc_status` n'a que quatre valeurs** (`uploading`, `processing`, `ready`,
   `failed`). Les maquettes en montrent sept.
6. **Le vocabulaire des rôles d'équipe.** Les maquettes en montrent quatre
   (owner, administrator, contributor, internal_viewer), la base en a quatre
   autres (owner, admin, member, guest).
7. **Le fuseau horaire d'une organisation**, pour que les échéances tombent à
   minuit local.

## Migrations

Toutes appliquées sur staging (`jourzsgjnutktsrgxkoo`) au 1er août, **sauf** :

| Migration | État |
|---|---|
| `20260801230000_journal_nom_de_piece` | en attente — le journal dit « une pièce » au lieu du nom |

Aucune n'a été portée en production. Le fondateur a levé la contrainte de
compatibilité V1 : produit en pré-lancement, les changements de modèle sont
autorisés — mais staging reste la première étape.

## L'ordre qui reste

1. ~~Dépôt, visionneuse, partage et accès, préparation~~ — faits.
2. ~~Vue d'ensemble~~ — faite le 1er août. Reste son pipeline investisseurs,
   qui attend l'écran Investisseurs.
3. ~~Activité~~ — faite le 1er août, par opération et pour l'organisation.
4. ~~Recherche~~ — faite le 1er août. Elle porte sur les pièces ; chercher une
   exigence ou un dossier reste à décider.
5. **Investisseurs**, puis **Lever** — le plus gros volume de maquettes.
6. **Équipe**, **Sécurité**, **Abonnement** — décisions produit d'abord.
