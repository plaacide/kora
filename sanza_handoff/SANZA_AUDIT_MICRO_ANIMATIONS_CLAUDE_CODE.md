# SANZA — Audit et implémentation des micro-animations

**Destinataire : Claude Code**  
**Périmètre : application Sanza déjà largement intégrée**  
**Objectif : identifier ce qui peut être animé utilement, sans casser les écrans ni ralentir le produit**

---

## 1. Contexte

La majorité des écrans de Sanza est déjà intégrée.

La prochaine étape consiste à déterminer :

- quelles interactions méritent une micro-animation ;
- quelles animations sont réellement utiles ;
- lesquelles seraient purement décoratives ;
- quels composants peuvent partager les mêmes comportements ;
- si l’architecture actuelle permet une implémentation propre ;
- si une bibliothèque d’animation est nécessaire ou si CSS suffit ;
- comment préserver les performances, l’accessibilité et la stabilité fonctionnelle.

L’objectif n’est pas d’animer toute l’interface.

L’objectif est de rendre les interactions :

- plus compréhensibles ;
- plus fluides ;
- plus rassurantes ;
- plus cohérentes ;
- plus professionnelles.

Sanza est un produit institutionnel lié à des documents sensibles, à la diligence et au financement. Les animations doivent être sobres, rapides et fonctionnelles.

---

# 2. Mission demandée à Claude Code

Avant toute modification du code :

1. analyser l’architecture actuelle ;
2. identifier la stack frontend utilisée ;
3. vérifier les bibliothèques déjà installées ;
4. recenser les composants interactifs existants ;
5. détecter les animations déjà présentes ;
6. identifier les incohérences ;
7. proposer ce qui peut raisonnablement être animé ;
8. classer les propositions par priorité ;
9. estimer les risques techniques ;
10. présenter un plan d’implémentation avant de coder.

Ne commencer aucune animation avant d’avoir présenté cet audit.

---

# 3. Livrable attendu avant implémentation

Claude Code doit produire un tableau de ce type :

| Zone | Composant actuel | État actuel | Animation possible | Priorité | Technologie recommandée | Risque |
|---|---|---|---|---|---|---|
| Navigation | Sidebar | Apparition instantanée | Transition d’ouverture | Haute | CSS ou Motion | Faible |
| Data room | Dossier | Ouverture brutale | Expansion contrôlée | Haute | CSS | Moyen |
| Upload | Ligne de fichier | Mise à jour sèche | Progression et changement d’état | Haute | CSS | Faible |
| Modal | Dialog | Apparition instantanée | Fade + légère translation | Haute | composant partagé | Faible |
| Dashboard | Cartes | Aucun mouvement | Aucun nécessaire | Faible | — | — |

L’audit doit distinguer :

- animation utile ;
- animation possible mais non prioritaire ;
- animation déconseillée ;
- animation impossible sans refactor ;
- animation déjà présente mais incohérente.

---

# 4. Principes de motion pour Sanza

## 4.1 La motion doit expliquer

Une animation doit au moins remplir une fonction :

- montrer qu’une action a été prise en compte ;
- montrer d’où vient un élément ;
- montrer où part un élément ;
- expliquer un changement d’état ;
- préserver le contexte pendant une navigation ;
- réduire la sensation de rupture ;
- rendre un chargement compréhensible.

Si elle ne remplit aucune de ces fonctions, ne pas l’ajouter.

## 4.2 La motion doit rester discrète

Éviter :

- rebonds ;
- confettis ;
- grandes rotations ;
- zooms importants ;
- effets permanents ;
- animations en boucle ;
- effets de parallaxe ;
- survols trop visibles ;
- transitions supérieures à 300 ms sans justification ;
- animations qui déplacent fortement le contenu.

## 4.3 La motion ne doit jamais masquer l’état réel

Interdit :

- simuler une progression d’upload non réelle ;
- retarder artificiellement une action terminée ;
- afficher un succès avant la réponse serveur ;
- utiliser une animation pour cacher une erreur ;
- faire croire qu’une donnée est chargée alors qu’elle ne l’est pas.

