# ADR-003 : Le critère « connecté à Sanza »

**Statut :** Proposé — option B recommandée · **amendé le 5 août 2026** (§ Amendement)
**Date :** 5 août 2026
**Branche :** `v2/rebuild`
**Décideur :** fondateur
**Déclencheur :** écrans 10, 11, 12 et 15 du paquet `parcours-programme` : « Un
critère connecté à Sanza se valide automatiquement dès que l'exigence
correspondante de l'entreprise est satisfaite. »

## Contexte

Trois faits du code se contredisent en apparence :

1. Un Challenge est assigné à une **entreprise** — une organisation.
2. Une exigence vit sur une **opération** : `checklist_items.deal_id`.
3. Une entreprise peut avoir **plusieurs opérations**. C'est la promesse même de
   la V2, dont le rail dit « Opérations ».

Donc « États financiers disponibles ✓ » ne veut rien dire tant qu'on n'a pas dit
*de quelle opération*. Résoudre au hasard, ce serait rejouer la mine déjà
désamorcée sept fois dans ce dépôt : `select … limit 1` sans `order by`.

Les écrans donnent la clé, mais en creux : l'écran 05 affiche une colonne
« Opération présentée », et l'écran 26 pose la règle — « l'opération est choisie
par l'entreprise, jamais par le programme ». Cette désignation n'existe
aujourd'hui que comme une colonne facultative d'un consentement
(`listing_consents.deal_id`), par cohorte.

Second fait à énoncer : `checklist_items.catalog_key` est **nullable**. Les
exigences ajoutées à la main n'ont pas de clé stable. Un critère connecté ne peut
donc s'accrocher qu'au catalogue — c'est une limite du modèle, à écrire dans
l'écran plutôt qu'à découvrir en production.

## Options

### A — Le Challenge lit la checklist de l'entreprise

Le service Challenge interroge `checklist_items` en filtrant sur `catalog_key`.

| Dimension | Évaluation |
|---|---|
| Complexité | Faible |
| Confidentialité | **Mauvaise** : le module programme sait lire l'intérieur d'une opération. L'invariant « aucun chemin vers un document » ne tient plus par construction, mais par discipline |
| Testabilité | Moyenne |

### B — Une lecture énumérée, de la famille de `sae_portfolio()`

Une fonction `startup_requirement_facts(startup_org)` rend, pour **l'opération
désignée** et pour les seules clés du catalogue, un triplet
`(catalog_key, satisfaite, date)`. Le Challenge ne lit que ça.

| Dimension | Évaluation |
|---|---|
| Complexité | Moyenne |
| Confidentialité | **Bonne** — même patron que le canal existant : ce qui n'est pas énuméré ne sort pas. Aucun nom de pièce, aucun identifiant de document |
| Testabilité | Bonne — le domaine reçoit des faits, pas des jointures |

Suppose une **désignation de premier rang** de l'opération présentée
(`startups.presented_deal_id` ou équivalent), écrite par l'entreprise seule.

### C — Le fait est poussé à l'événement

Quand une exigence est satisfaite, un événement est écrit ; les critères
connectés s'y abonnent.

| Dimension | Évaluation |
|---|---|
| Complexité | **Haute** — cohérence à reconstruire, rattrapage des états antérieurs |
| Confidentialité | Bonne |
| Coût | Un mécanisme d'événements que le produit n'a pas, et que l'arbitrage Pulse a écarté au profit d'`audit_log` |

## Arbitrage

**B**, avec deux clauses :

1. **La désignation de l'opération présentée devient un objet de premier rang**,
   écrite par l'entreprise. Sans elle, B est impossible et A est faux.
2. **Un Challenge s'instancie par copie.** Les critères sont recopiés du modèle
   dans l'instance au moment de la création — écran 12 : « le modèle original ne
   sera pas modifié ». Sans cette copie, corriger un modèle Sanza modifierait
   rétroactivement des Challenges en cours et des progressions déjà acquises.

## Amendement du 5 août 2026 — la progression est persistée

L'arbitrage rendu sur la sortie de cohorte (la progression **se fige et reste
visible**, voir [EVALUATION-PARCOURS-PROGRAMME.md](EVALUATION-PARCOURS-PROGRAMME.md) §5)
modifie l'option B, et pas à la marge.

Telle qu'écrite plus haut, la progression d'un critère connecté est *dérivée* à
la lecture, à partir des faits d'exigence. Or ces faits transitent par le canal
du programme, qui s'éteint avec le lien. Une progression dérivée ne se figerait
donc pas : elle deviendrait **vide**. L'écran afficherait 0 / 4 là où l'entreprise
avait fait 3 / 4 — le pire des trois résultats, parce qu'il a l'air d'une donnée
et non d'une absence.

La progression est donc **persistée par critère et par entreprise** :

```
challenge_progress (challenge_id, startup_org, criterion_id,
                    statut, atteint_le, origine, fige_le)
```

`origine` distingue « confirmé par l'entreprise » de « validé automatiquement ».
`fige_le` est renseigné à la rupture du lien. La fonction pure sur les faits
reste le moteur : elle *écrit* un état, elle ne le remplace pas.

Trois règles en découlent :

- Une ligne figée n'est **jamais** réévaluée. Une entreprise qui revient ouvre
  un nouveau lien, pas une reprise du passé.
- Une entreprise partie **sort des compteurs** — « 8 entreprises · 5 terminées »
  décrit la cohorte vivante — et reste consultable sous un filtre « parties ».
- Côté entreprise, le Challenge **disparaît de son espace**. Le gel protège la
  mémoire du programme, pas l'injonction faite à l'entreprise.

Bénéfice second, gratuit : le journal du Challenge (« terminé le 24 juillet »,
écran 14) devient exact plutôt que reconstruit.

## Conséquences

- Devient plus simple : la validation automatique est une fonction pure sur des
  faits — testable sans base.
- Devient plus dur : il faut un écran, côté entreprise, pour désigner l'opération
  présentée. Aucun des 34 écrans ne le montre.
- À revisiter : le sort d'un critère connecté quand l'entreprise **change**
  d'opération présentée. Le critère redevient-il « à faire » ? Question ouverte.

## Suites

1. [ ] Trancher l'option et ses deux clauses.
2. [ ] Décider où vit la désignation de l'opération présentée, et par quel écran
       l'entreprise la pose.
3. [ ] Écrire `startup_requirement_facts()` en énumérant les colonnes, sur le
       modèle de `sae_portfolio()`.
4. [ ] Trancher le sort d'un critère connecté au changement d'opération.
