# Sanza — refonte des écrans « levée » et de tous les états sans données

**Statut : spécification d'implémentation. À suivre à la lettre.**
Maquette de référence : `Sanza Ma Levee v2.dc.html` (7 écrans). Toutes les valeurs ci-dessous ont été relevées sur le code existant de ce dépôt — si une valeur diverge de ce que vous lisez dans le code, **le code gagne** : arrêtez-vous et signalez la divergence au lieu de trancher seul.

---

## 0. Règles absolues (à lire avant d'écrire une ligne)

1. **Ne réinventez aucun composant existant.** Utilisez `SanzaLogo`, `NavIcon`, `EncryptionBadge`, `ResonanceArcs`, `Modal`, `ShareButton`, `NewDataRoomButton`, `OuvrirLeveeButton`, `AddPastRaiseButton`. Si un besoin ressemble à un composant existant, importez-le, ne le copiez pas.
2. **Aucun texte codé en dur.** Toute chaîne visible passe par `next-intl` : ajoutez les clés dans `src/messages/fr.json` ET `src/messages/en.json`. Les libellés du persona fondateur vont sous `shell.founder.*` ou le namespace de l'écran, jamais en littéral JSX.
3. **Zéro emoji.** Icônes en trait uniquement, `currentColor`, `strokeWidth` 1.6 à 2.
4. **N'inventez pas de fonctionnalité.** Tout ce qui est marqué « Proposition » ci-dessous exige une décision produit : implémentez-le seulement si le point 8 est respecté, sinon laissez l'existant et signalez-le.
5. **Aucune régression de données.** Ces écrans lisent déjà `raises`, `raise_investors`, `checklist_items`, `documents`, `audit_log`, `memberships`. N'ajoutez pas de requête sans nécessité, ne changez pas la forme des retours, ne touchez pas aux migrations.
6. **Pas de `window.confirm`, pas d'`alert`.** Les confirmations passent par `Modal`, comme le fait déjà `CloseRaiseButton`.
7. **Accessibilité :** tout bouton désactivé porte `disabled` + `title` explicatif ; toute icône décorative porte `aria-hidden` ; les barres de progression portent `role="progressbar"` avec `aria-valuenow`.
8. **En cas de doute, vous vous arrêtez.** Vous ne créez pas de table, ne renommez pas de colonne, n'ajoutez pas de dépendance npm, ne modifiez pas la RLS, ne supprimez aucun écran existant. Vous posez la question.
9. **Un commit par section numérotée ci-dessous**, message en français, sujet à l'impératif.
10. Après implémentation : `npm run lint` et `npx tsc --noEmit` doivent passer sans nouvelle erreur.

---

## 1. Corriger l'i18n du shell (bug bloquant, à faire d'abord)

**Constat.** Sur un export PDF de `app.sanza.africa/deal`, la navigation et la topbar s'affichent en anglais (« Home », « My raises », « Data room », « MY ACCOUNT », « Security », « Roadmap », « Search a document… », « Share », « Log out ») alors que tout le contenu de la page est en français, et le titre du document est « Sanza — African dealflow, finally structured ».

**À faire.**
- Reproduire le cas : ouvrir `/deal` avec la locale FR active et vérifier ce que renvoie `useTranslations("shell")` côté client et `getTranslations("shell")` côté serveur.
- Vérifier `src/i18n/request.ts`, `src/i18n/locales.ts` et `src/proxy.ts` : la locale résolue doit être la même côté serveur et côté client. Un `Topbar` serveur en EN au-dessus d'un `Sidebar` client en FR = locale non propagée.
- Vérifier que la locale est persistée (cookie) et lue au premier rendu, pas seulement après un clic sur `LocaleSwitcher`.
- Contrôler que les clés existent bien dans `en.json` **et** `fr.json` : une clé absente en FR peut retomber sur EN silencieusement.
- Le `<title>` doit suivre la locale.

**Attendu.** En FR, la colonne affiche exactement : `Accueil` · `Contacts` · `Mes levées` · `Data room`, groupe `Mon compte` → `Sécurité` · `Roadmap`, recherche `Rechercher un document…`, `Partager`, `Déconnexion`. Ce sont les valeurs déjà présentes dans `fr.json` (`shell.founder.nav.*`, `shell.founder.groups.organisation`, `shell.founder.searchPlaceholder`) : **aucune traduction à écrire**, seul l'aiguillage est en cause.

⚠️ Ne « corrigez » pas ce bug en codant les libellés français en dur. Ce serait un refus d'implémentation.

---

## 2. `/deal` — rendre l'écran dépendant de son état

Fichier : `src/components/deal/MaLevee.tsx` (+ `src/app/(app)/deal/page.tsx` pour les données manquantes).

### 2.1 Seuil et calcul

Introduire une seule notion, dérivée de données déjà chargées :

```ts
// `readiness` (deal.readiness_score) et `missing` (checklist_items non "done")
// sont déjà passés à MaLevee. Aucune requête supplémentaire.
const enMiseEnRoute = readiness < 40;
```