## 4.4 La motion doit préserver le contexte

L’utilisateur doit comprendre :

- quelle opération il consulte ;
- quelle data room est ouverte ;
- quel dossier vient d’être développé ;
- quelle pièce vient d’être déplacée ;
- quel accès vient d’être accordé ou retiré ;
- quelle modale vient de se fermer ;
- quel changement de plan vient d’être appliqué.

---

# 5. Système de motion à créer

Ne pas définir les durées directement dans chaque page.

Créer des tokens centralisés dans le design system.

Exemple :

```css
:root {
  --motion-duration-instant: 80ms;
  --motion-duration-fast: 120ms;
  --motion-duration-default: 180ms;
  --motion-duration-slow: 260ms;

  --motion-ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --motion-ease-enter: cubic-bezier(0, 0, 0.2, 1);
  --motion-ease-exit: cubic-bezier(0.4, 0, 1, 1);
}
```

Créer si nécessaire :

```text
/styles/motion.css
/config/motion.ts
/lib/motion/tokens.ts
/components/motion/
```

Respecter l’architecture existante du projet.

Ne pas créer une architecture parallèle si le design system dispose déjà d’un système de tokens.

---

# 6. Durées recommandées

| Interaction | Durée |
|---|---:|
| Hover ou état pressé | 80–120 ms |
| Tooltip | 100–140 ms |
| Menu contextuel | 120–160 ms |
| Onglet | 140–180 ms |
| Accordéon | 160–220 ms |
| Toast | 160–220 ms |
| Modal | 180–240 ms |
| Drawer ou panneau latéral | 220–280 ms |
| Changement de contexte | 220–300 ms |
| Progression de valeur | 200–400 ms selon le cas |

Ne pas dépasser 300 ms pour une interaction courante, sauf justification claire.

---

# 7. Propriétés à privilégier

Privilégier :

```css
transform
opacity
```

Utiliser avec précaution :

```css
height
width
max-height
box-shadow
filter
```

Éviter autant que possible :

```css
top
left
right
bottom
margin
padding
```

Les animations ne doivent pas provoquer de reflows importants ni de déplacement involontaire de la mise en page.

---

# 8. Zones à auditer en priorité

## 8.1 Navigation globale

Analyser :

- sidebar principale ;
- changement de section ;
- ouverture des sous-menus ;
- état actif ;
- collapse éventuel ;
- navigation mobile ;
- retour vers « Toutes les opérations ».

Animations possibles :

- transition légère de l’indicateur actif ;
- ouverture contrôlée des sous-menus ;
- apparition du drawer mobile ;
- transition du panneau contextuel.

Ne pas animer toute la page à chaque navigation si cela ralentit l’usage.

## 8.2 Navigation entre opérations

Analyser :

- page Opérations ;
- ouverture d’une opération ;
- sélecteur rapide d’opération ;
- changement entre deux opérations ;
- archivage ;
- réactivation.

Animations possibles :

- apparition légère du panneau contextuel ;
- changement de l’opération active ;
- retrait d’une carte après archivage ;
- apparition dans la section Archives ;
- mise à jour du compteur du plan.

Le contexte de l’opération doit rester visible pendant la transition.

## 8.3 Data room

Analyser :

- ouverture d’un dossier ;
- fermeture d’un dossier ;
- création d’un dossier ;
- renommage ;
- déplacement ;
- dépôt de pièces ;
- sélection multiple ;
- suppression ;
- état vide ;
- changement de dossier.

Animations possibles :

- expansion et réduction des dossiers ;
- apparition d’une nouvelle pièce ;
- déplacement visuel contrôlé ;
- surbrillance de la destination lors du drag-and-drop ;
- retrait après suppression confirmée ;
- transition des états d’upload.

Ne pas animer toute l’arborescence lors d’une simple mise à jour.

## 8.4 Upload de documents

C’est une priorité haute.

États à représenter :

```text
queued
uploading
processing
ready
failed
```

Animations possibles :

- barre de progression réelle ;
- apparition de la ligne ;
- transition vers « traitement » ;
- confirmation discrète lorsque la pièce est prête ;
- erreur visuelle sobre ;
- retrait ou réessai.

