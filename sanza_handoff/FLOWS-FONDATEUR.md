# Parcours du fondateur — user flows, experience flows et copie

Document autoportant. Il ne suppose aucune connaissance du code : il décrit
**tous** les écrans que rencontre un fondateur, **tous** les états de chacun, et
**la copie exacte** de chaque état.

Destiné à servir de brief pour générer une maquette. Tout ce qui n'y figure pas
n'existe pas — et tout ce qui y figure doit exister.

---

# 0. Le fondateur en une page

**Qui il est.** Une personne qui dirige une entreprise et prépare un dossier —
pour lever, ou pour se faire examiner par une banque, un partenaire, un
auditeur.

**Ce qu'il possède.** UNE opération, la sienne. C'est la différence avec le
fonds, qui en suit plusieurs.

**Ce qu'il redoute.** Deux choses, dans cet ordre :
1. Que ses documents fuitent.
2. Passer pour désorganisé devant un investisseur.

**Ce qu'il vient faire.** Savoir ce qui lui manque, et qui regarde son dossier.

**Son état émotionnel dominant.** Il est en train de demander de l'argent ou de
se faire auditer. Il est exposé. Toute formulation qui le juge — « incomplet »,
« vous n'avez pas », « échec » — travaille contre le produit.

---

# 1. Vocabulaire canonique

Un terme, une chose. Les synonymes créent la confusion et doivent être bannis
de l'interface.

| Terme retenu | Ne jamais dire | Ce que c'est |
|---|---|---|
| **data room** | salle, espace, dossier, VDR | le contenant des documents d'une opération |
| **pièce** | fichier, doc, attachement | un document déposé |
| **dossier** | répertoire, folder | un regroupement de pièces dans la data room |
| **levée** | tour, financement, round | l'opération de financement en cours |
| **préparation** | complétude, score, readiness | le pourcentage d'avancement du dossier |
| **invité** | visiteur, guest, tiers | une personne à qui on a ouvert un accès |
| **programme** | accélérateur, incubateur, SAE | la structure d'accompagnement |
| **cohorte** | promotion, batch | le groupe suivi par un programme |
| **dealroom** | vitrine (côté programme) | la devanture d'un programme vers ses investisseurs |
| **fiche** | profil, page entreprise | la présentation d'une entreprise dans un dealroom |

**Tutoiement/vouvoiement** : **vouvoiement**, partout, sans exception.

---

# 2. Carte des écrans du fondateur

```
PUBLIC
├── /inscription ............... création de compte
├── /connexion ................. connexion
├── /connexion/2fa ............. second facteur
├── /mot-de-passe-oublie ....... demande de réinitialisation
├── /reinitialiser ............. nouveau mot de passe
├── /verifier-email ............ « vérifiez votre boîte »
├── /invitation/[token] ........ invitation investisseur reçue (rare : fondateur invité ailleurs)
└── /rejoindre/[token] ......... invitation d'un programme à rejoindre une cohorte

ONBOARDING
├── /onboarding ................ aiguillage selon le rôle choisi
├── /onboarding/fondateur ...... 1 ou 2 étapes selon l'objectif
└── /bienvenue ................. récapitulatif + première action

APPLICATION (menu latéral)
├── Accueil ...... /dashboard ......... deux versions selon qu'une data room existe
├── Data room .... /espaces ........... liste des data rooms
│   └── ........... /data-room ......... contenu d'une data room
│       ├── onglet Autorisations . /permissions
│       ├── onglet À fournir ..... /checklist
│       ├── onglet Questions ..... /qa
│       ├── onglet Invitations ... /invitations
│       ├── onglet Journal ....... /audit
│       ├── onglet NDA ........... /nda
│       └── onglet Versions ...... /versions
├── Ma levée ..... /deal .............. montants, audience, pipeline, indicateurs
├── Sécurité ..... /securite .......... mot de passe, 2FA, sessions, journal
└── Roadmap ...... /roadmap ........... ce qui arrive, et proposer

HORS MENU (atteints par une action, jamais par navigation)
├── /visionneuse ............... lecture d'un document
├── /preuve/[id] ............... preuve de signature NDA
├── /readiness ................. détail de la préparation (depuis la carte d'accueil)
└── /abonnement ................ régularisation, si l'échéance est passée
```

**Écrans que le fondateur ne voit JAMAIS** : `/pipeline`, `/portefeuille`,
`/cohortes`, `/dealroom`, `/demandes`, `/rapports`, `/vitrine`. Ce sont les
écrans du fonds et du programme.

---

# 3. PARCOURS A — Inscription et première connexion

## A.1 Choix du rôle

**Écran** `/inscription`

Trois cartes, cliquables, une seule sélectionnable :

| Carte | Titre | Sous-titre |
|---|---|---|
| investisseur | **Investisseur** | Je consulte des dossiers |
| fondateur | **Fondateur** | Je prépare mon dossier |
| programme | **Programme d'accompagnement** | Je suis une cohorte d'entreprises |

Champs, dans cet ordre : **Nom complet**, **Poste** (liste déroulante dépendant
du rôle + « Autre »), **E-mail**, **Mot de passe**, **Langue**.