`40` est un seuil produit : mettez-le dans une constante nommée en haut du fichier, avec un commentaire, pas en littéral au milieu du JSX.

### 2.2 Sous 40 % — l'écran devient un plan de route

Ordre imposé des blocs, de haut en bas :

1. **En-tête.** Titre = nom de la levée (inchangé). Badge d'état `BROUILLON` en mono 9px, `text-[#B4741B] bg-[#FBF0DC]` (ton `amber` déjà utilisé par `toneCls`). Sous-titre : ce qui manque, formulé en une phrase — pas « Le pilotage de votre tour de table ».
2. **Bandeau « Mise en route »** — *Proposition, section 2.3.*
3. **Résumé de la levée** (les 3 colonnes existantes), avec les champs vides transformés en actions — section 2.4.
4. **« Ce qu'il reste à fournir »** — la liste `missing`, **remontée ici**, plus en bas de page. Cinq lignes maximum, la première marquée `PROCHAINE` avec un bouton plein `Déposer`, les suivantes avec un lien `Déposer`. Chaque ligne mène au `folderId` de l'item quand il existe, sinon à `/data-room`.
5. **« Autour de la levée »** — les trois sections vides (Documents clés, Équipe, Investisseurs) **repliées en une seule carte de trois lignes**. Chaque ligne : icône, titre, une phrase de contexte, une action. Ces sections ne se déploient en sections pleines que lorsqu'elles contiennent au moins un élément.
6. Le bouton **Partager** de l'en-tête est `disabled` avec `title` : on ne partage pas une data room vide. (`ShareButton` doit accepter `disabled` — ajoutez la prop, ne dupliquez pas le composant.)

### 2.3 Bandeau « Mise en route » — Proposition

Carte `bg-[#1A1B1F] rounded-[8px] p-[26px_28px]`, `position:relative overflow:hidden`, avec `<ResonanceArcs corner="bottom-right" size={240} tone="dark" />` (carte sombre dans une page claire → 200–260, cf. les règles écrites dans le composant).

Deux colonnes : à gauche surtitre mono `MISE EN ROUTE · n SUR 3` + titre 21px blanc + phrase explicative + deux boutons (primaire orange = l'action de l'étape courante, secondaire en verre) ; à droite une liste de 3 étapes, l'étape active sur fond `rgba(232,92,43,0.12)` bordure `rgba(232,92,43,0.28)`, les suivantes en pastille creuse.

Les 3 étapes sont dérivées, pas saisies : (1) déposer les pièces socle → compteur `x/5` depuis `missing` ; (2) renseigner clôture et indicateurs → `raise.date_cloture` et `raise.indicateurs` ; (3) inviter un premier investisseur → `raise_investors`.

Le bandeau **disparaît** dès que `readiness >= 40`. Ne le rendez pas repliable, ne stockez pas d'état de fermeture.

### 2.4 Champs vides → actions

Aujourd'hui les valeurs absentes affichent `à renseigner` en `#C7C9CF`. Remplacez par un bouton pointillé (`border-dashed #D5D2CA`, hover `#C24619`) portant l'action : « Ajouter une date », « Saisir un engagement ». Il ouvre le modal `ModifierLevee` déjà existant, pré-positionné sur le champ concerné si c'est simple, sinon tel quel. **Ne créez pas un second formulaire d'édition.**

### 2.5 Au-delà de 40 % — bande de pilotage

Le bandeau de mise en route est remplacé par **une bande de 4 métriques** (grille `1.5fr 1fr 1fr 1fr`, `bg-white border-[#E2DED4] rounded-[6px]`, séparateurs verticaux) :

| Colonne | Source | Note |
|---|---|---|
| Montant recherché + barre d'engagement | `raises.montant_cible`, `montant_engage` | existe déjà, à déplacer ici |
| Dossier prêt (%) + « n pièces manquantes » | `deal.readiness_score`, `missing.length` | |
| Accès actifs | invitations / accès actifs de la data room | **vérifiez la source réelle** avant d'afficher |
| Dernière consultation | `audit_log` (`document.page_viewed`…) : date relative, qui, quel document, durée | **vérifiez que la durée est bien stockée** (`20260725090000_temps_de_lecture.sql`) |

⚠️ Les deux dernières colonnes ne doivent **jamais** être remplies avec une valeur approchée. Si la donnée n'est pas disponible de façon fiable, n'affichez pas la colonne et dites-le dans le rapport de PR — ne mettez pas un compteur faux.

L'en-tête passe en badge `EN COURS` (ton `green` de `toneCls`) et le sous-titre devient « Clôture visée le … — dans n jours » (utilisez `src/lib/echeance.ts` s'il calcule déjà ce delta ; sinon ajoutez-y la fonction, pas ailleurs).

---

## 3. États sans données — une grammaire unique

Créez **un** composant partagé, par exemple `src/components/ui/EmptyState.tsx` :

```tsx
{ icon?, title, description, action?, secondaryAction?, tone?: "light" | "dark", arcs?: boolean }
```