Règles :

- la progression doit refléter les données réelles ;
- ne pas remettre la barre à zéro lors du traitement ;
- ne pas afficher de succès prématuré ;
- ne pas faire rebondir la ligne ;
- conserver la hauteur pour éviter le déplacement de la liste.

## 8.5 Modales et dialogues

Analyser toutes les modales :

- création d’une opération ;
- invitation ;
- partage ;
- suppression ;
- archivage ;
- changement de plan ;
- NDA ;
- permissions ;
- paiement ;
- confirmation.

Animation recommandée :

- fond : fade léger ;
- contenu : fade + translation verticale de faible amplitude ;
- sortie plus rapide que l’entrée.

Exemple :

```text
Entrée : 200 ms
Sortie : 140 ms
Translation : 8 à 12 px maximum
```

Ne pas utiliser de zoom agressif.

La fermeture par Échap, clic extérieur et bouton doit conserver le même comportement.

## 8.6 Drawers et panneaux latéraux

Analyser :

- détails d’une pièce ;
- détails d’un investisseur ;
- paramètres d’accès ;
- résumé de plan ;
- filtres ;
- navigation mobile.

Animation possible :

- glissement horizontal ;
- overlay en fade ;
- focus déplacé correctement ;
- retour du focus à l’élément déclencheur.

Vérifier le comportement avec clavier et lecteur d’écran.

## 8.7 Boutons

États à auditer :

- default ;
- hover ;
- active ;
- focus ;
- loading ;
- disabled ;
- success éventuel ;
- destructive.

Animations possibles :

- changement de fond et bordure ;
- légère variation d’opacité ;
- translation maximale de 1 px à l’état pressé ;
- transition du libellé vers l’état de chargement.

Ne pas réduire fortement le bouton au clic.

Ne pas remplacer entièrement le texte par un spinner isolé.

Exemple :

```text
Envoyer l’invitation
→ Envoi…
→ Invitation envoyée
```

Le dernier état doit rester bref et ne pas retarder la suite.

## 8.8 Formulaires

Analyser :

- focus ;
- validation ;
- erreur ;
- succès ;
- champs conditionnels ;
- étapes d’onboarding ;
- changement de devise ;
- sélection de cartes.

Animations possibles :

- apparition des champs conditionnels ;
- transition de la bordure ;
- apparition du message d’erreur ;
- progression entre étapes ;
- sélection d’une carte.

Le message d’erreur doit rester lisible sans dépendre de l’animation.

Éviter les secousses de champ.

## 8.9 Onglets

Analyser :

- préparation ;
- permissions ;
- questions ;
- invitations ;
- journal ;
- NDA ;
- versions ;
- billing.

Animation possible :

- déplacement discret de l’indicateur actif ;
- fade très léger du contenu ;
- conservation de la hauteur si possible.

Ne pas glisser tout l’écran horizontalement à chaque changement d’onglet.

## 8.10 Toasts et retours d’action

Analyser :

- succès ;
- avertissement ;
- erreur ;
- information ;
- empilement ;
- disparition ;
- mobile.

Animation recommandée :

- entrée en fade + translation légère ;
- sortie rapide ;
- pas de rebond ;
- durée d’affichage suffisante ;
- erreurs persistantes si une action est nécessaire.

Les toasts ne doivent pas être la seule confirmation pour une action critique.

## 8.11 États de chargement

Analyser :

- listes ;
- dashboard ;
- data room ;
- visionneuse ;
- factures ;
- abonnements ;
- recherches ;
- permissions.

Priorité aux skeletons correspondant à la forme réelle du contenu.

Animations possibles :

- pulse très discret ;
- fade entre skeleton et contenu.

Ne pas utiliser un spinner seul sur un grand écran vide.

Respecter `prefers-reduced-motion`.

## 8.12 Barres et indicateurs de préparation

Analyser :

- score de préparation ;
- progression de checklist ;
- usage du plan ;
- stockage ;
- opérations actives.

Animation possible :

- progression de la valeur lors d’un changement réel ;
- transition courte de la barre ;
- apparition du nouveau libellé.

