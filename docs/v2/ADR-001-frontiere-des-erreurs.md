# ADR-001 : Où traduire les erreurs

**Statut :** Accepté — option C appliquée le 1er août 2026
**Date :** 1er août 2026
**Branche :** `v2/rebuild`
**Décideur :** fondateur
**Déclencheur :** `SANZA_V2_VALIDATIONS_ERREURS_COPIE_NATURELLE_CLAUDE_CODE.md`, §10 et §12

## Contexte

Le document de fiabilisation demande deux choses qui se tiennent : ne jamais
afficher d'erreur technique (§12), et normaliser le retour des actions (§10).
Avant de choisir un format, il faut regarder ce que le code fait aujourd'hui.

### Ce que mesure le code

| Mesure | Valeur |
|---|---|
| Actions serveur V2 | 52, réparties dans 11 `actions.ts` |
| Retours `ok: false` | 57 |
| … dont `error` est renseigné | **57 sur 57** |
| … dont `error` est le message Supabase brut | **36** |
| Replis humains écrits dans l'UI (`res.error ?? "…"`) | 24, dans 13 fichiers |
| Replis humains réellement atteignables | **0** |

### Le défaut n'est pas là où on le croit

Le réflexe est de dire : « 36 endroits renvoient l'erreur brute, corrigeons-les ».
C'est incomplet. Le défaut est structurel, et il se compose sur trois étages :

1. **L'action** renvoie `error.message` — la contrainte Postgres part vers le
   navigateur.
2. **Les deux traductions qui existent** — `traduire()` est écrite
   *deux fois*, dans `team/actions.ts:44` et `abonnement/actions.ts:33` — se
   terminent toutes deux par `return cle ? MESSAGES[cle] : message`. **Le repli
   est le message brut.** Une clé non prévue fuit exactement comme si aucune
   traduction n'existait.
3. **L'UI** écrit `setErreur(res.error ?? "L'accès n'a pas pu être créé.")`.
   Comme `error` est renseigné dans 57 cas sur 57, le `??` ne se déclenche
   jamais.

**Conséquence : les 24 messages humains écrits dans l'interface sont du code
mort.** Ils ont été rédigés avec soin, ils ne s'afficheront jamais. Ce que voit
le fondateur quand quelque chose casse, c'est `duplicate key value violates
unique constraint "…"`.

Le fait que `traduire()` ait été réécrite deux fois, indépendamment, est le
signal : le besoin est réel et récurrent, et il n'a pas d'endroit où vivre.

### Le format proposé par le §10 ne corrige pas ce défaut

```ts
| { success: false; code: string; message: string; … }
```

`code: string` accepte n'importe quelle chaîne. `message: string` aussi. Rien
dans ce type n'empêche `{ code: "23505", message: error.message }`. **Le format
du §10 reproduit exactement le trou qu'il dénonce au §12** : il documente une
intention là où il faudrait une contrainte.

## Décision proposée

Fermer la frontière **par le type**, dans `features/v2/domain/erreurs.ts`, et
laisser le compilateur énumérer le travail.

```ts
export type CodeErreur =
  | "operation.nom_requis"
  | "invitation.doublon"
  | "equipe.dernier_proprietaire"
  // …catalogue fermé, dérivé du §11

