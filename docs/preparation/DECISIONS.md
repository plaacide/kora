# Registre des décisions — Préparation et référentiels

**Version corrigée :** 1er août 2026  
**Branche :** `v2/rebuild`

Ce document existe parce que le raisonnement se perdait. Les conclusions étaient éparpillées entre une conversation ChatGPT, une conversation Claude et plusieurs documents qui n’en gardaient que les résultats. Six mois plus tard, personne n’aurait pu dire pourquoi le pays ne sélectionne pas un référentiel complet, pourquoi l’OHADA ne doit pas être traité comme un financeur, ou pourquoi l’utilisateur travaille dans un plan plutôt que dans un référentiel.

Chaque décision porte son origine, son statut et sa preuve. Une conclusion sans preuve vérifiable est marquée comme opinion ou décision de périmètre.

**Sources :**
- `sources/2026-08-01-chatgpt-referentiels-modeles.md` — proposition ChatGPT
- `../v2/PARCOURS-ET-REFERENTIELS.md` — analyse Claude, dont la §3.2 a été corrigée
- `EXIGENCES-SECTORIELLES.md` — contenu sectoriel
- `../v2/PLAN-DE-TRAVAIL.md` — exécution

---

## 1. Le vocabulaire — **adopté avec correction**

Origine : ChatGPT. Le principe des trois niveaux est retenu, avec une correction sur leur visibilité.

| Niveau | Définition | Qui le voit |
|---|---|---|
| **Référentiel** | La bibliothèque interne des exigences que Sanza connaît | L’équipe Sanza qui l’administre. Invisible pour les utilisateurs |
| **Modèle de préparation** | Une sélection réutilisable d’exigences conçue pour un besoin donné | L’équipe Sanza le configure. L’utilisateur peut en voir le nom, la finalité et éventuellement le changer |
| **Plan de préparation** | La version du modèle matérialisée et personnalisée pour une opération | Le fondateur et les membres autorisés de son entreprise |

Le fondateur travaille principalement dans le **Plan de préparation**. Il ne manipule jamais directement le Référentiel. Le nom et la finalité du Modèle peuvent toutefois être visibles, notamment lorsqu’il consulte ou change le modèle appliqué.

État au 1er août :
- le niveau 3 existe et fonctionne ;
- le niveau 1 est, depuis le lot B (`8fb2556`), la table `checklist_catalog` :
  vingt-deux exigences, interrogeables, modifiables sans redéploiement ;
- le niveau 2 n’existe pas encore comme objet explicite, versionné et administrable.

---

## 2. OHADA est un régime juridique, pas un financeur — **adopté**

Origine : ChatGPT. La confusion existante est confirmée par l’écran.

```ts
const SOURCES = {
  ohada: "OHADA",
  bank: "Banque",
  dfi: "DFI",
  capital: "Capital",
};
```

Le fondateur voyait un régime juridique affiché au même niveau que des catégories de financeurs ou de financement. La correspondance `dette → bank + ohada` héritait de cette confusion au lieu de la corriger.

**Décision :**

Pour le périmètre géographique actuellement proposé dans l’onboarding, le socle OHADA est appliqué à toutes les opérations. Cette règle devra être réévaluée avant l’ouverture à un pays non-OHADA.

L’OHADA ne doit plus être présenté comme :
- un financeur ;
- une provenance ;
- un objectif ;
- un type d’opération.

Il constitue une **couche juridique commune** qui alimente une partie des exigences de gouvernance, d’immatriculation, de droit des sociétés et de reporting financier.

Traité au lot C.

---

## 3. Applicabilité et provenance sont deux axes — **adopté**

Origine : ChatGPT. Confirmé par le code.

Le commentaire de `preparation.ts:36` dit « Qui réclame la pièce » — ce qui décrit une provenance — alors que les valeurs stockées sont des contextes d’applicabilité.

Exemple :

```text
bank · dfi · capital
```

ne signifie pas que ces acteurs ont demandé la pièce. Cela signifie que l’exigence peut être pertinente dans ces contextes.

**Décision :**

Ne rien renommer avant d’avoir la matrice complète des usages. Le renommage n’apporte rien tant que la provenance nominative n’existe pas, et un renommage à l’aveugle casserait `Preparation.tsx`, `preparation.ts` et les filtres.

Le futur modèle devra distinguer :

```text
Applicabilité
→ banque · DFI · capital · audit · diligence

Provenance réelle
→ Référentiel Sanza · fondateur · Banque Atlantique · Proparco · programme · import
```

**Reporté après la bêta.**

---