Ne pas rejouer l’animation à chaque visite de page si la valeur n’a pas changé.

## 8.13 Visionneuse

Analyser :

- ouverture ;
- fermeture ;
- changement de page ;
- vignettes ;
- document suivant ;
- chargement ;
- erreur.

Animations possibles :

- ouverture de la modale ;
- changement de page en fade très rapide ;
- sélection de vignette ;
- apparition du filigrane.

Éviter les effets de livre ou de page tournée.

## 8.14 Permissions et accès

Analyser :

- sélection du niveau d’accès ;
- ajout ou retrait d’un dossier ;
- expiration ;
- révocation ;
- NDA obligatoire ;
- invitation envoyée.

Animations possibles :

- mise à jour du résumé ;
- apparition des options conditionnelles ;
- retrait d’une ligne après révocation ;
- changement d’état NDA.

Pour les actions sensibles, la clarté prime sur la fluidité.

## 8.15 Pipeline et relations investisseurs

Analyser :

- changement de statut ;
- ajout d’un investisseur ;
- déplacement dans le pipeline ;
- activité récente ;
- engagement ;
- fermeture d’une levée.

Animations possibles :

- déplacement contrôlé d’une carte ;
- apparition d’une relation ;
- mise à jour du statut ;
- changement d’un montant.

Ne pas utiliser d’animation de célébration pour un soft-commit ou un engagement.

## 8.16 Abonnement et pricing

Analyser :

- modal de changement de plan ;
- sélection mensuel/annuel ;
- mise à jour du résumé ;
- upgrade ;
- downgrade ;
- limite atteinte ;
- paiement ;
- facture.

Animations possibles :

- transition entre les plans ;
- mise à jour du résumé tarifaire ;
- indication du plan sélectionné ;
- confirmation après paiement.

Ne jamais animer les montants de manière spectaculaire.

---

# 9. Priorisation

## Priorité 1 — Feedback indispensable

À implémenter en premier :

- boutons en chargement ;
- uploads ;
- erreurs ;
- succès ;
- modales ;
- toasts ;
- ouverture des dossiers ;
- actions de suppression et archivage ;
- changement de permissions ;
- création d’une opération.

## Priorité 2 — Navigation et contexte

- panneau d’opération ;
- drawer mobile ;
- changement d’onglet ;
- sélecteur d’opération ;
- navigation vers une data room ;
- ouverture de la visionneuse.

## Priorité 3 — Polish

- hover des cartes ;
- apparition de lignes ;
- progression des indicateurs ;
- menus contextuels ;
- filtres ;
- sélection de cartes.

## Priorité 4 — Décoratif

À éviter ou à traiter seulement après validation utilisateur :

- animations d’illustrations ;
- grandes transitions de page ;
- effets de fond ;
- animations au scroll ;
- parallaxe ;
- compteurs animés à chaque chargement.

---

# 10. Choix technique

Claude Code doit d’abord vérifier la stack.

## Si Motion ou Framer Motion est déjà installé

Réutiliser la bibliothèque pour :

- `AnimatePresence` ;
- modales ;
- drawers ;
- changements de liste ;
- transitions complexes ;
- drag-and-drop si déjà utilisé.

Ne pas utiliser la bibliothèque pour un simple hover CSS.

## Si aucune bibliothèque n’est installée

Ne pas ajouter automatiquement une dépendance.

Commencer avec CSS pour :

- boutons ;
- hover ;
- focus ;
- accordéons simples ;
- onglets ;
- menus ;
- toasts ;
- skeletons.

Proposer une bibliothèque uniquement si elle apporte une vraie valeur pour :

- exit animations ;
- listes dynamiques ;
- layout animations ;
- drag-and-drop ;
- transitions imbriquées.

## Interdiction

Ne pas mélanger plusieurs bibliothèques de motion sans nécessité.

---

# 11. Accessibilité

Implémenter ou vérifier une stratégie de réduction des mouvements :

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

Cette règle peut être adaptée si le projet dispose déjà d’une stratégie plus fine.

Vérifier :

