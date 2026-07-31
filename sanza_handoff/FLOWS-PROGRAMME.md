# Parcours du programme d'accompagnement — user flows et experience flows

Document autoportant, destiné à servir de brief pour générer une maquette.
Il ne suppose aucune connaissance du code.

**Copie reprise de la maquette officielle** (`maquettes/programme-onboarding-17-ecrans.html`)
partout où elle existe. Les libellés y sont **littéraux** : ne pas les
reformuler.

---

# 0. Le persona

## 0.1 Qui il est

Un directeur de programme — accélérateur, incubateur, venture studio, programme
public. Il accompagne **une promotion d'entreprises**, pas une entreprise.

Prénom de référence dans la maquette : **Fatou**, structure **Savane
Accelerator**, cohorte **Saison 4 · Agri & Agro**.

## 0.2 Ce qu'il possède, et ce qu'il ne possède pas

| Il possède | Il ne possède pas |
|---|---|
| des cohortes | **aucun dossier** |
| une vitrine vers ses investisseurs | **aucun document** |
| une relation avec des bailleurs | aucun droit sur les data rooms |

C'est la différence structurante avec le fondateur et le fonds. Tous les
écrans du programme découlent de cette asymétrie : **il voit des états, jamais
des contenus**.

## 0.3 Ses trois métiers, dans l'ordre où il les exerce

1. **Faire entrer** — inviter des entreprises et obtenir qu'elles acceptent.
2. **Accompagner** — repérer qui décroche, poser des questions, relancer.
3. **Valoriser** — présenter la promotion à des investisseurs, et rendre des
   comptes à son bailleur.

## 0.4 Jobs to be done

| Quand… | je veux… | pour… |
|---|---|---|
| j'ouvre le produit le matin | savoir **qui appeler aujourd'hui** | ne pas perdre une entreprise qui décroche |
| une entreprise ne répond pas | savoir **si elle a vu** mon invitation | choisir entre un e-mail et un coup de fil |
| mon bailleur demande un point | produire un état **sans refaire un tableur** | ne pas y passer un après-midi |
| un investisseur s'intéresse | **filtrer** avant de déranger l'entreprise | protéger la relation avec mes entreprises |
| une promotion démarre | montrer que le programme **sert à quelque chose** | justifier le prochain financement |

## 0.5 Ce qu'il redoute

- Qu'une entreprise se sente **surveillée** et refuse de rejoindre.
- Présenter à un investisseur une vitrine **vide ou creuse** — ça ne se rachète
  pas.
- Découvrir **trop tard** qu'une entreprise a décroché.
- Devoir expliquer à son bailleur qu'il n'a **pas de chiffres**.

## 0.6 Sa tension centrale

**Il a besoin d'informations qu'il n'a pas le droit d'exiger.** Chaque écran doit
donc, en même temps, lui donner de quoi agir et rappeler la limite. C'est ce qui
rend ce persona difficile à écrire — et c'est pourquoi la copie de la maquette
répète si souvent « ce que vous verrez / ce que vous ne verrez pas ».

---

# 1. Vocabulaire canonique

| Terme retenu | Ne jamais dire | Ce que c'est |
|---|---|---|
| **cohorte** | promotion, batch, saison | le groupe d'entreprises suivi sur une période |
| **entreprise** | startup, boîte, participant | un membre de la cohorte |
| **dealroom** | vitrine, showcase, marketplace | la devanture vers les investisseurs |
| **fiche** | profil, page | la présentation d'une entreprise dans le dealroom |
| **data room** | salle, espace | ce que possède l'entreprise, et que le programme ne voit pas |
| **préparation** | complétude, readiness, score | l'avancement du dossier d'une entreprise |
| **invitation** | demande, sollicitation | ce qu'on envoie à une entreprise pour la faire entrer |
| **demande d'accès** | requête, sollicitation | ce qu'un investisseur envoie pour entrer dans une data room |
| **mandat** | délégation, procuration | l'autorisation d'accorder l'accès à la place de l'entreprise |
| **bailleur** | financeur, LP | celui à qui le programme rend des comptes |

**Vouvoiement**, partout.

---

# 2. Carte des écrans

```
PUBLIC
├── 01  /inscription ............ rôle « Programme d'accompagnement »
├── 02  /verifier-email ......... confirmation d'adresse
│       /connexion, /connexion/2fa, /mot-de-passe-oublie, /reinitialiser
│
ONBOARDING — 3 étapes
├── 03  votre structure ......... type, nom, pays, site, volume annuel
├── 04  votre première cohorte .. nom, places, dates, objectif
├── 05  vos entreprises ......... invitations, sautable
└── 06  /bienvenue .............. checklist honnête + deux actions
│
APPLICATION (menu latéral, dans cet ordre)
├── Portefeuille .. /portefeuille ..... 11 — indicateurs agrégés
├── Mes cohortes .. /cohortes ......... 07 — liste
│   └── ............ /cohortes/[id] .... 08 · 09 · 10 · 12 — détail
├── Dealroom ...... /dealroom ......... 13 — publication + audience
├── Demandes ...... /demandes ......... 14 — file des demandes d'accès
├── Rapports ...... /rapports ......... 15 — état pour le bailleur
├── Sécurité ...... /securite ......... 16
└── Roadmap ....... /roadmap .......... 17
```

