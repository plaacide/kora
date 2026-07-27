# Règles métier de Sanza

Relevé **non exhaustif**, établi depuis le code et les migrations en place au
2026-07-31. Là où une règle est appliquée à deux endroits avec deux valeurs
différentes, c'est signalé plutôt que lissé.

Deux conventions de lecture :
- **« la base refuse »** = la règle vit dans une fonction `security definer` ou
  une politique RLS. Elle tient même si l'écran est contourné.
- **« l'écran empêche »** = la règle n'est qu'affichée. Elle se contourne.

---

## 1. Les quatre métiers

| Persona | Ce qu'il possède | Ce qu'il vient faire |
|---|---|---|
| `founder` | UNE opération, la sienne | savoir ce qui lui manque et qui regarde |
| `investor` | rien | consulter le dossier d'un autre |
| `fund` | un portefeuille d'opérations | suivre plusieurs dossiers |
| `sae` | **aucun dossier** | suivre une cohorte d'entreprises |

- Le **rôle d'adhésion ne suffit pas** à distinguer : un fondateur et un gérant
  de fonds sont tous deux `owner`. C'est `profiles.account_type` qui tranche.
- Un **invité (`guest`) est toujours traité en investisseur**, quel que soit son
  type de compte : il consulte un dossier qui n'est pas le sien.
- Un compte antérieur aux personas retombe sur `fund` — le comportement le
  moins surprenant.

---

## 2. La règle §0.1 — la plus forte du produit

> **Un programme voit l'ÉTAT d'une startup de sa cohorte : préparation, pièces
> manquantes, montant recherché. Jamais un document, jamais un deal, jamais
> même un nom de fichier.**

- Ce n'est pas une préférence d'affichage : les fonctions qui servent le
  programme (`sae_portfolio`, `cohort_members_named`) **énumèrent leurs
  colonnes**. Ce qui n'y figure pas ne peut pas fuiter par inadvertance.
- Le **nom d'un document est déjà une fuite** — « Term sheet Sequoia.pdf » dit
  l'essentiel sans qu'on ouvre le fichier.
- Vérifiable par exécution : `supabase/tests/rls_programme_0_1.sql`, 8 contrôles
  dont deux **inverses** (une RLS qui bloquerait tout passerait les six autres
  tout en rendant le produit inutilisable).

---

## 3. Data room et documents

- Les documents vivent dans un **bucket privé sans aucune politique SELECT** :
  le téléchargement direct est impossible, y compris par URL signée.
- Le viewer sert des **pages en images**, filigranées à la volée avec l'e-mail
  et la date du lecteur. Le fichier source n'atteint jamais le navigateur.
- **Indexation automatique** (`1.`, `2.1`, `2.1.1`) recalculée à chaque
  mouvement par `reindex_deal()`.
- Créer une data room génère un **modèle de six dossiers** (Corporate →
  Conformité).
- Les clés de stockage sont **ASCII strict** : un tiret cadratin ou un accent
  dans un nom de fichier fait rejeter l'envoi. Le nom AFFICHÉ reste intact.
- **Aucune écriture directe depuis le client.** Tout passe par des RPC qui
  vérifient les droits ET auditent dans la même transaction.

### Suppression
- Supprimer un dossier supprime **récursivement** son contenu, après avoir
  montré l'impact (`folder_delete_impact`).
- Un **NDA signé ne peut pas être supprimé** — protection par clé étrangère,
  volontaire.

---

## 4. Accès et permissions

Échelle unique, croissante :

```
none → watermark → view → download → edit
```

- **Tout niveau autre que `none` ouvre le document.** Il n'existe pas de niveau
  « voir la fiche sans voir les pièces » — c'est pourquoi l'accès vitrine ne
  passe PAS par cette échelle (cf. §7).
- L'accès accordé par une demande arrive au niveau **`watermark`**, le plus
  restrictif qui permette de lire : l'entreprise a accepté qu'on CONSULTE, pas
  qu'on emporte. Monter le niveau reste son geste.
- **Refuser après avoir accordé retire les droits** (`level = 'none'`) :
  la symétrie est appliquée en base, pas seulement dans le libellé.

---

## 5. Levée

- **Une seule levée `en_cours` par data room** (index unique partiel).
- La levée est **facultative** : une data room peut servir une diligence
  (banque, partenaire, audit) sans aucun montant. L'objectif est demandé à
  l'onboarding — `levee` ou `diligence` — et l'écran s'adapte : pas de montant
  inventé pour une diligence.
- Les **soft-commitments** sont un champ saisi à la main, pas une somme des
  tickets du pipeline. Additionner des tickets non confirmés produirait un
  chiffre que le fondateur n'assume pas.
- Le **pipeline investisseur** est une liste curée informative :
  `invite → nda → soft_commit → diligence → engage`, ou `refuse`.
- Les **indicateurs de vitrine** sont des lignes libres par audience
  (`vc` / `dfi` / `banque`), saisies par le fondateur.

---

## 6. Programme et cohortes