- focus clavier ;
- retour du focus après fermeture ;
- modales avec focus trap ;
- contenu accessible sans animation ;
- aucune information portée uniquement par le mouvement ;
- pas de clignotement ;
- pas d’animation agressive ;
- respect du lecteur d’écran.

---

# 12. Performance

Avant et après implémentation, mesurer :

- temps de rendu ;
- layout shifts ;
- fluidité des listes ;
- upload de plusieurs pièces ;
- ouverture d’une data room volumineuse ;
- navigation mobile ;
- utilisation CPU ;
- taille du bundle.

Objectifs :

- animation à 60 fps lorsque raisonnable ;
- pas de reflow massif ;
- pas de blocage du thread principal ;
- pas de multiplication de listeners ;
- pas de boucle d’animation inactive ;
- pas d’animation des éléments hors écran sans raison.

Utiliser le lazy loading si une bibliothèque lourde est nécessaire.

---

# 13. Tests attendus

## Tests fonctionnels

- animation terminée ou interrompue sans casser l’état ;
- double clic ;
- requête lente ;
- erreur serveur ;
- fermeture rapide d’une modal ;
- navigation pendant un chargement ;
- changement d’opération ;
- upload multiple ;
- archivage ;
- downgrade ;
- révocation d’accès.

## Tests accessibilité

- `prefers-reduced-motion` ;
- navigation clavier ;
- focus après modal ;
- lecteur d’écran ;
- zoom navigateur ;
- contraste des états.

## Tests responsive

- desktop ;
- tablette ;
- mobile ;
- petite hauteur d’écran ;
- drawer ;
- toasts ;
- clavier mobile ouvert.

---

# 14. Critères d’acceptation

Le sprint Motion est accepté lorsque :

- les animations utilisent des tokens centralisés ;
- les durées sont cohérentes ;
- les composants partagés possèdent un comportement commun ;
- les états de chargement reflètent les vraies requêtes ;
- les uploads reflètent la vraie progression ;
- les erreurs restent compréhensibles sans mouvement ;
- les modales sont accessibles ;
- `prefers-reduced-motion` est pris en charge ;
- aucune animation ne dépasse 300 ms sans justification ;
- aucune animation ne casse la mise en page ;
- aucune dépendance inutile n’est ajoutée ;
- les performances ne régressent pas de manière significative ;
- les animations restent sobres et cohérentes avec l’identité Sanza.

---

# 15. Ordre d’implémentation recommandé

## Phase 1 — Audit

- inventaire des composants ;
- inventaire des animations ;
- analyse de la stack ;
- recommandations ;
- risques ;
- estimation.

## Phase 2 — Fondation

- tokens ;
- helpers ;
- reduced motion ;
- composants partagés ;
- conventions.

## Phase 3 — Interactions critiques

- boutons ;
- modales ;
- drawers ;
- toasts ;
- erreurs ;
- chargements ;
- uploads.

## Phase 4 — Navigation et data room

- navigation ;
- opérations ;
- arborescence ;
- visionneuse ;
- permissions ;
- pipeline.

## Phase 5 — Polish

- hover ;
- indicateurs ;
- cartes ;
- menus ;
- transitions secondaires.

## Phase 6 — QA

- accessibilité ;
- performances ;
- responsive ;
- tests de non-régression ;
- suppression des animations inutiles.

---

# 16. Instruction finale

Commencez par auditer l’application et présenter ce qui est possible.

Ne codez pas immédiatement toutes les animations.

Pour chaque proposition, indiquez :

1. le composant concerné ;
2. l’objectif utilisateur ;
3. l’animation proposée ;
4. sa durée ;
5. la technologie ;
6. son niveau de priorité ;
7. le risque ;
8. l’effort estimé ;
9. l’impact sur les performances ;
10. sa compatibilité avec `prefers-reduced-motion`.

Après validation, implémentez d’abord les animations qui apportent un feedback fonctionnel, puis la navigation, puis le polish.

Ne modifiez pas la structure visuelle des écrans.  
Ne changez pas les flows métier.  
Ne remplacez pas les composants existants sans nécessité.  
Réutilisez le design system Sanza et les composants partagés.