**Écrans que le programme ne voit JAMAIS** : `/data-room`, `/visionneuse`,
`/deal`, `/checklist`, `/qa`, `/versions`, `/nda`, `/permissions`, `/pipeline`.
Ce sont les écrans de ceux qui possèdent un dossier.

## 2.1 Le grisage progressif du menu

Trois entrées s'activent au fur et à mesure. **Grisées, pas masquées** : un menu
qui s'allonge tout seul désoriente, une entrée grisée qui dit sa condition
enseigne le produit.

| Entrée | S'ouvre quand |
|---|---|
| **Portefeuille** | une entreprise a rejoint une cohorte |
| **Demandes d'accès** | une entreprise est publiée dans le dealroom |
| **Rapports** | une entreprise a entamé son dossier |

**Une seule ligne d'aide sous tout le menu**, jamais une par entrée. Elle nomme
la condition la plus proche d'être remplie :

- rien n'a rejoint → *« Les écrans grisés s'activent dès qu'une entreprise a rejoint une cohorte. »*
- une entreprise a rejoint, rien n'est déposé → *« Rapports s'ouvre dès qu'une entreprise a entamé son dossier. »*
- plus rien n'est grisé → **aucune ligne**

---

# 3. ÉCRAN 01 — Inscription

Trois cartes de rôle. Le programme choisit **« Programme d'accompagnement »**,
sous-titre : *Je suis une cohorte d'entreprises*.

Champs : **Nom complet**, **Poste**, **E-mail**, **Mot de passe**, **Langue**.
CTA `Créer mon compte`.

| Cas | Copie |
|---|---|
| E-mail déjà pris | « Un compte existe déjà avec cette adresse. **Se connecter** » |
| Mot de passe court | « Choisissez un mot de passe d'au moins 8 caractères. » |
| Trop de tentatives | « Trop de créations de compte depuis cette adresse IP. Réessayez dans une heure. » |
| En cours | CTA → `Création…`, désactivé |

# 4. ÉCRAN 02 — Confirmation d'adresse

> ## Vérifiez votre boîte e-mail
> Nous avons envoyé un lien de confirmation à **{adresse}**.
> *Le lien fonctionne depuis n'importe quel appareil.*
> `Renvoyer l'e-mail`

| Cas | Copie |
|---|---|
| Renvoyé | Toast « E-mail renvoyé à {adresse}. » |
| Trop fréquent | « Patientez une minute avant de redemander un envoi. » |
| Lien expiré | « **Ce lien a expiré.** Les liens de confirmation sont valables 24 heures. `Recevoir un nouveau lien` » |
| Déjà confirmé | « **Votre adresse est déjà confirmée.** `Se connecter` » |

---

# 5. ÉCRAN 03 — Onboarding 1/3 · Votre structure

**Chrome commun aux trois étapes :**
- en haut à gauche : logo
- en haut à droite : `ÉTAPE {n} / 3` · **`Enregistrer et quitter`**
- colonne gauche : **VOTRE INSCRIPTION**, trois jalons numérotés

| N° | Titre | Sous-titre |
|---|---|---|
| 1 | **Votre structure** | Nom, pays, type |
| 2 | **Votre première cohorte** | Dates et objectif |
| 3 | **Vos entreprises** | Invitations |

**Encart latéral — BON À SAVOIR :**
> Vous ne verrez jamais les documents de vos entreprises. Vous verrez leur
> avancement, leurs pièces manquantes, et ce qu'elles acceptent de montrer.

C'est la promesse fondatrice, posée avant la première saisie.

**Contenu :**
> ## Votre structure
> Ce que verront les entreprises que vous inviterez, et vos investisseurs.

- **Type de structure** — pastilles, choix unique :
  `Accélérateur` · `Incubateur` · `Venture studio` · `Programme public`
- **Nom de la structure** — *ex. Savane Accelerator*
- **Pays** — liste
- **Site web** — *ex. savane.africa*
- **Entreprises accompagnées par an** — *ex. 10 à 25*

**Actions :** `Compléter plus tard` (lien) · `Continuer →` (bouton)

| Cas | Copie |
|---|---|
| Nom vide ou < 2 caractères | Sous le bouton : « Renseignez le nom de votre structure pour continuer. » |
| Aucun type choisi | Autorisé — le type est facultatif |
| Enregistrement | `Enregistrement…`, bouton désactivé |
| Échec | « Impossible d'enregistrer. Vérifiez votre connexion et réessayez. » |
| Reprise après abandon | L'étape atteinte est restaurée, les champs pré-remplis |

---

# 6. ÉCRAN 04 — Onboarding 2/3 · Votre première cohorte

