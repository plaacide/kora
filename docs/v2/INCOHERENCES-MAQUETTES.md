# Incohérences entre écrans — parcours programme

**CLASSÉES SANS SUITE — décision du fondateur, 6 août 2026.** Ce sont des
données d'exemple, pas des règles : elles disparaissent au branchement, et la
vraie donnée sera cohérente par construction. Rien à arbitrer.

Le relevé reste ici pour une seule raison : **ne pas recopier un écart en
règle** le jour du branchement. Un chiffre qui diverge entre deux maquettes ne
doit pas devenir deux calculs différents dans le code. Chaque écran affiche ce
que sa maquette dessine, et les fixtures portent le conflit en commentaire à
l'endroit exact où il vit.

**Un seul point survit au branchement**, et il n'est pas une donnée : la règle
de l'écran 22 — « une entreprise sans accord ne sera pas publiée » — devra être
implémentée quelque part. Elle relève d'[ADR-002](ADR-002-portee-de-la-dealroom.md),
pas de cette liste.

---

## Ce qui est en jeu

Le §3 du handoff exige qu'« une entreprise porte les mêmes valeurs sur TOUS les
écrans où elle apparaît ». Les huit ci-dessous ne sont pas introduites à
l'intégration : elles sont dans les maquettes de référence. C'est ce qui les
rend sans conséquence — l'intégration n'a rien inventé.

---

## 1. Kalyx Foods est publiée et non publiée dans la même Dealroom

| Écran | Ce qu'il dit |
|---|---|
| 26 — entreprises publiées | « en attente du choix », fiche **Non publiée**, consentement **En attente** |
| 30 — accueil investisseur | carte complète : Seed · Dette · Recherche 300 000 € |

Les deux décrivent **Demo Day 2026**. Or l'écran 22 pose la règle : « une
entreprise sans accord peut préparer la Dealroom, mais ne sera pas publiée ».

**Conséquence si on ne tranche pas :** les lots H et I se contrediront à
l'écran. C'est la seule des six qui touche une règle produit.

---

## 2. Le Challenge de CoolBricks n'est pas le même selon l'écran

| Écran | Ce qu'il dit |
|---|---|
| 07 — portefeuille | Challenge « Préparer le dossier investisseur » · 3 / 4 critères · échéance demain |
| 14 et 15 — suivi | ce 3 / 4-échéance-demain appartient à « Préparer votre Demo Day » (4 critères) |

« Préparer le dossier investisseur — version Savane » est un autre Challenge :
5 critères, 5 entreprises, échéance 30 septembre.

**Bloque :** le lot C, qui affiche cette ligne.

---

## 3. Le §3 du handoff nomme deux entreprises qui n'existent nulle part

Il cite **Baobab Materials** (Construction · Côte d'Ivoire · Série A ·
2 000 000 €) et **Solaris Guinée** (Énergie · Guinée). Aucune des deux
n'apparaît dans un seul des trente-huit écrans.

Les vraies sont **CoolBricks** (Construction · Côte d'Ivoire · Seed · Equity ·
500 000 € · 62 %) et **Nimba Solar** (Énergie · Guinée · Seed · Equity ·
750 000 € · 81 %). Le §3 omet aussi **Bissap Labs** et **Sahel Dairy**.

**Tombée à moitié le 6 août :** les écrans 35, 37 et 40 citent désormais
**Baobab Materials**. Seule **Solaris Guinée** reste introuvable.

---

## 4. Trois ou quatre Challenges en cours pour Saison 4

| Écran | Ce qu'il dit |
|---|---|
| 02 — liste des cohortes | « **3** Challenges en cours » |
| 05 — entreprises actives | « **4** Challenges en cours », et le panneau contextuel affiche 4 |

L'écran 09b en liste effectivement quatre actifs.

---

## 5. Bissap Labs a une préparation, ou n'en a pas

