# Arbre des connexions — V2

La boussole du branchement : ce qui lit vraiment la base, ce qui affiche encore
des données écrites en dur, et ce qui manque côté serveur pour finir.

**Dernière vérification : 30 juillet 2026**, branche `v2/rebuild`, par
inventaire du code (`grep` des fichiers V2 touchant Supabase, puis lecture
écran par écran). Ce document se périme : le relire avant de s'y fier.

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
🔴 Vue d'ensemble                 —                     ATTEND : lecture deals + readiness
🔴 Préparation (exigences)        —                     ATTEND : checklist_items, apply_checklist_template
🟡 Data room                      listFolders(), listDocuments(), resolveFolderPath()
   ├─ 🟢 Arborescence             → folders (+ compte de pièces, accès invités)
   ├─ 🟢 Table des pièces         → documents + document_versions + checklist_item_documents
   ├─ 🟡 Panneau de détail        → infos réelles, mais versions et journal RETIRÉS (pas inventés)
   └─ 🔴 Dépôt de fichiers        —  ATTEND : Storage + register_document
🔴 Partage et accès               —                     ATTEND : permissions, create_invitation
🔴 Lever                          —                     ATTEND : raises, save_raise (écrans déjà faits)
🔴 Investisseurs                  —                     ATTEND : raise_investors
🔴 Activité (journal)             —                     ATTEND : audit_log par opération
🔴 Visionneuse                    —                     ATTEND : /api/viewer (existe en V1, complet)
```

## Le reste du produit

```
🔴 Invitations et demandes        —                     ATTEND : invitations
🔴 Activité globale               —                     ATTEND : audit_log par organisation
🔴 Recherche                      —                     ATTEND : documents + folders + deals
🔴 Équipe                         —                     ATTEND : memberships, profiles
🔴 Sécurité                       —                     ATTEND : MFA, audit_log
🔴 Abonnement                     —                     ATTEND : org_active, plans
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

**Règles pures.** `domain/operation.ts`, `domain/activity.ts`,
`domain/documents.ts` — testables sans base ni mock. 46 tests. Toute logique
qui ne fait pas d'entrée-sortie a vocation à y descendre.

## Décisions

**Tranchée — le dépôt à la racine** (30 juillet 2026). `documents.folder_id`
est devenu nullable (`20260731210000_documents_racine.sql`) : on dépose
d'abord, on range ensuite, ou jamais.

Conséquence à connaître : **une pièce à la racine ne se partage pas.** Un accès
se pose sur un dossier ; sans dossier, il n'y a nulle part où accorder — ni
retirer — un droit. La racine est donc réservée à l'équipe interne, et le geste
qui partage une pièce est celui qui la range.

**En attente** — deux choix produit, tous deux sur la fidélité des maquettes :

1. **Pas de visibilité par pièce** — le droit se pose sur le DOSSIER
   (`permissions.folder_id`). Les maquettes montrent « Masquée aux invités »
   par document. Dériver du dossier (ce qui est fait), ou migrer ?
2. **`doc_status` n'a que quatre valeurs** (`uploading`, `processing`, `ready`,
   `failed`). Les maquettes en montrent sept — « À actualiser », « Archivée »
   n'existent pas en base.

## L'ordre qui reste

Le chemin le plus court vers un produit utilisable de bout en bout :

1. **Dépôt de fichiers** — la base est prête (racine autorisée) ; reste le
   téléversement vers le bucket privé puis `register_document`.
2. **Visionneuse** — l'API V1 (`/api/viewer`) est complète et sérieuse :
   filigrane incrusté dans les pixels, audit page par page. Il s'agit de la
   brancher, pas de l'écrire.
3. **Partage et accès** — invitations, niveaux, expirations.
4. **Préparation et vue d'ensemble** — les exigences existent déjà en base,
   posées à la création de l'opération.
5. **Le reste** — recherche, équipe, activité globale, abonnement.