Règles de rédaction, sans exception :
- **Jamais** « Aucune donnée », « Rien à afficher », « Liste vide » seuls.
- Un titre qui nomme ce qui manque, une phrase qui explique **à quoi servira l'écran**, une action — et une seule.
- Si aucune action n'a de sens (journal d'audit), on écrit ce qui déclenchera le remplissage (« Se remplit tout seul ») et **on ne met pas de bouton**.
- Interdiction d'inventer un bouton qui n'est pas branché.

Écrans à traiter, avec les textes de la maquette : accès sans invité, questions sans question, journal sans activité, recherche sans résultat, erreur de chargement (« Vos données sont intactes — c'est l'affichage qui a échoué »), investisseur en liste d'attente (carte sombre + arcs 240).

Décor : `<ResonanceArcs corner="bottom-right" size={480} tone="light" />` sur les écrans vides pleine page ; `size={240} tone="dark"` sur une carte sombre ; **jamais** derrière une liste dense ou un tableau ; jamais plus de 2 jeux par écran. Ces règles sont déjà écrites dans le commentaire d'en-tête de `ResonanceArcs.tsx` — relisez-le et respectez-le.

---

## 4. Première connexion — trois écrans

### 4.1 Accueil, base vide (`/dashboard`)
Titre « Bonjour {prénom} », sous-titre « Votre espace est vide — et c'est normal. Une seule chose à faire aujourd'hui. » Puis une **grande carte Encre** (`<ResonanceArcs corner="top-right" size={560} tone="dark" />`) : surtitre mono `PREMIER PAS`, titre « Créez votre data room », un paragraphe, un bouton `NewDataRoomButton` et la mention « 3 minutes · vous pourrez tout modifier ensuite ». Sous la carte, 3 cartes d'étapes (la 1 pleine, les 2 et 3 à `opacity 0.65`).

### 4.2 `/deal` sans data room — améliorer l'existant, ne pas le remplacer
La branche `if (!deal)` de `src/app/(app)/deal/page.tsx` existe déjà : titre `Ma levée`, cadre pointillé, `<ResonanceArcs corner="bottom-right" size={480} tone="light" />`, `NewDataRoomButton label="Créer une data room"`.

**Conservez le titre, le message et l'action.** Remplacez le seul cadre pointillé par : à gauche le parcours en deux temps (1 « Créer la data room » actif, 2 « Ouvrir la levée » en attente) ; à droite un panneau Encre « À quoi ça ressemblera » avec un aperçu de levée **explicitement marqué illustratif**.

Interdits sur cet écran : pas de barre `MesLeveesBar` (la page retourne avant elle) ; pas de bouton `+ Nouvelle levée`, même désactivé ; pas de `+ Tour passé` (il exige un `dealId`).

### 4.3 Data room créée mais vide
Zone de dépôt en pointillés au centre, motif « écho » (3 barres × 2, opacités 0.28 / 0.5 / plein), titre « Vos dossiers attendent leur premier document », deux boutons. En dessous, les dossiers du modèle avec « 0 sur n pièces attendues » et un lien `Déposer` par dossier — le nombre attendu vient du modèle de checklist appliqué, **pas d'un nombre écrit en dur**.

Le bouton « Importer depuis Drive » de la maquette n'est une **Proposition** : ne l'implémentez pas si l'intégration n'existe pas. Retirez-le plutôt que de le laisser inerte.

### 4.4 Chargement
Squelette gris qui **conserve la géométrie** de la page cible (`src/app/(app)/loading.tsx`) : blocs `#EFEDE6` / `#F4F2EC`, pas de roue, pas de texte « Chargement… », pas d'animation clignotante. Un `pulse` très léger est acceptable, rien de plus.

---

## 5. Propositions nécessitant une validation produit

À ne PAS implémenter sans accord explicite. Listez-les dans la PR avec la question posée :

1. Entrées de menu **grisées** tant qu'aucune data room n'existe (`Sidebar.tsx` n'a pas de variante désactivée aujourd'hui).
2. **Data room de démonstration** pour fondateur (le seul jeu de démo du dépôt est côté programme : `20260721090000_sae_demo.sql`).
3. « Importer depuis Drive ».
4. Colonnes « Accès actifs » et « Dernière consultation » si la donnée n'est pas fiable.

---

## 6. Contrôles avant de rendre la main

- [ ] `/deal` en FR : plus une seule chaîne anglaise dans la nav et la topbar.
- [ ] Un fondateur neuf voit **une** action évidente sur chaque écran, jamais deux boutons primaires.
- [ ] Aucun écran n'affiche « à renseigner » ou « aucun » sans action ni explication.
- [ ] Sous 40 %, la liste des pièces manquantes est visible **sans faire défiler**.
- [ ] Les arcs viennent de `ResonanceArcs`, aux tailles prescrites, jamais redessinés à la main, jamais derrière un tableau.
- [ ] Le logo est le composant `SanzaLogo` partout — aucune reproduction inline.
- [ ] `npm run lint` et `npx tsc --noEmit` sans nouvelle erreur.
- [ ] Rapport de PR listant : ce qui est fait, ce qui est laissé de côté et pourquoi, chaque divergence constatée entre cette spécification et le code.
