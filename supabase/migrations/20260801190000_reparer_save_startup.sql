-- Réparer `save_startup`, cassée par la migration précédente.
--
-- CE FICHIER A ÉTÉ ÉCRIT APRÈS COUP. Le correctif avait été appliqué
-- directement en base le 1er août pour rétablir l'onboarding en panne, et le
-- fichier n'avait jamais été versionné. Le dépôt ne pouvait donc plus
-- reconstruire la base : rejouer les migrations depuis zéro aurait produit la
-- version CASSÉE de `save_startup`. Corps repris de `pg_get_functiondef` sur
-- `jourzsgjnutktsrgxkoo`, pas d'une reconstruction de mémoire.
--
-- CE QUI S'ÉTAIT PASSÉ. `20260801180000_objectif_six_valeurs.sql` recréait
-- `save_startup` à partir du FICHIER de migration d'origine, et non de la
-- définition réellement en vigueur. Cette version-là appelait
-- `public.startup_readiness(uuid)` et écrivait `readiness_score` — une fonction
-- qui n'existe pas et une colonne qui n'existe pas (la vraie s'appelle
-- `readiness`). Tout l'onboarding répondait « L'enregistrement a échoué ».
--
-- LA RÈGLE QUI EN DÉCOULE, et qui vaut pour toute fonction reprise :
-- lire `pg_get_functiondef`, jamais le fichier. Un fichier dit ce qu'on a
-- voulu écrire un jour ; la base dit ce qui tourne.

create or replace function public.save_startup(
  p_name text default null,
  p_country text default null,
  p_sector text default null,
  p_stage text default null,
  p_one_liner text default null,
  p_amount bigint default null,
  p_arr bigint default null,
  p_objectif text default null,
  p_horizon text default null,
  p_devise text default null,
  p_modalite text default null,
  p_forme_juridique text default null,
  p_numero_immatriculation text default null,
  p_site_web text default null
)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  if auth.uid() is null then raise exception 'non authentifié'; end if;

  -- Un objectif hors des six valeurs connues est ignoré plutôt que refusé :
  -- l'onboarding ne doit pas se bloquer sur une valeur devenue obsolète.
  if p_objectif is not null
     and p_objectif not in ('levee', 'dette', 'dfi', 'diligence', 'audit', 'autre') then
    p_objectif := null;
  end if;

  insert into public.startups as s
    (owner_id, name, country, sector, stage, one_liner, amount_sought_usd,
     arr_usd, objectif, horizon, devise, modalite_financement,
     forme_juridique, numero_immatriculation, site_web)
  values (
    auth.uid(), coalesce(p_name, ''), p_country, p_sector, p_stage,
    p_one_liner, p_amount, p_arr, coalesce(p_objectif, 'levee'), p_horizon,
    p_devise, p_modalite, p_forme_juridique, p_numero_immatriculation, p_site_web
  )
  -- Chaque étape de l'onboarding n'envoie que ses propres champs : `coalesce`
  -- garantit qu'avancer puis revenir ne vide jamais ce qui a déjà été saisi.
  on conflict (owner_id) do update set
    name                   = coalesce(nullif(excluded.name, ''), s.name),
    country                = coalesce(excluded.country, s.country),
    sector                 = coalesce(excluded.sector, s.sector),
    stage                  = coalesce(excluded.stage, s.stage),
    one_liner              = coalesce(excluded.one_liner, s.one_liner),
    amount_sought_usd      = coalesce(excluded.amount_sought_usd, s.amount_sought_usd),
    arr_usd                = coalesce(excluded.arr_usd, s.arr_usd),
    objectif               = coalesce(p_objectif, s.objectif),
    horizon                = coalesce(excluded.horizon, s.horizon),
    devise                 = coalesce(excluded.devise, s.devise),
    modalite_financement   = coalesce(excluded.modalite_financement, s.modalite_financement),
    forme_juridique        = coalesce(excluded.forme_juridique, s.forme_juridique),
    numero_immatriculation = coalesce(excluded.numero_immatriculation, s.numero_immatriculation),
    site_web               = coalesce(excluded.site_web, s.site_web),
    updated_at             = now();
end;
$function$;
