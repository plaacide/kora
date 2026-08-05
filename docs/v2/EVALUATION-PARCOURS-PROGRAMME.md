# Évaluation d'architecture — Parcours Programme

**Date :** 5 août 2026 · **Branche :** `v2/rebuild`
**Portée :** les 34 écrans du paquet `sanza_handoff/maquettes/parcours-programme`,
confrontés au code et au schéma réels.
**Préalable :** [GAP-PARCOURS-PROGRAMME.md](GAP-PARCOURS-PROGRAMME.md) dit ce qui
manque. Ce document dit ce que cela impose à l'architecture.

---

## Verdict

L'architecture V2 encaisse le parcours programme **sans changer de forme**. Les
principes posés dans [ARCHITECTURE.md](ARCHITECTURE.md) — écriture par RPC
auditée, métier hors de Next, RLS qui protège même quand la navigation masque —
tiennent tels quels. Ce n'est pas une refonte.

Mais le parcours force **quatre décisions structurantes** qui ne se rattrapent
pas après coup, parce qu'elles fixent des frontières de confidentialité. Deux
d'entre elles doivent être prises avant la première ligne de code : l'une décide
la forme de la base, l'autre décide ce qu'un programme peut déduire des
documents d'une entreprise.

Le vrai risque de ce parcours n'est pas la complexité. C'est qu'il ajoute un
**troisième acteur** — l'investisseur externe — à un produit qui en avait deux,
et que chaque nouvelle colonne rendue au programme est une décision de vie
privée déguisée en commodité d'affichage.

---

## 1. Ce que l'architecture garantit — et qu'il ne faut pas défaire

Quatre invariants tiennent la promesse écrite en pied de six écrans du paquet
(« Vous voyez l'avancement, jamais les documents »). Ils sont acquis, et gratuits
tant qu'on ne les contourne pas.

| # | Invariant | Où il vit |
|---|---|---|
| I1 | **Le programme lit par une fonction à colonnes énumérées**, pas par une politique RLS permissive. Ce qui n'est pas listé ne sort pas. | `sae_portfolio()` |
| I2 | **Le programme n'a aucun chemin vers un document.** Pas d'interdiction à maintenir : une absence de chemin. L'accès passe par le fondateur, qui invite comme un investisseur. | `can_see_deal`, jamais élargi |
| I3 | **Le journal est chaîné** (`prev_hash` / `entry_hash`) et toute écriture y passe. | `audit_log`, `write_audit()` |
| I4 | **Ce qu'un plan inclut est une écriture en base, pas un déploiement.** Aucun composant n'écrit `if (plan === …)`. | `features/v2/billing/entitlements.ts` |

I1 est le plus fragile des quatre. Le parcours demande d'ajouter au portefeuille
six colonnes (secteur, pays, opération présentée, Challenges en cours,
Dealrooms, tendance 30 jours). Chacune se justifie à l'écran. Prises ensemble,
elles font d'une fonction lisible une requête que plus personne ne relit — et
une frontière de confidentialité qu'on ne peut plus auditer d'un coup d'œil.
→ [ADR-004](ADR-004-canal-de-lecture-du-programme.md).

---

## 2. Les cinq tensions

| # | Tension | Sévérité | Décision |
|---|---|---|---|
| T1 | La Dealroom des écrans est un **objet**, la vitrine en base est une **projection de cohorte** — sans identité, donc sans statut, sans branding, sans audience | 🔴 bloquante | [ADR-002](ADR-002-portee-de-la-dealroom.md) |
| T2 | Le **consentement** change de portée : de « listée dans ma cohorte » à « d'accord pour cette Dealroom-ci » | 🔴 bloquante | [ADR-002](ADR-002-portee-de-la-dealroom.md) |
| T3 | Le critère « **connecté à Sanza** » relie un Challenge (porté par une *entreprise*) à une exigence (portée par une *opération*) — deux niveaux différents | 🟠 haute | [ADR-003](ADR-003-critere-connecte-a-sanza.md) |
| T4 | Le **canal de lecture** doit doubler de largeur | 🟠 haute | [ADR-004](ADR-004-canal-de-lecture-du-programme.md) |
| T5 | L'investisseur externe est un **second locataire**, pas une page publique de plus | 🟠 haute | [ADR-005](ADR-005-investisseur-externe.md) |

---

## 3. Points tranchés sans ADR

Ceux-là suivent une pratique déjà établie dans le dépôt.

| Point | Décision | Précédent |
|---|---|---|
| Catalogue des 14 modèles Sanza | Table semée par migration, comme `checklist_catalog` | `20260804120000_catalogue_des_exigences` |
| Modèles privés d'une organisation | Même table, `org_id` renseigné ; `null` = modèle Sanza | — |
| « Powered by Sanza » désactivable | Un **droit** lu dans `entitlements`, jamais un `if (plan === …)` | règle §7.1 du service des droits |
| Consultations d'une Dealroom, rappels de Challenge | Écrits dans `audit_log` via `write_audit()` | arbitrage Pulse : étendre le journal, pas ajouter un système d'événements |
| Rail par métier | `GLOBAL_NAVIGATION` devient fonction du métier au lieu d'une constante | `operationNavigation()` fait déjà ce patron |
| Aperçu investisseur temps réel (21, 28) | Rendu du même composant que la vue publique, pas une seconde implémentation | — |

---

## 4. Ordre des décisions

```
ADR-002 (Dealroom + consentement)  ─┬─► lots G, H, I     🔴 bloque la base
ADR-003 (critère connecté)         ─┼─► lots E, F        🔴 bloque les Challenges
ADR-004 (canal de lecture)         ─┼─► lots C, B        🟠 bloque le portefeuille
ADR-005 (investisseur)             ─┴─► lot I            🟠 bloque le hors-app
```

ADR-002 et ADR-003 commandent la forme de la base : ils passent devant. ADR-004
peut se décider au lot C. ADR-005 peut attendre le lot I, à condition de ne pas
bâtir l'audience Dealroom (lot H) sur une hypothèse contraire.

---

## 5. Arbitrage rendu — sortie d'une entreprise de la cohorte

**Question :** que devient un Challenge quand une entreprise quitte la cohorte ?
Le lien `cohort_links` est rompable des deux côtés — c'est écrit dans le socle.

**Décision du fondateur, 5 août 2026 : la progression se fige, et reste visible
au programme.** Ni effacement, ni poursuite — c'est la seule lecture qui ne
réécrit pas le passé : le travail a eu lieu, il cesse d'évoluer le jour où le
lien se rompt.

Trois conséquences, validées le même jour :

1. La progression est **persistée**, jamais dérivée à l'affichage. Le détail et
   le pourquoi sont dans [ADR-003](ADR-003-critere-connecte-a-sanza.md), §
   « Amendement ».
2. **Une entreprise partie sort des compteurs** — « 8 entreprises · 5
   terminées » décrit la cohorte vivante — et reste consultable sous un filtre
   « parties », marquée figée. Sinon un programme pilote sur des chiffres qui
   incluent des absents.
3. **Côté entreprise, le Challenge disparaît de son espace.** Le gel protège la
   mémoire du programme, pas l'injonction faite à l'entreprise.
