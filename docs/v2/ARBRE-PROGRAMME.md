# Arbre des connexions — Parcours Programme

La boussole du branchement du parcours **programme** — accélérateurs,
incubateurs, studios. Le parcours fondateur a le sien :
[ARBRE-CONNEXIONS.md](ARBRE-CONNEXIONS.md). Les deux ne se lisent pas ensemble :
ils n'ont ni le même rail, ni les mêmes écrans, ni les mêmes règles.

**Dernière vérification : 6 août 2026, en soirée**, branche `v2/rebuild`.
Re-dérivé depuis le code : quels fichiers existent sous `src/app/v2/(programme)`,
`(vitrine)`, `(entreprise)` et `(onboarding)/onboarding/programme`, lesquels
importent de `features/v2/server`, et quelles RPC sont réellement appelées.
Ce document se périme : le relire avant de s'y fier.

| Marque | Sens |
|---|---|
| 🟢 | Branché — l'écran lit ou écrit la vraie base |
| 🔴 | Fixture — aucune donnée réelle, tout est écrit dans le fichier |
| 📧 | Gabarit d'e-mail, pas une page |

**Les quarante-sept écrans sont intégrés.** Lots A à I, plus les neuf écrans de
complément versés le 6 août à midi. Plus aucun écran d'attente dans le
parcours. Ce qui reste est le branchement, pas l'intégration.

## Le compte, au fichier près

Le parcours porte **29 fichiers** : 25 pages et 4 coques.

| | Nombre |
|---|---|
| Pages en fixtures | **23** |
| Pages branchées | **2** — la liste des cohortes, les entreprises d'une cohorte |
| Coques branchées | **2** — la coque programme (garde de session), la nav de cohorte |
| Coques en fixtures | 2 — Dealroom, vitrine investisseur |

S'y ajoute, hors parcours mais branché de bout en bout, le **tunnel
d'inscription programme** — quatre écrans, quatre RPC.

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
🟢 Onboarding programme (00a-d)  ÉCRIT. Les quatre écrans appellent, dans
   organisation → save_programme      l'ordre : save_programme,
   accompagnement → set_programme_focus  set_programme_focus, create_cohort
   cohorte → create_cohort            (ou report), finish_programme_onboarding.
   prêt → finish_programme_onboarding
⚠️ Aucun chemin n'y mène          l'inscription propose « Un programme » mais
                                   ne redirige toujours pas vers ce tunnel.
