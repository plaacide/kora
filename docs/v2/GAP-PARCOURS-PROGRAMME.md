# Gap analysis — Parcours Programme (34 écrans)

Diagnostic exigé au §2 du handoff, à valider **avant** toute intégration.

**Établi le 5 août 2026**, en re-dérivant depuis le code : arborescence de
`src/app/v2` et `src/features/v2` sur la branche `v2/rebuild`, migrations
présentes dans `supabase/migrations`, et dépouillement des 34 écrans HTML.
Rien ici ne vient de ma mémoire de conversation.

Ce document dit **ce qui manque**. Ce que cela impose à l'architecture est
évalué à part, dans [EVALUATION-PARCOURS-PROGRAMME.md](EVALUATION-PARCOURS-PROGRAMME.md)
et les quatre décisions qu'elle instruit, ADR-002 à ADR-005.

---

## 0. Où se pose la question

Le parcours programme se branche sur **`v2/rebuild`**, pas sur `main`.

- `main` : la V1 en production + la nouvelle vitrine. Ses écrans programme
  (`src/app/(app)/cohortes`, `/portefeuille`, `/dealroom`, `/demandes`) sont
  de la V1 — 1 229 lignes au total, à ne pas reprendre.
- `v2/rebuild` : 259 commits d'avance, tout le parcours fondateur V2 sous
  `/v2`, thème `.v2` dans `src/features/v2/ui/v2.css`, logique serveur dans
  `src/features/v2/server/*`, métier testé dans `src/features/v2/domain/*`.
  Cette branche contient **toutes** les migrations de `main` plus 48.

Sur `v2/rebuild`, le parcours programme **n'existe pas du tout côté écran** :
aucune route `/v2/cohortes`, `/v2/portefeuille`, `/v2/dealrooms`. En base, en
revanche, une bonne moitié du socle est déjà là (§3).

---

## 1. Deux manques dans le paquet lui-même

**1.1 — Le CSS de référence — RÉSOLU le 5 août.** Les 34 écrans pointent tous
sur `../parcours/parcours.css`, et ce fichier manquait : ils s'ouvraient sans
aucun style. Le fondateur l'a versé le jour même, en **variante rail 216 px à
libellés** (`.rail a::after{content:attr(title)}`), et il est en place à
`sanza_handoff/maquettes/parcours/parcours.css` — là où les 35 fichiers le
cherchent.

Couverture vérifiée : **61 classes sur 61, 23 tokens sur 23**. La seule classe
absente du fichier, `.row`, n'appartient pas aux écrans — c'est la mise en page
du sommaire `index.html`, qui porte son propre `<style>`.

