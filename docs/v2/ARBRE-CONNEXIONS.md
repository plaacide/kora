# Arbre des connexions — V2

La boussole du branchement : ce qui lit vraiment la base, ce qui affiche encore
des données écrites en dur, et ce qui manque côté serveur pour finir.

**Dernière vérification : 6 août 2026**, branche `v2/rebuild` — la branche
Programme ci-dessous. Le reste de ce document date du **1er août** et n'a pas
été revérifié depuis.

**Vérification d'origine : 1er août 2026**, branche `v2/rebuild`. Établie en
re-dérivant depuis le code — quels écrans importent `features/v2/server/*` — et
en interrogeant la base de staging pour l'état réel des migrations. Ce document
se périme : le relire avant de s'y fier.

## Ce qui a changé le 1er août

**Les erreurs ne fuient plus.** Cinquante-sept retours d'échec portaient une
chaîne libre, dont trente-six le message Postgres brut ; les vingt-quatre
messages humains écrits dans les écrans étaient inatteignables. `CodeErreur` est
désormais une union fermée et `Echec` ne porte aucun texte — voir
[ADR-001](ADR-001-frontiere-des-erreurs.md).

**Les paramètres d'une levée sont validés.** `saveV2Raise` n'écrivait rien de
plus que ce qu'on lui donnait : fourchette de ticket inversée, part de capital à
250 %, devise inventée. Les règles du §27 vivent dans `domain/levee-schema.ts`,
testées.

**L'onboarding ne part plus deux fois.** Ses quatre formulaires n'avaient aucun
état d'envoi ; un second clic sur connexion lente créait deux organisations.

## Comment lire

| Marque | Sens |
|---|---|
| 🟢 | Branché — l'écran lit ou écrit la vraie base |
| 🟡 | Partiel — une partie lit la base, le reste est en dur |
| 🔴 | Fixture — aucune donnée réelle, tout est écrit dans le fichier |

**Un écran branché mais inatteignable ne compte pas.** Trois fois de suite,
un écran a été bâti sur une URL que rien ne proposait — écrans 16/17/13 le
31 juillet, `/investors` et `/activite` le 2 août — pendant que le chemin
réellement parcouru servait des fixtures. Vérifier depuis le RAIL, pas depuis
l'URL qu'on vient d'inventer.

## Ce qui mène où

```
Rail global      Accueil · Opérations · Invitations · Recherche
                 Équipe · Sécurité · Aide
Rail opération   Vue d'ensemble · Préparation · Partage et accès · Lever · Activité
Onglets Lever    Vue de la levée · Pipeline · Engagements · Mises à jour
```

`/v2/abonnement` a été ajouté au rail global le 3 août. Il y était inatteignable
— un écran qu'aucun chemin ne dessert n'existe pas pour celui qui l'utilise.

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
   └─ 🔴 Pipeline investisseurs   —                     La base est prête depuis
                                    le 1er août : `raise_investors` et
                                    les interactions existent. Le bloc de
                                    la maquette 10 reste à écrire.

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
   ├─ 🟢 Pièces HORS DOSSIER      lues depuis le 1er août. Le dépôt les
   │                                acceptait depuis toujours — c'est même le
   │                                seul endroit possible sans structure — mais
   │                                l'écran ne listait que les dossiers.
   │                                38 fichiers étaient invisibles sur une
   │                                seule opération.
   ├─ 🟢 Table des pièces         → documents + versions + exigences
   ├─ 🟢 Consultations            guestViewsByDocument() — EXTERNES SEULEMENT.
   │                                « 12 vues » ne dit rien si onze viennent de
   │                                l'équipe qui a déposé le fichier.
   ├─ 🟢 Menu « ⋯ » d'une pièce   ouvrir, renommer, déplacer, pièce clé,
   │                                masquer, supprimer. Les six options
   │                                affichées n'agissaient AUCUNE, « Supprimer »
   │                                comprise — le pire cas : on la croit faite.
   ├─ 🟢 Menu « ⋯ » d'un dossier  ouvrir, renommer, sous-dossier, supprimer.
   │                                La suppression refuse un dossier non vide :
   │                                un rangement n'emporte pas ce qu'il range.
   ├─ 🟢 Renommer sur place       le nom devient le champ ; le clic ailleurs
   │                                enregistre. Même geste depuis le menu.
   ├─ 🟢 Trois actions            ajouter, partager, créer un dossier.
   │                                « Request files » écartée : réclamer un
   │                                document est une fonctionnalité entière.
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