**Encart latéral — DEUX NOTIONS :**
> **Cohorte** — une promotion, avec des dates et une fin.
> **Dealroom** — la vitrine que vous publiez vers vos investisseurs, entreprise
> par entreprise.

Cet encart existe parce que la confusion cohorte/dealroom est **la** confusion
du persona. Il reste visible à l'étape 3.

**Contenu :**
> ## Votre première cohorte
> Une cohorte est une promotion : elle a un début, une fin, et un objectif. Vous
> en créerez d'autres.

- **Nom de la cohorte** — *ex. Saison 4 · Agri & Agro*
- **Places** — nombre, défaut 15
- **Début** / **Fin visée** — dates
- **Objectif** — pastilles :
  `Préparer à lever` · `Accès à la dette` · `Mise en conformité` · `Croissance commerciale`
  **+ `+ Autre objectif`** → champ libre, 40 caractères, jusqu'à **6** objectifs au total

⚠️ La maquette dit « Objectif principal » au singulier. **Le produit permet
plusieurs objectifs et des objectifs libres** — décision explicite du fondateur.
La maquette à générer doit refléter le multiple.

**Actions :** `← Retour` · `Continuer →`

| Cas | Copie |
|---|---|
| Nom vide | Sous le bouton : « Donnez un nom à cette cohorte pour continuer. » |
| 6 objectifs atteints | Les pastilles non choisies se grisent + « 6 objectifs au maximum — au-delà, ce n'est plus un objectif mais une description. » |
| Objectif libre vide | Le bouton `Ajouter` reste désactivé |
| Doublon d'objectif | Rien ne se passe, sans message — l'intention est déjà satisfaite |
| Fin avant début | « La date de fin doit suivre la date de début. » |

---

# 7. ÉCRAN 05 — Onboarding 3/3 · Vos entreprises

> ## Invitez vos premières entreprises
> Chacune accepte elle-même et garde la main sur ses documents. Vous pouvez
> aussi le faire plus tard.

- **Emails des fondateurs** — zone de texte, *ex. contact@kalyxfoods.ci, joe@coolbricks.ci…*
- Aide sous le champ : *Séparez par des virgules ou collez une liste. Vous pourrez en ajouter à tout moment.*
- **`Importer une liste`** — bouton secondaire, fichier CSV

**Rappel avant les actions :**
> Chaque fondateur reçoit une invitation nominative, l'accepte lui-même, et
> garde la main sur ses documents. Vous ne verrez jamais ses pièces — seulement
> son avancement.

**Actions :** `Je le ferai plus tard` · `Envoyer les invitations`

| Cas | Copie |
|---|---|
| Champ vide | `Envoyer les invitations` désactivé ; `Je le ferai plus tard` reste actif |
| Adresses invalides mêlées | « **{n} adresses** ne sont pas valides et seront ignorées : {liste}. » — on n'empêche pas l'envoi des autres |
| Palier dépassé | « Palier atteint : **{n} entreprises** sur votre plan. Contactez-nous pour l'étendre. » |
| Envoi partiel | « **{n} invitations envoyées.** {m} n'ont pas pu partir — leur lien est à copier ci-dessous. » |
| Import CSV, colonne introuvable | « Aucune colonne d'adresse détectée. La première ligne doit contenir un en-tête « email ». » |

---

# 8. ÉCRAN 06 — Bienvenue

Pleine page, fond sombre, hors application.

> # Bienvenue, Fatou
> **Savane Accelerator** est en place et votre première cohorte est créée. Trois
> invitations sont parties — l'écran se remplira au fur et à mesure des
> acceptations.

**Checklist honnête**, une carte, trois lignes :

| Ligne | État à droite |
|---|---|
| **Structure enregistrée** | Fait |
| **Cohorte « {Nom} »** | Créée |
| **{n} entreprises invitées** | **En attente de leur réponse** |

⚠️ La troisième ligne n'est **jamais cochée** tant que personne n'a accepté. Une
invitation partie n'est pas une adhésion.

**Actions :** `Ouvrir ma cohorte` · `Inviter d'autres entreprises`

| Cas | Copie de la 3ᵉ ligne |
|---|---|
| Aucune invitation envoyée | « Aucune entreprise invitée » · *À faire* |
| n invitées, 0 acceptée | « {n} entreprises invitées » · *En attente de leur réponse* |
| n invitées, m acceptées | « {n} entreprises invitées » · *{m} ont accepté* |
| 2FA non activée | Quatrième ligne : **Double authentification** · *Recommandée*, et un second bouton `Activer la double authentification` |

---

# 9. ÉCRAN 07 — Cohortes, état vide

> ## Mes cohortes
> Votre espace est vide — et c'est normal. Une seule chose à faire aujourd'hui.

**État vide :**
> ### Commencez par une cohorte
> Une cohorte est une promotion : quelques entreprises, des dates, un objectif.
> Tout le reste de Sanza s'y rattache — le suivi, le dealroom, les rapports.
>
> `Créer ma première cohorte`  ·  `Comment ça marche`
>
> *Vous pourrez en gérer plusieurs en parallèle, et une entreprise peut
> appartenir à deux cohortes.*

