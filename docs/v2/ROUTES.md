# Sanza V2 — contrat des routes

## Routes globales

| Route | Contexte | Rôle |
|---|---|---|
| `/v2` | — | Redirige vers les opérations |
| `/v2/operations` | Workspace | Liste et création des opérations |
| `/v2/invitations` | Workspace | Invitations et demandes reçues |
| `/v2/team` | Workspace | Collaborateurs internes |
| `/v2/security` | Workspace | 2FA, sessions et journal de sécurité |

## Onboarding

| Route | Résultat attendu |
|---|---|
| `/v2/onboarding/company` | Identité et juridiction de l’entreprise |
| `/v2/onboarding/operation` | Type de financement ou diligence |
| `/v2/onboarding/details` | Questions conditionnelles |
| `/v2/onboarding/result` | Plan généré et espace privé |

L’onboarding exige une session mais pas encore une adhésion à une
organisation. Une invitation doit survivre à toutes ces étapes.

## Opération

Préfixe : `/v2/operations/[operationId]`

| Suffixe | Fonction |
|---|---|
| `/overview` | Prochaine action, progression, activité récente |
| `/preparation` | Exigences documentaires contextualisées |
| `/documents/[[...folderPath]]` | Data room et dossier sélectionné |
| `/access` | Partage, prévisualisation et révocation |
| `/investors` | Relations de financement, si applicable |
| `/activity` | Activité documentaire de l’opération |

L’URL d’un dossier conserve son chemin. Les détails importants devront aussi
être restaurables par URL ou paramètres de recherche : exigence, pièce, accès
et investisseur.

## Navigation adaptative

- `Investisseurs` est visible pour une levée en capital ou lorsqu’une opération
  suit explicitement plusieurs financeurs.
- Une diligence simple conserve Vue d’ensemble, Préparation, Partage, Activité
  et Documents.
- Une invitation de programme n’ajoute pas une section permanente au shell.
- La visibilité d’une route n’est jamais utilisée comme contrôle de sécurité.