## 4. `checklist_items.sources` existait déjà — **fait vérifié, corrige l’analyse initiale**

La première analyse affirmait qu’aucune colonne de provenance n’existait et en faisait la recommandation numéro un. C’était faux.

La colonne existe, est remplie, affichée en badges et filtrable.

```text
{ohada,capital}      PV des assemblées des 3 derniers exercices
{bank,dfi,capital}   États financiers SYSCOHADA — 3 exercices
{dfi}                Plan d’action E&S
```

**Correction importante :**

Le mécanisme d’applicabilité cumulée existait déjà au niveau des exigences. Il peut servir de base à une première version des Modèles de préparation, sans nécessiter immédiatement de nouvelles tables.

Il ne constitue toutefois pas, à lui seul, un Référentiel complet. Il ne couvre pas encore :
- l’administration d’une bibliothèque ;
- la version des modèles ;
- la provenance nominative ;
- la justification d’ajout ;
- l’historique des changements ;
- les variantes selon la forme juridique ou le pays.

---

## 5. L’instrument affine l’objectif — **fait vérifié**

La combinaison `Objectif : obtenir un financement + Modalité : dette` n’existe pas dans le produit. `dette` est déjà un objectif.

Valeurs réelles de `modalite_financement`, par objectif :

| Objectif | Modalités disponibles |
|---|---|
| `levee` | Pré-amorçage · Amorçage · Série A · B · C+ |
| `dette` | Crédit d’investissement · Ligne de trésorerie · Crédit-bail · Financement d’équipement · Crédit documentaire |
| `dfi` | Subvention · Prêt concessionnel · Garantie · Assistance technique · Fonds propres |

**Décision :**

Pour la première version, chaque objectif sélectionne directement un Modèle de préparation principal. La modalité affine le contexte à l’intérieur de cet objectif et pourra modifier ou enrichir le modèle lorsque les exigences correspondantes auront été validées.

Il n’y a donc pas, à ce stade, de matrice générale `objectif × instrument` à construire.

---

## 6. La couche « régime juridique » n’a qu’une valeur dans le périmètre actuel — **fait vérifié, décision de périmètre**

L’onboarding ne propose que l’UEMOA et la CEMAC : quatorze pays, tous membres de l’OHADA. Les autres pays ont été retirés à la demande du fondateur.

**Décision pour la bêta :**

Le pays ne sélectionne pas un référentiel juridique entièrement distinct. Il adapte uniquement les éléments locaux déjà vérifiés :
- la terminologie ;
- les autorités ;
- certains identifiants ;
- les variantes documentaires confirmées.

Exemples :

```text
Sénégal
→ NINEA

Autres pays
→ IFU ou identifiant local vérifié
```

Cette décision est une simplification de périmètre, pas une conclusion juridique universelle. Elle devra être rouverte :
- avant l’ajout d’un pays non-OHADA ;
- lorsqu’une exigence nationale supplémentaire aura été confirmée ;
- lorsqu’une différence d’autorité ou de justificatif aura un impact produit réel.

Traité au lot C.

---

## 7. Le stade change le niveau, pas la présence — **adopté**

Origine : ChatGPT.

Masquer une exigence comme « États financiers — 3 exercices » pour une entreprise en pré-amorçage retire au fondateur la possibilité de fournir la pièce s’il la possède et lui cache ce qu’un financeur pourrait réclamer.

**Décision :**

Le stade modifie le niveau de l’exigence :

```text
requis ↔ recommandé
```

Il ne supprime pas automatiquement l’exigence du plan.

---

## 8. Pas d’écran de recommandation de modèle — **décision produit**

Pour la première version, `objectif → modèle principal` est une correspondance directe.

Afficher :

> D’après votre besoin, nous vous recommandons le modèle Financement bancaire.

à une personne qui vient de choisir « Financement bancaire » lui renverrait sa propre réponse sous une forme artificiellement valorisée.

**Décision :**

Le modèle s’applique directement et le Plan de préparation s’affiche. Une action « Changer de modèle » peut rester disponible.

L’utilisateur peut voir :
- le nom du modèle appliqué ;
- sa finalité ;
- le nombre d’exigences initiales ;
- un lien pour le changer.

Il ne voit pas :
- les règles internes ;
- les critères d’applicabilité ;
- la structure technique du Référentiel.

**Opinion produit, pas fait vérifié.** À rouvrir si les tests utilisateurs montrent que le fondateur ne comprend pas d’où vient son plan.

---

## 9. Ne pas ajouter systématiquement « Type de financeur ciblé » — **décision de simplification**

Le type de financeur est parfois déductible, mais pas toujours.

