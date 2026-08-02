# Résultats des essais en navigateur

**Exécution :** 2 août 2026 · **Cible :** `https://v2.sanza.africa` (recette
déployée) · **Base :** `jourzsgjnutktsrgxkoo`

Ce document rapporte ce qui a **réellement tourné**, pas ce qui devrait
fonctionner. Les artefacts sont dans `evidence/` : rapport HTML, vidéos, traces
et captures de chaque test, y compris ceux qui passent.

---

## Le compte

La suite authentifiée n'avait **jamais tourné** avant aujourd'hui, faute
d'identifiants. Le fondateur ne saisit pas de mot de passe pour authentifier un
agent, et un mot de passe collé dans une conversation y reste.

`e2e/creer-compte-essai.mjs` tranche autrement : il tire le mot de passe au
sort, crée les comptes par l'API d'administration, les écrit dans
`.env.test.local` que git ignore, et ne les affiche jamais. Il refuse toute
cible autre que la recette.

**Deux comptes, parce qu'un seul ne peut pas être dans deux états :**

| | Compte | État |
|---|---|---|
| Installé | `zz-test-e2e@sanza.africa` | Organisation créée, onboarding terminé. SARL sénégalaise en amorçage — choisie pour exercer les variantes du référentiel. |
| Neuf | `zz-test-neuf@sanza.africa` | Aucune organisation. **Détruit et recréé à chaque exécution.** |

Sans le second, les neuf tests du parcours d'onboarding s'ignoraient d'eux-mêmes
— le compte installé y est redirigé vers son poste de pilotage. **Le parcours le
plus critique de la bêta n'était éprouvé nulle part**, et rien ne le signalait.

---

## Le résultat

```text
36 tests · 35 passés · 0 échoué · 2 ignorés
```

*(Première exécution, 2 août : 33 passés et 1 échec, dû à un correctif poussé
mais pas encore déployé. Le déploiement effectué, la suite est au vert.)*

| Projet | Tests | Passés | Échoués | Ignorés |
|---|---:|---:|---:|---:|
| `public` — sans compte | 21 | **21** | 0 | 0 |
| `onboarding` — compte neuf | 7 | **7** | 0 | 0 |
| `chrome-desktop` — compte installé | 6 | 4 | 0 | 2 |
| Ouverture de session (×2) | 2 | 2 | 0 | 0 |

### Ce que couvrent les 21 tests publics

Connexion et ses refus, inscription et ses validations, survie de la saisie
après un échec — **le mot de passe, lui, ne revient jamais du serveur** —, et
les destinations : le formulaire d'inscription vise l'onboarding V2, un
`?suivant=` vide ne fait pas retomber sur la V1, une destination fournie est
respectée.

### Ce que couvrent les 7 tests d'onboarding

Le choix de l'objectif au clic **et au clavier**, l'objectif réellement envoyé,
l'effacement de l'erreur dans l'URL après lecture, la persistance de la saisie
entre étapes, et le fait qu'un champ jamais rempli reste vide.

### Ce que couvrent les 6 tests du poste de pilotage

Le menu du compte — ouverture, fermeture à Échap avec retour du focus,
fermeture au clic extérieur — et la déconnexion, qui ramène à la connexion **de
la V2 et non de la V1**.

---

## L'échec de la première exécution, et sa correction

```text
[onboarding] › un secteur enregistré sous une ancienne liste reste affiché
  locator('select[name="sector"]').locator('option[value="Énergie"]')
  Expected: 1 · Received: 0
```

**Ce n'était pas une régression du produit.** Les options des sélecteurs
n'avaient pas d'attribut `value` : le DOM la déduit du texte — l'écran
fonctionne — mais aucun sélecteur d'attribut ne trouve l'option, et le test
croyait qu'elle avait disparu.

Corrigé et déployé le 2 août. **La suite est au vert depuis.**

Les 2 tests ignorés le restent légitimement : ce sont ceux du bandeau
d'onboarding, que le compte installé ne peut plus atteindre — il y est redirigé
vers son poste de pilotage. Le compte neuf les couvre.

---

## Trois tests avaient vieilli sans qu'on le sache

C'est l'enseignement le plus utile de cette première exécution : **une suite qui
ne tourne jamais pourrit en silence.**

| Test | Ce qui avait changé |
|---|---|
| Bandeau d'onboarding | Il porte trois images depuis qu'on y a ajouté l'aide et la déconnexion. L'assertion visait une image unique et échouait en mode strict. |
| Persistance de la saisie | Le test ne remplissait pas « Forme juridique », devenue obligatoire et sans valeur par défaut. **La validation native du navigateur bloquait l'envoi sans un mot** : la page restait en place et le test attendait une navigation qui ne venait jamais. |
| Valeur hors liste | Voir ci-dessus. |

Le test de persistance vérifie désormais que **la forme juridique est
restituée** — c'était le défaut signalé le 1er août.

---

## L'instabilité, trouvée et corrigée

`limites.spec.ts` échouait une fois sur deux et passait toujours seul. La cause
n'était ni le produit ni les comptes : **`deconnexion.spec.ts` s'exécutait avant
lui, et son dernier test se déconnecte pour de vrai.** La session était donc
invalidée côté serveur, et tout ce qui suivait dans le même projet atterrissait
sur la page de connexion.

L'ordre alphabétique le garantissait — `deconnexion` avant `limites` — et le
rapport accusait le produit là où le coupable était un test voisin.

La déconnexion a désormais **son propre projet**. C'est la seule garantie qui ne
dépende pas du nom des fichiers.

```text
36 tests · 35 passés · 0 échoué · 2 ignorés
```

---

## Ce qui n'est PAS couvert

À dire avant qu'on prenne ce document pour une garantie :

| | Pourquoi |
|---|---|
| **Les limites de plan** | Vérifiées en SQL sous identité authentifiée, **jamais à l'écran**. C'est le plus gros trou. |
| Le dépôt et la lecture de pièces | Aucun test ne téléverse un fichier. |
| Le partage et les accès invités | Aucun test n'ouvre une data room côté destinataire. |
| Le paiement et l'abonnement | Éprouvé une fois à la main le 1er août — pas automatisé. |
| La double authentification | Le compte de test n'en a pas ; la suite échoue si on en pose une. |
| Le mobile | Le projet existe, aucun test `mobile.*` n'est écrit. |

---

## Rejouer

```bash
node e2e/creer-compte-essai.mjs
E2E_BASE_URL=https://v2.sanza.africa npx playwright test
```

Le premier renouvelle les mots de passe et remet le compte neuf à zéro. Sans
lui, les tests d'onboarding se remettraient à s'ignorer dès que l'un d'eux
termine le parcours.