## 9.1 Cohortes, état rempli

Une carte par cohorte : **nom**, **période**, et cinq chiffres réels —
entreprises · data rooms · volume recherché · préparation moyenne · à relancer.

| Cas | Comportement |
|---|---|
| Une seule cohorte | La liste s'affiche quand même — on ne saute pas à son détail, contrairement aux data rooms du fondateur |
| Cohorte archivée | Grisée, badge **ARCHIVÉE**, en bas de liste |
| Préparation moyenne | Ne compte **que** les entreprises ayant un score. Une cohorte sans dossier affiche « — », jamais 0 % |
| Devises multiples | Le volume affiche « — » + *devises multiples* ; on n'additionne pas des FCFA et des NGN |
| Plus de 2 relances en attente | Le chiffre passe en rouge |

---

# 10. ÉCRAN 08 — Cohorte sans entreprise

**En-tête :**
> ### Saison 4 · Agri & Agro
> mars → décembre 2026 · 0 / 15 places · **aucune entreprise**
>
> `Modifier la cohorte`  ·  `Inviter une entreprise`

**État vide :**
> ### Invitez vos premières entreprises
> Rien n'apparaîtra ici avant qu'une entreprise ait accepté votre invitation.
> Elle garde la main sur ses documents — vous verrez son avancement, pas ses
> pièces.
>
> `Inviter par email`  ·  `Importer une liste`
>
> *Une invitation reste valable 30 jours et se relance en un clic.*

---

# 11. ÉCRAN 09 — Invitations en attente

L'écran le plus dense du produit, et le plus utile.

**En-tête :**
> ### Saison 4 · Agri & Agro
> mars → décembre 2026 · **3 invitations envoyées · 0 acceptée**
>
> `Relancer tout le monde`  ·  `Inviter une entreprise`

**Conseil contextuel** — la signature du produit :
> Trois invitations partent, personne n'a encore accepté. C'est fréquent la
> première semaine : une relance nominative convertit mieux qu'un rappel
> automatique. **CoolBricks** a ouvert le lien sans finir — c'est celle-là qu'il
> faut appeler.

**Liste — INVITATIONS EN ATTENTE.** Une ligne par invitation :
avatar à initiales · **nom de l'entreprise** · adresse · **statut** · ancienneté
· `Relancer` · `Retirer`

**Les trois statuts, et pourquoi ils diffèrent :**

| Statut | Condition | Ce que le programme doit faire |
|---|---|---|
| **ENVOYÉE** | partie, jamais ouverte, moins de 5 jours | attendre |
| **LIEN OUVERT** | le lien a été ouvert au moins une fois | **appeler** — la personne a vu et a hésité |
| **À RELANCER** | jamais ouverte, 5 jours ou plus | renvoyer un e-mail |
| **EXPIRÉE** | 30 jours sans réponse | relancer, sinon elle ne peut plus être acceptée |

⚠️ Une invitation ouverte **garde** ce statut quel que soit son âge : avoir été
vue prime sur le temps écoulé.

**Cas de figure :**

| Cas | Comportement |
|---|---|
| Une seule invitation en attente | `Relancer tout le monde` est **masqué** — il ferait doublon |
| Relance groupée réussie | « **{n} invitations relancées.** » |
| Relance d'une expirée | Autorisée : elle repousse l'échéance de 30 jours |
| E-mail non parti | Encadré avec le lien à copier, sous la liste |
| Invitation acceptée | La ligne passe en **A REJOINT**, vert, sans bouton `Relancer` |
| Sans nom d'entreprise saisi | L'adresse fait office de titre, l'avatar prend ses initiales |
| Retrait | Confirmation : « **Retirer l'invitation de {nom} ?** Son lien cessera de fonctionner. Vous pourrez la réinviter plus tard. » |

---

# 12. ÉCRAN 10 — Première entreprise

**En-tête :**
> ### Saison 4 · Agri & Agro
> **1 entreprise · 1 data room · 2 invitations en attente**
>
> `Rapport bailleur`  ·  `Publier le dealroom`

**Conseil contextuel :**
> **CoolBricks** a rejoint votre cohorte. Son dossier est encore vide : c'est le
> bon moment pour lui indiquer les cinq pièces socle. Vos indicateurs de
> portefeuille s'activeront dès son premier dépôt.

**Filtres :** `Toutes` · `Décrochent` · `Dans la vitrine` — à droite,
`TRIÉ PAR RISQUE`.

**Barre de sélection**, au-dessus du tableau :
> 0 sur 1 listées dans le dealroom · vous choisissez qui apparaît · **1 en attente d'accord**
> `Mettre à jour le dealroom`

**Tableau** — colonnes : ☐ · **ENTREPRISE** · DATA ROOMS · RECHERCHÉ ·
PRÉPARATION · **DEALROOM**