| Écran | Ce qu'il dit |
|---|---|
| 05 — entreprises actives | **Nouvelle**, opération « non renseignée », préparation « — » |
| 13 — assigner un Challenge | **12 %** de préparation |
| 31 — filtres investisseur | Pre-seed · Equity · Recherche 150 000 € |

---

## 7. « Préparer votre Demo Day » a quatre ou cinq critères

| Écran | Ce qu'il dit |
|---|---|
| 11, 14, 15 | **4** critères — pitch deck, KPIs, montant recherché, pitch de 5 minutes |
| 42 — vue entreprise | **5** critères, et des intitulés différents — pitch deck à jour, états financiers, cap table, projections, vidéo |

---

## 8. Les Challenges en cours de Saison 4 ne sont pas les mêmes

| Écran | Ce qu'il dit |
|---|---|
| 09b — liste | Demo Day, Mettre à jour vos KPIs, Pièces OHADA, Dossier investisseur |
| 37 — vue d'ensemble | Demo Day, **Cap table à jour**, **Reporting bailleur T3**, **Dossier de crédit** |

---

## 6. Kalyx Foods en Seed ou en Série A

| Écran | Ce qu'il dit |
|---|---|
| 21 — aperçu du branding | « Agro · **Série A** » |
| 22 — entreprises de la Dealroom | Seed · 38 % |
| 30 — accueil investisseur | Seed · Dette · 300 000 € |

**Seule exception déjà tranchée**, et par le handoff lui-même : son §4 écrit
« 22 : Kalyx Foods = Seed · 38 % (pas Série A) ». J'ai donc harmonisé sur
**Seed** partout, y compris dans l'aperçu de l'écran 21. C'est le seul endroit
du parcours où j'ai corrigé plutôt que reproduit, parce que le handoff le
demande nommément.

---

## Neuf écrans que rien ne dessine

Recompté depuis le code le 6 août : huit destinations portent un écran
d'attente, plus un écran promis par le texte sans entrée de navigation. Aucune
n'est un cul-de-sac — chacune dit ce qu'elle attend.

| # | Destination | Ce qui l'annonce |
|---|---|---|
| 1 | `/v2/programme` — **Accueil** | **première entrée du rail programme** |
| 2 | `/v2/demandes` — **Demandes** | rail global |
| 3 | `/v2/rapports` — **Rapports** | rail global, ET le bouton « Rapport bailleur » de l'écran 07 |
| 4 | `/v2/cohortes/[id]` — **vue d'ensemble peuplée** | l'écran 03 ne montre que l'état vide |
| 5 | `/v2/cohortes/[id]/dealrooms` | nav de cohorte |
| 6 | `/v2/cohortes/[id]/rapports` | nav de cohorte |
| 7 | `/v2/dealrooms/[id]/demandes` | nav de Dealroom, avec un compteur à 6 |
| 8 | `/v2/dealrooms/[id]/activite` | nav de Dealroom |
| 9 | **La vue entreprise d'un Challenge** | quatre écrans la promettent, aucune nav ne la porte |

**Les deux plus visibles sont les n° 1 et 4.** L'accueil est la première entrée
du rail : c'est l'écran sur lequel un programme atterrit, et il n'existe pas.
La vue d'ensemble d'une cohorte n'est maquettée qu'au premier jour — dès qu'une
entreprise entre, l'écran que le programme ouvrira le plus souvent n'est pas
dessiné.

**Le n° 9 est le seul qui sorte du parcours** : le paquet est entièrement côté
programme et côté investisseur. Rien n'y montre l'espace d'un fondateur, alors
que quatre écrans annoncent ce qu'il verra — « chaque entreprise verra ce
Challenge dans son espace, avec la mention Demandé par Savane Accelerator »
(13), « confirmé par l'entreprise » (11, 12, 15).

**Le n° 3 est annoncé trois fois** : deux entrées de navigation et un bouton.
L'export bailleur en XLSX existe déjà (`/api/portefeuille/export`) et pourrait
lui servir de première version.
