# Arbre des connexions — Parcours Programme

La boussole du branchement du parcours **programme** — accélérateurs,
incubateurs, studios. Le parcours fondateur a le sien :
[ARBRE-CONNEXIONS.md](ARBRE-CONNEXIONS.md). Les deux ne se lisent pas ensemble :
ils n'ont ni le même rail, ni les mêmes écrans, ni les mêmes règles.

**Dernière vérification : 6 août 2026**, branche `v2/rebuild`. Établie en
re-dérivant depuis le code — quels fichiers existent sous
`src/app/v2/(programme)`, `(vitrine)`, `(entreprise)` et le tunnel
d'inscription, et lesquels importent quoi que ce soit de `features/v2/server`.
Ce document se périme : le relire avant de s'y fier.

| Marque | Sens |
|---|---|
| 🟢 | Branché — l'écran lit ou écrit la vraie base |
| 🔴 | Fixture — aucune donnée réelle, tout est écrit dans le fichier |
| 📧 | Gabarit d'e-mail, pas une page |

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
