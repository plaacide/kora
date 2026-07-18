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

(sans Docker en local : le faire sur le serveur, il en a un.)

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
