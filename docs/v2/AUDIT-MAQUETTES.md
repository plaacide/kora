# Audit — les 69 maquettes contre les écrans réels

Établi le **30 juillet 2026** par comparaison systématique : les 69 maquettes
rendues et analysées par leur DOM (pas par lecture de HTML brut), puis
confrontées au code de `src/app/v2` et `src/features/v2`.

Ce document répond à deux questions par écran : **est-il atteignable ?** et
**lui manque-t-il des blocs ?**

## Le défaut de méthode qu'il corrige

Jusqu'ici, chaque écran était vérifié au moment où on le branchait. Un écran
dont aucun lien ne pose le paramètre d'URL n'apparaît dans aucun parcours :
il n'était donc jamais vu, et son absence ne se remarquait pas. On vérifiait
que ce qui avait été fait marchait, pas que rien ne manquait.

---

## 1. Écrans injoignables

Le code existe, aucun lien n'y mène. Il faut taper le paramètre à la main.

| Écran | Composant | Paramètre | Liens qui le posent |
|---|---|---|---|
| **16 · Dépôt en cours** | `Upload.tsx` | `?depot=1` | **0** |
| **17 · Confirmation associations** | `Associations.tsx` | `?associations=1` | **0** |
| **13 · Import d'une liste** | `ImportList.tsx` | `?import=1` | **0** |
| **09/10 · Vue d'ensemble (états 2 et 4)** | `OverviewStates.tsx` | `?etat=` | **0** |

Ces quatre écrans affichent tous des données écrites en dur — noms de fichiers,
pourcentages, personnes qui n'existent pas.

## 2. Écrans amputés

Atteignables, mais il leur manque des blocs de la maquette.

### 18 · Détail d'une pièce — complété le 31 juillet 2026

| Bloc de la maquette | État |
|---|---|
| Badge statut, type et poids (`PDF · 3,1 Mo`) | ✅ |
| Exigence / Dossier / Visibilité | ✅ |
| **Période couverte** | ❌ aucune colonne en base |
| **Versions** (liste + « Restaurer ») | ✅ |
| **Activité sur cette pièce** | ✅ depuis `audit_log` |
| **Remplacer (vN)** | ✅ via `add_document_version` |
| **Archiver** | ❌ aucune RPC — `delete_document` supprime, n'archive pas |
| Ouvrir la visionneuse | ✅ |

Deux manques restent, et tous deux tiennent à la base, pas à l'écran :
« Période couverte » n'a aucune colonne, et archiver une pièce n'existe pas —
`delete_document` supprime pour de bon. Les afficher demanderait une migration.

La maquette montre aussi un commentaire par version (« Ajout des annexes
fiscales ») : `document_versions` n'a pas de champ pour cela.

### 15 · Data room remplie

Pagination (« Page précédente / suivante ») absente — la table affiche tout.
Acceptable tant que les dossiers sont courts, à revoir au-delà.

### 19 · Visionneuse

Contrôles de zoom (`92 %`, agrandir, réduire) absents. Le reste est branché.

## 3. Écrans jamais construits

Aucun composant ne leur correspond.

| Écran | Sujet |
|---|---|
| 25 | Prévisualisation comme l'invité |
| 29 | Fiche investisseur — activité documentaire |
| 38 | Pipeline — mode colonnes |
| 42 | Ajouter une interaction |
| 44 | Vue Engagements |
| 51 | Variantes d'états (référence) |
| 59 | Modale limite du plan |
| 61 | Modale choix dealroom |
| 62 | Bienvenue adaptée — data room à la demande |

L'écran **62** est celui dont dépend l'arbitrage différé sur la création
automatique de data room à l'onboarding.

## 4. Écrans atteignables et complets

Auth (01→03), onboarding (04→07), opérations (52→54), création d'opération
(55→57), accueil (73/74), data room racine et dossier (14/15), visionneuse
(19, hors zoom), partage (20→24), et les écrans Lever (35→50) — ces derniers
étant complets en apparence mais alimentés par des données en dur.

---

## Ce qu'il faut retenir

**Le vrai sujet n'est pas le nombre d'écrans manquants**, mais que quatre
écrans existants soient inatteignables. Ils ont été écrits, relus, commités —
et personne ne peut les ouvrir.

Deux règles pour que cela ne se reproduise pas :

1. **Un écran monté sur un paramètre d'URL doit avoir son lien dans le même
   commit.** Sans lien, il est mort à la naissance.
2. **Retirer un bloc plutôt qu'afficher du faux reste juste** — mais la dette
   doit être inscrite ici, pas seulement mentionnée en conversation.

## Ordre de reprise proposé

1. ~~**Écran 16**~~ — fait le 31 juillet : s'ouvre dès deux pièces, pourcentage
   mesuré, « Tout annuler » opérant.
2. ~~**Écran 18**~~ — fait le 31 juillet : versions, restauration, remplacement
   et journal.
3. **Écrans 17 et 13** — restent injoignables. Le 17 suppose des suggestions
   pièce ↔ exigence qui n'existent pas encore ; le 13, un analyseur de liste
   reçue.
4. **Écran 62** — il porte une décision produit en attente.
5. Le reste, par ordre d'usage réel.
