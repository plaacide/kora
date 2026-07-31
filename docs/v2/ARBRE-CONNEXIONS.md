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
   ├─ 🟢 Périmètre choisi         invitation_folders + create_invitation(p_folders)
   ├─ 🟢 Pièces masquées          documents.hidden_from_guests + set_document_hidden()
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

**Tranchée — l'invitation porte son périmètre** (31 juillet 2026).
`accept_invitation` accordait TOUS les dossiers racine. La migration
`20260731230000_invitation_perimetre` ajoute `invitation_folders` : l'assistant
fait choisir les dossiers, et l'acceptation n'ouvre que ceux-là.

Deux états à ne pas confondre : **aucun périmètre enregistré** vaut « toute la
data room, y compris ce qui sera créé plus tard » — c'est l'ancien
comportement, conservé pour la V1 et les invitations déjà envoyées. Une
**sélection** fige au contraire la liste.

**Tranchée — une pièce se masque, sans changer de dossier** (1er août 2026).
Le droit se pose sur le dossier ; ouvrir « Financier » ouvrait ses douze
pièces. `documents.hidden_from_guests` (migration `20260801090000`) permet d'en
retirer une sans la déplacer.

Le masquage est une propriété de la PIÈCE, pas de l'invitation : il se décide
dans la data room, devant le fichier, et vaut pour tous les invités présents et
à venir. Un masquage par invité serait un état qu'aucun écran ne montre en
entier. L'assistant de partage le LIT et annonce les exceptions au moment de
choisir les dossiers.

La RLS cache jusqu'au NOM : un invité ne sait pas que la pièce existe.

**Tranchée — les exigences ont deux axes** (1er août 2026).
`category` valait `ohada | financier | dfi` : des financeurs déguisés en
domaines, et uniques, donc une exigence réclamée par une banque ET un bailleur
devait choisir. Séparé en `domain` (8 valeurs, celles des maquettes) et
`sources` (plusieurs par exigence), plus `level` qui manquait entièrement.

Sur les six états des maquettes, quatre sont stockés — `not_applicable`
rejoint les trois existants, il a son geste. « À actualiser » se DÉDUIT de
`freshness_days` et de la date de la preuve : « Extrait RCCM de moins de
3 mois » portait déjà la règle dans son intitulé. « En vérification » est
écarté tant qu'aucun geste ne le produit.

**Tranchée — la révocation** (1er août 2026). `revoke_invitation` passe le
statut, supprime les permissions sur l'opération et journalise. Vérifié sur un
compte invité réel : plus rien de visible, jeton rejoué refusé.

**Tranchée — la lecture d'un invité suit ses droits** (1er août 2026).
Vérification faite sur un vrai compte invité, après acceptation d'une
invitation portant sur deux dossiers sur six : il lisait les six dossiers, les
vingt-quatre noms de pièces et leurs clés de stockage. Ses DROITS étaient
justes (`none` partout ailleurs, contenu inaccessible), mais le nom suffit à
trahir. `can_see_deal` ouvrait la lecture de toute l'opération dès qu'un droit
existait quelque part — défendable quand le partage était tout ou rien, plus
depuis que l'assistant fait décocher des dossiers.

`20260801120000_cloisonnement_par_dossier` aligne la lecture sur le droit, et
ferme la checklist aux invités : elle disait ce qui manque encore au dossier.
⚠️ Cette migration change aussi ce qu'un invité V1 voit en production.

**En attente** — les choix produit, tous sur la fidélité des maquettes :

1. **`doc_status` n'a que quatre valeurs** (`uploading`, `processing`, `ready`,
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