Une ligne :
> ☐ · **CoolBricks** `NOUVELLE` / *Construction · Abidjan* · 1 salle ·
> *non renseigné* · 0 % · **Accord en attente**

**Note sous le tableau :**
> Une entreprise peut avoir plusieurs data rooms : le dealroom pointe celle
> qu'elle a désignée. Retirer une fiche du dealroom ne coupe aucun accès déjà
> accordé.

**Le bouton « Publier le dealroom » reste inactif**, avec sa raison :
> Aucune entreprise n'a encore donné son accord pour être listée, et aucune n'a
> de dossier entamé. Publier une vitrine vide coûte une crédibilité qu'on ne
> rachète pas.

## 12.1 Les états d'une ligne d'entreprise

| Badge | Condition | Couleur |
|---|---|---|
| **NOUVELLE** | aucune préparation mesurable — pas encore de data room | bleu |
| **DÉCROCHE** | préparation < 45 % | rouge |
| **EN COURS** | préparation entre 45 % et 75 % | ambre |
| **PRÊTE** | préparation ≥ 75 % | vert |

⚠️ **Préparation nulle ≠ zéro.** Une entreprise qui vient de rejoindre est
NOUVELLE, jamais « en décrochage ». Elle est exclue du filtre « Décrochent ».

## 12.2 La colonne DEALROOM

| Valeur | Signification |
|---|---|
| **Accord en attente** | l'entreprise n'a pas consenti au listage |
| **Accord donné** | consentement vivant, mais dossier vide |
| **Listable** | les deux conditions sont réunies, la case est cochable |
| **Dans la vitrine** | fiche publiée |

**La case à cocher est INERTE sans accord.** Grisée, avec au survol : « Cette
entreprise n'a pas donné son accord pour être listée. »

## 12.3 Cas de figure du tableau

| Cas | Comportement |
|---|---|
| Aucune entreprise listable | Encart au-dessus du tableau, texte de l'écran 13 |
| Filtre « Décrochent » vide | « Aucune entreprise ne décroche. » — ton neutre, pas de félicitations |
| Filtre « Dans la vitrine » vide | « Aucune entreprise n'est publiée. » |
| Devises multiples | Colonne RECHERCHÉ en devise propre à chaque ligne |
| Montant non renseigné | *non renseigné*, en gris — jamais « 0 » |
| Plus de 15 entreprises | Pagination, 15 par page, tri par risque conservé |

---

# 13. ÉCRAN 11 — Portefeuille

> ## Portefeuille
> Aucun indicateur pour l'instant — ils se calculent à partir des dossiers de
> vos entreprises.

**État vide :**
> ### Vos indicateurs attendent le premier dépôt
> Volume recherché, préparation moyenne, entreprises prêtes à pitcher,
> décrochages : tout se calcule automatiquement dès qu'une entreprise renseigne
> sa levée et dépose ses pièces.
>
> `Voir ma cohorte`  ·  `Relancer mes entreprises`
>
> *Nous n'affichons pas d'indicateurs à zéro : un tableau de bord vide se lit
> comme un produit cassé.*

## 13.1 Portefeuille rempli

Quatre cartes : **Entreprises** · **Prêtes (≥ 75 %)** · **Préparation moyenne**
· **Volume recherché**.

Puis une carte par entreprise, **triée du moins préparé au plus préparé** — la
liste des urgences, pas l'annuaire.

Chaque carte : nom, montant · stade, pourcentage, exigences faites/total, et
surtout **les pièces manquantes NOMMÉES** :

> ### Il lui reste à fournir
> `RCCM` `États financiers 2025` `Pacte d'associés`

Un directeur qui lit « 40 % » ne sait pas quoi faire de sa journée ; « il manque
le RCCM » se relance dans la minute.

| Cas | Comportement |
|---|---|
| Aucune entreprise | État vide ci-dessus, **les quatre cartes ne sont pas rendues** |
| Devises multiples | Volume affiche « — » + *devises multiples* |
| Entreprise sans pièce manquante | La section « Il lui reste à fournir » disparaît |
| Export | `Exporter (Excel)` en haut à droite, visible seulement si la liste n'est pas vide |

---

# 14. ÉCRAN 12 — Questions et suggestions

Panneau latéral du détail de cohorte.

> ## Questions & suggestions
> Le fil entre vous et vos entreprises. Rien n'a encore été échangé.

**État vide :**
> ### Posez votre première question
> Une question attend une réponse et reste ouverte jusqu'à ce qu'elle arrive.
> Une suggestion n'attend rien — elle s'affiche dans l'espace de l'entreprise,
> sans créer de dette.
>
> `Écrire à une entreprise`
>
> *Vos échanges ne sont visibles que de l'entreprise concernée. Les autres
> membres de la cohorte n'en savent rien.*

**Formulaire :** bascule `QUESTION` / `SUGGESTION`, avec sous elle :
*Une suggestion n'attend pas de réponse. Une question, oui.*
Puis un sélecteur **Choisissez une entreprise**, une zone de texte
*Écrire à l'entreprise…*, et `Envoyer`.

