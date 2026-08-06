<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Pièges déjà rencontrés sur Kora (ne pas les refaire)

## Constantes partagées → module NEUTRE, jamais "use client"/"use server"

Exporter autre chose qu'un composant ou une action depuis un module
`"use client"` / `"use server"` casse à l'exécution : Next remplace l'export
par une référence, et la valeur n'est plus utilisable.

- `"use server"` + `export const LEVELS` → `LEVELS.indexOf is not a function`
- `"use client"` + `export const STAGES` importé par un composant serveur →
  `STAGES is not iterable`

**Ni TypeScript ni `next build` ne le détectent** — seul un test réel le
révèle. Les constantes vivent dans `src/lib/*` (`permissions.ts`, `stages.ts`).

## Une FONCTION ne traverse pas la frontière serveur → client

Passer une fonction en `prop` d'un composant serveur vers un composant client
produit un **500 en production**, sans aucune erreur au build ni au typage.

Constaté sur la page d'invitation : le serveur passait
`tooMany: (minutes) => t(...)` pour formater un message. TypeScript l'accepte,
`next build` passe, la page rend en local — et renvoie 500 une fois déployée.

Remède : passer la CHAÎNE brute (le gabarit ICU) et l'interpoler côté client
avec `useTranslations`. Ne franchissent la frontière que des données
sérialisables.

**Rien ne le détecte avant l'exécution en conteneur**, et l'écran fautif peut
être rare — celui-ci ne s'ouvrait qu'après avoir cliqué un lien d'invitation.

## Supabase Storage : la clé d'objet refuse le non-ASCII

`Invalid key: .../Sanza — African dealflow, finally structured.pdf`

Le nom de fichier partait tel quel dans la clé de stockage. Un tiret cadratin,
une apostrophe typographique ou un accent suffisent à faire rejeter l'envoi.

Remède : `cleStockage()` (`src/lib/storage-key.ts`), qui translittère et retire
le non-ASCII **pour la clé seulement**. Le nom AFFICHÉ reste intact — c'est
celui que le fondateur a choisi, et le tronquer serait une perte visible.

Le piège s'était glissé à DEUX endroits : le téléversement initial et
`VersionList.tsx`. Chercher tous les points d'écriture avant de conclure.

## next-intl : pas de point dans les clés

Le point exprime l'imbrication, `"document.page_viewed"` est donc une clé
invalide. Les actions d'audit viennent de la base avec des points → passer par
`actionKey()`, qui les remplace par des underscores.

## PostgREST : relations ambiguës

`documents` et `document_versions` se référencent mutuellement. Sans hint
explicite (`documents!document_versions_document_id_fkey!inner(...)`), la
requête renvoie null.

## Supabase : ne pas réassigner un query builder

`let q = supabase.from(...); if (x) q = supabase.from(...)` →
« Type instantiation is excessively deep ». Construire la requête en une seule
expression (ternaire).

## Postgres : CASE vers un enum

Un `CASE` renvoie du `text` : caster explicitement (`::public.mon_enum`),
sinon erreur 42804.

## `create or replace function` : la signature doit être REPRISE À L'IDENTIQUE

Redéfinir une fonction ne se limite pas à réécrire son corps. Postgres refuse
tout changement de forme par `create or replace` :

- retirer une valeur par défaut → `42P13 cannot remove parameter defaults from
  existing function`
- changer le type de retour → `42P13 cannot change return type of existing
  function`

Dans les deux cas il exige un `DROP FUNCTION` préalable — qui fait perdre les
`grant` au passage, donc il faut les réémettre.

Le piège est qu'on ne recopie pas toujours la signature complète en allant
chercher la fonction : `create_deal` s'écrit
`(p_name text, p_type text default 'VC', p_currency text default 'XOF',
p_amount numeric default null)`. Réécrite sans ses défauts, elle échoue —
alors que le corps, lui, était juste.

Reprendre la signature depuis la DERNIÈRE définition en date : une même
fonction est souvent redéfinie par plusieurs migrations successives, et c'est
la plus récente qui fait foi.

**Rien ne le détecte avant l'exécution** : ni TypeScript, ni `next build`, ni
la relecture du SQL.

## package-lock : le régénérer avec le npm de l'IMAGE, pas celui du Mac

Le Mac tourne sur Node 26 / npm 11 ; l'image Docker sur `node:22` / npm 10.
Les deux ne dédupliquent pas pareil : npm 11 omet l'entrée imbriquée
`next-intl/node_modules/@swc/helpers@0.5.23` que npm 10 exige. Résultat, le
build casse en production avec :

> `npm ci` can only install packages when your package.json and
> package-lock.json are in sync. Missing: @swc/helpers@0.5.23 from lock file

**En local on ne voit rien** : `npm run build` utilise le `node_modules` déjà
installé, alors que le Dockerfile utilise `npm ci`, qui est strict.

Si `npm install` est relancé sur le Mac, il réécrit le lock et recasse le
build. Régénérer alors le lock avec le npm de l'image :

```bash
docker run --rm -v "$PWD":/app -w /app node:22-bookworm-slim \
  npm install --package-lock-only
```

