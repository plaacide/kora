# Sanza — Handoff multi-opérations (18 frames desktop)

Package pour Claude Code. Maquettes HTML/CSS statiques 1440 px, données de test **Nimba Solar** (Série A 2026, 500 000 000 XOF, échéance 30-11-2026). Le brief produit complet est dans `BRIEF.md` — il fait foi pour le modèle de données, les routes, la sécurité et l'ordre de travail.

## Comment lire les maquettes
- Chaque fichier contient un ou plusieurs blocs `.screen` (1440×900 min) précédés d'une note `.screen-note` (id, portée, état montré).
- `parcours.css` est LE design system : tokens (`--orange #E85C2B`, encres `#101828/#475467/#667085/#98A2B3`, lignes `#E4E7EC/#F2F4F7`), boutons, champs 52 px, badges, shell applicatif (rail 60 px → panneau contextuel 240 px → topbar 60 px → contenu). Ne rien redéfinir localement.
- Icônes : Lucide, trait 1.75, 18 px dans le rail, 14-16 px inline.
- Typo : Archivo (titres/labels) + Inter (texte). Vouvoiement partout.

## Nouveaux écrans (7)
| Frame | Route | Points d'attention |
|---|---|---|
| 52 · Opérations vide | `/operations` | Une seule action primaire, aucun compteur à zéro, réassurance confidentialité. |
| 53 · Une opération | `/operations` | La liste n'est jamais sautée ; « Nouvelle opération » reste visible dans la topbar. |
| 54 · Multiples + archives | `/operations` | Sections ACTIVES/ARCHIVÉES ; menu ··· (Ouvrir, Modifier, Dupliquer la structure, Clôturer, Archiver, Exporter l'index). Archivée = lecture seule. |
| 55 · Création — type | `/operations/new` étape 1 | 6 cartes. Sans sélection : CTA désactivé + raison affichée sous le bouton. |
| 56 · Création — informations | étape 2 | Champs communs + bloc conditionnel selon le type (ici : Levée). Infos permanentes de l'entreprise réutilisées, pas de re-onboarding. |
| 57 · Création — structure | étape 3 | 3 options ; la copie de structure ne reprend JAMAIS pièces/invités/permissions/NDA/questions/activité. 2e bloc : état de succès (data room créée privée). |
| 58 · Accueil multi-opérations | `/dashboard` | Max 3 actions urgentes, tableau VOS OPÉRATIONS, UN seul conseil contextuel. Chaque action ouvre directement la bonne opération. |

## Modales (3)
| Frame | Déclencheur | Points d'attention |
|---|---|---|
| 59 · Limite du plan | clic « Nouvelle opération » à la limite | 2 variantes : Raise (1 active) et Close (3 actives). Ne jamais masquer le bouton sans explication. |
| 60 · Clôturer / archiver | menu ··· | Clôture : choix conserver/révoquer les accès. Archivage : lecture seule, hors décompte, rien n'est supprimé, réversible. |
| 61 · Choix dealroom | invitation programme | Le mandat/consentement ne s'applique qu'à UNE opération, jamais automatiquement à toutes. |

## Écrans adaptés (8)
| Frame | Écran d'origine (parcours V2) | Changement |
|---|---|---|
| 62 · Bienvenue | 07-plan-genere | Aucune data room auto : « Créer ma data room » crée ensemble la 1re opération et sa data room privée. |
| 63 · Vue d'ensemble | 08/10 | Sélecteur rapide ouvert sur le nom de l'opération (raccourci — `/operations` reste la gestion principale). Nom, type, statut, préparation, échéance, prochaine action, activité toujours visibles. |
| 64 · Partage | 23-partage-verification | Bandeau contexte « Série A 2026 — vous allez ouvrir… » + ligne OPÉRATION en tête de la vérification finale. |
| 65 · Invitations et demandes | 26-demande-acces | Chaque ligne nomme son opération (tag) + filtre par opération. |
| 66 · Recherche | — (nouveau global) | Chaque résultat affiche son chemin `Opération › Dossier`, y compris archivées. |
| 67 · Activité / questions | 30-journal-activite | Hors contexte d'opération : tag opération sur chaque événement + filtre. |
| 68 · Abonnement | — (nouveau global) | « Opérations actives 3 sur 3 », archives hors décompte, grille des plans (Ready 1 en préparation / Raise 1 active / Close 3 actives / Sur mesure). |
| 69 · Cohorte / dealroom | 31/32 | L'entreprise rejoint la cohorte, mais l'opération présentée est explicite et modifiable (→ modale 61). |

## Navigation (rappel du modèle)
- Rail global : Accueil, Opérations, Invitations et demandes, Recherche / Équipe, Sécurité, Aide. Pas d'entrée globale « Ma levée » ni « Data rooms ».
- Panneau contextuel d'opération : `← Toutes les opérations`, nom + type + statut, PILOTER (Vue d'ensemble, Préparation, Partage et accès, **Ma levée**, Investisseurs, Activité), DOCUMENTS (arborescence). Pour une diligence : masquer « Ma levée ».
- Routes : tout sous `/operations/[operationId]/…` (voir BRIEF.md §5).

## Écarts assumés vs BRIEF.md
- Abonnement affiché « 3 sur 3 » (le brief illustre « 2 sur 3 ») pour rester cohérent avec la liste 54 et la modale 59-Close.
- Les écrans du parcours V2 existant utilisent encore « Lever » dans la nav contextuelle ; les frames MO utilisent « Ma levée » (canonique du brief). Aligner en code sur « Ma levée ».

## Hors périmètre de ce package
Les 6 variantes mobiles prioritaires (BRIEF.md §12-13) ne sont pas incluses — à valider dans un second lot.