| Cas | Comportement |
|---|---|
| Aucune entreprise dans la cohorte | Le sélecteur est vide et désactivé : « Invitez d'abord une entreprise. » |
| Texte vide | `Envoyer` désactivé |
| Question ouverte | Pastille ambre **EN ATTENTE** + ancienneté |
| Question répondue | Pastille verte **RÉPONDU** + la réponse sous la question |
| Suggestion | Pastille grise **SUGGESTION**, jamais de statut d'attente |
| Plus de 10 échanges | Les 5 derniers + « Voir tout » |

⚠️ **Ce n'est pas un chat.** Pas de fil de discussion, pas d'indicateur de
frappe, pas d'accusé de lecture. Un fil non lu est une dette.

---

# 15. ÉCRAN 13 — Dealroom

> ## Dealroom
> La vitrine que vous publiez vers vos investisseurs. Elle n'est pas encore
> publiable.
>
> `Publier` *(inactif)*

**État vide :**
> ### Aucune entreprise n'est encore listable
> Vous choisissez qui apparaît, entreprise par entreprise. Deux conditions :
> l'entreprise a donné son accord pour être listée, et son dossier est entamé —
> un investisseur qui ouvre une fiche vide ne revient pas.
>
> `Demander l'accord à mes entreprises`

**Aperçu de la vitrine** — deux colonnes explicatives, toujours visibles :

| **Ce que l'investisseur verra** | **Ce qu'il pourra demander** |
|---|---|
| Une fiche par entreprise : secteur, stade, montant recherché, chiffres clés selon l'instrument qu'il cherche. **Aucun document.** | L'accès à une data room. Vous filtrez et recommandez ; l'entreprise accorde, sauf si elle vous a mandaté. |

## 15.1 Dealroom rempli

Une section **par cohorte**, chacune avec :

**Fiches publiées** — une ligne par entreprise : nom, *publiée le {date}*,
`Dépublier`.
> *Dépublier retire la fiche de la vitrine. Cela ne retire aucun accès à une
> data room déjà accordé.*

**Qui a accès** — l'audience :
> La vitrine n'est pas publique et n'est pas indexée. On y entre par invitation
> nominative, liée à une adresse : un lien transféré n'ouvre rien.

Champ `adresse@fonds.com` + `Inviter`, puis une ligne par investisseur :
adresse · **ENVOYÉE** ou **ACCEPTÉE** · *invité le {date}* · `Retirer l'accès`

> *Retirer l'accès ferme la vitrine à cette personne. Les data rooms auxquelles
> une entreprise lui a ouvert l'accès ne sont pas touchées — cette décision
> appartient à l'entreprise.*

| Cas | Comportement |
|---|---|
| Aucune fiche publiée | **Le formulaire d'invitation n'est PAS affiché.** Inviter dans une vitrine vide brûle la seule occasion de faire venir quelqu'un |
| Cohorte sans fiche publiée | Sa section entière est absente, plutôt qu'une section vide |
| Aucun investisseur invité | « **Personne n'a encore accès.** Invitez les investisseurs que vous voulez voir parcourir cette cohorte. » |
| E-mail non parti | Encadré avec le lien à copier |
| Adresse déjà invitée | La réinvitation **rouvre** l'accès sans créer de doublon ; le premier lien reste valable |

---

# 16. ÉCRAN 14 — Demandes d'accès

> ## Demandes d'accès
> Aucune demande pour l'instant.

**État vide :**
> ### Les demandes arriveront ici
> Dès qu'un investisseur ouvre une fiche de votre dealroom et veut aller plus
> loin, sa demande atterrit dans cette file — avec qui il est, ce qu'il cherche,
> et quelle salle il vise.
>
> *Vous filtrez et recommandez : transmettre avec avis favorable, transmettre
> sans avis, ou écarter. C'est l'entreprise qui accorde l'accès — vous éclairez
> sa décision.*

## 16.1 Une demande

> **{Investisseur}** · {Organisation}  `DÉCISION STARTUP`
> {Entreprise} · salle **{Nom}** · cherche **{equity | dette | mezzanine}**
> *il y a {n} jours*
>
> `Transmettre avec avis favorable`  ·  `Transmettre sans avis`  ·  `Écarter`
>
> *Vous recommandez ; c'est l'entreprise qui accorde l'accès.*

## 16.2 Le badge décide de tout

