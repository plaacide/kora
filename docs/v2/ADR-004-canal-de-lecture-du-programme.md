# ADR-004 : Le canal de lecture du programme

**Statut :** **ACCEPTÉ le 6 août 2026** — option B, trois canaux composés dans
l'application. Tranché par le fondateur.
**Date :** 5 août 2026
**Branche :** `v2/rebuild`
**Décideur :** fondateur
**Déclencheur :** écrans 05 et 07 du paquet `parcours-programme`.

## Contexte

`sae_portfolio()` rend neuf colonnes : entreprise, opération, stade, montant,
devise, préparation, manques. C'est aujourd'hui la **seule** frontière de
confidentialité lisible du produit côté programme — une fonction, pas une
politique RLS, dont les colonnes sont énumérées une à une.

Les écrans en demandent au moins six de plus : secteur, pays, opération présentée
et instrument, Challenges en cours et en retard, Dealrooms, colonne « À faire »,
segment (Prêtes / En cours / Décrochent / Nouvelles), tendance (« +6 pts sur
30 jours »).

Tout mettre dans la même fonction, c'est joindre `challenges`, `dealrooms`,
`checklist_items` et `audit_log` à chaque ligne de portefeuille — et transformer
cette frontière en requête que plus personne ne relit.

## Options

| | A — Une fonction élargie | B — Une fonction par préoccupation | C — Une vue matérialisée |
|---|---|---|---|
| Complexité | Faible | Moyenne | Haute |
| Lisibilité de la frontière | **Mauvaise** | Bonne — trois listes courtes | Moyenne |
| Performance | Une requête | 3 à 4 requêtes composées côté application | Excellente en lecture |
| Fraîcheur | Immédiate | Immédiate | **Différée** — l'écran 07 affiche « mis à jour il y a 5 minutes », ce qui l'accepte |
| Coût d'évolution | Chaque ajout touche la fonction critique | Chaque ajout touche une fonction petite | Rafraîchissement à opérer |

## Arbitrage

**B.** Trois canaux — `sae_portfolio()` étendu du strict minimum (secteur, pays,
opération présentée), `programme_challenges_par_entreprise()`,
`programme_dealrooms_par_entreprise()` — composés dans la couche application.

Le segment et la tendance sont **calculés dans le domaine**, à partir de ces
faits : ce sont des règles produit, elles se testent sans base.

À la volumétrie visée — 18 entreprises dans les fixtures, paliers 10 / 25 / 50
au tarif Programme — la question de performance ne se pose pas. La lisibilité de
la frontière, elle, se pose tous les jours.

## Conséquences

- Devient plus simple : ajouter une colonne ne rouvre plus la fonction qui décide
  ce qu'un programme voit d'une entreprise.
- Devient plus dur : trois allers-retours au lieu d'un ; à surveiller si un
  palier 50 arrive.
- À revisiter : C redevient pertinent si un programme dépasse la centaine
  d'entreprises.

## Suites

1. [ ] Trancher l'option.
2. [ ] Étendre `sae_portfolio()` du strict minimum, colonne par colonne.
3. [ ] Écrire les deux fonctions nouvelles, et les règles de segment et de
       tendance dans `features/v2/domain`, avec leurs tests.
