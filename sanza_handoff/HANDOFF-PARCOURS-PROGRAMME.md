# HANDOFF — Parcours Programme (Accélérateurs) · Cohortes, Challenges & Dealrooms

**Destinataire : Claude Code.**
**Exigence : intégration STRICTE. Résultat attendu : qualité production, professionnel, soigné dans le moindre détail.**

---

## 0. Règles non négociables

1. **Source de vérité : les 34 écrans HTML dans `parcours-programme/` + `parcours/parcours.css`.** Chaque écran s'ouvre dans un navigateur. Reproduire à l'identique : espacements, tailles de police, couleurs, ordres des colonnes, libellés, états. **Ne pas réinterpréter, ne pas « améliorer », ne pas substituer des composants d'une autre librairie.**
2. **Aucune valeur codée en dur.** Toutes les couleurs, polices, espacements viennent des variables CSS de `parcours/parcours.css` (`--text-1..4`, `--line`, `--line-soft`, `--brand`, ramps `--amber/--green/--red/--blue` + `-bg`, `--sans`, `--head`). Si votre stack a un thème central, mappez ces tokens une fois, puis consommez le thème.
3. **Les textes sont contractuels.** Libellés de boutons, titres, textes d'états vides, messages d'aide : reprendre mot pour mot. Le wording a été validé.
4. **Chaque état compte.** Les écrans vides (01, 03, 06, 09, 18) ne sont pas optionnels : ce sont les premiers écrans que verra un nouvel accélérateur. Les intégrer avec le même soin que les écrans remplis.
5. **Avant de coder : gap analysis obligatoire (voir §2).** Ne pas commencer l'intégration avant d'avoir livré ce diagnostic.

---

## 1. Contenu du paquet

```
parcours-programme/   34 écrans HTML (référence exacte)
  index.html          sommaire cliquable de tous les écrans
parcours/parcours.css tokens + composants (btn, card, tag, table, kv, ctx-label…)
design-system/        référence design system Sanza v2
```

### Carte des écrans

**A. Cohortes & portefeuille (côté accélérateur)**
- 01 cohortes (vide) · 02 cohortes (liste) · 03 cohorte (vide) · 04 cohorte (invitations en attente) · 05 cohorte (entreprises actives)
- 06 portefeuille (vide) · 07 portefeuille (rempli) · 08 questions & suggestions
- 17 modale « nouvelle entreprise »

**B. Challenges**
- 09 challenges (vide) · 09b challenges actifs · 10 bibliothèque de modèles · 11 créer de zéro · 12 personnaliser un modèle · 13 assigner aux entreprises · 14 détail challenge (vue programme) · 15 détail challenge (vue entreprise) · 16 mes modèles

**C. Dealrooms (côté accélérateur)**
- 18 dealrooms (vide) · 19 dealrooms (liste) · 20–24 wizard de création (identité → branding → entreprises → audience → préview) · 25 dashboard · 26 entreprises · 27 audience · 28 branding

**D. Expérience investisseur (externe, brandée)**
- 29 email d'invitation · 30 accueil dealroom · 31 recherche + filtres · 32 fiche entreprise · 33 demande d'accès

---

## 2. AVANT DE CODER — Gap analysis obligatoire