Exemples d’ambiguïté :
- une dette peut venir d’une banque, d’une institution de microfinance, d’un fonds de dette ou d’un crédit-bailleur ;
- une diligence peut être menée par un investisseur, une banque, une DFI ou un acquéreur ;
- une DFI peut intervenir en dette, en garantie, en subvention ou en fonds propres.

**Décision :**

Ne pas ajouter une question générale à sept options dans tous les parcours.

La logique devient :

```text
Déduire lorsque la réponse est non ambiguë.
Poser une question contextuelle uniquement lorsque plusieurs catégories restent plausibles.
```

Exemple pour une levée :

```text
Qui préparez-vous à solliciter ?

○ Fonds d’investissement
○ Investisseurs individuels
○ Institution de développement
○ Plusieurs types d’investisseurs
○ Pas encore défini
```

---

## 10. L’échéance sert à la priorisation — **adopté**

Origine : ChatGPT.

`startups.horizon` est déjà stocké. Trier le Plan de préparation selon l’urgence ne touche ni au Référentiel ni au Modèle.

**Décision :**

L’échéance influence :
- l’ordre d’affichage ;
- les priorités ;
- les prochaines actions ;
- les alertes de fraîcheur.

Elle ne modifie pas automatiquement la présence d’une exigence.

---

## 11. Le montant ne permet pas de résoudre les seuils — **adopté**

Le montant recherché ne permet pas de déterminer les obligations liées au commissariat aux comptes. Les seuils portent notamment sur :
- le chiffre d’affaires ;
- le total du bilan ;
- l’effectif.

**Décision :**

Cet axe reste une question distincte à poser au fondateur, ou n’est pas traité. Ne jamais inventer une règle à partir du montant de la levée ou du financement recherché.

---

## 12. Ce qui a été rejeté, et pourquoi

| Proposition | Origine | Motif du rejet |
|---|---|---|
| Tables `referentiels` / `referentiel_items` immédiates | Claude | Elles dupliqueraient trop tôt une partie de ce que `sources` permet déjà |
| `NULL` valant « s’applique à tout » | Claude | Astuce de base de données peu prédictible et difficile à expliquer |
| Déduplication sur l’intitulé normalisé | Claude | Fragile : deux formulations proches peuvent rester différentes |
| Six tableaux `applicable_*` | ChatGPT | Trop de complexité pour 22 exigences et aucun apprentissage utilisateur |
| Sept couches cumulatives complètes | ChatGPT | Trop de combinatoire pour la bêta ; la logique doit rester prédictible |
| Masquer les exigences impossibles | Claude | Le stade doit changer le niveau, pas supprimer l’exigence |
| Ajouter « Fintech » comme onzième secteur | — | « Services financiers » couvre déjà le besoin actuel |
| Écran de recommandation de modèle | ChatGPT | Répète la réponse de l’utilisateur sans réelle valeur ajoutée |
| Question générale « Type de financeur » | ChatGPT | Inutile dans certains parcours et ambiguë dans d’autres ; doit être contextuelle |

---

## 13. Le modèle retenu pour la première version

Les différentes dimensions se réduisent à **une sélection principale et plusieurs modificateurs prévisibles** :

```text
objectif
→ sélection du Modèle de préparation principal

modalité
→ contexte conservé ; effet ultérieur lorsque les règles seront validées

forme juridique
→ variantes juridiques ciblées

stade
→ niveau requis ou recommandé

pays
→ terminologie et variantes locales vérifiées

échéance
→ priorité d’affichage
```

Quand les exigences manquantes auront été rédigées et vérifiées :

```text
secteur réglementé
→ extension ciblée

instrument / modalité
→ enrichissement du modèle
```

**Critère retenu : chaque effet doit être prévisible isolément.**

C’est ce qui justifie le rejet :
- du `NULL` cumulatif ;
- des matrices d’applicabilité trop larges ;
- des couches nombreuses et invisibles ;
- des règles difficiles à expliquer au fondateur.

---

## 14. Les huit promesses retirées

Le produit annonçait une adaptation qu’aucune fonction ne produisait.

`apply_checklist_template(p_deal)` et `apply_dataroom_template(p_deal)` ne lisaient ni l’objectif, ni le pays, ni le secteur.

Huit phrases ont été retirées en `808e2e1` et `5b950b2`.

Le balayage porte désormais sur les tournures d’effet, pas sur un seul mot comme « adapter ».

**Règle :**

Aucune phrase du produit ne doit annoncer un comportement avant que le code le produise.

