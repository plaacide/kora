# Matrice de validation des formulaires

**Méthode :** lecture du code. Les colonnes « client » et « serveur » sont
vérifiables ; la colonne « double clic » l'est aussi. **Aucune cellule n'a été
remplie par supposition** — les cases inconnues portent `?`.

Légende : ✅ présent · ⚠️ partiel · ❌ absent · — sans objet

## Formulaires du périmètre bêta

| Formulaire | Champs obligatoires | Validation client | Validation serveur | Erreur inline | Focus | Chargement | Double clic | Saisie conservée |
|---|---|---|---|---|---|---|---|---|
| Connexion | e-mail, mot de passe | ✅ `required` + zod | ✅ zod `lib/validation/auth` | ✅ `role=alert` | ❌ | ✅ | ✅ `useActionState` | ✅ |
| Inscription | nom, e-mail, mot de passe, poste | ✅ `required` + zod | ✅ zod | ✅ par champ | ❌ | ✅ | ✅ | ✅ |
| Onboarding — entreprise | nom | ⚠️ 1 `required` | ✅ `?erreur=nom` | ✅ `role=alert` | ❌ | ✅ | ✅ `BoutonEnvoi` | ✅ |
| Onboarding — objectif | — | — | ✅ RPC | ✅ | ❌ | ✅ | ✅ `BoutonEnvoi` | ✅ |
| Onboarding — détails | — | ❌ | ✅ RPC | ✅ | ❌ | ✅ | ✅ `BoutonEnvoi` | ✅ |
| Nouvelle opération | nom, structure | ✅ 4 `required` | ✅ `back(…, "nom")` | ✅ `role=alert` | ❌ | ✅ | ✅ `BoutonEnvoiExterne` | ✅ via `Carried` |
| Créer un dossier | nom | ❌ | ✅ `dossier.nom_requis` | ✅ | ❌ | ✅ | ✅ `busy` | ✅ |
| Renommer (pièce/dossier) | nom | ❌ | ✅ `document.nom_requis` | ✅ | ✅ auto | ✅ | ✅ garde `enCours` | ✅ |
| Dépôt de pièces | fichier | ✅ `accept` | ✅ statut HTTP → code | ✅ par fichier | — | ✅ par fichier | ✅ | — |
| Ajouter une exigence | intitulé, domaine, niveau | ✅ 4 `required` | ✅ `exigence.intitule_trop_court` | ✅ | ❌ | ✅ | ✅ | ✅ |
| Inviter un visiteur | e-mail, périmètre | ❌ | ✅ `acces.destinataire_requis` | ✅ `role=alert` ×2 | ❌ | ✅ `busy` | ✅ | ✅ |
| Inviter un collaborateur | e-mail, rôle | ❌ | ✅ RPC → `equipe.*` | ✅ `role=alert` ×2 | ❌ | ✅ | ✅ | ✅ |
| Configurer une levée | aucun — tout est facultatif | ⚠️ fourchette à la saisie | ✅ **`validerLevee`, 11 règles** | ✅ `role=alert` ×3 | ❌ **voir note** | ✅ | ✅ `busy` | ✅ |
| Ajouter un investisseur | nom | ❌ | ✅ `investisseur.nom_requis` | ✅ `role=alert` | ❌ | ✅ | ✅ | ✅ |
| Enregistrer un engagement | investisseur, montant | ❌ | ✅ 2 codes distincts | ✅ `role=alert` | ❌ | ✅ | ✅ | ✅ |
| Consigner une interaction | type, date | ❌ | ✅ RPC | ✅ `role=alert` | ❌ | ✅ | ✅ | ✅ |
| Activer le TOTP | code | ❌ | ✅ SDK → `mfa.code_invalide` | ✅ | ❌ | ✅ | ✅ | — |

## Les règles réellement vérifiées côté serveur

Seule la levée a un jeu de règles complet et testé — 16 tests dans
`domain/levee-schema.test.ts` :

| Règle | Vérifiée | Code rendu |
|---|---|---|
| Chaîne vide / espaces seuls | ✅ `.trim()` | `levee.nom_requis` |
| Minimum (2 caractères) | ✅ | `levee.nom_requis` |
| Maximum (120 caractères) | ✅ | `levee.nom_requis` |
| Nombre négatif | ✅ | `levee.montant_invalide` |
| Zéro autorisé | ✅ délibérément | — |
| Plafond (10¹²) | ✅ | `levee.montant_invalide` |
| Valeur hors liste (devise, stade, instrument) | ✅ | `levee.*_inconnu` |
| Fourchette inversée | ✅ | `levee.ticket_incoherent` |
| Pourcentage hors 0–100 | ✅ | `levee.part_capital_invalide` |
| Date invalide | ✅ | `levee.echeance_invalide` |
| Somme > 100 % | ✅ | `levee.usage_depasse` |
| Doublon | ✅ en base (index unique) | `exigence.doublon` etc. |

## Trois manques réels

### 1. `aria-describedby` est absent partout — **0 occurrence**

Le §13 du brief l'exige sur chaque champ obligatoire. Aucun écran ne le pose.
Conséquence : un lecteur d'écran annonce le champ et son état invalide, mais
**pas le message qui explique quoi corriger**.

`aria-invalid` n'existe que dans `Auth.tsx` (4 occurrences). Ailleurs : 0.

**Gravité S3** — contournable à la souris, bloquant pour qui navigue au lecteur
d'écran. Non bloquant pour une bêta fermée voyante, à corriger avant ouverture
large.

### 2. Aucun formulaire ne met le focus sur le premier champ fautif

Le §15 le demande. Seul le renommage en ligne place le curseur, et c'est par
construction. Pour la levée, l'action **rend pourtant `res.champ`** — le champ
est identifié côté serveur, mais l'écran ne s'en sert pas : il n'a ni `<form>`
ni attributs `name`, ses champs sont contrôlés un par un. Le raccorder demande
de reprendre cet écran.

Les messages nomment le champ en toutes lettres (« la part de capital se saisit
entre 0 et 100 »), ce qui limite la gêne sur un écran d'une douzaine de champs.

### 3. « Nouvelle opération » n'était pas gardée contre le double clic — corrigé

Trouvé en remplissant cette matrice, corrigé dans la foulée.

Son bouton est posé HORS du formulaire, relié par `form="…"` : il n'est donc pas
descendant du `<form>`, et `useFormStatus` — qui lit un contexte React — ne le
voyait pas. Le bouton restait cliquable pendant tout l'envoi, et un double clic
sur connexion lente créait **deux opérations**, la seconde consommant une place
de plan.

`BoutonEnvoiExterne` écoute l'évènement `submit` natif du formulaire visé, seul
signal disponible de l'extérieur.

**Reste à vérifier à l'exécution** : la garde est écrite, elle n'a pas encore
été éprouvée par un vrai double clic. C'est un test de la suite authentifiée.

## Réserve

Les colonnes « erreur inline », « chargement » et « saisie conservée » sont
déduites de la présence de `role="alert"`, d'un état `busy` et du pattern de
composant. **Elles n'ont pas été observées à l'exécution.** La suite
authentifiée les confirmera ou les démentira.