🟢 Lever                          activeRaise(), closedRaises()
   ├─ 🟢 Non configurée (35)      create_raise()
   ├─ 🟢 Configurer (36)          save_raise() — nom, stade, montant, devise,
   │                                instrument, valorisation, échéance, audience,
   │                                et depuis le 4 août : ticket min/max,
   │                                investisseur principal, part de capital,
   │                                usage des fonds. L'écran l'avouait :
   │                                « aucune colonne ne les porte ».
   ├─ 🟢 Vue de la levée (37)     → montants réels, progression calculée
   ├─ 🟢 Paramètres essentiels    ÉTAIENT ÉCRITS EN DUR : « Série A · Prise de
   │                                participation · 25 – 150 M XOF » s'affichait
   │                                sur toutes les levées, y compris une levée
   │                                vide. Un écran de synthèse qui invente ses
   │                                chiffres est pire qu'un écran vide.
   ├─ 🟢 Prochaines actions       prochainesActions() — dérivées du pipeline,
   │                                PAS d'une table de tâches : « relancer
   │                                Baobab » n'existe pas sans Baobab, et une
   │                                table séparée créerait des orphelines.
   ├─ 🟢 Activité récente         activiteRecenteLevee() → audit_log. Quatre
   │                                lignes inventées s'y affichaient.
   ├─ 🟢 Clôturer (45)            close_raise()
   ├─ 🟢 Pipeline (38-40)         → voir Investisseurs ci-dessous
   ├─ 🟢 Engagements (43-44)      commitments(), commitmentHistory()
   │  ├─ 🟢 Enregistrer (43)      save_raise_commitment() — un par investisseur
   │  ├─ 🟢 Ventilation (44)      confirmés / soft-commits / restant, calculés
   │  ├─ 🟢 Historique (44)       → audit_log : l'avant ET l'après, donc
   │  │                             « requalifié en » se reconstitue
   │  └─ 🟢 Retirer               delete_raise_commitment()
   └─ 🟢 Mises à jour (46-50)     updates(), update()
      ├─ 🟢 Liste (46)            → période, audience, état, consultations
      ├─ 🟢 Audience (47)         save_raise_update() — instrument × financeur
      ├─ 🟢 Indicateurs (48)      → catalogue de 18 définitions, suggérées par
      │                             famille ; valeurs saisies, jamais devinées
      ├─ 🟢 Commentaire           → résumé du dirigeant + demande
      ├─ 🟢 Vérification (49)     → l'aperçu destinataire, publiables seuls
      ├─ 🟢 Publiée (50)          publish_raise_update() — figée, versionnée
      ├─ 🟢 Correction V2         correct_raise_update() — la V1 reste lisible
      └─ 🟡 Consultations         seen_raise_update() existe ; rien ne l'appelle
                                    encore : l'écran destinataire n'est pas fait