```

### Cohortes — lot B · LE SEUL LOT BRANCHÉ

```
🟢 01 Liste vide                 /v2/cohortes?etat=vide     listerCohortes()
🟢 02 Liste remplie              /v2/cohortes               listerCohortes()
🔴 03 Cohorte au premier jour    /v2/cohortes/saison-4-jour-1
🟢 04 Invitations en attente     …/entreprises              listerInvitations()
🟢 05 Entreprises actives        …/entreprises              listerInvitations()
🔴 17 Une entreprise arrive      …/entreprises?arrivee=1
🟢 Nav de cohorte                lireCohorte()  — compteurs du panneau latéral
🟢 Inviter une entreprise        cohortes/actions.ts → invite_to_cohort
🔴 37 Vue d'ensemble peuplée     /v2/cohortes/[id]
```

Règles pures et testées : `features/v2/domain/cohorte.ts` — état d'une
invitation, ton du statut, période, effectif. 12 tests.

**Point à traiter au prochain lot :** `server/cohortes.ts` lit les tables en
direct (`.from("cohorts")`, `.from("cohort_members")`, `.from("cohort_links")`),
et non par une fonction à colonnes énumérées comme `sae_portfolio()`. Le
portefeuille, lui, doit suivre le patron — c'est l'objet d'
[ADR-004](ADR-004-canal-de-lecture-du-programme.md).

### Portefeuille — lot C

```
🔴 06, 07    /v2/portefeuille — vide et rempli
```

[ADR-004](ADR-004-canal-de-lecture-du-programme.md) **est tranchée** (6 août,
option B) : trois canaux courts composés dans l'application. Le lot peut partir.

### Questions & suggestions — lot D

```
🔴 08 Le fil                     /v2/cohortes/[id]/questions
```

`program_threads` existe (`20260728100000_dealroom_vitrine_demandes`) ; il lui
manque un rattachement à la cohorte. Aucune ADR ne bloque.

### Challenges — lots E et F

```
🔴 09  Aucun Challenge           /v2/cohortes/saison-4-jour-1/challenges
🔴 09b Quatre actifs             /v2/cohortes/saison-4/challenges
🔴 10  Bibliothèque Sanza        …/challenges/bibliotheque
🔴 16  Mes modèles               …/challenges/bibliotheque?onglet=miens
🔴 11  Créer de zéro             …/challenges/nouveau
🔴 12  Personnaliser un modèle   …/challenges/nouveau?modele=…
🔴 42  Vue entreprise            /v2/challenges/[id] · CÔTÉ FONDATEUR
```

**Rien n'existe en base.** [ADR-003](ADR-003-critere-connecte-a-sanza.md) **est
tranchée** (6 août, option B et ses deux clauses) : lecture énumérée,
désignation de l'opération présentée par l'entreprise, Challenge instancié par
copie, progression persistée.

L'écran 42 est le seul du parcours à se placer du côté de l'entreprise : il a
sa propre coque, un bandeau et rien d'autre.

### Dealrooms — lots G et H

```
🔴 18 à 24   État vide, liste, assistant en quatre étapes, aperçu
🔴 25 à 28   Vue d'ensemble, entreprises publiées, audience, branding
🔴 40, 41    /v2/dealrooms/[id]/demandes · /activite
🔴 38        /v2/cohortes/[id]/dealrooms
```

**Le modèle change de forme.** [ADR-002](ADR-002-portee-de-la-dealroom.md) **est
tranchée** (6 août, option B) : la Dealroom devient un objet de premier rang,
les `showcase_*` sont reprises puis supprimées, et les accords déjà donnés ne
se reportent pas.

### Investisseur, hors application — lot I

```
🔴 30 à 33   /v2/d/[dealroom] — accueil, filtres, fiche, demande d'accès
📧 29        docs/emails/dealroom-01-invitation-investisseur.html
```

[ADR-005](ADR-005-investisseur-externe.md) **est tranchée** (6 août,
**option B**, contre la recommandation) : **la Dealroom s'ouvre sans compte**,
qui reste proposé mais jamais exigé.

⚠️ Trois textes de la maquette deviennent faux et sont à réécrire avant
intégration — le lien « personnel » de l'écran 29, l'invitation « liée à
l'adresse » du 23, l'audience nominative du 27. Le lien EST l'accès.

### Le reste du rail

```
🔴 34  Accueil du programme          /v2/programme
🔴 35  Demandes, toutes Dealrooms    /v2/demandes
🔴 36  Rapports                      /v2/rapports
🔴 39  Cohorte — Rapports            /v2/cohortes/[id]/rapports
```

## Ce que la base a déjà, et que rien n'appelle encore

`sae_portfolio()`, `program_threads`, `program_notes`, `access_requests`,
`mandates`, `listing_consents`, `showcase_entries`, `showcase_access`.

`cohorts`, `cohort_members`, `cohort_links`, `create_cohort()`,
`invite_to_cohort()` et `save_programme()` **sont désormais appelées** — c'est
le lot 1.

## L'état de la base de staging

Projet `jourzsgjnutktsrgxkoo` (« Sanza V2 Staging »). L'autre projet,
`bileqzpguyynkktndazs`, est la **production** — ne pas y toucher.

Onze migrations du dépôt ne figurent pas au registre `schema_migrations`, mais
leur contenu **est déjà en base**, vérifié par empreinte du corps réel des
fonctions (`pg_proc.prosrc`) contre les fichiers du dépôt. Les rejouer telles
quelles serait au mieux inutile, au pire destructeur :

- `exigences_deux_axes` réinstallerait `apply_checklist_template` dans sa
  version du 1ᵉʳ août et rejouerait des `update` sur `checklist_items.category`,
  colonne supprimée depuis ;
- `pipeline_deux_axes` échouerait, sa reprise lisant `raise_investors.statut`,
  que cette même migration supprime.

`20260731200000_objectif_quatre_valeurs` ne doit **jamais** être rejouée seule :
`objectif_six_valeurs` lui succède et est déjà en place. Dans un rejeu ORDONNÉ,
en revanche, elle est inoffensive — elle passe avant, et se fait remplacer.

`checklist_metadata()` est le seul objet absent, et il doit le rester : le
catalogue est devenu une TABLE le 4 août (`checklist_catalog`, 54 lignes contre
22 dans la fonction). La poser recréerait la divergence que son propre
commentaire redoute. `src/` ne l'appelle jamais.

### Le registre ne correspond pas aux noms de fichiers

Constat du 6 août, et il change la conclusion : **aucune** des 120 lignes du
registre ne porte l'horodatage de son fichier. La plus ancienne version inscrite
est `20260729134637`, alors que la plus ancienne migration du dépôt est
`20260716090000` ; 67 lignes portent un nom préfixé `bootstrap_`.

Les versions sont donc des heures d'APPLICATION, pas des heures de fichier.
Conséquence : `supabase db push` ne peut pas se réconcilier avec ce registre, et
y ajouter à la main les douze lignes manquantes n'y changerait rien — ce serait
ajouter de l'incohérent à de l'incohérent.

**Le seul chemin vers un dépôt et un staging qui s'accordent est une
reconstruction complète**, et elle ne passe pas par le connecteur : 124 fichiers,
696 Ko de SQL. Elle demande la CLI et le mot de passe de la base. `db reset` est
LOCAL uniquement ; pour le distant c'est vider le schéma puis `db push`.

`supabase/apply_pending.sql` a été supprimé le 6 août : c'était `pipeline_deux_axes`
recopiée « à exécuter dans le SQL editor », et c'est ce mécanisme — appliquer à
la main sans passer par le registre — qui a produit toute la dérive.

**Le dépôt ne savait pas reconstruire le staging** jusqu'au commit `669ec8b` :
`apply_checklist_template` avait été corrigée à la main sur la base, et la
migration du dépôt qui prétendait porter le correctif ne l'appliquait pas. Voir
[20260806170000_appliquer_vraiment_le_secteur_et_l_activation.sql](../../supabase/migrations/20260806170000_appliquer_vraiment_le_secteur_et_l_activation.sql).

Vérification faite le 6 août : `save_raise` n'était pas divergente — normalisée,
elle est identique au dépôt.
