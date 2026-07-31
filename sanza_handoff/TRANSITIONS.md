# Sanza — Spec navigation, transitions et animations

Référence exécutable : `70-prototype-transitions.html`, `71-prototype-dataroom.html`, **`72-prototype-flow-integral.html` (source de vérité — le flow complet y est branché)**. Reproduire ces comportements à l'identique.

## 1. Barre de navigation (rail global)

- **Dépliée par défaut** : 216 px, icône 18 px + libellé (Accueil, Opérations, Invitations et demandes, Recherche / Équipe, Sécurité, Aide, avatar). C'est l'état initial pour tout nouvel utilisateur.
- **Repli uniquement sur action explicite** : une icône « plier » (chevrons ‹‹, en bas du rail au-dessus de l'avatar) réduit le rail à 60 px icônes seules (tooltips au survol). La même icône (››) le redéplie.
- Le choix est **persisté** (localStorage / préférence utilisateur) et ne change jamais tout seul — pas de repli automatique au resize desktop.
- Transition largeur : 240 ms, `cubic-bezier(.32,.72,.24,1)` ; les libellés fondent (opacity) pendant le repli.
- État actif : fond `--orange-soft`, texte `--orange-text` 600, barrette 3 px `--orange` à gauche.

## 2. Courbe et tempo communs

- Courbe unique : `cubic-bezier(.32,.72,.24,1)` pour TOUTES les transitions de navigation.
- Push de page et tiroirs : **480 ms**. Cascade de listes : 340 ms par ligne, décalage 40 ms/ligne. Changement de vue interne (Vue d'ensemble ↔ documents) : 300 ms fade + translateY(10px).
- `prefers-reduced-motion: reduce` → remplacer tous les mouvements par un fondu 150 ms.

## 3. Push plein écran (changement de contexte)

Écran entrant : `translateX(100%) → 0`. Écran sortant : glisse à `translateX(-24%)` + opacité 0,55 (effet de profondeur iOS). Retour = mouvement strictement inverse.

Où :
- Opérations → ouvrir une opération (52/53/54 → 63)
- Accueil → clic sur une action urgente ou ligne du tableau (58)
- Résultat de recherche → document dans son opération (66)
- « ← Toutes les opérations » = retour inverse.

## 4. Tiroir latéral droit (action sans quitter le contexte)

Panneau 440–480 px, `translateX(100%) → 0` en 480 ms, voile `rgba(16,24,40,.28)` en fondu. Fermeture : Échap, clic sur le voile, ou ✕. Le contexte derrière reste visible.

Où :
- Créer un accès (version rapide ; le wizard 4 étapes reste pour le parcours complet)
- Ajouter / éditer un investisseur du pipeline
- Aperçu d'un document (voir §5)
- Examiner une demande d'accès (65)
- Détail d'un événement du journal (30/67)
- Composer une mise à jour investisseurs (module Lever)

Règle : **navigation = push, action contextuelle = tiroir, confirmation destructive ou limite de plan = modale** (59/60/61).

## 5. Data room — navigation documents

- **Racine « Data room »** = design de l'écran 14 : zone de dépôt en pointillés avec illustration en haut, carte « Structure de votre plan » en dessous listant les dossiers (compteur de pièces, badge Privé/Partagé, menu ···). PAS une simple liste de lignes.
- **Drill-down en cascade** : entrer dans un dossier fait apparaître les lignes une à une depuis la droite (translateX 28 px + fade, 40 ms de décalage par ligne). Remonter (fil d'Ariane) = cascade inverse depuis la gauche. Pas de push plein écran à l'intérieur de la data room.
- **Fil d'Ariane** dans la topbar : `Data room › Finance et comptabilité › Relevés bancaires`, chaque niveau cliquable.
- **Arborescence synchronisée** (panneau contextuel) : dossier courant surligné `--orange-soft`, sous-dossiers révélés uniquement sur le chemin actif.
- **Aperçu document en tiroir** : clic sur une pièce → tiroir droit avec aperçu filigrané, Statut/Version/Déposé par/Date, activité de la pièce, actions Remplacer / Ouvrir en plein écran. Vue dossier dense (table écran 15) accessible en plein écran.
- Statuts au niveau ligne : Prête (vert) / À vérifier (ambre) / Manquante (neutre — les pièces attendues restent listées).

## 6. Implémentation

- Desktop : View Transitions API ou framer-motion/CSS — peu importe, mais respecter courbe, durées et sens.
- Le clic sur toute la carte opération navigue ; le menu ··· fait `stopPropagation`.
- Pendant un push, l'écran sortant reste monté jusqu'à la fin de l'animation (pas de flash blanc).
- Tokens, composants et shell : voir `README.md` + `parcours.css` du package.