(Investisseurs)                   → l'onglet Pipeline de Lever, ci-dessus.
                                    La route `/operations/:id/investors`
                                    redirige : elle n'était dans aucun rail.
   ├─ 🟢 Colonnes (38)            → sept étapes, tickets cumulés par colonne
   ├─ 🟢 Tableau (39)             → étape, accès, ticket : trois colonnes distinctes
   ├─ 🟢 Ajouter / modifier (40)  save_raise_investor() — 8 champs, listes fermées
   ├─ 🟢 Retirer                  delete_raise_investor()
   ├─ 🟢 Accès documentaire       DÉDUIT des invitations, par l'adresse
   ├─ 🟢 Interactions (41-42)     pipelineInteractions()
   │  ├─ 🟢 Historique            dans la fiche de la relation
   │  ├─ 🟢 Consigner (42)        save_raise_interaction() — six types fermés
   │  │                             la prochaine action REMONTE sur la relation
   │  └─ 🟢 Retirer               delete_raise_interaction()
   └─ 🟢 Fiche de relation (41)   panneau de 560 px, six onglets
      (« Questions » de la maquette écarté : le produit n'en porte pas)
      ├─ 🟢 Résumé                étape, accès, engagement, dernière interaction
      ├─ 🟢 Interactions          l'historique complet
      ├─ 🟢 Activité documentaire document.page_viewed — visites DÉDUITES
      │                             (bursts à trente minutes), pas de durée :
      │                             aucune n'est enregistrée
      ├─ 🟢 Accès                 l'invitation qui correspond à l'adresse
      ├─ 🟢 Engagements           l'engagement déclaré, sa preuve
      └─ 🟢 Notes internes        jamais visibles par l'investisseur
🟢 Activité (journal)             operationJournal()    → audit_log de l'opération
🟢 Visionneuse                    → /api/viewer, filigrane incrusté, audit par page
   ├─ 🟢 En surcouche             posée SUR la data room, fond translucide,
   │                                clic à côté pour refermer. Consulter une
   │                                pièce n'est pas quitter la data room.
   ├─ 🟢 PDF et bureautique       rendus page par page, filigrane dans les
   │                                pixels — jamais en CSS, qui se retire.
   ├─ 🟢 Images                   passent par le même canvas : servir un JPEG
   │                                tel quel le rendrait récupérable d'un clic
   │                                droit. Plafonnées à 1800 px de large.
   ├─ 🟢 Tableurs                 SheetView, en grille. Il existait déjà pour
   │                                la V1 et n'était pas branché ici. Un modèle
   │                                financier en image perd ses colonnes.
   ├─ 🟢 Zoom, plein écran        le zoom agit sur la largeur affichée, pas sur
   │                                l'échelle de rendu : redemander chaque page
   │                                relancerait autant de conversions.
   ├─ 🟢 Barre effaçable          après 2,6 s d'immobilité — elle mange un
   │                                cinquième de la page sur un portable.
   └─ ⚪ Vidéos                    sans aperçu : un flux relève d'un autre
                                    modèle, et le filigrane ne s'y applique pas.
```

## Le reste du produit

```
🟢 Invitations et demandes        inbox()               → access_requests + mes_invitations()
   ├─ 🟢 Liste (65)               → à traiter / traitées, deux sources mêlées
   ├─ 🟢 Examiner (26)            decide_access_request() — crée les permissions
   └─ 🔴 Cohorte (31-32)          —                     ATTEND : cohort_links
🟢 Activité globale               organizationJournal() → même écran, autre portée
                                  (rejoint depuis l'accueil : le rail n'a pas
                                   d'entrée, la maquette n'en prévoit pas)
🟢 Recherche                      searchDocuments()     → documents par nom, filtrées
                                                        par opération, chemin complet
🟢 Équipe (33)                    teamMembers(), myRole(), pendingInvitations()
   ├─ 🟢 Tableau                  memberships + profiles + audit_log
   │                                les `guest` sont écartés À LA LECTURE
   ├─ 🟢 Gérer un rôle            set_member_role() — dernier propriétaire,
   │                                retrait de soi, admin qui se promeut : refusés
   ├─ 🟢 Retirer                  remove_member() — dépôts et journal conservés
   ├─ 🟢 Inviter                  invite_member() + e-mail + lien de secours
   ├─ 🟢 Révoquer                 revoke_org_invitation()
   ├─ 🟢 Rejoindre                accept_org_invitation()
   │                                /v2/rejoindre-equipe, HORS du poste de
   │                                pilotage : l'invité n'est pas encore membre
   └─ ⚪ Périmètre par opération  n'existe pas, et ne sera pas fait : arbitrage
                                    du fondateur le 2 août. Un interne voit
                                    toutes les opérations ; la colonne le dit.
🟢 Sécurité (34)                  securityState(), securityJournal()
   ├─ 🟢 TOTP                     enroll / challenge / verify / unenroll
   │                                côté navigateur : Supabase exige la session
   ├─ 🟢 Journal de sécurité      log_security_event() — actions fermées,
   │                                organisation déduite de l'appelant
   ├─ 🟢 Fermer les autres        signOut scope « others »
   ├─ ⚪ Liste des appareils      Supabase ne l'expose pas. L'écran le dit.
   └─ ⚪ Codes de récupération    non faits : les générer serait facile, les
                                    faire fonctionner ne l'est pas
🟢 Abonnement (68)                workspacePlan(), workspaceConsumption()
   ├─ 🟢 Plan en cours            les neuf plans, leurs prix réels en base
   ├─ 🟢 Usage                    compté sur les données, jamais incrémenté
   ├─ 🟢 Opérations comptées      une archive ne compte pas
   ├─ 🟢 Droits du plan           43 fonctionnalités, entitlements par plan
   ├─ 🟢 Changer de plan          set_workspace_plan() — §14 montée immédiate,
   │                                §15 descente ANNONCÉE. L'écran porte enfin
   │                                le bouton : choix du plan, de l'intervalle
   │                                et du moyen, puis paiement.
   ├─ 🟢 Moyen de paiement        CHOISI CHEZ LE PRESTATAIRE, pas chez nous.
   │                                L'écran demandait le moyen et le numéro
   │                                que Genius Pay redemande sur sa page :
   │                                double saisie, et une donnée personnelle
   │                                collectée sans usage. Sa page connaît en
   │                                plus les opérateurs du pays du payeur.
   ├─ 🟢 Revenir au plan gratuit  aucun paiement ouvert — l'écran proposait
   │                                « Payer » sur un plan à zéro franc. C'est
   │                                une descente : annoncée, effet au terme.
   ├─ 🟢 Résilier                 cancel_workspace_subscription(), en fin de
   │                                période payée et jamais immédiat. L'écran
   │                                dit AVANT le clic : la date jusqu'à
   │                                laquelle le service est dû, qu'aucune
   │                                donnée n'est supprimée, et qu'on peut
   │                                revenir en arrière.
   ├─ 🟢 Prestataire de paiement  deux implémentations : MANUEL (virement,
   │                                facture) et GENIUS PAY — mobile money,
   │                                cartes, et le RÉCURRENT. Choisi par
   │                                SANZA_BILLING_PROVIDER. Voir GENIUSPAY.md.
   ├─ 🟢 Recevoir un paiement     /api/v2/billing/webhook → apply_billing_event()
   │                                signature HMAC vérifiée, fenêtre 5 min,
   │                                bac à sable cloisonné du réel, idempotence
   │                                garantie par l'unicité en base. Éprouvé :
   │                                anon et client refusés, rejeu neutralisé.
   ├─ 🔴 Renouvellement réel      non confirmé par leur documentation. Aucune
   │                                phrase du produit ne dit « automatique »,
   │                                et un test le vérifie. À réécrire quand ils
   │                                répondront — pas avant.
   ├─ 🟢 Essayé pour de vrai      1er août : paiement Wave 21 750 XOF, webhook
   │                                signé reçu 11 s après, plan ouvert seul.
   ├─ 🟢 Factures                 émises par SANZA, pas par le prestataire :
   │                                eux encaissent, ils ne vendent rien.
   │                                Numérotation continue et sans trou par
   │                                année, sous verrou. Pas de PDF : rien n'en
   │                                produit, et un lien qui ne télécharge rien
   │                                est pire qu'une colonne absente.
   ├─ 🟢 Courriers                 souscription, renouvellement, résiliation.
   │                                Aucun ne dit « automatique » — un test le
   │                                vérifie. Celui de résiliation ne retient
   │                                personne. Un seul point d'envoi pour les
   │                                deux chemins de paiement, sinon un client
   │                                recevrait deux confirmations.
   ├─ 🟡 Conforme aux écrans 75-77 forme ET états. Les six états vivent dans
   │                                `billing/etat.ts`, en logique pure : un
   │                                seul endroit décide, dix-sept tests disent
   │                                quoi. Reste le tableau des factures, qui
   │                                attend la première facture réelle.
   │                                DIVERGENCE ASSUMÉE : le handoff parle d'un
   │                                seul état « lecture seule après échéance ».
   │                                Notre modèle en distingue deux — l'impayé,
   │                                qui doit de l'argent, et le résilié, qui ne
   │                                doit rien et retombe au plan gratuit. Les
   │                                confondre traiterait un client parti
   │                                proprement comme un mauvais payeur.
   ├─ 🟢 Reprendre un abonnement  resume_workspace_subscription() : lève la
   │                                résiliation sans recalculer la période,
   │                                sinon résilier puis se raviser offrirait
   │                                un mois. L'écran promettait ce retour,
   │                                rien ne savait le faire.
   └─ 🟢 Faire respecter la limite trois triggers, faits le 3 août : créer une
                                    opération, ajouter un collaborateur,
                                    inviter un externe. En base et non dans
                                    les écrans, parce qu'un contrôle qui ne
                                    vit que dans l'application se contourne
                                    en appelant la RPC. Les refus sont mis en
                                    mots par `billing/limites.ts`.
                                    JAMAIS TESTÉ DANS UN NAVIGATEUR : vérifié
                                    sous identité authentifiée en SQL, pas sur
                                    l'écran, faute d'un compte accessible.
```

## Ce que le rail affiche

```
🟢 Nom de l'opération       le rail affichait « Série A 2026 · Levée en
                            capital » sur TOUTES les opérations, dossier
                            bancaire compris.
🟢 Sélecteur d'opérations   listOperationNames() — trois noms de maquette s'y
                            affichaient, et chacun renvoyait à la liste au lieu
                            d'ouvrir l'opération. Un sélecteur qui ne
                            sélectionne rien. Les archivées viennent avec,
                            signalées.
🟢 Badge Privée/Partagée    suit un accès ouvert, non l'écran regardé
🟢 Préparation  1/16        preparationProgress() — requis seul, comme l'écran
🟢 Bandeau      « Partagée — 1 accès actif »  countActiveAccesses()
🔴 Partage et accès         la maquette 24 montre un badge, pas encore branché
🔴 Investisseurs, Lever     pas de badge
```

## Largeur des écrans

Neuf écrans s'arrêtaient entre 820 et 1130 px quand le conteneur global en
offre 1380 : leurs colonnes se serraient pendant qu'un tiers de l'écran restait
blanc. Portés à 1380 le 4 août — data room, préparation, journal, vue
d'ensemble, accueil, opérations (860 auparavant, le plus étranglé), recherche,
équipe.

Restent étroits, et ce n'est pas un oubli : **abonnement, sécurité, invitations
et les assistants** portent du texte de décision. Une ligne à 1380 px se lit
mal, et la maquette 76 fixe 820 pour l'abonnement.

Deux questions ouvertes, qui pèsent plus que ces neuf nombres : relever le
plafond global au-delà de 1380 sur les très grands écrans, et rendre la colonne
contextuelle repliable — ses 240 px permanents coûtent plus que tout ce qui a
été gagné.

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

**Accorder une demande ouvre vraiment la porte** (2 août).
`decide_access_request` ne pose pas une étiquette : elle crée les permissions
sur les dossiers de l'opération. Vérifié — six permissions au niveau filigrane,
et `access_request.granted` au journal. L'écran le dit, parce qu'un fondateur
qui croit ranger un message ouvrirait sa data room sans le savoir.

**Le pipeline a deux axes** (2 août). `statut` mélangeait une ÉTAPE, un
ENGAGEMENT et une ISSUE : un investisseur en diligence ayant soft-committé ne
pouvait afficher qu'une des deux. Sept étapes, cinq engagements. `nda`
disparaît — il décrivait un ACCÈS, qui se lit dans les invitations ; `refuse`
devient un engagement retiré sans effacer l'étape atteinte.

**Pays et fonction sont des listes** (2 août). Saisis à la main, ils
produisaient « Cote d'ivoire », « RCI » et « Côte d'Ivoire » dans la même base.
La ZONE ne se saisit pas : elle se déduit du pays, sans quoi « Ghana · Afrique
de l'Est » finirait par exister sans que personne puisse trancher.

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
6. ~~**Le vocabulaire des rôles d'équipe.**~~ Tranché le 2 août : `org_role`
   porte désormais `internal_viewer`. Reste l'écran (33), pas la base.
7. **Le fuseau horaire d'une organisation**, pour que les échéances tombent à
   minuit local.
8. **Les conditions d'une levée.** La maquette 36 demande ticket minimum et
   maximum, recherche d'un lead et part de capital envisagée. Aucune colonne ne
   les porte.
9. **La liste des pays de l'onboarding** en propose cinq, écrits en dur, alors
   que `domain/geographie` en tient cinquante-huit rangés par zone. Les deux
   devraient être la même liste.
10. ~~**La ventilation du montant sécurisé.**~~ Faite le 2 août :
   `raise_commitments` porte une ligne par investisseur et `montant_engage`
   n'est plus saisi — il est recalculé.

## Migrations

Toutes appliquées sur staging (`jourzsgjnutktsrgxkoo`), y compris
`lecteur_interne`, `engagements`, `mises_a_jour`, `gerer_l_equipe`,
`inviter_un_collaborateur`, `journal_de_securite` et
`interactions_pipeline`, `engagement_de_la_relation`, `socle_abonnements`,
`changer_de_plan` et `descente_differee`. Aucune n'est en attente.

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
5. ~~Lever~~ — fait. Vue, pipeline, engagements et mises à jour sont branchés.
6. ~~Investisseurs~~ — fait le 1er août. Restent les interactions (41-42).
7. ~~Équipe~~ — faite le 2 août, invitation comprise. Le périmètre par
   opération est écarté : le fondateur l'a tranché, ce n'est pas un manque.
8. ~~Interactions du pipeline~~ et ~~fiche de relation~~ — faites le 3 août.
9. **Cohortes** (31-32) — `cohort_links` n'existe pas.
10. ~~Sécurité~~ — faite le 2 août. Restent les codes de récupération, qui
   demandent une mécanique de secours propre.
11. ~~Abonnement~~ — complet le 4 août : socle, entitlements, limites, écrans
   75-77, six états, paiement Genius Pay éprouvé sur une vraie transaction,
   factures émises, courriers envoyés. Ne restent que des dépendances externes
   et un choix commercial :
   - **le PDF des factures** — rien ne le produit. L'écran propose d'écrire
     plutôt que d'afficher un lien qui ne télécharge rien.
   - **le prorata** — « À régler aujourd'hui » affiche le tarif plein. La
     règle est commerciale, pas technique : c'est au fondateur de la poser.
   - **ce qui dépend de Genius Pay** : aucun événement `subscription.*` dans
     leur tableau de bord, donc pas de reconduction ; aucune redirection
     automatique après paiement ; aucune personnalisation de leur page.

## Ce qui reste, tout écran confondu

### 1. Réglages d'une opération — PRIORITÉ, décidée le 1er août

**Presque rien ne permet de modifier une opération après sa création.** Ni son
nom, ni son montant, ni sa devise, ni son étape, ni l'exigence de NDA ; ni de la
supprimer. Le dossier de l'opération contient `overview`, `preparation`,
`documents`, `access`, `lever`, `investors`, `activity` — et aucun `settings`.

**L'archivage, lui, est branché** (1er août) : le menu « ⋯ » ouvre une fenêtre
qui nomme la vraie opération et appelle `set_deal_archived`. La remise en
activité passe par le même chemin. C'est le seul geste de réglage qui existe.

C'est ce trou qui a fait retirer quatre options du menu « ⋯ » plutôt que de les
laisser ne rien faire : « Modifier », « Dupliquer la structure », « Exporter
l'index », et « Clôturer ».

**« Clôturer une opération » n'a aucun support en base, et c'est une question
produit ouverte.** `deal_stage` — sourcing, screening, due diligence, ic,
signed, passed — décrit l'avancement d'un dossier côté investisseur, hérité de
la V1. La clôture qui existe vraiment est celle d'une LEVÉE (`close_raise`), et
elle a son écran. Reste à décider si une opération de fondateur doit pouvoir se
clôturer autrement qu'en s'archivant.

**Tout est prêt en base**, rien n'est à écrire côté SQL :

| Section | Fonction |
|---|---|
| Identité — nom, type, montant, devise | `update_deal` |
| Étape — sourcing → signé | `set_deal_stage` |
| NDA avant consultation | `set_deal_nda` |
| Recalculer la numérotation | `reindex_deal` |
| Archiver — réversible, sort du décompte du plan | `set_deal_archived` |
| Supprimer — irréversible | `delete_deal` |

C'est aussi l'endroit où « Supprimer » a sa place, et non dans le menu d'une
ligne de liste où l'on clique en passant : on arrive dans les réglages
délibérément, après avoir lu le reste.

**Question ouverte, à trancher avant d'écrire la suppression** : doit-elle
effacer aussi les fichiers du stockage ? Aujourd'hui la cascade en base ne les
touche pas — c'est ce qui a permis de reconstruire *Pre-seed 2nd Round* le
1er août — mais cela signifie qu'un client qui supprime croit avoir effacé
alors que les fichiers restent.

### Le reste

- **Cohortes** (31-32) — **CE DOCUMENT SE TROMPAIT** : `cohort_links` existe,
  ainsi que `cohorts`, `cohort_members`, `cohort_snapshots`, et sept fonctions
  dont `invite_to_cohort`, `accept_cohort_link`, `revoke_cohort_link` et
  `program_cohorts`. Ce qui manque n'est pas le socle mais **une lecture** —
  `mes_invitations`, appelée par `inbox()` et absente de la base — et le
  branchement des écrans sur elle. Les écrans sont fermés depuis `ef94371` ;
  ils affichaient des fixtures et ignoraient le jeton de l'URL.
- **Pipeline investisseurs dans Vue d'ensemble** (maquette 10).
- **Consultations des mises à jour** — `seen_raise_update()` existe et n'est
  appelée nulle part : on ne sait pas qui a lu quoi.
- **Import d'une liste** (13), **badges du rail**, **codes de récupération**.
- **Usage des fonds** — la colonne existe et la vue de levée l'affiche, mais
  aucun champ ne permet encore de le saisir : il faudrait une petite liste de
  postes avec leurs parts.
- **Vidéos dans la visionneuse** — sans aperçu. Un flux relève d'un autre
  modèle de lecture, et le filigrane ne s'y applique pas de la même façon.
- **Le PDF des factures** — rien ne le produit ; l'écran propose d'écrire.
- **Chercher une exigence ou un dossier** — la recherche ne porte que sur les
  pièces.
- **Les limites n'ont jamais été éprouvées dans un navigateur** : vérifiées en
  SQL sous identité authentifiée, jamais sur l'écran, faute d'un compte
  accessible.


---

## Le parcours programme

**Re-dérivé le 6 août 2026, en fin de journée** : quels fichiers existent sous
`src/app/v2/(programme)`, `(vitrine)` et `(onboarding)/onboarding/programme`,
et lesquels importent quoi que ce soit de `features/v2/server`.

**LES QUARANTE-SEPT ÉCRANS SONT INTÉGRÉS.** Lots A à I, plus les neuf écrans
de complément versés le 6 août à midi — accueil du programme, demandes,
rapports, cohorte peuplée, dealrooms et rapports de cohorte, demandes et
activité d'une Dealroom, et la vue entreprise d'un Challenge. **Plus aucun
écran d'attente dans le parcours.** Ce qui reste est le branchement, pas
l'intégration.

**Mouvement** : entrées de page branchées sur `TRANSITIONS.md` — tiroir 480 ms,
modales en fondu montant, cascade de listes à 40 ms, mouvement réduit à 150 ms.
Ce qui répond sous le doigt (états de pression, chargement, succès) attend le
branchement : aucun de ces boutons n'écrit encore.

**Un seul fichier de ce parcours lit la base** : `(programme)/layout.tsx`, pour
savoir qui est connecté. **Aucun écran** ne lit ni n'écrit — tous affichent les
fixtures des maquettes, conformément à l'ordre de travail du 29 juillet. C'est
un choix, pas un oubli : ne pas le compter comme une dette.

```
Rail programme   Accueil · Portefeuille · Cohortes · Dealrooms · Demandes ·
                 Rapports ⟂ Équipe · Sécurité · Abonnement · Aide
Nav de cohorte   Vue d'ensemble · Entreprises · Challenges ·
                 Questions & suggestions · Dealrooms · Rapports
```

### Entrer

```
🟢 Porte d'entrée /v2            metierDuCompte()      → profiles.account_type
   └─ un compte `sae` entre par ses cohortes, les autres par l'accueil
🟢 Sans organisation             → l'onboarding de SON métier, plus celui du
                                   fondateur pour tout le monde
🔴 Onboarding programme (00a-d)  —                     organisation, façon
                                   d'accompagner, première cohorte, espace prêt.
                                   N'ÉCRIT RIEN : « Créer la cohorte » est un
                                   lien. `save_programme` et `create_cohort`
                                   existent en base et ne sont pas appelées.
⚠️ Aucun chemin n'y mène          l'inscription propose « Un programme » mais
                                   ne redirige pas vers ce tunnel.
```

### Cohortes — lot B

```
🔴 01 Liste vide                 /v2/cohortes?etat=vide
🔴 02 Liste remplie              /v2/cohortes
🔴 03 Cohorte au premier jour    /v2/cohortes/saison-4-jour-1
🔴 04 Invitations en attente     /v2/cohortes/saison-4-jour-1/entreprises
🔴 05 Entreprises actives        /v2/cohortes/saison-4/entreprises
🔴 17 Une entreprise arrive      …/entreprises?arrivee=1
⚪ Vue d'ensemble peuplée        aucune maquette ne la montre
```

### Questions & suggestions — lot D

```
🔴 08 Le fil                     /v2/cohortes/[id]/questions
```

### Challenges — lot E

```
🔴 09  Aucun Challenge           /v2/cohortes/saison-4-jour-1/challenges
🔴 09b Quatre actifs             /v2/cohortes/saison-4/challenges
🔴 10  Bibliothèque Sanza        …/challenges/bibliotheque
🔴 16  Mes modèles               …/challenges/bibliotheque?onglet=miens
🔴 11  Créer de zéro             …/challenges/nouveau
🔴 12  Personnaliser un modèle   …/challenges/nouveau?modele=…
```

### Dealrooms — lots G et H

```
🔴 18 à 24   État vide, liste, assistant en quatre étapes, aperçu
🔴 25 à 28   Vue d'ensemble, entreprises publiées, audience, branding
```

### Investisseur, hors application — lot I

```
🔴 30 à 33   /v2/d/[dealroom] — accueil, filtres, fiche, demande d'accès
📧 29        docs/emails/dealroom-01-invitation-investisseur.html
```

### Portefeuille — lot C

```
🔴 06, 07    /v2/portefeuille — vide et rempli
```

### Les neuf écrans de complément — versés le 6 août

```
🔴 34  Accueil du programme          /v2/programme
🔴 35  Demandes, toutes Dealrooms    /v2/demandes
🔴 36  Rapports                      /v2/rapports
🔴 37  Cohorte — vue d'ensemble      /v2/cohortes/[id] (état peuplé)
🔴 38  Cohorte — Dealrooms           /v2/cohortes/[id]/dealrooms
🔴 39  Cohorte — Rapports            /v2/cohortes/[id]/rapports
🔴 40  Dealroom — Demandes           /v2/dealrooms/[id]/demandes
🔴 41  Dealroom — Activité           /v2/dealrooms/[id]/activite
🔴 42  Challenge — vue entreprise    /v2/challenges/[id] · CÔTÉ FONDATEUR
```

L'écran 42 est le seul du parcours à se placer du côté de l'entreprise : il a
sa propre coque, un bandeau et rien d'autre.

### Ce que la base a déjà, et que rien n'appelle

`cohorts`, `cohort_members`, `cohort_links`, `sae_portfolio()`,
`program_threads`, `program_notes`, `access_requests`, `mandates`,
`listing_consents`, `showcase_entries`, `showcase_access`, `save_programme()`,
`create_cohort()`, `invite_to_cohort()`. Rien de tout cela n'est appelé par le
parcours V2 : le branchement viendra quand les 38 écrans existeront.

**Rien n'existe en base pour les Challenges ni pour la Dealroom en tant
qu'objet** — voir [ADR-002](ADR-002-portee-de-la-dealroom.md) et
[ADR-003](ADR-003-critere-connecte-a-sanza.md).