**Et il n'y a rien à trancher sur le rail.** L'app V2 a déjà un **rail
dépliable** — `Shell.tsx` et `.v2-rail[data-expanded]`, `v2.css:1455 :
60 px en icônes replié, 216 px avec libellés déplié, bascule persistée. Les deux
variantes du `parcours.css` ne sont donc pas deux partis pris concurrents : ce
sont **les deux états du même rail**. Le paquet programme est dessiné dans
l'état déplié, ce que le fichier versé reflète.

Le commentaire du code le dit déjà : « le bouton n'est pas dans les maquettes,
les libellés en viennent ». Seule différence de forme, sans portée : la maquette
rend les libellés par `::after{content:attr(title)}`, l'app par un vrai
`<span>`.

**1.2 — `design-system/` est absent** du paquet (annoncé au §1 du handoff). La
référence existante est `sanza_handoff/Website sanza_v2/design-system/` ; à
confirmer que c'est bien celle-là.

**1.3 — Le handoff nomme des tokens qui n'existent pas.** Le §1 parle de
`--text-1..4` et `--brand` : aucun des deux n'apparaît dans les 34 écrans. Le
jeu réellement utilisé est `--text`, `--text-2/3/4`, `--ink`, `--line`,
`--line-soft`, `--band`, `--orange` + `-soft`/`-text`, `--green/--blue/--amber/
--red` + `-bg`, `--sans`, `--head`, `--r-sm/md/lg`. Je prends les écrans pour
source, comme le dit la règle 1.

**1.4 — Le §2 décrit une sidebar qui n'est pas celle des écrans.** Le handoff
annonce « Cohortes, Portefeuille, Challenges, Dealrooms, Demandes, Aide ». Les
écrans montrent : **Accueil · Portefeuille · Cohortes · Dealrooms · Demandes ·
Rapports** — puis, en pied de rail — **Sécurité · Aide**. Les Challenges ne
sont pas au niveau global : ils vivent **dans** une cohorte.

---

## 2. Deux incohérences entre écrans

Le §3 annonce des fixtures « cohérentes entre elles, c'est vérifié ». Deux
points ne le sont pas. Je ne les corrige pas de mon côté.

**2.1 — Kalyx Foods est publiée et non publiée dans la même Dealroom.**
Écran 26 (Demo Day 2026, entreprises) : Kalyx = « en attente du choix », fiche
« Non publiée », consentement « En attente ». Écran 30 (accueil investisseur de
cette même Dealroom) : Kalyx a une carte complète, Seed · Dette ·
300 000 €. Or la règle de l'écran 22 est explicite — « une entreprise sans
accord ne sera pas publiée ». Une des deux vues ment. → **Q6**

**2.2 — L'écran 07 attribue à CoolBricks un Challenge qui n'est pas le sien.**
Portefeuille : « CoolBricks · Challenge "Préparer le dossier investisseur" ·
3 / 4 critères · échéance demain ». Écrans 14 et 15 : le 3/4-échéance-demain de
CoolBricks appartient à « Préparer votre Demo Day » (4 critères). « Préparer le
dossier investisseur — version Savane » est un autre Challenge : 5 critères,
5 entreprises, échéance 30 septembre. → **Q7**

**2.3 — Le §3 nomme deux entreprises qui n'existent dans aucun écran** :
« Baobab Materials » et « Solaris Guinée ». Les vraies sont **CoolBricks**
(Construction · Côte d'Ivoire · Seed · Equity · 500 000 € · 62 %) et **Nimba
Solar** (Énergie · Guinée · Seed · Equity · 750 000 € · 81 %). Il manque aussi
au §3 **Bissap Labs** (Ag-tech · Bénin · Pre-seed · 150 000 € · 12 %) et
**Sahel Dairy** (Agroalimentaire · Burkina Faso · Seed · 300 000 €). Je
constitue les fixtures depuis les écrans, pas depuis le §3.

---

## 3. Ce qui existe déjà en base — et ne doit pas être recréé

Tout ceci est présent sur `v2/rebuild`, avec RLS et fonctions d'écriture.

| Existant | Ce qu'il porte | Écrans servis |
|---|---|---|
| `cohorts` | nom, objectif, places (`seats`), dates, archivage | 02, 03 |
| `cohort_members` | entreprise ↔ cohorte, date d'entrée | 05 |
| `cohort_links` | invitation par e-mail + jeton, `pending/accepted/revoked`, expiration 30 j, relance 48 h, aperçu | 04 |
| `sae_portfolio()` | fonction de lecture à colonnes énumérées : entreprise, opération, stade, montant, devise, préparation, manques | 05, 07 |
| `program_threads` | question / suggestion, `open/answered/read`, réponse | 08 |
| `program_notes` | notes privées du programme | — |
| `listing_consents` | consentement de listage **par cohorte** | 22 (partiellement) |
| `showcase_entries` | fiches publiées **d'une cohorte** | 26 (partiellement) |
| `showcase_access` | investisseurs invités **d'une cohorte**, jeton nominatif, révocation | 27 (partiellement) |
| `access_requests` | demande d'accès data room, instrument, message, décision, expiration | 33, Demandes |
| `mandates` | mandat donné au programme par une entreprise | 33 (mention finale) |
| `organizations` | `program_type`, pays, site, volume, `cohort_limit`, `branding` jsonb | onboarding programme |

Le canal de lecture est une **fonction** et non une politique RLS : ce qui n'y
est pas énuméré ne sort pas. Le programme ne voit aucun document parce que
rien ne le lui accorde — c'est déjà l'architecture, et les écrans la répètent
mot pour mot en pied de page. Rien à changer là.

---

## 4. Ce qui manque — par entité

### 4.1 Challenges — **rien n'existe**. Ni table, ni fonction, ni écran.

Onze des 34 écrans (09, 09b, 10, 11, 12, 13, 14, 15, 16, 17, + le portefeuille)
en dépendent. À créer :

- **Modèle de Challenge** : catalogue Sanza (14 modèles, 8 catégories : Levée de
  fonds 3, Dette 2, Finance 2, Gouvernance 2, Conformité 2, Commercial 1, ESG 1,
  Reporting 1) + modèles **privés d'une organisation** (16 — pas de partage
  public au MVP). Un modèle porte : titre, description, type, durée
  recommandée, critères, compteur « déjà utilisé dans N de vos cohortes ».
- **Critère de modèle** : libellé, `manuel | connecté à Sanza`, `obligatoire |
  optionnel`, et un drapeau **structurel** (12 : « critère structurel — non
  supprimable »).
- **Challenge (instance)** rattaché à une cohorte : titre, description, type,
  échéance, statut actif/terminé, origine (créé de zéro / dérivé d'un modèle —
  « le modèle original ne sera pas modifié »).
- **Assignation** Challenge ↔ entreprise, réassignable à tout moment sans
  recréer le Challenge (13).
- **Progression par critère et par entreprise** : `à faire / en cours / terminé
  / en retard`, date de confirmation, et pour les critères manuels une
  confirmation **par l'entreprise**.
- **Le lien « connecté à Sanza »** : un critère connecté se valide
  automatiquement dès que l'exigence correspondante de l'entreprise est
  satisfaite. C'est le point le plus lourd : il faut une correspondance stable
  entre un critère de Challenge et une **clé d'exigence** du référentiel. La
  clé stable existe depuis le 4 août (`20260804130000_cle_stable_des_exigences`)
  — c'est sur elle qu'il faut s'appuyer, et pas sur un identifiant de ligne. Les
  critères connectés visibles dans les écrans : états financiers, cap table,
  montant recherché, KPIs.
- **Le rappel** (« Envoyer un rappel », 14/15) : à rattacher au journal
  existant, pas à un système de notifications neuf.

### 4.2 Dealroom — **le modèle actuel n'est pas celui des écrans**

Aujourd'hui la vitrine est **un attribut de cohorte** : `showcase_entries.
cohort_id`, `showcase_access.cohort_id`, `listing_consents.cohort_id`.

Les écrans en font un **objet de premier rang** :

- multi-cohortes (22 : « Saison 4 · Agri & Agro » **et** « Fintech 2026 ») ;
- avec quatre statuts : `BROUILLON / PRÊTE À PUBLIER / PUBLIÉE / ARCHIVÉE` (19) ;
- avec sa propre identité : nom interne, titre public, sous-titre, description,
  contact (20) ;
- son **branding** : logo, bannière 1600 × 400, couleur d'accent avec correction
  de contraste, thème clair/sombre, logos partenaires (AFD, Proparco), bascule
  « Powered by Sanza » liée au plan (21, 28) ;
- sa propre **audience** d'investisseurs, nominative, avec états `Acceptée /
  Envoyée / Expirée / Accès retiré` (27) ;
- son **consentement propre** : « Chaque entreprise donne son accord Dealroom
  par Dealroom » (18) ;
- ses réglages de sécurité : invitation liée à l'adresse, lien non
  transférable, expiration 30 j, NDA Dealroom optionnel, demandes d'accès
  activables (23).

Il faut donc **des tables Dealroom** (`dealroom`, `dealroom_cohorts`,
`dealroom_entries`, `dealroom_access`, `dealroom_branding`) et faire migrer ce
que porte aujourd'hui la cohorte. Le consentement change de portée : de
« l'entreprise accepte d'être listée dans sa cohorte » à « l'entreprise accepte
cette Dealroom-ci ». **C'est une décision produit, pas une décision technique.**
→ **Q3**

Manquent aussi :
- **le compteur de consultations** par fiche et par investisseur (25 :
  « 18 consultations cette semaine », 27 : « a consulté 3 fiches ») — le socle
  existe (`page_dwell`, `audit_log`), la lecture par Dealroom non ;
- **le pitch d'une ligne** de chaque entreprise (30, 31, 32) — aucune colonne ne
  le porte aujourd'hui ;
- **les chiffres clés et l'équipe** de la fiche investisseur (32 : CA, croissance,
  marge brute, deux personnes) — rien de tel en base ;
- **le réglage « afficher la préparation »** côté Dealroom (31 : « préparation
  affichée seulement si le réglage Dealroom l'autorise »).

### 4.3 Rapports — **route absente, contenu inconnu**

« Rapports » est dans le rail global **et** dans la nav de cohorte, mais aucun
des 34 écrans ne le montre. L'export bailleur XLSX existe déjà
(`/api/portefeuille/export`) et le bouton « Rapport bailleur » de l'écran 07
peut s'y brancher. Le reste est un trou. → **Q5**

### 4.4 Portefeuille et cohortes — à réécrire en V2, pas à recréer en base

Les écrans 05 et 07 demandent, en plus de ce que `sae_portfolio()` sait
rendre : le **secteur et le pays** (ajoutés le 31 juillet, à vérifier dans la
fonction), l'**opération présentée et son instrument**, le **nombre de
Challenges en cours / en retard**, le **nombre de Dealrooms**, la **colonne
« À faire »**, les **segments** (Prêtes / En cours / Décrochent / Nouvelles) et
la **tendance** (« +6 pts sur 30 jours »). Il faut donc étendre la fonction de
lecture — en énumérant les colonnes, comme aujourd'hui.

Le bloc « Conseil » (04, 05) est un texte calculé, pas une donnée : il faut
décider de sa règle. → **Q8**

---

## 5. Rôles et visibilité

| Rôle | Existe ? | Manque |
|---|---|---|
| Programme (admin) | ✅ `profiles.account_type = 'sae'`, org avec `program_type` | le rail et les écrans V2 |
| Entreprise (fondateur) | ✅ complet en V2 | la **vue entreprise** d'un Challenge — l'écran 15 est la vue *programme* d'une entreprise, pas celle du fondateur. Aucun écran du paquet ne montre le Challenge côté entreprise, alors que les textes le promettent (« Chaque entreprise verra ce Challenge dans son espace, avec la mention "Demandé par Savane Accelerator" », 13 ; « confirmé par l'entreprise », 11/15). → **Q4** |
| Investisseur invité | 🟡 `showcase_access` par cohorte | l'accès **par Dealroom**, et le parcours 29–33 hors app |

La matrice tient déjà sur le point dur : le programme voit la complétude,
jamais les pièces. Les six pieds de page qui le répètent (« Vous voyez
l'avancement, jamais les documents ») sont donc vrais, et le resteront tant que
le canal de lecture reste une fonction à colonnes énumérées.

---

## 6. Routage public investisseur (29–33)

Rien n'existe. Les écrans 30–33 sont **hors du groupe authentifié** et brandés
par Dealroom. Il faut :

- une URL publique par Dealroom, non indexée, avec la marque du programme ;
- l'ouverture par **jeton nominatif** lié à l'adresse invitée (le mécanisme
  existe pour `showcase_access`, il faut le porter sur la Dealroom) ;
- le NDA Dealroom optionnel avant entrée (23) ;
- un layout distinct : bannière, couleur d'accent, logos partenaires, pied
  « Espace privé — accès sur invitation uniquement · Powered by Sanza ».

L'écran 29 est un **e-mail**, pas une page : il rejoint `docs/emails`.

---

## 7. Navigation

**Rail global du programme** — huit entrées, contre cinq aujourd'hui pour le
fondateur : Accueil · Portefeuille · Cohortes · Dealrooms · Demandes ·
Rapports ⟂ Sécurité · Aide. `GLOBAL_NAVIGATION`
(`src/features/v2/navigation/config.ts`) est aujourd'hui une constante unique :
elle doit devenir fonction du métier.

**Deux absents du rail programme** : **Équipe** et **Abonnement**. Un programme
est pourtant une organisation avec des collaborateurs, et son plan
(150 000 F/mois, paliers 10/25/50) mord déjà à l'invitation. Les deux écrans
existent en V2. Oubli de maquette ou choix ? → **Q2**

**Nav de cohorte** (240 px, `.v2-ctx`) : Vue d'ensemble · Entreprises · Challenges ·
Questions & suggestions · Dealrooms · Rapports, avec compteurs. Le motif existe
déjà pour une opération — même composant, autre contenu.

**Nav de Dealroom** : Vue d'ensemble · Entreprises · Audience · Demandes ·
Branding · Activité.

Deux écrans du paquet n'ont **aucune route** annoncée : 10 et 16 (bibliothèque
et modèles) sont marqués « P16 / P22 » sans URL, et 13 (assigner) non plus. À
placer sous `/v2/cohortes/[id]/challenges/…` pour ne pas répéter l'erreur
consignée dans l'arbre : *un écran bâti sur une URL que rien ne propose n'existe
pas*.

---

## 8. Ce que je ne tranche pas — huit questions

1. ~~Quel `parcours.css` fait foi~~ — **close le 5 août.** Le fichier est versé
   et couvre tout (§1.1). Le rail large n'est pas un second parti pris : c'est
   l'état déplié du rail que l'app a déjà. Rien à décider.
2. **Équipe et Abonnement** dans le rail programme : oubli à réparer, ou choix
   assumé ?
3. **Dealroom multi-cohortes** : on crée le nouvel objet et on migre la vitrine
   de cohorte vers lui (le consentement change de portée), ou on garde les deux ?
   Rien n'est en production côté programme, donc la migration propre est
   possible — c'est le moment. → instruite par
   [ADR-002](ADR-002-portee-de-la-dealroom.md).
4. **La vue entreprise d'un Challenge** n'est dans aucun écran. Je la conçois
   d'après le parcours fondateur V2, ou j'attends une maquette ?
5. **Rapports** : que contient l'écran ? Aujourd'hui je ne peux brancher que
   l'export XLSX existant.
6. **Kalyx Foods**, écrans 26 vs 30 (§2.1) : quelle vue est juste ?
7. **Écran 07** (§2.2) : quel Challenge porte le 3/4 de CoolBricks ?
8. **Le bloc « Conseil »** (04, 05) : quelle règle le calcule — la plus grande
   urgence, le plus grand retard, autre chose ? Sinon il reste une fixture.

---

## 9. Découpage proposé (à valider, pas à lancer)

Un lot = un commit, dans l'ordre où chaque lot rend le suivant possible.

| Lot | Contenu | Écrans |
|---|---|---|
| A | Tokens `parcours.css` mappés sur le thème `.v2`, rail et nav de cohorte par métier | socle |
| B | Cohortes : liste, vide, détail, invitations, entreprises actives | 01–05, 17 |
| C | Portefeuille : vide et rempli, extension de la lecture | 06, 07 |
| D | Questions & suggestions | 08 |
| E | Challenges — base + modèles + création + personnalisation | 09, 09b, 10, 11, 12, 16 |
| F | Challenges — assignation, suivi, détail | 13, 14, 15 |
| G | Dealroom — objet, statuts, assistant 4 étapes | 18–24 |
| H | Dealroom — gestion après publication | 25–28 |
| I | Parcours investisseur hors app + e-mail | 29–33 |

Les états vides (01, 03, 06, 09, 18) partent **avec** leur lot, jamais après.

Rien ne commence avant que ce diagnostic soit validé et les questions
tranchées. Q1 est close depuis le 5 août ; **Q3 devient la première**, parce
qu'elle décide la forme de la base.