**Sans Docker sur le Mac**, `npx` sait exécuter la bonne version de npm — c'est
le npm qui compte, pas le Node qui l'exécute :

```bash
npx --yes npm@10.9.8 install --package-lock-only
npx --yes npm@10.9.8 ci --dry-run    # doit passer, sinon le build cassera
```

Le `ci --dry-run` est la vérification qui manquait : `npm run build` en local ne
révèle rien, et l'erreur n'apparaît qu'au déploiement. Le lancer après TOUTE
installation de dépendance.

⚠️ Ce piège s'est reproduit le 1er août, en ajoutant Playwright : la consigne
existait déjà ci-dessus et n'a pas été appliquée. Le déploiement a échoué sur
exactement le paquet nommé ici.

## Sortie standalone : les imports construits à l'exécution ne sont pas tracés

`pdfjs` charge son worker par un chemin calculé au runtime. Le traceur de Next
ne le voit pas, donc `pdf.worker.mjs` n'atterrit pas dans `.next/standalone`.
En conteneur, **tout** rendu du viewer échoue alors sur :

> Setting up fake worker failed: Cannot find module
> '/app/node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs'

**En local on ne voit rien** : le `node_modules` complet est présent. D'où
`outputFileTracingIncludes` dans `next.config.ts` (worker + `standard_fonts`).

Corollaire : ne pas écrire `catch {}` muet dans une route. Ces deux `catch`
renvoyaient un 500 générique, et le diagnostic a demandé de rejouer le rendu à
la main dans le conteneur. Journaliser l'erreur.

## Derrière le proxy : `request.url` ne porte PAS le domaine public

L'application écoute sur `0.0.0.0:8080` dans le conteneur, et c'est cette
adresse que porte l'URL de la requête. Une redirection construite sur
`new URL(request.url).origin` envoie donc l'utilisateur vers
`https://0.0.0.0:8080` — injoignable.

**En local on ne voit rien** : l'origine est déjà `http://localhost:3000`.
Constaté en production sur `/auth/confirm`, où un lien de réinitialisation
expiré renvoyait dans le vide.

Toujours passer par `originFromHeaders()` (`src/lib/app-origin.ts`), qui lit
`x-forwarded-host` / `x-forwarded-proto`. Pour tester en local :

```bash
curl -H "x-forwarded-host: app.sanza.africa" -H "x-forwarded-proto: https" ...
```

## Gabarits d'e-mail Supabase : `{{ .ConfirmationURL }}` ne marche PAS ici

Nos routes d'échange de jeton (`/auth/confirm`) attendent le **flux serveur** :
`?token_hash=…&type=…`. Or `{{ .ConfirmationURL }}`, la variable par défaut des
gabarits Supabase, produit un lien vers `/auth/v1/verify?token=…` — un autre
mécanisme, qui n'expose jamais `token_hash`. La route reçoit donc une URL sans
paramètres et répond `?erreur=lien_invalide`.

Le lien doit être construit à la main dans le gabarit :

```
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reinitialiser
```

**Aucun test local ne le révèle** : fabriquer un jeton par l'API admin et
appeler la route directement passe les bons paramètres — c'est le gabarit, et
lui seul, qui est en défaut. Il faut envoyer un vrai e-mail et lire le lien.
Sans attendre le clic du fondateur, l'API Resend permet de le relire :

```bash
curl -s "https://api.resend.com/emails/$ID" -H "Authorization: Bearer $RESEND_API_KEY"
```

Corollaire : le sujet (`Subject heading`) se sauvegarde séparément du corps ;
vérifier les deux.

## E-mails d'authentification : c'est NOUS qui les composons

Depuis le Send Email Hook (`/api/auth/email-hook`), Supabase n'envoie plus rien
lui-même : il appelle notre route et nous rendons le message
(`src/lib/email/auth-templates.ts`), en français ou en anglais selon
`profiles.locale`. Les gabarits du tableau de bord Supabase ne sont donc plus la
source de vérité — ne plus y coller de HTML, il serait ignoré.

Deux variables d'environnement sont nécessaires, et leur absence est silencieuse
côté utilisateur : `SEND_EMAIL_HOOK_SECRET` (sinon la route refuse tout, aucun
e-mail ne part) et `EMAIL_FROM` sur le domaine vérifié.

Piège de forme : la valeur de `EMAIL_FROM` contient `<` et `>`. Sans guillemets
dans `.env.local`, `source .env.local` casse le shell (`parse error near \n`) —
dotenv, lui, le tolère, donc le défaut ne se voit qu'en ligne de commande.

## Liens e-mail : PKCE les casse, TOUJOURS `flowType: "implicit"`

`@supabase/ssr` utilise PKCE par défaut. Pour la navigation c'est le bon
choix ; pour un lien envoyé par e-mail, c'est fatal, et de deux façons :

- le jeton arrive préfixé `pkce_…`, et `verifyOtp()` le REJETTE — il attend un
  `token_hash` simple ;
- PKCE dépose un `code_verifier` en cookie dans le navigateur qui a fait la
  demande. Un lien demandé sur l'ordinateur et ouvert sur le téléphone ne peut
  donc pas fonctionner, par construction.

