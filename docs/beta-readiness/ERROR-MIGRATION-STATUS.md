# État de la migration des erreurs

**Branche :** `v2/rebuild` · **Commit :** voir `git rev-parse HEAD`
**Méthode :** recherches dans le code, listées en fin de document pour être rejouées.
**Décision de référence :** [ADR-001](../v2/ADR-001-frontiere-des-erreurs.md)

## Résumé

| | Avant | Aujourd'hui |
|---|---|---|
| Retours d'échec portant une chaîne libre | 57 | **0** |
| Retours portant `error.message` brut | 36 | **0** |
| Replis humains inatteignables dans l'UI | 24 | **0** |
| Dictionnaires locaux à repli brut (`traduire()`) | 3 | **0** |
| Codes nommés et testés | 0 | **81** |

**Aucune erreur brute ne peut plus atteindre le navigateur depuis une action
migrée.** Ce n'est pas une intention documentée : `Echec` ne porte aucun champ
de texte, donc `error.message` ne compile pas.

## Par domaine

| Domaine | Fichier | Actions | Migrées | UI migrée | Erreur brute possible |
|---|---|---:|---:|---|---|
| Data room | `operations/[id]/documents/` | 14 | 14 | Oui | Non |
| Levée | `operations/[id]/lever/` | 13 | 13 | Oui | Non |
| Abonnement | `abonnement/` | 5 | 5 | Oui | Non |
| Préparation | `operations/[id]/preparation/` | 5 | 5 | Oui | Non |
| Équipe | `team/` | 4 | 4 | Oui | Non |
| Partage et accès | `operations/[id]/access/` | 2 | 2 | Oui | Non |
| Sécurité | `security/` | 2 | 2 | Oui | Non |
| Opérations (archivage) | `operations/` | 1 | 1 | Oui | Non |
| Demandes d'accès | `invitations/` | 1 | 1 | Oui | Non |
| Rejoindre une équipe | `rejoindre-equipe/` | 1 | 1 | Oui | Non |
| **Onboarding** | `(onboarding)/onboarding/` | 4 | **0** | s.o. | **Non** — voir ci-dessous |
| **Nouvelle opération** | `operations/nouvelle/` | 1 | **0** | s.o. | **Non** — voir ci-dessous |

**48 actions sur 53 passent par le catalogue.** Les cinq restantes n'y passent
pas et n'ont pas à y passer.

### Pourquoi ces cinq actions ne sont pas migrées

Elles ne **retournent** rien : ce sont des actions de formulaire qui terminent
par `redirect()`. L'erreur voyage donc dans l'URL, sous forme de **clé** et
jamais de message :

```ts
if (!name) redirect(`${v2Routes.onboarding.company}?erreur=nom`);
```

```ts
back(formData, messageDeRefus(error.message) ? "limite" : "enregistrement");
```

Le message brut sert ici uniquement à **choisir** une clé ; il n'est pas
transmis. L'écran traduit la clé via son propre `ERROR_MESSAGES`.

**Ce n'est pas une fuite, mais c'est un second mécanisme.** Deux endroits
mettent des mots sur des erreurs, et celui-là n'est pas testé. À unifier après
la bêta ; ce n'est pas bloquant.

## Le vocabulaire technique ne peut pas s'afficher

Le catalogue est testé contre une liste de mots interdits — `constraint`,
`violates`, `duplicate key`, `relation`, `supabase`, `postgres`, `rpc`,
`null`, `undefined`, ainsi que les noms de tables. Voir
`src/features/v2/domain/erreurs.test.ts`.

Un code ajouté sans texte **ne compile pas** : `Exclude<CodeErreur, …>` nomme le
manquant. Vérifié en injectant volontairement un code fictif — `tsc` l'a signalé
sur deux lignes.

Un test navigateur asserte en outre l'absence de ce vocabulaire sur les écrans
publics (`e2e/public.auth.spec.ts`).

## Ce qui est autorisé, et où

| Usage | Autorisé | Compte réel |
|---|---|---|
| `console.error` côté serveur avec le message brut | ✅ oui — c'est là qu'il sert | 46 |
| `codeDepuisPostgres(error.message)` | ✅ oui — seul point qui lit du brut | 44 |
| Retour de `error.message` vers le navigateur | ❌ interdit | **0** |
| `res.error` lu dans un écran | ❌ interdit | **0** |
| `throw new Error` atteignant le navigateur | ❌ interdit | **0** (6 dans le fournisseur de paiement, tous rattrapés — voir ci-dessous) |

Les six `throw` de `billing/providers/geniuspay.ts` sont interceptés par le
`try/catch` de `requestV2Plan`, qui rend `paiement.lenteur_prestataire` ou
`paiement.ouverture_impossible`. Aucun ne traverse.

## Recherches à rejouer

```bash
# Doit rendre 0 : aucune erreur brute vers le navigateur
grep -rn "error: error.message\|res\.error\|resultat\.error" src/features/v2 src/app/v2 --include="*.ts" --include="*.tsx"

# Doit rendre uniquement des console.error et des codeDepuisPostgres()
grep -rn "error\.message" src/features/v2 src/app/v2 --include="*.ts" --include="*.tsx"

# Doit rendre 0 hors du fournisseur de paiement
grep -rn "throw new Error" src/features/v2 src/app/v2 --include="*.ts" --include="*.tsx"
```

## Réserve

Ces conclusions viennent de la **lecture du code**, pas de l'exécution. Elles
prouvent qu'aucune erreur brute ne peut être *écrite* vers le navigateur ; elles
ne prouvent pas que chaque parcours se comporte bien à l'exécution. La suite
authentifiée reste à lancer — voir [README](README.md).
