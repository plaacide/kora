# Arbre des connexions — V2

La boussole du branchement : ce qui lit vraiment la base, ce qui affiche encore
des données écrites en dur, et ce qui manque côté serveur pour finir.

**Dernière vérification : 31 juillet 2026 (soir)**, branche `v2/rebuild`, par
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
🟡 Préparation (exigences)        listRequirementsFull(), requirementDetail(), requirementHistory()
   ├─ 🟢 Plan (écran 11)          → checklist_items + preuves + dossier attendu
   ├─ 🟢 Détail (écran 12)        → preuves, journal, statut, retrait de preuve
   ├─ 🟢 Ajouter une exigence     add_checklist_item()
   ├─ 🟢 Poser le référentiel     apply_checklist_template()
   └─ 🔴 Import d'une liste (13)  —                     ATTEND : extraction + colonne de provenance
🟢 Data room                      listFolders(), listDocuments(), resolveFolderPath()
   ├─ 🟢 Arborescence             → folders (+ compte de pièces, accès invités)
   ├─ 🟢 Table des pièces         → documents + document_versions + checklist_item_documents
   ├─ 🟢 Détail, versions, journal → document_versions + audit_log ; restaurer et remplacer
   ├─ 🟢 Dépôt (écran 16)         → Storage direct + register_document, % réel, annulation
   └─ 🟢 Associations (écran 17)  → suggestions depuis le modèle + attach_checklist_document
🟢 Partage et accès               listAccesses(), shareableFolders(), countActiveAccesses()
   ├─ 🟢 Assistant (écrans 20-23) → createInvitation() V1 : RPC + lien + e-mail
   ├─ 🟢 Tableau (écran 24)       → invitations + ndas + permissions + audit_log
   ├─ 🟢 Aperçu invité (écran 25) → dossiers et pièces réellement ouverts
   └─ 🔴 Révocation               —                     ATTEND : RPC revoke_invitation
🔴 Lever                          —                     ATTEND : raises, save_raise (écrans déjà faits)
🔴 Investisseurs                  —                     ATTEND : raise_investors
🔴 Activité (journal)             —                     ATTEND : audit_log par opération
🟢 Visionneuse                    → /api/viewer, filigrane incrusté, audit par page
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

**Tranchée — l'accès ne se restreint pas à l'invitation** (31 juillet 2026).
`accept_invitation` accorde TOUS les dossiers racine au niveau de
l'invitation ; rien ne retient « cette invitation n'ouvre que ces
dossiers-là ». L'assistant DIT donc ce qui s'ouvrira au lieu d'offrir un choix
qui serait ignoré. Restreindre reste possible après, via `set_permission`.

**En attente** — les choix produit, tous sur la fidélité des maquettes :

1. **Pas de visibilité par pièce** — le droit se pose sur le DOSSIER
   (`permissions.folder_id`). Les maquettes montrent « Masquée aux invités »
   par document. Dériver du dossier (ce qui est fait), ou migrer ?
2. **La préparation : trois états contre six, et pas de niveau.**
   `checklist_status` vaut `todo | in_progress | done`. Les maquettes montrent
   « À actualiser », « Non applicable », « En vérification », plus trois
   niveaux (Requis / Recommandé / Optionnel) et une juridiction. Rien de tout
   cela n'existe en base. Trois catégories aussi, là où les maquettes en
   montrent huit — et `ohada | financier | dfi` tient plus du financeur que du
   domaine.
3. **Révoquer un accès demande une migration.** Aucune RPC ne révoque, et
   `invitations` n'a pas de politique UPDATE : le bouton semblerait marcher
   sans rien fermer.
4. **`doc_status` n'a que quatre valeurs** (`uploading`, `processing`, `ready`,
   `failed`). Les maquettes en montrent sept — « À actualiser », « Archivée »
   n'existent pas en base.

## L'ordre qui reste

Le chemin le plus court vers un produit utilisable de bout en bout :

1. ~~Dépôt de fichiers~~ — fait le 31 juillet.
2. ~~Visionneuse~~ — fait le 31 juillet.
3. ~~Partage et accès~~ — fait le 31 juillet. Reste la révocation, qui demande
   une migration.
4. ~~Préparation~~ — fait le 31 juillet. Reste l'écran 13 (import d'une liste
   reçue), qui demande une extraction et une colonne de provenance.
5. **Vue d'ensemble** — dépend des deux précédents (prochaine action,
   progression, activité récente). C'est la suite immédiate.
6. **Le reste** — recherche, équipe, activité globale, abonnement.
