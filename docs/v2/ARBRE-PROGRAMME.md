# Arbre des connexions — Parcours Programme

La boussole du branchement du parcours **programme** — accélérateurs,
incubateurs, studios. Le parcours fondateur a le sien :
[ARBRE-CONNEXIONS.md](ARBRE-CONNEXIONS.md). Les deux ne se lisent pas ensemble :
ils n'ont ni le même rail, ni les mêmes écrans, ni les mêmes règles.

**Dernière vérification : 6 août 2026, nuit**, branche `v2/rebuild`.
Re-dérivé depuis le code : quels fichiers existent, lesquels importent de
`features/v2/server`, et quelles RPC sont réellement appelées.
Ce document se périme : le relire avant de s'y fier.

| Marque | Sens |
|---|---|
| 🟢 | Branché — l'écran lit ou écrit la vraie base |
| 🟡 | Le socle existe en base, l'écran est encore en fixtures |
| 🔴 | Fixture — aucune donnée réelle |
| 📧 | Gabarit d'e-mail, pas une page |

## Le compte, au fichier près

**25 pages et 4 coques.** Six fichiers du parcours lisent ou écrivent la base.

| | Nombre |
|---|---|
| Pages branchées | **4** — cohortes, entreprises d'une cohorte, questions, portefeuille |
| Coques branchées | **2** — coque programme (garde de session), nav de cohorte |
| Pages en fixtures | 21 |
| Coques en fixtures | 2 — Dealroom, vitrine investisseur |

S'y ajoutent le **tunnel d'inscription** (4 écrans, 5 RPC) et le **logo**.

**Règles pures et testées** : `domain/cohorte.ts`, `domain/portefeuille.ts`,
`domain/questions.ts`. 319 tests sur l'ensemble du domaine V2.

```
Rail programme   Accueil · Portefeuille · Cohortes · Dealrooms · Demandes ·
                 Rapports ⟂ Équipe · Sécurité · Abonnement · Aide
Nav de cohorte   Vue d'ensemble · Entreprises · Challenges ·
                 Questions & suggestions · Dealrooms · Rapports
```

### Entrer

```
🟢 Porte d'entrée /v2            metierDuCompte() → profiles.account_type
🟢 Onboarding programme (00a-d)  save_programme · set_programme_focus ·
                                 create_cohort · finish_programme_onboarding
🟢 Logo du programme             set_org_logo → bucket `branding` (public),
                                 clé `<org_id>/logo-<aléa>.<ext>`, enregistrée
                                 dans `organizations.branding`. Public parce que
                                 la Dealroom l'est — ADR-005. Les pièces d'un
                                 dossier restent dans `documents`, privé.
⚠️ Aucun chemin n'y mène          l'inscription propose « Un programme » mais ne
                                 redirige toujours pas vers ce tunnel.
```

### Cohortes — lot B 🟢

```
🟢 01/02 Liste vide et remplie   listerCohortes()
🟢 04/05 Entreprises             listerInvitations()
🟢 Nav de cohorte                lireCohorte() — compteurs du panneau
🟢 Inviter une entreprise        invite_to_cohort
🔴 03 Cohorte au premier jour · 17 Une entreprise arrive · 37 Vue d'ensemble
```

**À resserrer :** `listerCohortes()` lit `cohort_members` **sans filtre** —
toute la table — puis ne garde que ses propres cohortes. Pas une fuite (les
identifiants sont des UUID), mais une lecture inutilement large.

### Portefeuille — lot C 🟢

```
🟢 06 vide · 07 rempli           /v2/portefeuille — sae_portfolio()
```

`sae_portfolio()` porte désormais le secteur et le pays. La jointure vers
`startups` est `LATERAL` : une organisation peut avoir plusieurs fiches, et un
`join` ordinaire dupliquait les lignes.

**Trois règles refusent un raccourci** : on compte les entreprises et non les
lignes ; une opération sans préparation est écartée et non comptée pour zéro ;
deux devises ne s'additionnent jamais, faute de tout taux dans ce produit.

**Ce qui manque encore :** la tendance « +6 pts sur 30 jours » —
`cohort_snapshots` a la bonne colonne mais reste **vide**, rien ne l'alimente.
Et les libellés de priorité diront « 21 exigences à fournir » tant que les
Challenges et les Dealrooms n'existeront pas.

### Questions & suggestions — lot D 🟢

```
🟢 08 Le fil                     cohort_threads() · cohort_companies() ·
                                 create_program_thread()
```

Le badge se décide par le **type** d'abord : une suggestion n'est jamais « en
attente ». Un fil répondu porte la date de la **réponse**, pas de l'envoi.

**Piège rencontré :** la liste des destinataires, lue par
`cohort_members ⋈ organizations`, rendait zéro ligne — la RLS interdit au
programme de lire la fiche d'une organisation dont il n'est pas membre, et le
`!inner` de PostgREST écarte alors la ligne, **sans erreur ni journal**.

### Challenges — lots E et F 🟡