Symptôme observé : « lien expiré » dès le PREMIER clic, aussi bien à la
confirmation d'inscription qu'à la réinitialisation de mot de passe. Le message
trompe — `/auth/confirm` renvoie `erreur=lien_expire` pour toute erreur de
`verifyOtp`, qu'elle soit due à l'expiration, à un jeton déjà utilisé ou, ici,
à un jeton d'un autre type.

Tout appel qui DÉCLENCHE un e-mail (`signUp`, `resetPasswordForEmail`) doit
donc utiliser `createClient({ flowType: "implicit" })`.

⚠️ **Récidive (2026-07-24)** : `@supabase/ssr` 0.12 fait
`auth: { ...options?.auth, flowType: "pkce", … }` — l'option passée est étalée
AVANT le littéral, donc **écrasée en silence**. Le `flowType: "implicit"`
transmis à `createServerClient` ne faisait plus rien, et tous les liens
repartaient en `pkce_`. Le remède est dans `src/lib/supabase/server.ts` : en
implicite, on n'utilise PLUS `@supabase/ssr` mais le client nu
`@supabase/supabase-js` (aucune session/cookie n'est nécessaire pour ces
flux). À re-vérifier à chaque montée de version de `@supabase/ssr` : relire un
e-mail réel via l'API Resend et contrôler l'absence de préfixe `pkce_`.

**Rien ne le détecte avant l'exécution**, et le journal Resend dit
« delivered » : l'e-mail part, il arrive, c'est le lien qu'il contient qui est
inutilisable. Pour vérifier, relire le lien réellement envoyé :

```bash
curl -s "https://api.resend.com/emails/$ID" -H "Authorization: Bearer $RESEND_API_KEY"
```

Un `token_hash=pkce_…` dans l'URL est le signe.

## Resend : le domaine vérifié est la RACINE, pas `send.`

Resend affiche des enregistrements sur `send.sanza.africa` (MX de rebond +
SPF), ce qui laisse croire que c'est là l'identité d'envoi. C'est faux : le
domaine vérifié est `sanza.africa`, et une adresse `@send.sanza.africa` est
rejetée en **403 « domain is not verified »**. Côté Supabase, cela remonte en
`500 Error sending recovery email`, sans aucune trace dans les journaux Resend
puisque le message est refusé dès la remise.

Expéditeur correct : `noreply@sanza.africa`.

## Turbopack : bindings natifs

`@napi-rs/canvas` et `pdfjs-dist` doivent figurer dans
`serverExternalPackages` (next.config.ts), sinon « non-ecmascript placeable
asset ».

## Un champ nommé `focus` casse toute la page

> `Runtime TypeError: domNode.focus is not a function`

Le DOM expose les contrôles nommés d'un formulaire comme **propriétés du
formulaire**, et la propriété l'emporte sur la méthode héritée. Un
`<select name="focus">` remplace donc `form.focus` par un élément. React appelle
`domNode.focus()` en restituant le focus, tombe sur ce `<select>`, et l'écran
entier meurt.

Constaté sur `/v2/onboarding/programme/cohorte`, où le champ était même
`disabled` — donc jamais soumis. Le `name` ne servait à rien et coûtait la page.

Les noms à ne jamais donner à un champ : `focus`, `blur`, `submit`, `reset`,
`requestSubmit`, `checkValidity`, `reportValidity`, `elements`, `length`,
`action`, `method`, `target`. (`name` est sans danger : c'est une chaîne, pas
une méthode — d'où `<input name="name">`, courant et inoffensif.)

**Ni TypeScript ni `next build` ne le détectent** : le JSX est valide, le typage
aussi. Seule l'ouverture de la page le révèle.

## CSP : `img-src` doit lister Supabase pour les images de marque

Le logo d'un programme et le branding d'une Dealroom vivent dans le bucket
public `branding`. La CSP disait `img-src 'self' blob: data:`, sans l'origine
Supabase.

Le symptôme trompe : le fichier se télécharge parfaitement — `200 image/png` en
`curl` comme en `page.request.get()` — la clé est bonne, l'URL est bonne, et le
navigateur affiche une **image cassée**. Rien dans les journaux du serveur, rien
côté Node : le refus est dans le navigateur, et il faut un rendu réel pour le
voir. Une capture d'écran le montre ; une requête HTTP, jamais.

`connect-src` portait déjà l'origine Supabase, ce qui rend l'omission d'autant
plus facile à manquer en relisant `src/lib/security/headers.ts`.

# Règles produit

- **Aucun lien de navigation vers une page inexistante** (`nav.ts`). Ce qui
  n'est pas construit vit sur `/roadmap`.
- **Aucune écriture directe depuis le client** : tout passe par des RPC
  `security definer` qui vérifient les droits ET auditent dans la même
  transaction.
- **Jamais de données inventées dans l'UI** (KPI, sparkline). Si la donnée
  réelle n'existe pas, ne pas afficher l'élément.
- **Vérifier à l'écran**, pas seulement au build : les trois bugs ci-dessus
  passaient tous le build.