### Cohorte
- Une cohorte est une **promotion** : un début, une fin, un objectif, des
  places. Un programme peut en gérer plusieurs en parallèle.
- Une entreprise peut appartenir à **deux cohortes** (`cohort_members` est n-n).
- **Objectifs multiples** (`cohorts.goals text[]`), jusqu'à **6**, mêlant quatre
  codes connus (`leve`, `dette`, `conformite`, `croissance`) et des objectifs
  libres saisis par le programme (40 caractères max).
  ⚠️ La maquette dit « Objectif principal » au singulier — le multiple est une
  demande explicite du fondateur, pas une dérive.
- **Palier** : `organizations.cohort_limit`, défaut **10** startups
  accompagnées, tous liens non révoqués confondus. Le dépassement produit un
  message qui NOMME le palier et invite au contact — pas un mur muet.

### Invitation d'une entreprise
- Le programme invite avec un **nom + une adresse**. Le nom s'affiche jusqu'à
  l'acceptation ; l'organisation réelle prend ensuite le relais.
- **C'est l'entreprise qui accepte**, elle-même. L'écran d'acceptation énonce
  ce que le programme verra ET ne verra pas avant le bouton.
- L'invitation **vise une adresse** : `accept_cohort_link` compare l'adresse du
  compte connecté à celle invitée. Un lien transféré n'ouvre rien.
- **Expiration à 30 jours**, calculée depuis la dernière relance. La base
  refuse d'accepter au-delà.
- **Relançable autant de fois que nécessaire**, unitairement ou en groupe. La
  relance **ne change pas le jeton** — le premier e-mail reste utilisable.
- Trois statuts : **ENVOYÉE** · **LIEN OUVERT** (première visite horodatée) ·
  **À RELANCER** (5 jours sans ouverture). Un lien ouvert garde ce statut quel
  que soit son âge : avoir été vu prime sur le temps écoulé.
- **Accepter exige une organisation.** Un invité fraîchement inscrit n'en a pas
  encore ; l'écran le dit avant, et un rappel l'attend sur son accueil.

### Seuils de préparation
| Seuil | Valeur | Où |
|---|---|---|
| « décroche » | < 45 % | tableau de cohorte |
| « prête » | **70 %** | `/cohortes`, `/accelerateurs` |
| « prête » | **75 %** | `/portefeuille`, `/readiness`, tableau de cohorte |

⚠️ **Incohérence réelle** : la même question reçoit deux réponses selon
l'écran. À trancher.

- Une préparation **nulle n'est pas zéro** : une entreprise qui vient de
  rejoindre est **NOUVELLE**, pas « en décrochage ». Elle est exclue du filtre
  « Décrochent ».

### Questions et suggestions
- Deux objets distincts, jamais un fil de discussion. Une **question** attend
  une réponse et reste ouverte ; une **suggestion** n'attend rien.
  Le chat libre est refusé — un fil non lu est une dette.
- Les échanges ne sont visibles que de l'entreprise concernée.

---

## 7. Dealroom (vitrine)

- **La vitrine n'est pas publique**, pas indexée, sans lien anonyme. On y entre
  par **invitation nominative** liée à une adresse.
- L'accès vitrine passe par une table dédiée (`showcase_access`), **pas** par
  l'échelle de permissions — sinon un investisseur de vitrine aurait accès aux
  documents (cf. §4).

### Publication
Deux conditions **cumulées**, vérifiées en base :
1. l'entreprise a **donné son accord** de listage, **par cohorte** — accepter
   pour la Saison 4 n'autorise pas le programme Dette ;
2. son **dossier est entamé** (au moins une pièce).

- L'entreprise **désigne la salle** que la fiche pointera. Le programme ne
  choisit pas à sa place.
- **Dépublier ≠ révoquer** : retirer une fiche ne coupe aucun accès accordé.
- **Retirer son accord ne dépublie pas automatiquement.** Couper dans la
  seconde surprendrait un investisseur en pleine lecture, et le programme doit
  savoir qu'une entreprise s'est retirée.

### La fiche
- **8 lignes nommées et fixes**, par lecture — c'est ce qui rend deux
  entreprises comparables.
  - *Equity* : ARR, croissance, marge brute, runway, CAC/LTV, tour recherché,
    dilution, cap table.
  - *Dette* : CA 12 mois, EBITDA, couverture du service de la dette,
    endettement, BFR, garanties, saisonnalité, cycle de trésorerie.
- Une valeur absente est **« non communiqué »**, en italique. On ne la calcule
  pas depuis une autre, on ne la remplace pas par zéro : **un zéro affiché à un
  investisseur est une affirmation, pas une absence**.
- Les chiffres viennent de l'**entreprise**, jamais du programme. Date de mise à
  jour sur chaque fiche, **bandeau au-delà de 90 jours**.
- **Aucune pièce consultable**. Un seul bouton : demander l'accès.

---

## 8. Demandes d'accès

Flux : l'investisseur demande depuis une fiche → le programme **filtre** →
l'entreprise **tranche**.

