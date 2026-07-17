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
