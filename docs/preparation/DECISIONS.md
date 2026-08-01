# Registre des décisions — Préparation et référentiels

**Ce document existe parce que le raisonnement se perdait.** Les conclusions
étaient éparpillées entre une conversation ChatGPT, une conversation Claude et
trois documents qui n'en gardaient que les résultats. Six mois plus tard,
personne n'aurait pu dire *pourquoi* le pays ne sélectionne pas de référentiel.

Chaque ligne porte son origine, son statut et sa preuve. Une décision sans
preuve vérifiable est marquée comme opinion.

**Sources :**
- `sources/2026-08-01-chatgpt-referentiels-modeles.md` — la proposition ChatGPT
- `../v2/PARCOURS-ET-REFERENTIELS.md` — mon analyse, dont la §3.2 était fausse
- `EXIGENCES-SECTORIELLES.md` — le contenu sectoriel
- `../v2/PLAN-DE-TRAVAIL.md` — l'exécution

---

## 1. Le vocabulaire — **adopté**

Origine : ChatGPT. Retenu sans réserve.

| Niveau | Définition | Qui le voit |
|---|---|---|
| **Référentiel** | La bibliothèque interne des exigences que Sanza connaît | personne |
| **Modèle de préparation** | Une sélection réutilisable pour un besoin donné | personne |
| **Plan de préparation** | La version matérialisée pour une opération | **le fondateur, et lui seul** |

**Le fondateur ne voit jamais que le niveau 3.** Les deux premiers sont du
vocabulaire d'équipe. ChatGPT le pose lui-même en §2, puis se contredit en
proposant un écran de choix de modèle — voir décision 8.

État au 1er août : le niveau 3 existe et fonctionne, le niveau 1 est un littéral
JSONB dans une procédure stockée, le niveau 2 n'existe pas.

---

## 2. OHADA est un régime juridique, pas un financeur — **adopté**

Origine : ChatGPT. **J'avais tort**, et l'écran le prouvait.

```ts
const SOURCES = { ohada: "OHADA", bank: "Banque", dfi: "DFI", capital: "Capital" };
```

Le fondateur voyait un **régime juridique affiché en badge à côté de deux
catégories de prêteurs**. Ma correspondance `dette → bank + ohada` héritait de
cette confusion au lieu de la corriger.

**Décision :** OHADA quitte `sources` et devient le socle appliqué à toute
opération. Traité au lot C.

---

## 3. Applicabilité et provenance sont deux axes — **adopté**

Origine : ChatGPT. Confirmé par le code.

Le commentaire de `preparation.ts:36` dit « *Qui réclame la pièce* » —
provenance — alors que les valeurs stockées sont des contextes d'applicabilité.
Le champ porte donc un nom et une intention qui ne correspondent pas à son
contenu.

**Décision :** ne rien renommer avant d'avoir la matrice d'usage complète.
Le renommage n'apporte rien tant que la provenance nominative n'existe pas, et
un renommage à l'aveugle casserait `Preparation.tsx`, `preparation.ts` et les
filtres.

**Reporté après la bêta.**

---

## 4. `checklist_items.sources` existait déjà — **fait vérifié, corrige mon analyse**

Ma §3.2 affirmait qu'aucune colonne de provenance n'existait et en faisait la
recommandation numéro un. **Faux.** La colonne existe, est remplie, affichée en
badges, filtrable.

```text
{ohada,capital}      PV des assemblées des 3 derniers exercices
{bank,dfi,capital}   États financiers SYSCOHADA — 3 exercices
{dfi}                Plan d'action E&S
```

Conséquence : le modèle cumulatif que je proposais de concevoir **existait
déjà**, en mieux — porté par l'exigence, sans jointure, sans doublon possible.

---

## 5. L'instrument est imbriqué dans l'objectif — **fait vérifié, corrige ChatGPT**

ChatGPT proposait `Objectif : obtenir un financement + Modalité : dette`. Cette
combinaison **n'existe pas** : `dette` *est* un objectif. Il indiquait lui-même
ne pas avoir vérifié le champ.

Valeurs réelles de `modalite_financement`, par objectif :

| `levee` | Pré-amorçage · Amorçage · Série A · B · C+ |
| `dette` | Crédit d'investissement · Ligne de trésorerie · Crédit-bail · Financement d'équipement · Crédit documentaire |
| `dfi` | Subvention · Prêt concessionnel · Garantie · Assistance technique · Fonds propres |

**Conséquence majeure : il n'y a aucune matrice objectif × instrument.**
L'instrument affine à l'intérieur d'un objectif. Toute une dimension de
complexité disparaît.

---

## 6. La couche « régime juridique » n'a qu'une valeur — **fait vérifié, corrige ChatGPT**

ChatGPT écrivait « `Pays : Ghana → référentiel juridique Ghana` ». Impossible :
l'onboarding ne propose que l'UEMOA et la CEMAC — quatorze pays, **tous OHADA**.
Les autres ont été retirés à la demande du fondateur.

**Décision :** le pays ne sélectionne aucun référentiel. Il ne change que la
**terminologie** — NINEA au Sénégal, IFU ailleurs ; le nom du registre. Traité
au lot C.