**CTA** : `Créer mon compte`
**Lien secondaire** : « Vous avez déjà un compte ? **Se connecter** »

### Cas de figure

| Cas | Ce qui s'affiche |
|---|---|
| Aucun rôle choisi | CTA actif quand même (le rôle a un défaut) — mais la carte « Fondateur » est présélectionnée si l'arrivée vient d'une invitation |
| Champ nom vide | Sous le champ : « Indiquez votre nom complet. » |
| E-mail mal formé | « Cette adresse ne semble pas valide. Vérifiez la saisie. » |
| Mot de passe trop court | « Choisissez un mot de passe d'au moins 8 caractères. » |
| E-mail déjà pris | « Un compte existe déjà avec cette adresse. **Se connecter** » — le lien est cliquable |
| Trop de tentatives | « Trop de créations de compte depuis cette adresse IP. Réessayez dans une heure. » |
| Arrivée depuis une invitation | L'e-mail est **pré-rempli** et modifiable. Bandeau au-dessus : « **{Programme}** vous a invité. Créez votre compte pour répondre à son invitation. » |
| Envoi en cours | CTA devient `Création…`, désactivé |

## A.2 Confirmation d'adresse

**Écran** `/verifier-email`

> ## Vérifiez votre boîte e-mail
> Nous avons envoyé un lien de confirmation à **{adresse}**. Ouvrez-le pour
> activer votre compte.
>
> *Le lien fonctionne depuis n'importe quel appareil — vous pouvez l'ouvrir sur
> votre téléphone.*
>
> `Renvoyer l'e-mail`  ·  Mauvaise adresse ? **Recommencer**

### Cas de figure

| Cas | Copie |
|---|---|
| E-mail renvoyé | Toast : « E-mail renvoyé à {adresse}. » |
| Renvoi trop fréquent | « Patientez une minute avant de redemander un envoi. » |
| Lien expiré (clic tardif) | Écran dédié : « **Ce lien a expiré.** Les liens de confirmation sont valables 24 heures. `Recevoir un nouveau lien` » |
| Lien déjà utilisé | « **Votre adresse est déjà confirmée.** `Se connecter` » |
| Lien invalide | « **Ce lien n'est pas valide.** Il a peut-être été tronqué par votre messagerie. `Recevoir un nouveau lien` » |

## A.3 Connexion

**Écran** `/connexion`

Champs : **E-mail**, **Mot de passe**. CTA `Se connecter`.
Liens : « **Mot de passe oublié ?** » · « Pas encore de compte ? **Créer un compte** »

| Cas | Copie |
|---|---|
| Identifiants faux | « E-mail ou mot de passe incorrect. » — **jamais** dire lequel des deux |
| Adresse non confirmée | « Confirmez d'abord votre adresse. Nous venons de vous renvoyer un lien. » |
| Trop de tentatives | « Trop de tentatives. Réessayez dans dix minutes. » |
| 2FA active | Redirection vers `/connexion/2fa` |
| Arrivée depuis une invitation | La destination est conservée : après connexion, retour à l'invitation |

## A.4 Second facteur

**Écran** `/connexion/2fa`

> ## Code de vérification
> Saisissez le code à 6 chiffres de votre application d'authentification.
>
> `[ _ _ _ _ _ _ ]`
> `Vérifier`

| Cas | Copie |
|---|---|
| Code faux | « Code incorrect. Vérifiez qu'il n'a pas expiré — il change toutes les 30 secondes. » |
| Code expiré | Même message |
| Appareil perdu | Lien : « **Vous n'avez plus accès à votre application ?** » → écran de contact |

---

# 4. PARCOURS B — Onboarding

Le nombre d'étapes **dépend de l'objectif**. C'est la règle structurante de ce
parcours.

## B.1 Étape 1 — Votre objectif et votre entreprise

**Écran** `/onboarding/fondateur`, étape 1

> ## Votre entreprise
> Ces informations ne sont visibles que de vous et des personnes que vous
> inviterez.

**Objectif** (facultatif — libellé sous le titre : « Vous pourrez le changer
plus tard. ») — deux cartes :

| Carte | Titre | Corps |
|---|---|---|
| `levee` | **Je prépare une levée** | Vous cherchez des investisseurs. Sanza vous aide à monter le dossier et à suivre qui le consulte. |
| `diligence` | **Je réponds à une diligence** | Une banque, un partenaire ou un auditeur examine votre entreprise. Vous n'avez pas de montant à annoncer. |

Champs : **Nom de l'entreprise**, **Secteur**, **Pays**, **Stade**, **Une
phrase qui vous décrit** (facultatif, 120 caractères).

**CTA** :
- objectif = `levee` → `Continuer →` (2 étapes au total)
- objectif = `diligence` → `Terminer` (1 seule étape — pas de levée à renseigner)
- aucun objectif choisi → `Continuer →`, comportement de `levee`

| Cas | Copie |
|---|---|
| Nom d'entreprise vide | Sous le CTA : « Indiquez le nom de votre entreprise pour continuer. » |
| Nom < 2 caractères | Idem |
| Enregistrement en cours | CTA → `Enregistrement…`, désactivé |
| Échec serveur | « Impossible d'enregistrer. Vérifiez votre connexion et réessayez. » |

