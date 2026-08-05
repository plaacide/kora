# ADR-002 : Portée de la Dealroom et du consentement

**Statut :** Proposé — option B recommandée
**Date :** 5 août 2026
**Branche :** `v2/rebuild`
**Décideur :** fondateur
**Déclencheur :** écrans 18–28 du paquet `parcours-programme`, et la phrase de
l'écran 18 : « Chaque entreprise donne son accord Dealroom par Dealroom. »

## Contexte

En base, la vitrine n'existe pas comme objet :

```
listing_consents (startup_org, program_org, cohort_id, deal_id, granted_at, revoked_at)
showcase_entries (cohort_id, startup_org, published_at, unpublished_at)
showcase_access  (cohort_id, email, token, investor_user, …)
```

Les trois tables sont indexées sur `cohort_id`. Une cohorte a donc *au plus une*
vitrine, qui n'a ni nom, ni statut, ni marque, ni audience distincte.

Les écrans demandent l'inverse : un objet nommé (« Demo Day 2026 »), avec quatre
statuts (BROUILLON / PRÊTE À PUBLIER / PUBLIÉE / ARCHIVÉE), un branding propre,
une audience nominative, **et des entreprises tirées de plusieurs cohortes** —
l'écran 22 mêle Saison 4 · Agri & Agro et Fintech 2026. Ce n'est pas une colonne
qui manque : c'est l'entité.

Le point délicat n'est pas la table. C'est que **le consentement est un
contrat**, et qu'on ne peut pas le migrer par équivalence. Un `listing_consent`
donné pour une cohorte ne vaut pas accord pour une Dealroom future, brandée
autrement, montrée à une audience que l'entreprise ne connaît pas.

## Options

### A — Garder la vitrine par cohorte, ajouter des colonnes

| Dimension | Évaluation |
|---|---|
| Complexité | Faible |
| Coût | Nul à court terme |
| Fidélité aux écrans | **Rompue** : le multi-cohortes est impossible |
| Réversibilité | Mauvaise — chaque écran bâti dessus devra être réécrit |

**Pour :** rien à migrer.
**Contre :** contredit frontalement l'écran 22. À écarter, sauf à changer le
produit.

### B — Dealroom en objet de premier rang, la vitrine de cohorte disparaît

```
dealrooms          (id, program_org, nom_interne, titre_public, sous_titre,
                    description, contact, statut, published_at, archived_at)
dealroom_branding  (dealroom_id, logo, banniere, accent, theme, partenaires[],
                    powered_by_sanza)
dealroom_cohorts   (dealroom_id, cohort_id)          -- multi-cohortes
dealroom_entries   (dealroom_id, startup_org, deal_id, published_at,
                    unpublished_at)
dealroom_consents  (dealroom_id, startup_org, statut, granted_at, revoked_at)
dealroom_access    (dealroom_id, email, token, investor_user, statut, …)
```

| Dimension | Évaluation |
|---|---|
| Complexité | Moyenne — six tables, une migration de données |
| Coût | Un lot de migration ; **rien n'est en production côté programme** |
| Fidélité aux écrans | Totale |
| Réversibilité | Bonne — c'est le moment où elle coûte le moins |

**Pour :** les statuts, le branding, l'audience et le multi-cohortes deviennent
naturels ; le consentement retrouve la portée que l'écran lui donne.
**Contre :** les tables `showcase_*` sont reprises et supprimées ; les accords
repartent à zéro.

### C — Les deux modèles cohabitent

| Dimension | Évaluation |
|---|---|
| Complexité | **Haute** — deux chemins de publication, deux notions de consentement |
| Coût | Permanent : chaque règle s'écrit deux fois |
| Fidélité aux écrans | Bonne |
| Réversibilité | Mauvaise — la dette se solidifie |

**Contre :** deux façons de publier une entreprise devant des investisseurs,
c'est deux façons de se tromper sur qui a donné son accord.

## Arbitrage

**B.** Le seul argument de A et C est le coût de migration — or il est presque
nul aujourd'hui et croît à chaque écran livré. Rien n'est en production côté
programme ; c'est exactement la fenêtre décrite par la note de pré-lancement.

Le point à trancher explicitement, parce qu'il est produit et non technique :
**les `listing_consents` existants ne deviennent pas des accords Dealroom.** Une
entreprise redemande son accord, Dealroom par Dealroom.

## Conséquences

- Devient plus simple : les statuts, le branding, l'audience, le multi-cohortes.
- Devient plus dur : la cohorte perd sa vitrine — s'il existait un usage
  « vitrine de cohorte » sans Dealroom, il faut le représenter par une Dealroom
  à une seule cohorte.
- À revisiter : `showcase_access` sait déjà lier un jeton à une adresse. Ce
  mécanisme est repris tel quel, pas réinventé — voir
  [ADR-005](ADR-005-investisseur-externe.md).

## Suites

1. [ ] Trancher l'option, et la clause sur les consentements existants.
2. [ ] Écrire la migration des six tables, avec reprise puis suppression des
       `showcase_*`.
3. [ ] Vérifier qu'aucun écran V1 de `main` ne lit encore `showcase_entries`
       avant de supprimer.
