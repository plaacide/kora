# Mouvement et temps réel — spécification et brief de maquette

Ce document sert deux usages :
1. **spécification** pour qui code ;
2. **brief** à coller dans un générateur de maquette (§6).

---

## 0. Ce qu'une maquette statique peut, et ne peut pas

C'est le point qui décide de toute la suite.

Un générateur de maquette produit du **HTML statique**. Il ne peut ni animer un
parcours ni recevoir un événement. Lui demander « ajoute des micro-animations »
ou « gère le temps réel » ne produit rien d'exploitable.

Ce qu'il **peut** rendre, et qu'il faut donc lui demander :

| Ce qu'on veut | Ce qu'on demande à la maquette |
|---|---|
| Une micro-animation | les **deux états** qu'elle relie — avant / après — côte à côte, plus l'annotation de la transition |
| Un chargement | l'écran en **état squelette**, comme un écran à part entière |
| Une notification temps réel | **l'état produit** par l'événement : la pastille à 3, le bandeau, l'entrée dans le journal |
| Une transition d'état | une **variante d'écran** par état, jamais un seul écran « générique » |

**Règle** : une micro-interaction se maquette en *frames*, pas en mouvement.
Un état de temps réel se maquette en *résultat*, pas en flux.

---

## 1. Ce qui existe déjà dans le produit

À reprendre, pas à réinventer. Ces valeurs sont dans `src/app/globals.css`.

### Courbes

| Nom | Valeur | Usage |
|---|---|---|
| standard | `cubic-bezier(0.22, 1, 0.36, 1)` | tout ce qui entre ou change d'état |
| douce | `cubic-bezier(0.2, 0.8, 0.2, 1)` | déplacements longs |
| `ease-out` | — | animations d'entrée courtes |
| `linear` | — | rotation continue seulement |

### Durées

| Durée | Usage |
|---|---|
| **160 ms** | ouverture de modale ou de popover (`animate-pop`) |
| **180 ms** | changement de couleur, entrée de page (`animate-in`) |
| **250 ms** | fondu d'un élément isolé (`animate-fade-in`) |
| **700 ms** | rotation continue d'attente |
| **1,3 s** | balayage du squelette de chargement |
| **2 s** | pulsation d'une pastille d'état |

### Animations nommées disponibles

`fade-in` · `fade-in-up` · `pop-in` · `shimmer` · `spin` · `pulse-dot` ·
`sz-vib` (la vibration du dernier « a » du logo).

### Deux décisions déjà prises, à ne pas défaire

**L'entrée de page est un fondu d'opacité SEUL.** Un `translateY` de 6 px avait
été essayé : tout l'écran glissait à chaque navigation, ce qui se lisait comme
des composants mal fixés. Pire, le `transform` créait un bloc conteneur qui
piégeait les `position: fixed` des enfants — le voile des modales ne couvrait
que la zone de contenu.

**`prefers-reduced-motion` est respecté** par une règle globale qui ramène
toutes les transitions à `0.001ms`. Toute animation nouvelle doit passer par les
classes existantes, sinon elle échappe à cette règle.

---

## 2. Catalogue des micro-interactions

Structure de Dan Saffer : **déclencheur → règles → retour → boucles**.
Le « retour » est la seule partie visible ; c'est elle qui se maquette.

### 2.1 Dépôt d'un document

| | |
|---|---|
| **Déclencheur** | fichier lâché sur la zone, ou choisi au parcours |
| **Règles** | envoi, puis préparation de la lecture sécurisée, puis disponible |
| **Retour** | barre de progression → pastille grise pulsante → ligne normale |
| **Boucles** | plusieurs fichiers : une barre par fichier, un total en tête |

**Frames à maquetter** : zone au repos · zone survolée par un fichier · envoi à
40 % · en préparation · disponible · échec.

### 2.2 Association d'une pièce à une exigence

| | |
|---|---|
| **Déclencheur** | choix d'une pièce dans la liste |
| **Règles** | l'exigence passe à « fourni », la préparation globale monte |
| **Retour** | la case se coche, **et le pourcentage global s'anime jusqu'à sa nouvelle valeur** |
| **Boucles** | si c'était la dernière exigence de la catégorie, la section entière se marque complète |

Le deuxième effet est ce qui fait la micro-**interaction** : cocher une case est
banal, voir la préparation monter au même instant est ce qui donne envie de
recommencer.

**Frames** : avant · après (case cochée + pourcentage plus élevé) · catégorie
complétée.

### 2.3 Envoi d'une invitation