## B.2 Étape 2 — Votre levée *(uniquement si objectif = levée)*

> ## Votre levée
> Ce que vous cherchez, et pour quand. Rien n'est définitif.

Champs : **Montant recherché**, **Devise**, **Type de tour**, **Horizon**
(liste : *Ce trimestre* / *Q3 2026* / *Q4 2026* / *2027* / *Pas encore décidé*).

**Un seul bouton, dont le libellé suit l'état :**
- aucun champ rempli → `Remplir plus tard`
- au moins un champ rempli → `Terminer`

C'est délibéré : deux boutons feraient croire qu'il faut choisir entre valider
et abandonner.

| Cas | Copie |
|---|---|
| Montant non numérique | « Saisissez un montant en chiffres, sans espace ni symbole. » |
| Retour à l'étape 1 | Lien `← Retour` — les saisies de l'étape 1 sont conservées |

## B.3 La data room est un CHOIX, pas un automatisme

À la fin de l'onboarding, **aucune data room n'est créée**. Le fondateur arrive
sur un accueil qui lui en propose une. C'est ce qui rend `/bienvenue` et
l'accueil honnêtes : ils ne prétendent pas qu'une chose existe déjà.

## B.4 Écran de bienvenue

**Écran** `/bienvenue` — fond sombre, pleine page, sortie de l'application.

> # Bienvenue, {Prénom}
> Votre espace est prêt. Voici où vous en êtes.

Checklist en **une carte**, lignes séparées, chacune avec une pastille cochée
ou vide :

| Ligne | Cochée quand | Note à droite |
|---|---|---|
| **Fiche entreprise** | préparation = 100 % | « Complète » sinon « {n} % » |
| **Votre levée** *(masquée si diligence)* | un montant est saisi | « Renseignée » sinon « À renseigner » |
| **Data room** | une data room existe | « Créée » sinon « À créer » |

**CTA principal** : `Aller à mon espace →`
**CTA secondaire** :
- data room existante → `Déposer mes documents`
- pas de data room → `Créer ma data room`

⚠️ Ne jamais proposer « Déposer mes documents » sans data room : le bouton
mènerait à un écran qui n'a rien à montrer.

---

# 5. PARCOURS C — L'accueil

Deux versions. Le choix se fait sur une seule question : **existe-t-il une data
room ?**

## C.1 Accueil SANS data room — première connexion

L'écran ne montre **aucun compteur**. Des zéros alignés seraient l'image de son
propre retard.

> # Bonjour {Prénom}
> Une seule chose à faire aujourd'hui.

**Bloc principal, fond sombre, pleine largeur :**

> ## Créez votre data room
> C'est le coffre où vivront vos documents. Vous décidez qui y entre, ce que
> chacun peut voir, et vous saurez qui a consulté quoi.
>
> `Créer ma data room`
>
> *Vous préférez explorer d'abord ?* **Voir une démonstration (2 min)**