| Transition | Qui | Effet |
|---|---|---|
| `recommended` | programme | transmet avec avis favorable |
| `forwarded` | programme | transmet sans avis |
| `dismissed` | programme | écarte ; l'investisseur est notifié, l'entreprise ne voit rien |
| `granted` | **entreprise** | ouvre réellement l'accès (membership `guest` + `watermark`) |
| `refused` | **entreprise** | ferme, y compris après un `granted` |

- **Le mandat est la seule exception.** Si l'entreprise a mandaté le programme
  pour une salle précise, il peut accorder directement. Le badge
  **« MANDAT ACCORDÉ » / « DÉCISION STARTUP »** doit être visible sur chaque
  demande — confondre les deux, c'est croire accorder quand on recommande.
- Le mandat est **par salle** et **révocable**. Le révoquer **ne reprend pas**
  les accès déjà accordés : ils l'ont été au nom de l'entreprise, et un
  investisseur qui perd son accès sans explication le vit comme une rupture.
- Un mandat ne peut être donné qu'à un programme qui accompagne réellement
  l'entreprise dans une cohorte vivante, et seulement par un **responsable**.
- **Expiration à 30 jours**, relançable **une seule fois** par l'auteur. La
  dissymétrie avec les invitations est voulue : ici un demandeur insiste auprès
  de quelqu'un qui ne lui doit rien.
- Chaque transition s'écrit au **journal d'audit de l'entreprise**. Un refus se
  conserve.

---

## 9. Rapports bailleur

- **Le refus de générer est la fonctionnalité.** Sous le seuil — au moins une
  entreprise au dossier entamé — le rapport REFUSE de se produire plutôt que de
  livrer un document à cases vides. Un rapport tout à zéro dessert la cohorte
  auprès du bailleur bien plus que son absence.
- Le refus **nomme le seuil**. Refuser sans expliquer serait pire que produire.
- **Tendance mensuelle par relevés**, pas par calcul : l'historique n'existe
  pas (`readiness_score` est écrasé, `checklist_items` ne garde pas ses états).
  Le relevé se déclenche à la première ouverture du rapport chaque mois.
- Les **trous sont montrés**, jamais reliés. Un mois sans visite ne laisse aucun
  point, et relier deux points distants inventerait les mesures manquantes.

---

## 10. Abonnement

- `organizations.paid_until` — nul = jamais soumis à l'abonnement.
- La base **refuse toute écriture** au-delà de l'échéance (`deal_org_for_write`).
- L'application ferme aussi la **lecture**, mais vers un écran qui explique et
  propose de régulariser : une erreur SQL n'explique rien.
- **Avertissement les 7 derniers jours**, resserré à l'approche.

---

## 11. Audit et sécurité

- Journal **append-only**, chaîné par hash SHA-256 par organisation, avec
  `verify_audit_chain()`. Un trigger interdit la modification.
- **2FA** proposée à la première session du programme, jamais bloquante : il
  verra passer des états de dossiers de tiers, mais un mur à la première
  connexion fait fuir avant d'avoir rien montré.
- Si un facteur est vérifié, `aal2` devient **exigé** à chaque connexion.
- Les liens d'e-mail utilisent le **flux implicite** : PKCE empêcherait
  d'ouvrir un lien depuis un autre appareil que celui qui l'a demandé.

---

## 12. Règles transverses de produit

Elles priment sur toute demande d'écran.

1. **Jamais de données inventées.** Pas de KPI, de courbe ni de valeur par
   défaut fabriquée. Si la donnée réelle n'existe pas, l'élément ne s'affiche
   pas.
2. **Aucun lien de navigation vers une page inexistante.** Ce qui n'est pas
   construit vit sur `/roadmap`.
3. **Aucune écriture directe depuis le client.**
4. **Pas d'indicateurs à zéro.** Un tableau de bord entièrement à zéro se lit
   comme un produit cassé, pas comme un produit qui attend. On affiche ce qui
   le remplira.
5. **Ne jamais afficher « 0 entreprise » quand des invitations courent.**
6. **Un état vide se lit en trois temps** : ce qui manque, à quoi ça servira, et
   la précision qui rassure.
7. **Un bouton grisé dit pourquoi**, sous le bouton — pas en info-bulle, qui ne
   s'ouvre pas au doigt.
8. **Le conseil contextuel nomme quelqu'un.** Sans nom, c'est un bandeau ; avec,
   c'est une consigne. Un seul à la fois, le plus urgent.
9. **Un seuil ne s'écrit qu'une fois.** Voir §6 pour un contre-exemple encore
   en place.

---

## 13. Ce qui n'existe pas, volontairement

- Aucun **ordonnanceur**. Les expirations sont calculées à la lecture et le
  relevé mensuel se déclenche à la première visite. Une donnée périmée reste en
  base ; c'est sa date qui la dit périmée.
- Aucun **chat libre** entre programme et entreprise.
- Aucune **note privée** du programme sur une entreprise (table créée puis
  supprimée : trois zones de texte au même endroit, dont deux visibles par
  l'entreprise et une non, est une erreur de destinataire qui attend de se
  produire).
- Aucun **lien anonyme** vers quoi que ce soit.