Ce parcours accélérateur est **nouveau** par rapport à la structure existante de Sanza (aujourd'hui centrée sur le parcours fondateur : data room, levée, mises à jour). Première tâche, avant toute intégration :

1. **Inventorier la structure actuelle** : modèles de données, routes, permissions, navigation existants côté fondateur.
2. **Comparer avec ce que ces 34 écrans exigent** et produire la liste écrite de ce qui MANQUE. À vérifier au minimum :
   - Entités : `Cohorte`, `Membership entreprise↔cohorte` (statuts : invitée / active), `Challenge` (modèle vs instance personnalisée), `Assignation challenge↔entreprise` (progression par critère), `Dealroom` (identité, branding, sélection d'entreprises, audience), `Invitation investisseur`, `Demande d'accès investisseur`, `Question/Suggestion` sur une pièce du portefeuille.
   - Rôles : au moins `accélérateur admin`, `entreprise (fondateur)`, `investisseur invité` — avec la matrice de visibilité (l'investisseur ne voit QUE ce que la dealroom expose ; l'accélérateur voit la complétude mais pas nécessairement le contenu des pièces).
   - Routage public : les écrans 29–33 sont **hors app**, sur URL brandée par dealroom (logo, couleur du programme).
   - Navigation : la sidebar de ces écrans (Cohortes, Portefeuille, Challenges, Dealrooms, Demandes, Aide) vs la nav actuelle.
3. **Livrer ce diagnostic** (manques, conflits, questions) et le faire valider AVANT de commencer l'intégration.

---

## 3. Fixtures

L'intégration se fait avec des **fixtures** (pas de données réelles, pas de lorem ipsum improvisé). Reprendre les données des écrans, qui sont cohérentes entre elles — c'est vérifié, ne pas les altérer :

- **Cohorte** : « Promotion 2026 » — 8 entreprises actives, 4 invitations en attente.
- **Entreprises** (secteur · pays · stade · complétude) : Baobab Materials (Construction · Côte d'Ivoire · Série A · recherche 2 000 000 €), Kalyx Foods (Agroalimentaire · Sénégal · **Seed · 38 %** · 300 000 €), Wari Logistics (Logistique · Mali · Seed · 400 000 €), Teranga Health (Santé · Sénégal · Pre-seed · 250 000 €), Solaris Guinée (Énergie · Guinée), Moneta Pay (Fintech · Togo), + Ag-tech Bénin (hibiscus), laiterie Burkina Faso.
- **Challenges** : « Préparer votre Demo Day » (5 critères), « Reporting bailleur trimestriel » (3 critères), « Cap table à jour »…
- **Dealroom** : sponsors « AFD » et « Proparco », 12 entreprises exposées, montants au format `2 000 000 €` (espace insécable comme séparateur de milliers).
- **Investisseurs** : Banque Atlantique, Impact Partners, Teranga Capital…

Une entreprise = les mêmes valeurs sur TOUS les écrans où elle apparaît (05, 07, 13, 22, 30, 31, 32). Toute incohérence introduite à l'intégration sera considérée comme un bug.

---

## 4. Points d'attention (détails vérifiés en revue — à ne pas régresser)

- **10** : pied du panneau détail = texte « Déjà utilisé dans N de vos cohortes » AU-DESSUS des deux boutons pleine largeur (pas sur la même ligne).
- **16** : grille des modèles en `repeat(3, minmax(0,1fr))` + `flex-wrap` sur les rangées de boutons — rien ne déborde d'une carte.
- **17** : « N critères » ne casse jamais sur deux lignes (`white-space:nowrap`).
- **22** : Kalyx Foods = Seed · 38 % (pas Série A).
- **30/31** : chaque carte entreprise porte une ligne de pitch ; « Programme soutenu par · AFD · Proparco » est calé à droite, insécable.
- Tableaux : chiffres en `font-variant-numeric: tabular-nums`.
- États de survol et focus visibles sur tout élément interactif (jamais le focus bleu navigateur).

---

## 5. Definition of Done

- [ ] Gap analysis livrée et validée (§2) avant la première PR d'intégration.
- [ ] Les 34 écrans rendus pixel-fidèles aux HTML de référence, tokens mappés, zéro valeur en dur.
- [ ] Tous les états vides + états de survol/focus/désactivé intégrés.
- [ ] Fixtures conformes au §3, cohérentes inter-écrans.
- [ ] Parcours investisseur (29–33) accessible hors authentification app, brandé par dealroom.
- [ ] Revue croisée avec les écrans de référence ouverts côte à côte avant merge.