**En dessous, le chemin complet** — trois étapes, la 1 en pleine intensité, les
2 et 3 atténuées (elles se décrivent, elles ne s'actionnent pas encore) :

| N° | Titre | Corps |
|---|---|---|
| 1 | Créez votre data room | Six dossiers types sont préparés pour vous. |
| 2 | Déposez vos pièces | Vos documents restent chiffrés. Personne n'y accède sans votre geste. |
| 3 | Invitez qui doit lire | Chaque invité signe un accord, et vous voyez ce qu'il consulte. |

### Cas de figure

| Cas | Comportement |
|---|---|
| Vidéo de démonstration absente du serveur | Le bloc « Voir une démonstration » **n'est pas rendu**. Un bouton qui ouvre un 404 est pire qu'un bouton absent. |
| Vidéo présente | Ouverture en **fenêtre modale**, lecture immédiate, muette au départ, fermeture par Échap, par la croix, et par clic sur le fond |
| Invitation de cohorte en attente | **Bandeau orange au-dessus de tout** : voir §11 |

## C.2 Accueil AVEC data room

Quatre zones, dans cet ordre de lecture :

**1. Salutation + une phrase de contexte**
> # Bonjour {Prénom}
> {phrase de conseil contextuel — voir §14}

**2. Carte « Où j'en suis »** — la préparation
> ### Où j'en suis
> **{n} %** de votre dossier est prêt
> [barre de progression]
> Il vous reste **{k} pièces** à fournir. **Voir le détail →**

**3. Carte « Ma levée »** *(masquée si diligence)*
> ### Ma levée
> **{montant} {devise}** recherchés · **{engagé} {devise}** en soft-commit
> {n} investisseurs au pipeline · **Ouvrir →**

**4. Activité récente**
> ### Activité
> - **{Nom}** a consulté *{Document}* — il y a {durée}
> - **{Nom}** a signé le NDA — il y a {durée}
> - **{Nom}** a posé une question — il y a {durée}

### Cas de figure de l'activité

| Cas | Copie |
|---|---|
| Aucune activité, aucun invité | « Personne n'a encore accès à votre data room. Les consultations apparaîtront ici. `Inviter quelqu'un` » |
| Invités présents, aucune consultation | « Vos invités n'ont pas encore ouvert le dossier. C'est fréquent la première semaine. » |
| Plus de 10 événements | Afficher les 5 derniers + « **Voir tout le journal →** » |

---

# 6. PARCOURS D — La data room

## D.1 Liste des data rooms — `/espaces`

| Cas | Écran |
|---|---|
| Aucune | État vide : « **Aucune data room** / Une data room réunit les documents d'une opération. Vous en créerez une par levée, ou une seule si vous n'en menez qu'une. » + `Créer ma data room` |
| Une seule | La liste est **sautée** : on ouvre directement son contenu |
| Plusieurs | Cartes : nom, stade, nombre de pièces, nombre d'invités, dernière activité |

## D.2 Contenu — `/data-room`

Arborescence à gauche, contenu du dossier à droite. Chaque élément porte son
**index calculé** : `1.`, `2.1`, `2.1.1`. L'index se recalcule à chaque
déplacement — il ne se saisit pas.

Six dossiers créés d'office : *Corporate*, *Financier*, *Juridique*,
*Commercial*, *Équipe*, *Conformité*.

### États d'un document

| État | Pastille | Copie au survol |
|---|---|---|
| `uploading` | barre de progression | « Envoi en cours — {n} % » |
| `processing` | pastille grise pulsante | « Préparation de la lecture sécurisée… » |
| `ready` | aucune | — |
| `failed` | pastille rouge | « L'envoi a échoué. `Réessayer` » |

### Dépôt de fichiers

| Cas | Copie |
|---|---|
| Glisser-déposer survolé | La zone se teinte : « Déposez vos fichiers ici » |
| Fichier trop volumineux | « **{Nom}** dépasse la taille maximale de {n} Mo. » |
| Format non pris en charge | « **{Nom}** n'est pas un format lisible. Formats acceptés : PDF, Word, Excel, PowerPoint, images. » |
| Nom avec caractères spéciaux | **Aucun message.** Le nom affiché reste intact ; seule la clé de stockage est nettoyée. L'utilisateur ne doit rien savoir de ce détail technique. |
| Envoi multiple | Une ligne de progression par fichier, un total en haut : « {n} sur {total} envoyés » |
| Connexion perdue | « Envoi interrompu. Vos fichiers déjà envoyés sont conservés. `Reprendre` » |

### Actions sur un dossier

| Action | Confirmation |
|---|---|
| Renommer | Champ en ligne, `Entrée` valide, `Échap` annule |
| Déplacer | Glisser-déposer ; l'index se recalcule silencieusement |
| **Supprimer** | Fenêtre nommant l'impact — voir ci-dessous |

**Confirmation de suppression d'un dossier :**

> ### Supprimer « {Dossier} » ?
> **{n} pièces** et **{m} sous-dossiers** seront supprimés avec lui.
>
> {si des exigences y sont rattachées :}
> ⚠️ **{k} exigences** de votre liste « à fournir » pointent vers ces pièces.
> Elles repasseront à « à fournir ».
>
> {si des invités y ont accès :}
> ⚠️ **{j} personnes** ont accès à ce dossier. Elles ne verront plus rien.
>
> Cette action est définitive.
>
> `Supprimer le dossier`  ·  `Annuler`

Le bouton porte l'action, jamais « OK ».

### Suppression d'un document

Même structure. **Cas particulier bloquant** :

> ### Ce document ne peut pas être supprimé
> **{Nom}** est un accord de confidentialité signé par {n} personnes. Il
> constitue leur preuve d'engagement et la vôtre.
>
> `J'ai compris`

## D.3 Lecture d'un document

Ouverture **en fenêtre modale**, pas en pleine page — le fondateur ne perd pas
sa place dans l'arborescence.

- Navigation par page, molette et flèches
- Bande latérale de vignettes
- Passage au **document suivant sans quitter le lecteur**
- Filigrane visible : *{e-mail} · {date}*

| Cas | Copie |
|---|---|
| Chargement | Ossature grise de la page (jamais un tourniquet seul) |
| Rendu impossible | « Ce document ne peut pas être affiché. `Signaler le problème` » |
| Document en préparation | « Ce document est en cours de préparation. Réessayez dans un instant. » |

---

# 7. PARCOURS E — Ce qu'il reste à fournir

**Écran** onglet « À fournir », détail sur `/readiness`

Les exigences sont réparties en trois catégories : **OHADA**, **Financier**,
**DFI**. Chacune a trois états : `à fournir`, `en cours`, `fourni`.

> ## Ce qu'il reste à fournir
> **{n} %** de votre dossier est prêt.

Une section par catégorie, chacune avec sa progression :

> ### Conformité OHADA · {faites}/{total}
> - ☐ **Statuts à jour** — `Associer une pièce`
> - ◐ **RCCM** — en cours · *2 pièces associées*
> - ☑ **Registre des associés** — *Registre.pdf*

| Cas | Copie |
|---|---|
| Aucune pièce déposée | « Votre liste est prête. Associez vos premières pièces pour voir la préparation monter. » |
| Tout est fourni | « **Votre dossier est complet.** Rien ne vous manque pour recevoir un investisseur. » — pastille verte, ton sobre, pas de confettis |
| Une exigence sans pièce disponible | Au clic sur « Associer une pièce » et data room vide : « Vous n'avez encore déposé aucune pièce. `Déposer un document` » |
| Pièce associée puis supprimée | L'exigence repasse à « à fournir » et un bandeau l'annonce : « **{Exigence}** est repassée à « à fournir » : la pièce associée a été supprimée. » |

---

# 8. PARCOURS F — Inviter un investisseur

## F.1 L'invitation

**Écran** onglet « Autorisations » → `Inviter`

> ### Inviter quelqu'un dans votre data room
> Cette personne recevra un lien nominatif. Elle devra signer votre accord de
> confidentialité avant d'accéder à la moindre pièce.

Champs : **Nom** (facultatif), **E-mail**, **Niveau d'accès**, **Dossiers
autorisés** (cases à cocher, tous par défaut).

**Les cinq niveaux, dans l'ordre :**

| Niveau | Libellé | Description sous le libellé |
|---|---|---|
| `none` | Aucun accès | Ne voit rien. |
| `watermark` | **Lecture filigranée** | Lit à l'écran. Chaque page porte son e-mail et la date. Aucun téléchargement. |
| `view` | Lecture | Lit à l'écran, sans filigrane. |
| `download` | Téléchargement | Peut enregistrer les fichiers. |
| `edit` | Modification | Peut déposer et remplacer des pièces. |

Le niveau **Lecture filigranée** est présélectionné, avec sous la liste :
« Recommandé pour un premier contact. »

**CTA** : `Envoyer l'invitation`

| Cas | Copie |
|---|---|
| E-mail déjà invité | « **{adresse}** a déjà été invitée. `Modifier ses droits` » |
| Aucun dossier coché | CTA désactivé + « Choisissez au moins un dossier. » |
| E-mail non parti | Encadré : « L'invitation existe, mais l'e-mail n'est pas parti. Transmettez ce lien vous-même : » + lien + `Copier` |
| Envoi réussi | Toast : « Invitation envoyée à **{adresse}**. » |

## F.2 Le tableau des accès

Une ligne par invité : **avatar**, nom + e-mail, **droits** (modifiables en
ligne), **dossiers**, **dernière visite**, `Retirer`.

| Cas | Copie de la colonne « dernière visite » |
|---|---|
| Jamais venu | « — » |
| Venu | « il y a {durée} » |
| NDA non signé | Pastille ambre : « **NDA en attente** » |

**Retirer un accès :**

> ### Retirer l'accès de {Nom} ?
> Cette personne ne pourra plus ouvrir aucune pièce. Son historique de
> consultation est conservé.
>
> `Retirer l'accès`  ·  `Annuler`

---

# 9. PARCOURS G — Questions et réponses

Les questions viennent des invités. Chaque réponse a trois états : **brouillon**,
**revue interne**, **publiée**.

> ## Questions
> **{n}** en attente de réponse

Par question : auteur, date, texte, et l'état de la réponse.

| Cas | Copie |
|---|---|
| Aucune question | « **Aucune question pour l'instant.** Les questions de vos invités arriveront ici. Y répondre publiquement évite d'avoir à le refaire dix fois. » |
| Réponse en brouillon | Pastille grise « Brouillon » + « Visible de vous seul. » |
| Réponse en revue | Pastille ambre « En revue » + « Visible de votre équipe, pas de l'auteur. » |
| Réponse publiée | Pastille verte « Publiée » + « Visible de {Nom}. » |
| Publication | Confirmation : « **Publier cette réponse ?** {Nom} la recevra et pourra la lire. Vous pourrez la modifier ensuite. `Publier` · `Annuler` » |

---

# 10. PARCOURS H — Ma levée

**Écran** `/deal` — masqué si l'objectif est `diligence` ; le libellé du menu
devient alors « Ma data room » et l'écran n'affiche que préparation et activité.

Quatre blocs :

**1. Les montants**
> **{cible} {devise}** recherchés
> **{engagé} {devise}** en soft-commit — *{pourcentage} %*
> [barre]

**2. En bref** — les indicateurs par audience (VC / DFI / Banque), lignes libres
saisies par le fondateur.

**3. Les investisseurs sur cette levée** — pipeline curé :
`Invité → NDA en attente → Soft-commit → Diligence → Engagé`, ou `Refusé`.

**4. L'échéance** — date de clôture visée.

| Cas | Copie |
|---|---|
| Aucun montant saisi | « **Votre levée n'est pas encore renseignée.** Indiquez ce que vous cherchez : c'est ce qui rend le reste lisible. `Renseigner ma levée` » |
| Aucun indicateur | « **Aucun indicateur publié.** Ce sont les chiffres que verront vos investisseurs. Vous choisissez lesquels. `Ajouter des indicateurs` » |
| Pipeline vide | « **Personne au pipeline.** Ajoutez les investisseurs que vous suivez — cette liste ne sert qu'à vous. » |
| Levée clôturée | Bandeau : « Cette levée est clôturée. Elle reste consultable dans votre historique. » |

⚠️ **Les tickets du pipeline ne s'additionnent jamais** en soft-commit. Le
soft-commit est un montant que le fondateur saisit lui-même.

---

# 11. PARCOURS I — Rejoindre une cohorte

Le cas le plus délicat du produit : quelqu'un demande à voir l'état de son
dossier, et il n'a rien demandé.

## I.1 L'invitation reçue

**Écran** `/rejoindre/[token]` — hors application, pas de menu.

### Cas 1 — visiteur non connecté
Redirection vers `/inscription`, **e-mail pré-rempli**, avec le bandeau :
« **{Programme}** vous a invité. Créez votre compte pour répondre. »

### Cas 2 — connecté, sans espace créé
> ## Créez d'abord votre espace
> {Programme} vous invite à rejoindre sa cohorte. Pour accepter, il vous faut
> d'abord votre propre espace Sanza — c'est lui qui portera votre dossier, et
> vous en resterez seul propriétaire.
>
> *Votre invitation reste valable : vous la retrouverez sur votre accueil.*
>
> `Créer mon espace`

### Cas 3 — connecté, espace créé : l'écran de consentement
> ## {Programme} souhaite suivre votre préparation
>
> **Ce qu'il verra :** le nom de votre entreprise, votre stade, le montant que
> vous recherchez, votre degré de préparation, et les pièces qu'il vous reste à
> fournir.
>
> **Ce qu'il ne verra pas :** vos documents. Ni leur contenu, ni leur nom. Vous
> seul décidez qui accède à votre data room, et vous pouvez quitter la cohorte
> à tout moment.
>
> `Rejoindre {Programme}`  ·  `Plus tard`

⚠️ **Aucun bouton « Refuser ».** Ne rien faire est un refus. Un bouton
« Refuser » laisserait croire qu'une réponse est due.

### Autres cas

| Cas | Écran |
|---|---|
| Jeton inconnu ou retiré | « **Cette invitation n'est plus valable.** Le lien a peut-être été retiré par le programme. Demandez-lui de vous en envoyer un nouveau. » |
| Déjà accepté | « **Vous faites déjà partie de cette cohorte.** {Programme} suit votre préparation. Vous pouvez quitter la cohorte depuis vos paramètres. » |
| Mauvaise adresse | « **Cette invitation ne vous est pas adressée.** Elle a été envoyée à **{adresse invitée}**, et vous êtes connecté avec {adresse actuelle}. Connectez-vous avec l'adresse invitée. » |
| Expirée (30 jours) | « **Cette invitation a expiré.** Demandez à {Programme} de la relancer. » |

## I.2 Le rappel sur l'accueil

Tant qu'une invitation est vivante, **bandeau orange en tête de l'accueil** :

> **{Programme}** vous invite à rejoindre sa cohorte
> Cohorte « {Nom} ». Rejoindre ne donne accès à aucun de vos documents — vous
> restez seul maître de votre dossier.
> `Voir l'invitation`

Il disparaît dès que l'invitation est acceptée, retirée ou périmée.

---

# 12. PARCOURS J — Être listé dans un dealroom

**Écran** onglet « Autorisations », section **Être listé dans un dealroom**.
Visible **uniquement** si l'entreprise appartient à au moins une cohorte.

> ### Être listé dans un dealroom
> Un programme qui vous accompagne peut montrer votre fiche à ses
> investisseurs : les indicateurs que vous avez publiés, votre montant
> recherché, votre préparation. Aucun document n'y est consultable — un
> investisseur intéressé demande l'accès, et c'est vous qui tranchez.

Une ligne **par cohorte** : nom de la cohorte, nom du programme,
`Accepter d'être listé` ou pastille **LISTÉ** + `Ne plus être listé`.

| Cas | Copie |
|---|---|
| Listé, salle courante | « Salle montrée : **{Nom de la salle}** » |
| Listé, autre salle désignée | En ambre : « Vous avez désigné une autre salle (**{Nom}**). Accepter depuis celle-ci déplacera la fiche. » |
| Aucune cohorte | La section entière est **absente** |
| Retrait | « Retirer votre accord empêche toute nouvelle publication. Une fiche déjà en ligne y reste jusqu'à ce que le programme la retire — la couper dans la seconde surprendrait un investisseur en pleine lecture. » |

---

# 13. PARCOURS K — Donner mandat

Le geste le plus lourd du produit : déléguer à un tiers le droit d'ouvrir sa
data room.

> ### Donner mandat
> Un programme mandaté peut accorder lui-même l'accès à votre data room, sans
> repasser par vous.

Une ligne **par programme**. Bouton `Donner mandat` → **confirmation en deux
temps**, l'avertissement s'affichant AVANT le clic final :

> ⚠️ **{Programme}** pourra ouvrir cette data room à un investisseur sans votre
> accord préalable. Les accès qu'il aura accordés **resteront ouverts même si
> vous retirez le mandat**.
>
> `Annuler`  ·  `Confirmer le mandat`

Retirer un mandat ne demande **aucune confirmation** : refermer une porte n'a
jamais besoin d'être protégé.

| Cas | Copie |
|---|---|
| Sous mandat | Pastille **MANDAT ACCORDÉ** + `Retirer le mandat` |
| Aucune cohorte | Section absente |
| Rappel sous la liste | « Retirer le mandat empêche les accès futurs. Les accès en cours se retirent un par un depuis le tableau ci-dessus, en connaissance de cause. » |

---

# 14. PARCOURS L — Demandes d'accès reçues

Un investisseur a vu la fiche dans un dealroom et demande à entrer.

> ### {Investisseur} demande l'accès à **{Salle}**
> {Programme} {a recommandé cette demande | l'a transmise sans avis}.
> Instrument recherché : **{equity | dette | mezzanine}**
> Demandée il y a {n} jours.
>
> `Accorder l'accès`  ·  `Refuser`

| Cas | Copie |
|---|---|
| Recommandée | Pastille verte « **Recommandée par {Programme}** » |
| Transmise sans avis | Pastille grise « **Transmise sans avis** » |
| Accord | Confirmation : « **Accorder l'accès à {Nom} ?** Cette personne pourra lire vos pièces en lecture filigranée. Vous pourrez ajuster ses droits ensuite. » |
| Refus | Aucune confirmation. Toast : « Demande refusée. » |
| Expirée (30 jours) | Pastille rouge « **Expirée** » + « Cette demande a expiré : elle ne peut plus être tranchée. » — **les boutons disparaissent**, ils ne sont pas grisés |
| Aucune demande | « **Aucune demande pour l'instant.** Les investisseurs qui découvrent votre fiche dans un dealroom apparaîtront ici. » |

---

# 15. PARCOURS M — Sécurité

**Écran** `/securite`

Conseil contextuel en haut, quand la 2FA est inactive :
> La double authentification n'est pas activée. Vos documents intéressent des
> gens qui savent chercher : c'est la première chose qu'un investisseur
> sérieux vérifiera.

Quatre lignes :

| Ligne | Valeur | Action |
|---|---|---|
| **Double authentification** | Non activée / Activée | `Activer` / `Désactiver` |
| **Mot de passe** | Modifié il y a {durée} | `Modifier` |
| **Sessions actives** | {n} appareils · {ville}, {date} | `Voir` |
| **Journal de sécurité** | {n} événements | `Consulter` |

| Cas | Copie |
|---|---|
| Journal vide | « Un journal de sécurité vide est une bonne nouvelle, pas un manque : il se remplira à chaque connexion, changement de mot de passe ou nouvel appareil. » |
| Activation 2FA | QR code + champ de code + **codes de secours à télécharger**, avec : « Conservez ces codes hors de votre téléphone. Ils sont votre seule issue si vous le perdez. » |
| Désactivation 2FA | « **Désactiver la double authentification ?** Votre compte reposera sur votre seul mot de passe. `Désactiver` · `Garder la 2FA` » |

---

# 16. Cas de figure transverses

À appliquer sur **tous** les écrans.

## 16.1 Abonnement

| Cas | Comportement |
|---|---|
| Plus de 7 jours restants | Rien |
| 7 jours ou moins | Bandeau ambre en tête d'écran : « Votre accès se ferme dans **{n} jours**. **Régulariser** » |
| Dernier jour | « Votre accès se ferme **aujourd'hui**. **Régulariser** » |
| Échéance passée | Redirection vers `/abonnement` — plus rien n'est accessible. L'écran explique et propose de régulariser ; **jamais** une erreur technique |

## 16.2 États de chargement

| Contexte | Motif |
|---|---|
| Liste | Ossature grise aux dimensions des lignes réelles |
| Document | Ossature de page, pas de tourniquet seul |
| Action sur bouton | Le libellé change (`Envoi…`), le bouton se désactive — **jamais** de tourniquet qui remplace le texte |
| Plus de 3 secondes | Ajouter : « Cela prend plus de temps que prévu… » |

## 16.3 Erreurs

Structure obligatoire : **ce qui s'est passé + pourquoi + quoi faire**.

| Type | Copie |
|---|---|
| Réseau | « **Connexion perdue.** Vos modifications ne sont pas enregistrées. `Réessayer` » |
| Serveur (500) | « **Quelque chose s'est mal passé de notre côté.** Ce n'est pas vous. Réessayez dans un instant — si cela persiste, écrivez-nous. » |
| Droit refusé (403) | « **Vous n'avez pas accès à cet élément.** Si c'est une erreur, demandez à {propriétaire}. » |
| Introuvable (404) | « **Cette page n'existe pas.** Le lien est peut-être périmé. `Retour à l'accueil` » |

⚠️ Ne jamais afficher un code d'erreur brut, un identifiant technique ou un nom
de table.

## 16.4 États vides — la grammaire en trois temps

Tout état vide se lit ainsi :

1. **Ce qui manque** — un titre qui nomme la chose absente, jamais « Aucune donnée »
2. **À quoi ça servira** — une ou deux phrases
3. **La précision qui rassure** — une ligne en retrait, sous l'action

Plus **une** action, jamais deux principales.

## 16.5 Boutons désactivés

Un bouton grisé **dit toujours pourquoi**, dans une phrase **sous le bouton** —
jamais en info-bulle, qui ne s'ouvre pas au doigt.

## 16.6 Confirmations

- Le titre pose la question avec le **compte réel** : « Supprimer 3 pièces ? »
  et non « Êtes-vous sûr ? »
- Le corps dit la **conséquence** et si c'est **réversible**
- Les boutons portent **l'action** : `Supprimer les pièces` / `Conserver` —
  jamais `OK` / `Annuler`
- Le bouton destructeur est **à droite** et en rouge

## 16.7 Accessibilité de la copie

- Aucune phrase ne repose sur une couleur seule
- Les messages d'erreur sont associés au champ (`aria-describedby`)
- Les animations respectent `prefers-reduced-motion`

---

# 17. Voix et ton

| Situation | Ton | Exemple |
|---|---|---|
| **Neutre** | direct, informatif | « 3 pièces déposées. » |
| **Succès** | sobre, jamais euphorique | « Invitation envoyée. » — pas de « Bravo ! 🎉 » |
| **Erreur utilisateur** | factuel, sans reproche | « Cette adresse ne semble pas valide. » — pas « Vous avez saisi une adresse invalide » |
| **Erreur système** | assume la faute | « Quelque chose s'est mal passé **de notre côté**. Ce n'est pas vous. » |
| **Avertissement** | clair sur la conséquence | « Les accès accordés resteront ouverts. » |
| **État vide** | encourageant, jamais culpabilisant | « Votre espace est vide — et c'est normal. » |

**Interdits absolus :**
- « Oups ! », « Aïe », « Houston »
- Points d'exclamation multiples, émojis dans les messages d'erreur
- « Simplement », « il suffit de », « juste » — minimisent l'effort du lecteur
- Le passif quand l'acteur est connu : « Votre document a été supprimé » →
  « Vous avez supprimé ce document »
- « Incomplet », « échec », « manquant » comme jugement de l'utilisateur

---

# 18. Le conseil contextuel

Une phrase, sur l'accueil et certains écrans, qui **lit l'état réel** et dit
quoi faire aujourd'hui.

**Trois règles :**
1. Il **nomme** — une personne, un document, une date. Sans nom, c'est un
   bandeau publicitaire ; avec, c'est une consigne.
2. Il ne se déclenche que sur un état **réel et vérifiable**.
3. **Un seul à la fois**, le plus urgent.

| Situation | Phrase |
|---|---|
| Data room vide | « Votre data room est prête et vide. Les statuts et le RCCM sont les deux pièces que tout le monde demande en premier — commencez par elles. » |
| Pièces déposées, aucun invité | « Votre dossier est à {n} %. Vous pouvez déjà le montrer : un investisseur préfère un dossier en cours qu'on lui explique à un dossier parfait qui arrive trop tard. » |
| Invité qui n'a jamais ouvert | « **{Nom}** n'a pas encore ouvert votre dossier, six jours après l'invitation. Un message court convertit mieux qu'une relance automatique. » |
| Invité très actif | « **{Nom}** a passé {durée} sur votre dossier cette semaine, surtout sur *{Document}*. C'est le moment de proposer un échange. » |
| Question sans réponse depuis 3 jours | « **{Nom}** attend une réponse depuis {n} jours. Une question qui traîne se lit comme une réponse qu'on évite. » |
| NDA non signé | « **{Nom}** n'a pas signé l'accord de confidentialité : il ne voit encore rien. » |
| Dossier complet | « Votre dossier est complet. Rien ne vous manque pour recevoir un investisseur. » |

---

# 19. Ce qui n'existe pas — et ne doit pas apparaître dans la maquette

- Aucun **chat** libre
- Aucune **notification push** (pas de service worker)
- Aucun **temps réel** (pas de curseurs, pas de présence)
- Aucun **partage public** ni lien anonyme
- Aucune **note privée** de tiers sur l'entreprise
- Aucun **score comparatif** entre entreprises visible du fondateur
- Aucune **suggestion automatique** de montant, de valorisation ou d'investisseur
- Aucun **indicateur à zéro** : si la donnée n'existe pas, l'élément n'est pas
  rendu

---

# 20. Brief pour la génération de maquette

À coller tel quel en tête de la demande :

> Génère une maquette HTML des écrans du fondateur de Sanza, une data room pour
> entreprises africaines qui préparent une levée ou une diligence.
>
> **Contraintes de forme.** Un écran = un bloc `<div data-screen-label="NN Nom">`
> de 1180 px de large. Bandeau supérieur et menu latéral répétés sur chaque
> écran applicatif. Français, vouvoiement.
>
> **Contraintes de fond.**
> - N'invente aucun libellé : utilise exactement la copie du document.
> - Chaque écran doit exister en autant de versions qu'il a d'états listés —
>   vide, chargé, en erreur, en limite.
> - Aucun indicateur à zéro : si la donnée n'existe pas, l'élément disparaît.
> - Tout bouton désactivé porte sa raison sous lui.
> - Toute confirmation nomme l'action, jamais « OK ».
>
> **Palette.** Encre `#171A2C`, quasi-noir `#1A1B1F`, orange `#E85C2B`, orange
> clair `#F08A5E`, craie `#FAF8F4` et `#F4F1EA`, lignes `#E2DED4` et `#E8E5DC`,
> textes secondaires `#4A4E63` et `#8B8FA3`.
> **Typographie.** Instrument Sans pour le texte, IBM Plex Mono pour les
> chiffres, les codes et les étiquettes en capitales.
>
> **Écrans attendus** — la liste du §2, chacun dans tous ses états.