Cette décision devra être rouverte le jour où un pays hors OHADA entrera dans la
liste.

---

## 7. Le stade change le niveau, pas la présence — **adopté, contre ma proposition**

Origine : ChatGPT. Meilleur que ma proposition.

Je proposais de **masquer** « États financiers — 3 exercices » pour un
pré-amorçage. Faire passer l'exigence de **requis à recommandé** est supérieur :
masquer retire au fondateur la possibilité de fournir la pièce s'il l'a, et lui
cache ce qu'un financeur pourrait réclamer.

---

## 8. Pas d'écran de recommandation de modèle — **décision contre ChatGPT**

`objectif → modèle` est une identité, un pour un. Afficher « *d'après votre
besoin, nous vous recommandons le modèle Financement bancaire* » à quelqu'un qui
vient de répondre « un financement bancaire », c'est lui **renvoyer sa propre
réponse renommée**.

C'est la même maladie que les huit phrases retirées les 1er août : une
intelligence mise en scène là où il n'y en a pas.

**Décision :** le modèle s'applique, le plan s'affiche, un lien « Changer de
modèle » reste disponible. Une étape de moins.

**Opinion, pas fait.** À rouvrir si un test utilisateur montre que le fondateur
ne comprend pas d'où vient son plan.

---

## 9. Ne pas ajouter « Type de financeur ciblé » — **décision contre ChatGPT**

La question est **déductible dans quatre cas sur six** : `dette` → banque
commerciale, `dfi` → bailleur, `audit` → auditeur, `diligence` → acquéreur. Seul
`levee` ouvrirait un vrai choix.

Poser une question à sept options dont la réponse est déjà connue contredit la
consigne du 1er août — ne rien pré-remplir, ne rien demander deux fois.

---

## 10. L'échéance sert à la priorisation — **adopté**

Origine : ChatGPT. Je n'y avais pas pensé. `startups.horizon` est déjà stocké, et
trier le plan par urgence ne touche ni au référentiel ni au modèle. Le gain le
moins cher de la liste.

---

## 11. Le montant ne résout pas les seuils — **décision, contre les deux documents**

« Commissaire aux comptes si seuils atteints » ne peut pas être résolu par le
montant recherché : les seuils OHADA portent sur le **chiffre d'affaires**, le
**total du bilan** et l'**effectif**.

**Décision :** cet axe reste une question posée au fondateur, ou rien. Ne pas
inventer une règle sur le montant de la levée.

---

## 12. Ce qui a été rejeté, et pourquoi

| Proposition | Origine | Motif du rejet |
|---|---|---|
| Tables `referentiels` / `referentiel_items` | moi | Dupliquent ce que `sources` fait déjà, avec une jointure de plus |
| `NULL` valant « s'applique à tout » | moi | Astuce de base de données. Personne ne peut prédire de tête ce que produit une combinaison |
| Déduplication sur l'intitulé normalisé | moi | « Statuts à jour » ≠ « Statuts certifiés conformes ». Problème disparu : une ligne porte déjà plusieurs sources |
| Six tableaux `applicable_*` (§7) | ChatGPT | Reproduit exactement la combinatoire ci-dessus. Moteur de règles pour 22 exigences et zéro utilisateur |
| Sept couches cumulatives (§6) | ChatGPT | Même problème de prédictibilité |
| Quatre documents livrables avant d'écrire du code (§12) | ChatGPT | L'audit a demandé six requêtes. Plus d'écriture que le correctif |
| Masquer les exigences impossibles | moi | Voir décision 7 |
| Ajouter « Fintech » comme onzième secteur | — | « Services financiers » le couvre pour qui le choisit |

---

## 13. Le modèle retenu

Les sept couches se réduisent, faits vérifiés en main, à **une sélection et
quatre modificateurs** :

```text
objectif         → le modèle              identité, aucune règle à écrire
forme juridique  → 3 exigences réécrites  SA / SARL / EI
stade            → requis ↔ recommandé
pays             → terminologie           NINEA / IFU, nom du registre
échéance         → ordre d'affichage
```

Puis, quand les exigences manquantes seront rédigées : le secteur réglementé
(santé, services financiers) et l'instrument.

**Critère retenu tout au long : chaque effet doit être prévisible isolément.**
C'est ce qui a fait rejeter le `NULL` cumulatif, les six tableaux
d'applicabilité et les sept couches.

---

## 14. Les huit promesses retirées

Le produit annonçait une adaptation qu'aucune fonction ne produisait.
`apply_checklist_template(p_deal)` et `apply_dataroom_template(p_deal)` ne lisent
ni l'objectif, ni le pays, ni le secteur.

Huit phrases, pas quatre comme mon analyse le disait. Les deux dernières étaient
des aides de champ que **j'avais écrites moi-même** le 1er août — « Il détermine
les pièces que la banque demandera » — et que mon balayage avait manquées parce
qu'il ne cherchait que le mot « adapter ».

Retirées en `808e2e1` et `5b950b2`. Le balayage porte désormais sur les
tournures d'effet, pas sur un mot.

**Règle qui en découle :** aucune phrase du produit ne doit annoncer un
comportement avant que le code le produise. Le plan de préparation est un point
de départ, jamais une liste exhaustive ni une garantie de conformité.