export type Echec = { ok: false; code: CodeErreur };
export type Resultat<T = void> = { ok: true; data: T } | Echec;
```

Le point n'est pas le nom des champs. Le point est que `code` soit une **union
fermée** et qu'aucun champ ne porte de texte libre. `error: error.message` cesse
de compiler : les 36 sites deviennent des erreurs TypeScript, pas des oublis.

Le texte vit dans un seul module, `Record<CodeErreur, Message>`, testable comme
`messageDeRefus` l'est déjà pour les limites de plan — précédent qui fonctionne
et qu'on étend plutôt que de le remplacer.

## Options considérées

### Option A — Corriger les 36 sites, garder `error?: string`

| Dimension | Évaluation |
|---|---|
| Coût | Faible — 36 remplacements |
| Risque de régression | Faible |
| Durabilité | **Nulle** |

**Pour :** rapide, aucun refactor.
**Contre :** rien n'empêche la 37ᵉ. Le type continue d'accepter le brut, et
c'est précisément par là que les deux `traduire()` fuient déjà. On corrige les
symptômes en laissant la cause.

### Option B — Étendre `traduire()` à chaque `actions.ts`

| Dimension | Évaluation |
|---|---|
| Coût | Moyen — 11 fichiers |
| Risque de régression | Faible |
| Durabilité | Faible |

**Pour :** suit ce que le code fait déjà spontanément.
**Contre :** onze dictionnaires locaux à maintenir, et le repli brut reste dans
chacun. C'est la duplication actuelle, industrialisée. Le §8 l'interdit
explicitement — « ne pas dupliquer les mêmes règles dans plusieurs composants ».

### Option C — Frontière fermée par le type *(recommandée)*

| Dimension | Évaluation |
|---|---|
| Coût | Moyen-élevé — type + catalogue + 36 sites + 24 appelants |
| Risque de régression | **Faible** — le compilateur guide |
| Durabilité | Élevée |

**Pour :** le défaut devient inexprimable. Le travail est énuméré par `tsc`, pas
par ma lecture — donc exhaustif, ce qu'un audit manuel ne peut pas garantir.
Migration possible fichier par fichier. Réutilise `messageDeRefus`.
**Contre :** touche 11 `actions.ts` et 13 fichiers d'UI. Impose de nommer tous
les cas d'échec — travail réel, mais c'est le §11 du document.

### Option D — `ActionResult<T>` du §10, à la lettre

| Dimension | Évaluation |
|---|---|
| Coût | Élevé — 57 retours, 24 appelants, `success` au lieu de `ok` |
| Risque de régression | Moyen |
| Durabilité | **Faible** — `message: string` rouvre le trou |

**Pour :** conforme au document ; `fieldErrors` sert la validation par champ.
**Contre :** le renommage `ok` → `success` est du coût sans bénéfice, et le
`message: string` libre réintroduit la fuite. On paierait le prix d'une
migration pour conserver le défaut.

`fieldErrors` est le seul apport réel du §10 — il est ajoutable à l'option C
sans en adopter le reste.

## Analyse du compromis

L'arbitrage se joue entre **coût immédiat** et **garantie**.

A et B sont deux ou trois fois moins chers et corrigent ce qui est visible
aujourd'hui. Ils ne changent rien à la propriété qui a produit le défaut : le
type autorise le brut. Sur une base qui grandit encore, la fuite reviendra, et
elle reviendra silencieusement — aucun test ne la détecte, puisqu'un message
brut est un `string` valide.

C coûte plus cher une fois et rend la classe entière impossible. C'est le même
raisonnement que celui déjà appliqué à `libelleStade` ou `libelleActionJournal` :
un seul endroit nomme, et il est testé. Le codebase penche déjà dans cette
direction — la décision consiste surtout à l'assumer pour les erreurs.

Le seul argument sérieux contre C est le calendrier. Il se traite en migrant par
parcours plutôt que d'un bloc.

## Conséquences

**Devient plus facile :** ajouter un cas d'échec — on l'ajoute à l'union, le
compilateur réclame son texte. Tester la copie d'erreur. Traduire l'interface
plus tard, le cas échéant.

**Devient plus difficile :** renvoyer une erreur sans l'avoir nommée. C'est
l'objectif, mais cela ralentit l'écriture d'une action nouvelle.

**À revisiter :** `fieldErrors` (§10) quand la validation par champ arrivera ;
le sort des erreurs vraiment imprévues — un code `inattendu` volontairement
unique, jamais une chaîne libre.

## Ce qui a été fait

Option C, parcours par parcours, `ok` conservé.

1. [x] `domain/erreurs.ts` — union `CodeErreur` (81 codes) + catalogue
2. [x] Catalogue testé : tout code a un texte, aucun ne contient de jargon
3. [x] `Resultat` basculé ; `tsc` a listé les sites
4. [x] 11 `actions.ts` migrées, un commit par parcours
5. [x] 24 replis morts supprimés
6. [x] **Trois** `traduire()` locaux absorbés — un troisième dormait dans
       `rejoindre-equipe/`, avec le même repli brut

### Ce que la migration a révélé en chemin

- **Dix-neuf signatures de props redéclaraient `{ ok: boolean; error?: string }`.**
  Ce type est plus large que `Resultat` : `Echec` s'y glisse, `error` y vaut
  toujours `undefined`, et le code se perdait à la frontière. Fermer le serveur
  ne servait à rien tant que l'écran rouvrait dans sa propre signature. C'est le
  défaut le moins visible de tout le chantier.
- **L'écran de publication reniflait le message brut** —
  `res.error?.includes("aucun destinataire")` — pour reconnaître une cause. Une
  reformulation en base aurait suffi à faire disparaître le message précis.
- **Les fuites ne venaient pas toutes de Postgres** : le stockage répondait
  « Payload too large », le SDK d'authentification « MFA challenge failed », et
  `errorRaw` s'affichait sans traduction sur l'écran de connexion.

## Reste à trancher

- **`fieldErrors` du §10** : `saveV2Raise` rend un `champ` typé, mais l'écran de
  configuration n'a ni `<form>` ni attributs `name` — la mise au point sur le
  champ fautif (§15) attend une reprise de cet écran.
- **`ok` ou `success`** : `ok` conservé, 57 usages. À rouvrir si le §10 devient
  une contrainte.

## Hors périmètre de cet ADR

Ces points du document restent ouverts et ne dépendent pas de cette décision :

- création automatique d'une opération à l'onboarding (§22)
- suppression des fichiers Storage (§21)
- `OperationDialog` décoratif, atteignable depuis le menu de la liste (§21)
- `seen_raise_update()` jamais appelé (§29)