| | |
|---|---|
| **Déclencheur** | clic sur « Envoyer l'invitation » |
| **Règles** | le bouton se verrouille, l'e-mail part, la ligne apparaît dans le tableau |
| **Retour** | libellé → `Envoi…`, puis toast « Invitation envoyée à {adresse} », puis nouvelle ligne en `fade-in-up` |
| **Boucles** | échec d'envoi → l'encadré « lien à copier » remplace le toast |

**Frames** : au repos · en cours · succès avec toast · échec avec lien à copier.

### 2.4 Ouverture d'un document

| | |
|---|---|
| **Déclencheur** | clic sur une ligne |
| **Règles** | la modale s'ouvre, la première page se charge |
| **Retour** | voile + `pop-in` 160 ms, puis squelette de page, puis la page |
| **Boucles** | pages suivantes préchargées, sans squelette visible |

**Frames** : liste · modale avec squelette · modale avec page rendue.

### 2.5 Suppression

| | |
|---|---|
| **Déclencheur** | clic sur « Supprimer » |
| **Règles** | on calcule l'impact réel avant d'afficher quoi que ce soit |
| **Retour** | la confirmation **nomme les conséquences chiffrées**, pas « êtes-vous sûr » |
| **Boucles** | suppression refusée (NDA signé) → écran d'explication, pas d'erreur |

**Frames** : confirmation avec impact · confirmation bloquante · liste après
suppression.

### 2.6 Bouton désactivé qui s'active

| | |
|---|---|
| **Déclencheur** | la condition manquante est remplie |
| **Règles** | — |
| **Retour** | le bouton passe de gris à orange en 180 ms, **et la phrase d'explication sous lui disparaît en fondu** |

C'est le cas qui a coûté du temps en test réel : un bouton grisé sans phrase.
La phrase fait partie de l'interaction, pas de la décoration.

**Frames** : désactivé + phrase · actif sans phrase.

### 2.7 Barre de préparation

| | |
|---|---|
| **Déclencheur** | la valeur change |
| **Règles** | — |
| **Retour** | la barre se remplit sur 400 ms, le nombre s'incrémente en même temps |
| **Boucles** | passage sous 45 % → la couleur vire ; au-dessus de 75 % → vert |

**Frames** : 0 % · 40 % · 78 % · 100 %.

---

## 3. Catalogue des événements temps réel

Trois colonnes à décider ensemble : **quel événement**, **par quel transport**,
**sur quelle surface**.

### 3.1 La règle de partage

- **Postgres Changes** — état **durable** qui doit être exact.
- **Broadcast** — éphémère, fréquent, sans valeur le lendemain.
- **Presence** — qui est connecté, maintenant.

### 3.2 Événements pour le fondateur

| Événement | Transport | Surface | Copie |
|---|---|---|---|
| Une demande d'accès arrive | Postgres Changes | pastille + entrée dans la liste | « **{Investisseur}** demande l'accès à {Salle}. » |
| Un invité signe le NDA | Postgres Changes | activité + pastille | « **{Nom}** a signé l'accord de confidentialité. » |
| Une question est posée | Postgres Changes | pastille sur l'onglet Questions | « **{Nom}** a posé une question. » |
| Un programme l'invite en cohorte | Postgres Changes | bandeau d'accueil | voir le document des parcours |
| Un invité ouvre un document | **Broadcast** | activité, sans pastille | « **{Nom}** consulte *{Document}*. » |
| Un invité est en train de lire | **Presence** | point vert sur sa ligne | « en ligne » |

### 3.3 Événements pour le programme

| Événement | Transport | Surface |
|---|---|---|
| Une entreprise accepte l'invitation | Postgres Changes | pastille + ligne du tableau |
| Une invitation est ouverte sans suite | Postgres Changes | passage du statut à **LIEN OUVERT** |
| Une entreprise dépose sa première pièce | Postgres Changes | la préparation quitte « NOUVELLE » |

### 3.4 Ce qui ne doit PAS être en temps réel

- La **préparation** : elle se recalcule au dépôt, pas en continu. Un chiffre
  qui bouge tout seul sous les yeux inquiète plus qu'il n'informe.
- Les **montants de levée** : saisis par le fondateur, jamais poussés.
- Le **journal d'audit** : il se consulte, il ne se déroule pas en direct.

### 3.5 Surfaces et leurs règles