```
🟡 LE SOCLE EXISTE  challenge_templates · challenge_template_criteria ·
                    challenges · challenge_criteria · challenge_assignments ·
                    challenge_progress · startups.presented_deal_id
🔴 09 · 09b · 10 · 16 · 11 · 12 · 42     tous en fixtures
```

Les six tables sont posées, RLS active, une politique de lecture chacune.
**Aucune politique d'écriture** : tout passera par des RPC auditées.

**Ce qui manque :** les RPC (créer un modèle, créer un Challenge par copie,
assigner, confirmer un critère), `startup_requirement_facts()` qui alimente les
critères connectés, les règles de domaine, puis les sept écrans.

⚠️ **Une décision reste ouverte**, laissée par ADR-003 : que devient un critère
connecté quand l'entreprise **change** d'opération présentée ? Il redevient
« à faire », ou il garde ce qu'il avait acquis.

### Dealrooms — lots G et H 🔴

```
🔴 18 à 28 · 40 · 41 · 38
```

[ADR-002](ADR-002-portee-de-la-dealroom.md) est tranchée (option B) : objet de
premier rang, `showcase_*` reprises puis supprimées, accords non reportés.
**Rien n'est encore en base.**

### Investisseur, hors application — lot I 🔴

```
🔴 30 à 33   /v2/d/[dealroom]
📧 29        docs/emails/dealroom-01-invitation-investisseur.html
```

[ADR-005](ADR-005-investisseur-externe.md) est tranchée (option B) : **la
Dealroom s'ouvre sans compte**, qui reste proposé mais jamais exigé.

⚠️ Trois textes de maquette deviennent faux et sont à réécrire : le lien
« personnel » du 29, l'invitation « liée à l'adresse » du 23, l'audience
nominative du 27. **Le lien EST l'accès.**

**Le NDA de la Dealroom est supprimé** (6 août) : pas de compte, donc pas de
signataire, donc rien d'opposable. Il reste entier là où un signataire existe —
la demande d'accès à une **data room**, et le parcours fondateur. Une Dealroom
montre des FICHES, une data room contient des PIÈCES : la première s'ouvre, la
seconde se demande, et c'est cette frontière qui porte seule la protection.

### Le reste du rail 🔴

```
🔴 34 /v2/programme · 35 /v2/demandes · 36 /v2/rapports · 39 rapports de cohorte
```

## L'état de la base de staging

Projet `jourzsgjnutktsrgxkoo` (« Sanza V2 Staging »). L'autre projet,
`bileqzpguyynkktndazs`, est la **production** — ne pas y toucher.

### Le registre ne correspond pas aux noms de fichiers

Aucune des lignes du registre ne porte l'horodatage de son fichier : la plus
ancienne version inscrite date du 29 juillet quand la plus ancienne migration
du dépôt est du 16, et 67 lignes sont préfixées `bootstrap_`. Ce sont des
heures d'APPLICATION, pas de fichier.

`supabase db push` ne peut donc pas se réconcilier avec ce registre, et y
ajouter à la main les douze lignes manquantes n'y changerait rien. **Le seul
chemin vers un dépôt et un staging qui s'accordent est une reconstruction
complète** — 124 fichiers, 696 Ko — qui demande la CLI et le mot de passe de la
base. `db reset` est LOCAL uniquement ; pour le distant, vider le schéma puis
`db push`.

### Les onze migrations « manquantes »

Leur contenu **est déjà en base**, vérifié par empreinte du corps réel des
fonctions contre les fichiers du dépôt. Les rejouer serait au mieux inutile,
au pire destructeur :

- `exigences_deux_axes` réinstallerait `apply_checklist_template` dans sa
  version du 1ᵉʳ août et rejouerait des `update` sur `checklist_items.category`,
  colonne supprimée depuis ;
- `pipeline_deux_axes` échouerait, sa reprise lisant `raise_investors.statut`,
  que cette même migration supprime.

`objectif_quatre_valeurs` ne doit **jamais** être rejouée seule ;
`objectif_six_valeurs` lui succède. Dans un rejeu ORDONNÉ elle est inoffensive.

`checklist_metadata()` est le seul objet absent, et doit le rester : le
catalogue est devenu une TABLE le 4 août (54 lignes contre 22 dans la
fonction).

**Le dépôt ne savait pas reconstruire le staging** jusqu'au commit `669ec8b` :
`apply_checklist_template` avait été corrigée à la main, et la migration qui
prétendait porter le correctif ne l'appliquait pas.

## Données de démonstration posées sur le staging

Pour vérifier les écrans à l'œil, deux entreprises ont été rattachées à la
cohorte de **MTN INCUBATEUR** — FINEO PRE-SEED et Nimba Solar — avec des
montants dans **deux devises différentes**, et Nimba Solar portant **deux
opérations**. Ce cas éprouve les trois règles les plus faciles à rater. Deux
messages de démonstration existent aussi dans le fil de la cohorte de test.
Ce sont des données jetables.