| Badge | Quand | Bouton principal |
|---|---|---|
| **DÉCISION STARTUP** | pas de mandat | `Transmettre avec avis favorable` |
| **MANDAT ACCORDÉ** | l'entreprise a mandaté le programme pour cette salle | **`Accorder l'accès`** — il ouvre réellement |

⚠️ Les deux boutons ne portent **jamais** le même libellé. Confondre, c'est
croire accorder quand on recommande — ou l'inverse, ce qui est pire.

## 16.3 Cas de figure

| Cas | Comportement |
|---|---|
| Demande périmée (30 j) | Pastille rouge **EXPIRÉE** + « Sans réponse depuis 30 jours, cette demande a expiré : elle ne peut plus être tranchée. L'investisseur peut la relancer une fois. » — **les boutons disparaissent**, ils ne sont pas grisés |
| Expire dans moins de 7 jours | Pastille ambre **EXPIRE DANS {n} JOURS** |
| Déjà tranchée | Pastille grise avec l'issue : *Recommandée* · *Transmise* · *Écartée* · *Accordée* · *Refusée* |
| Pastille de l'en-tête | Ne compte **que** les demandes encore actionnables — une file gonflée de périmées n'appelle aucune action |
| Écarter | Aucune confirmation. L'investisseur est notifié sobrement, l'entreprise ne voit rien |

---

# 17. ÉCRAN 15 — Rapports

> ## Rapports
> Le rapport que vous devez à votre bailleur, sans le refaire dans un tableur.

**État de refus** — c'est la fonctionnalité, pas une limite :
> ### Pas encore assez de matière
> Un rapport de cohorte a besoin d'au moins une entreprise avec un dossier
> entamé. Nous préférons refuser de le générer plutôt que de vous livrer un
> document à cases vides.
>
> `Voir ce qui manque`
>
> *Ce qui entrera dedans : entreprises, montants recherchés, préparation, pièces
> manquantes par catégorie, invitations et accès accordés sur la période.*

## 17.1 Rapport généré

Sélecteur de cohorte (liens, pas menu déroulant — l'URL porte le choix, donc le
rapport se partage).

**Bloc principal :** nom de la cohorte, période, puis quatre chiffres —
Entreprises · Data rooms · Recherché · Accès accordés.

**Par catégorie** — barres : `Conformité OHADA` · `Financier` · `DFI`, chacune
en *{faites}/{total}*.

**Pied :** invitations · *arrêté au {date}*.

## 17.2 Tendance mensuelle

> ### Tendance mensuelle

| Cas | Copie |
|---|---|
| Aucun relevé | « Le premier relevé sera fait en ouvrant ce rapport. Revenez le mois prochain : une courbe demande au moins deux points. » |
| Un seul relevé | « Un seul relevé pour l'instant, celui de ce mois-ci. La tendance apparaîtra au relevé suivant — nous ne traçons pas de courbe à partir d'un point. » |
| Deux relevés ou plus | Une ligne par mois : mois · barre de préparation · pourcentage · *{n} entr. · {m} accès* |
| Mois manquant | Une ligne `···` + « {n} mois sans relevé » — **jamais reliée** |

**Pied de la tendance :**
> Chaque relevé est pris au premier passage du mois sur cet écran, puis figé.
> Les mois où personne n'a ouvert le rapport restent vides : nous ne relions pas
> deux points distants, cela inventerait les mesures manquantes.

---

# 18. ÉCRAN 16 — Sécurité

> ## Sécurité
> Votre compte vient d'être créé. Voici l'état de sa protection.

**Conseil contextuel, quand la 2FA est inactive :**
> La double authentification n'est pas activée. Vous verrez passer des dossiers
> confidentiels d'entreprises tierces : c'est la première chose que votre
> bailleur vous demandera.

Quatre lignes :

| Ligne | Valeur | Action |
|---|---|---|
| **Double authentification** | Non activée | `Activer` |
| **Mot de passe** | Défini il y a quelques minutes | `Modifier` |
| **Sessions actives** | 1 appareil · Abidjan, aujourd'hui | `Voir` |
| **Journal de sécurité** | Aucun événement pour l'instant | — |

**Pied :**
> Un journal de sécurité vide est une bonne nouvelle, pas un manque : il se
> remplira à chaque connexion, changement de mot de passe ou nouvel appareil.

| Cas | Copie |
|---|---|
| 2FA activée | Valeur → *Activée*, action → `Désactiver`, et le conseil du haut **disparaît** |
| Activation | QR code + champ + **codes de secours** : « Conservez ces codes hors de votre téléphone. Ils sont votre seule issue si vous le perdez. » |
| Désactivation | « **Désactiver la double authentification ?** Votre compte reposera sur votre seul mot de passe. `Désactiver` · `Garder la 2FA` » |
| Session à révoquer | « **Déconnecter cet appareil ?** La session en cours sur {appareil} sera fermée. » |

---

# 19. ÉCRAN 17 — Roadmap

> ## Roadmap
> Ce que nous construisons, et ce que vous pouvez peser dessus.

Trois colonnes :

| **EN COURS** | **ENSUITE** | **À L'ÉTUDE** |
|---|---|---|
| Dealroom filtrable par instrument | Ateliers collectifs de cohorte | Comparaison inter-cohortes |
| Rapport bailleur exportable | Indicateurs dette (DSCR, garanties) | API pour vos outils internes |

**État vide des demandes :**
> ### Vous n'avez encore rien demandé
> Les programmes qui nous disent ce qui leur manque voient leurs demandes
> arriver dans « Ensuite » en quelques semaines. Nous lisons tout, et nous
> répondons.
>
> `Proposer une amélioration`

| Cas | Comportement |
|---|---|
| Demandes soumises | Liste sous les colonnes, avec leur statut : *Reçue* · *À l'étude* · *Planifiée* · *Livrée* |
| Soumission | Modale : titre + description + `Envoyer`. Confirmation : « **Reçu.** Nous vous répondons sous une semaine. » |

---

# 20. Cas de figure transverses

## 20.1 Abonnement
Identiques au fondateur : bandeau les 7 derniers jours, redirection vers
`/abonnement` une fois l'échéance passée.

## 20.2 Palier d'entreprises
Le plan borne le nombre d'entreprises accompagnées, **toutes cohortes
confondues**.

| Cas | Copie |
|---|---|
| Proche du palier | Sur `/cohortes` : « **{n} sur {limite} entreprises** de votre plan. » |
| Palier atteint | À l'invitation : « Palier atteint : **{limite} entreprises** sur votre plan. Contactez-nous pour l'étendre. » |

⚠️ Le message **nomme le chiffre**. « Limite atteinte » sans le nombre oblige à
deviner.

## 20.3 États de chargement, erreurs, boutons désactivés, confirmations
Identiques au document du fondateur (§16). Rappel des deux règles les plus
enfreintes :
- un bouton grisé dit **pourquoi**, sous le bouton ;
- une confirmation nomme **l'action**, jamais « OK ».

## 20.4 Le conseil contextuel du programme

Un seul à la fois, le plus urgent, et il **nomme** toujours.

| Situation | Phrase |
|---|---|
| Invitations parties, aucune ouverte | « {n} invitations attendent une réponse, aucune n'a encore été ouverte. Au-delà de cinq jours, un message personnel vaut mieux qu'une relance de plus. » |
| Une invitation ouverte sans suite | « **{Nom}** a ouvert le lien sans aller au bout. C'est l'invitation la plus prometteuse de votre liste : un appel court y suffit généralement. » |
| Une entreprise arrivée, dossier vide | « **{Nom}** a rejoint votre cohorte. Son dossier est encore vide : c'est le bon moment pour lui indiquer les pièces socle. » |
| Dossier entamé, accord manquant | « **{Nom}** a entamé son dossier mais n'a pas encore accepté d'être listée dans votre dealroom. C'est elle qui donne cet accord — vous ne pouvez pas le faire à sa place. » |
| Une entreprise décroche | « **{Nom}** est à {n} % alors que la cohorte est à {m} %. C'est l'écart le plus large de votre promotion. » |

---

# 21. Ce qui n'existe pas — et ne doit pas apparaître

- Aucun **accès aux documents**, sous aucune forme, y compris un nom de fichier
- Aucun **chat** libre
- Aucune **note privée** du programme sur une entreprise
- Aucune **comparaison inter-cohortes** (elle est « à l'étude » sur la roadmap)
- Aucune **notation** ou classement des entreprises entre elles visible d'un tiers
- Aucun **indicateur à zéro**
- Aucun **lien public** vers le dealroom

---

# 22. Brief à coller dans le générateur

> Génère une maquette HTML des écrans du **programme d'accompagnement** de
> Sanza — accélérateurs, incubateurs, venture studios, programmes publics qui
> suivent une cohorte d'entreprises.
>
> **Forme.** Un écran = `<div data-screen-label="NN Nom">`, 1180 px de large.
> Bandeau supérieur et menu latéral répétés sur chaque écran applicatif.
> Français, vouvoiement.
>
> **Fond.**
> - N'invente aucun libellé : utilise exactement la copie de ce document.
> - Chaque écran existe en autant de versions qu'il a d'états — vide, rempli,
>   en erreur, en limite.
> - Aucun indicateur à zéro : si la donnée n'existe pas, l'élément disparaît.
> - Tout bouton désactivé porte sa raison **sous** lui.
> - Toute confirmation nomme l'action, jamais « OK ».
> - Le menu comporte trois entrées grisées avec **une seule** ligne d'aide sous
>   toute la colonne.
>
> **Écrans attendus** — les 17 de la carte du §2, plus les états remplis :
> cohortes remplies, cohorte à plusieurs entreprises, portefeuille rempli,
> dealroom publié avec audience, demandes en attente et tranchées, rapport
> généré avec tendance.
>
> **Palette.** Encre `#171A2C`, quasi-noir `#1A1B1F`, orange `#E85C2B`, orange
> clair `#F08A5E`, craie `#FAF8F4` et `#F4F1EA`, lignes `#E2DED4` et `#E8E5DC`,
> textes secondaires `#4A4E63` et `#8B8FA3`.
> **Typographie.** Instrument Sans pour le texte, IBM Plex Mono pour les
> chiffres, codes et étiquettes en capitales.
>
> **Le conseil contextuel doit figurer sur les écrans 09, 10, 11 et 16** — c'est
> la signature du produit : une phrase qui lit l'état réel, nomme une entreprise,
> et dit quoi faire aujourd'hui.