Le Plan de préparation est :
- un point de départ ;
- une aide structurée ;
- un plan personnalisable.

Il n’est jamais présenté comme :
- une liste exhaustive ;
- une garantie de conformité ;
- la reproduction certaine des demandes d’un financeur.

---

## 15. Expérience utilisateur retenue

Le parcours cible devient :

```text
Onboarding
→ l’utilisateur indique son besoin
→ l’objectif sélectionne le modèle principal
→ les autres réponses ajustent le plan
→ le plan est matérialisé dans l’opération
→ l’utilisateur travaille dans son plan
```

L’utilisateur ne compose pas le Référentiel et ne manipule pas les règles internes.

Dans Préparation, il peut voir :

```text
Plan de préparation
Financement bancaire · 19 exigences initiales

Basé sur :
- le besoin déclaré
- le socle juridique applicable
- la forme juridique de l’entreprise
- le stade de développement
- l’échéance indiquée
```

Il peut ensuite :
- rattacher des pièces ;
- confirmer ou écarter des suggestions ;
- ajouter une exigence ;
- marquer une exigence comme non applicable ;
- changer de modèle ;
- suivre la progression ;
- ajouter les demandes particulières reçues d’un financeur.

---

## 16. Points à rouvrir après la bêta

1. Créer un objet explicite et versionné pour les Modèles de préparation.
2. Distinguer techniquement applicabilité et provenance nominative.
3. Ajouter les demandes provenant d’un financeur nommé.
4. Étendre les variantes locales par pays, uniquement à partir de règles vérifiées.
5. Ajouter des extensions sectorielles pour les secteurs réglementés.
6. Déterminer quand la modalité modifie réellement le contenu du plan.
7. Tester si le fondateur comprend l’origine de son plan sans écran de recommandation.
8. Étudier le comportement lors d’un changement d’objectif ou de modèle sans supprimer automatiquement le travail déjà réalisé.

---

## 17. Le Référentiel sera contributif — **contrainte d'architecture, énoncée le 1er août**

Consigne du fondateur : *« plus tard, les investisseurs, accélérateurs pourront
aussi apporter, modifier, ajouter Référentiel »*.

**Ce n'est pas un chantier de la bêta.** C'est une contrainte qui interdit
certaines économies aujourd'hui, parce qu'elles coûteraient beaucoup plus cher à
défaire ensuite.

### 17.1 Ce que cela renverse

**Décision D1 inversée : les Modèles de préparation seront une table, pas une
constante TypeScript.**

Je recommandais la constante, avec cet argument : *« tant que vous êtes seul à
les écrire, une table vous oblige à construire une administration pour
vous-même »*. L'argument tombe le jour où l'auteur n'est plus seul. Un
accélérateur ne peut pas attendre un déploiement pour corriger sa liste, et
personne ne lui donnera accès au dépôt.

Le coût des deux options est presque identique aujourd'hui. Il devient très
différent une fois que du code de sélection existe.

### 17.2 Ce que cela avance dans l'ordre des priorités

La décision 3 — distinguer **applicabilité** et **provenance** — cesse d'être un
raffinement reportable. Dès qu'une exigence peut venir de Sanza, d'un
accélérateur ou d'un investisseur, savoir **qui l'a mise là** devient la
condition pour :

- l'afficher honnêtement (« demandé par votre programme », pas « demandé par
  Sanza ») ;
- la retirer quand la relation prend fin ;
- ne pas laisser le référentiel d'un accélérateur fuiter chez les autres.

Elle reste hors bêta, mais elle n'est plus facultative.

### 17.3 Ce que cela n'autorise pas

**Ne pas construire le multi-contributeur maintenant.** Pas de colonne
propriétaire, pas de politique RLS par organisation, pas d'écran
d'administration tant qu'aucun accélérateur réel n'est branché. Ajouter une
colonne à une table Postgres reste bon marché ; c'est la logique qu'on ne veut
pas réécrire.

La règle appliquée : **ce qui est cher à défaire se décide maintenant, ce qui
est bon marché à ajouter attend un besoin réel.**

### 17.4 Les questions ouvertes, à trancher avant d'ouvrir aux contributeurs

1. Un accélérateur modifie-t-il le référentiel Sanza, ou en superpose-t-il un ?
   *(La superposition évite qu'un contributeur en dégrade un autre.)*
2. Une exigence ajoutée par un investisseur s'applique-t-elle à toutes ses
   opérations, ou seulement à celle qu'il examine ?
3. Le fondateur peut-il refuser une exigence imposée par son programme ?
4. Qui arbitre quand deux contributeurs demandent la même pièce sous deux noms ?
