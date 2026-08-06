# Incohérences entre écrans — parcours programme

**Relevé au 6 août 2026**, au fil de l'intégration des vingt-neuf premiers
écrans. À trancher **à la fin**, quand les trente-huit existeront : décidées
maintenant, elles le seraient sans voir l'ensemble.

Aucune n'a été arbitrée. Chaque écran affiche ce que sa maquette dessine, et
les fixtures portent le conflit en commentaire à l'endroit exact où il vit.

---

## Ce qui est en jeu

Le §3 du handoff exige qu'« une entreprise porte les mêmes valeurs sur TOUS les
écrans où elle apparaît » et annonce que « toute incohérence introduite à
l'intégration sera considérée comme un bug ». Les six ci-dessous ne sont pas
introduites à l'intégration : elles sont dans les maquettes de référence.

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

**Traitement retenu :** les fixtures viennent des écrans, comme le veut la
règle 1. Rien à trancher, sauf si le §3 doit être corrigé.

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

## Deux écrans que rien ne dessine

Vérifié fichier par fichier sur les trente-huit : aucun ne les montre.

- **Rapports.** L'entrée est dans le rail global ET dans la navigation de
  cohorte, et l'écran 07 porte un bouton « Rapport bailleur ». Trois chemins,
  aucune destination. L'export XLSX existe déjà (`/api/portefeuille/export`) et
  pourrait s'y brancher.
- **La vue entreprise d'un Challenge.** Quatre écrans la promettent — « chaque
  entreprise verra ce Challenge dans son espace, avec la mention Demandé par
  Savane Accelerator » (13), « confirmé par l'entreprise » (11, 12, 15) — et
  aucun ne la montre. Le paquet est entièrement côté programme et côté
  investisseur : il ne contient aucun écran de l'espace d'un fondateur.

En attendant, les deux entrées mènent à un écran qui dit ce qu'il attend.
