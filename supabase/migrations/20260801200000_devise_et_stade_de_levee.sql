-- ---------------------------------------------------------------------------
-- Deux colonnes manquantes à `startups`.
--
-- 1. `devise` n'existait pas. Le champ « Devise » de l'étape Détails était
--    saisi puis jeté : `save_startup` n'avait aucun paramètre pour lui. On
--    demandait une information pour ne rien en faire, et `amount_sought_usd`
--    restait un nombre sans unité.
--
-- 2. `stade_levee` : DEUX questions écrivaient `stage`. « Stade de
--    développement » (étape Entreprise, quatre choix) et « Stade de la levée »
--    (étape Détails, cinq choix). La dernière enregistrée écrasait l'autre, et
--    leurs listes ne coïncident même pas — « Série B », valide pour une levée,
--    n'existe pas côté entreprise. Le défaut est resté invisible tant que rien
--    ne relisait ces champs ; il s'est vu dès que l'onboarding a recommencé à
--    réafficher la saisie.
--
-- `stage` garde son sens d'origine — la maturité de l'entreprise — et n'est PAS
-- migrée : pour les lignes existantes, on ne peut pas savoir laquelle des deux
-- questions a écrit la valeur qui s'y trouve. Deviner reviendrait à inventer.
-- ---------------------------------------------------------------------------
alter table public.startups add column if not exists devise text;
alter table public.startups add column if not exists stade_levee text;

comment on column public.startups.stage is
  'Maturité de l''entreprise — étape « Parlez-nous de votre entreprise ».';
comment on column public.startups.stade_levee is
  'Stade du tour recherché — étape « Détails ». Distinct de `stage`.';
comment on column public.startups.devise is
  'Devise du montant recherché. Sans elle, `amount_sought_usd` ne se lit pas.';

-- ⚠️ Corps repris de `pg_get_functiondef` sur la recette, pas d'un fichier :
-- c'est ce qu'a coûté `objectif_six_valeurs`, qui avait recopié une version
-- appelant une fonction inexistante et cassé tout l'onboarding.
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
  p_stade_levee text default null
)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'non authentifié'; end if;

  if p_objectif is not null
     and p_objectif not in ('levee', 'dette', 'dfi', 'diligence', 'audit', 'autre') then
    p_objectif := null;
  end if;

  insert into public.startups as s
    (owner_id, name, country, sector, stage, one_liner, amount_sought_usd,
     arr_usd, objectif, horizon, devise, stade_levee)
  values (
    auth.uid(), coalesce(p_name, ''), p_country, p_sector, p_stage,
    p_one_liner, p_amount, p_arr, coalesce(p_objectif, 'levee'), p_horizon,
    p_devise, p_stade_levee
  )
  on conflict (owner_id) do update set
    name              = coalesce(nullif(excluded.name, ''), s.name),
    country           = coalesce(excluded.country, s.country),
    sector            = coalesce(excluded.sector, s.sector),
    stage             = coalesce(excluded.stage, s.stage),
    one_liner         = coalesce(excluded.one_liner, s.one_liner),
    amount_sought_usd = coalesce(excluded.amount_sought_usd, s.amount_sought_usd),
    arr_usd           = coalesce(excluded.arr_usd, s.arr_usd),
    objectif          = coalesce(p_objectif, s.objectif),
    horizon           = coalesce(excluded.horizon, s.horizon),
    devise            = coalesce(excluded.devise, s.devise),
    stade_levee       = coalesce(excluded.stade_levee, s.stade_levee),
    updated_at        = now();
end;
$$;

-- L'ancienne signature à neuf paramètres est retirée : la laisser vivre
-- laisserait un appelant oublié écrire sans devise ni stade de levée, en
-- silence, pendant des mois.
drop function if exists public.save_startup(
  text, text, text, text, text, bigint, bigint, text, text
);

grant execute on function public.save_startup(
  text, text, text, text, text, bigint, bigint, text, text, text, text
) to authenticated;