| Surface | Quand | Durée | Règle |
|---|---|---|---|
| **Toast** | résultat d'une action que l'utilisateur vient de faire | 4 s, refermable | jamais pour un événement venu d'ailleurs — il apparaîtrait sans cause visible |
| **Pastille** (compteur) | quelque chose attend une action | persistante | disparaît au traitement, pas à la lecture |
| **Bandeau** | une décision est requise | persistante | un seul à la fois, le plus urgent |
| **Ligne d'activité** | information sans action | persistante | pas de pastille |
| **Point de présence** | quelqu'un est là maintenant | temps réel | jamais d'historique |

**Trois interdits** :
- pas de son ;
- pas de notification navigateur (pas de *service worker* dans ce produit) ;
- pas de toast pour un événement distant.

### 3.6 États à maquetter pour chaque surface

- pastille **absente** / à **1** / à **9** / à **99+**
- bandeau **seul** / **empilé avec l'avertissement d'abonnement**
- activité **vide** / **3 lignes** / **plus de 10 avec « voir tout »**
- point de présence **actif** / **absent**

---

## 4. Le cas des deux notifications simultanées

À trancher explicitement, sinon la maquette l'ignore et le code improvise :

> Si un bandeau d'invitation de cohorte **et** l'avertissement d'échéance
> d'abonnement s'appliquent, **l'abonnement passe en premier** : il ferme
> l'accès, l'autre non.

---

## 5. Accessibilité

- Toute animation passe par les classes existantes, donc par
  `prefers-reduced-motion`.
- Une pastille de compteur n'est jamais **que** de la couleur : elle porte le
  nombre.
- Un événement qui change l'écran est annoncé par une région `aria-live="polite"`
  — jamais `assertive`, qui interrompt la lecture en cours.
- Un toast doit rester lisible plus de 4 secondes s'il est survolé ou focalisé.

---

## 6. Brief à coller dans le générateur de maquette

> En plus des écrans, produis les **variantes d'état** ci-dessous. Une maquette
> statique ne peut pas montrer de mouvement : montre donc les **images entre
> lesquelles** le mouvement se produit, chacune comme un écran à part entière,
> étiquetée `data-screen-label`.
>
> **Micro-interactions — produire les paires avant/après :**
> - zone de dépôt : au repos · survolée · envoi à 40 % · en préparation ·
>   disponible · échec
> - exigence : non fournie · fournie, avec la préparation globale plus élevée
> - catégorie d'exigences : partielle · complète
> - bouton : désactivé avec sa phrase d'explication · actif sans phrase
> - barre de préparation : 0 % · 40 % · 78 % · 100 %
> - modale de document : squelette de page · page rendue
> - invitation : au repos · en cours · succès avec toast · échec avec lien à copier
>
> **Temps réel — produire les états produits, pas le flux :**
> - pastille de menu : absente · 1 · 9 · 99+
> - activité : vide · 3 lignes · plus de 10 avec « voir tout »
> - bandeau d'invitation seul · empilé sous l'avertissement d'abonnement
> - ligne d'invité : hors ligne · point vert « en ligne »
> - liste de demandes : vide · 1 en attente · 1 expirée
>
> **Contraintes de mouvement**, à annoter sur chaque paire :
> - courbe standard `cubic-bezier(0.22, 1, 0.36, 1)`
> - 160 ms pour une ouverture de modale, 180 ms pour un changement de couleur
>   ou une entrée de page, 250 ms pour un fondu isolé, 400 ms pour le
>   remplissage d'une barre
> - l'entrée de page est un **fondu d'opacité seul** — jamais de déplacement
> - toute animation doit se désactiver sous `prefers-reduced-motion`
>
> **Interdits** : aucun son, aucune notification navigateur, aucun toast pour un
> événement qui ne vient pas d'une action de l'utilisateur.

---

## 7. Comment transmettre ceci

Il n'y a pas de canal magique — un générateur de design ne lit que ce qu'on lui
donne dans la demande. Trois façons, par ordre d'efficacité :

1. **Coller le §6 en tête de la demande**, après le brief des écrans
   (`FLOWS-FONDATEUR.md` §20). Les deux se complètent : l'un donne les écrans,
   l'autre leurs variantes d'état.
2. **Joindre ce fichier entier** si l'outil accepte les pièces jointes. Le §0 et
   le §1 lui évitent d'inventer des durées.
3. **Après une première génération**, renvoyer les manques : « il manque la
   variante *envoi à 40 %* de la zone de dépôt ». Le format `data-screen-label`
   rend ces manques faciles à nommer.

⚠️ Ne demandez **jamais** « ajoute des animations » sans lui dire lesquelles :
il en inventera, avec ses propres durées, et le produit aura deux grammaires de
mouvement.
