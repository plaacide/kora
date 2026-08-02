# Les exigences à rédiger — canevas

**Pour vous, à remplir.** C'est le goulot du produit : tant que ces lignes
n'existent pas, les lots D, E et G restent bloqués, et le catalogue reste **un
catalogue de levée en capital avec des étiquettes bancaires posées dessus**.

Je fournis la structure, les colonnes qu'attend le catalogue, et des
propositions. **Vous corrigez, complétez ou supprimez.** Rien n'entre en base
sans votre validation — j'ai déjà écrit des exigences réglementaires trop vite
une fois, et le document sectoriel porte les cicatrices de cette prudence.

---

## Comment remplir

Chaque exigence a besoin de sept informations. Cinq sont mécaniques, deux
demandent votre jugement.

| Colonne | Ce que c'est | Valeurs |
|---|---|---|
| **Intitulé** | Ce que le fondateur lit | libre, court |
| **Description** | Pourquoi ça compte — pas ce que c'est | une à deux phrases |
| **Domaine** | Où l'exigence se range | voir la liste ci-dessous |
| **Niveau** | Ce qui bloque un closing | `requis` · `recommandé` · `optionnel` |
| **Financeurs** | Qui la réclame | `bank` · `dfi` · `capital` · `ohada` |
| **Fraîcheur** | Combien de jours avant péremption | un nombre, ou vide |
| **Dossier** | Où la pièce se dépose | un chemin comme `2.6` |

**Les huit domaines :** `company_registration`, `governance_and_ownership`,
`finance_and_accounting`, `tax`, `commercial_and_market`, `team_and_people`,
`technology_and_ip`, `impact_esg`.

**Sur la description.** Le catalogue existant ne dit jamais ce qu'est une
pièce — il dit ce qu'elle coûte de ne pas l'avoir. « Un extrait périmé bloque
systématiquement un closing. » C'est ce ton qu'il faut tenir : le fondateur sait
ce qu'est un RCCM, il ne sait pas que trois mois le périment.

---

## 1. Dette bancaire

**Douze exigences portent déjà l'étiquette `bank`** — RCCM, déclaration fiscale,
états financiers, budget, tableau de la dette, TVA, quitus fiscal, assurances,
régularité sociale, bénéficiaires effectifs, rapport du commissaire, agréments.
Elles n'ont pas à être réécrites.

**Ce qui manque, à mon avis** — cinq lignes que je propose, à valider :

| # | Intitulé proposé | Domaine | Niveau | Fraîcheur | Dossier |
|---|---|---|---|---|---|
| B1 | Sûretés et garanties proposées | `finance_and_accounting` | requis | — | 2.6 |
| B2 | Relevés bancaires des 12 derniers mois | `finance_and_accounting` | requis | 90 | 2.1 |
| B3 | Plan de trésorerie prévisionnel | `finance_and_accounting` | requis | 180 | 2.4 |
| B4 | Objet du financement et plan d'emploi des fonds | `commercial_and_market` | requis | — | 2.5 |
| B5 | Contrats et commandes soutenant les flux futurs | `commercial_and_market` | recommandé | — | 3.1 |

**Descriptions à écrire.** Voici les miennes, à corriger :

- **B1** — « Ce que vous engagez en garantie, et sa valeur. C'est souvent ce qui
  décide du montant accordé, avant même l'analyse du dossier. »
- **B2** — « Douze mois de mouvements, tous comptes confondus. Une banque y lit
  votre saisonnalité et vos incidents mieux que dans vos états financiers. »
- **B3** — « Mois par mois, sur la durée du concours. Un prêt se rembourse avec
  de la trésorerie, pas avec du résultat. »
- **B4** — « À quoi sert l'argent, et selon quel calendrier. Un objet flou fait
  reculer un comité de crédit. »
- **B5** — À écrire.

**Vos questions à trancher :**

1. « Tableau de la dette et des covenants » existe déjà — suffit-il, ou faut-il
   un échéancier séparé ?
2. Le type de concours change-t-il ces cinq lignes ? Un crédit-bail ne demande
   probablement pas de sûretés au même sens qu'un crédit d'investissement.

---

## 2. DFI et bailleurs

**Dix exigences portent déjà `dfi`.** Ce qui manque dépend fortement de
l'instrument — subvention, prêt concessionnel, garantie, assistance technique —
et je n'ai pas d'avis assez sûr pour proposer.

| # | Intitulé | Domaine | Niveau | Fraîcheur | Dossier |
|---|---|---|---|---|---|
| D1 | | | | | |
| D2 | | | | | |
| D3 | | | | | |

**Pistes, sans certitude :** note de projet et cadre logique pour une
subvention ; sûretés et états financiers audités pour un prêt concessionnel ;
engagement d'une banque tierce pour une garantie. À vous de dire ce qui se
demande réellement.

---

## 3. Audit

Aucune exigence ne porte cette étiquette — l'objectif `audit` existe dans le
produit et le catalogue l'ignore.

| # | Intitulé | Domaine | Niveau | Fraîcheur | Dossier |
|---|---|---|---|---|---|
| A1 | | | | | |
| A2 | | | | | |

**Et une question de fond :** un audit demande-t-il des pièces que le socle
OHADA ne couvre pas déjà — grand livre, balance, rapprochements, inventaires,
justificatifs — ou seulement les mêmes, avec un niveau d'exigence supérieur ?
**Si c'est le second cas, il n'y a rien à écrire** : il suffit de faire passer
certaines exigences de recommandé à requis. Dites-le-moi, cela vous épargnerait
tout ce chapitre.

---

## 4. Diligence

Même situation.

| # | Intitulé | Domaine | Niveau | Fraîcheur | Dossier |
|---|---|---|---|---|---|
| G1 | | | | | |
| G2 | | | | | |

**Question :** une diligence est-elle un dossier de levée regardé par
l'acheteur, ou autre chose ? Si c'est le premier cas, `diligence → capital +
ohada` suffit et ce chapitre disparaît aussi.

---

## 5. Ce que je fais de vos réponses

Chaque ligne remplie devient une ligne de `checklist_catalog`, avec sa clé
stable. Les variantes par forme juridique, pays et stade s'y appliquent
automatiquement — vous n'avez pas à les prévoir.

Ensuite seulement, `apply_checklist_template` peut filtrer sur l'objectif : **le
filtre sans ces exigences donnerait à un dossier bancaire une liste de levée
amputée**, donc une promesse plus crédible tout en restant fausse. C'est
pourquoi les lots D et E ne se livrent jamais séparément.

**Le plus court chemin :** répondez d'abord aux deux questions des chapitres 3
et 4. Si l'audit et la diligence se ramènent à des niveaux plutôt qu'à des
pièces nouvelles, il ne vous reste que la dette et le DFI à écrire.
