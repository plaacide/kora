-- Calendrier visé de la levée (V2 §5 — chips de l'étape 2 de l'onboarding).
--
-- Un fondateur qui vise Q4 2026 et un autre qui vise « plus tard » ne se
-- préparent pas au même rythme. La maquette demandait cette information dès
-- l'onboarding ; aucune colonne ne l'accueillait, elle se perdait.
--
-- Volontairement du `text` libre et non un enum : les trimestres proposés
-- glissent avec le temps (Q3 2026 aujourd'hui, Q1 2027 dans six mois), et un
-- enum obligerait une migration à chaque glissement.
alter table public.startups
  add column if not exists horizon text;

comment on column public.startups.horizon is
  'Calendrier visé pour la levée : « Q3 2026 », « Q4 2026 », « later »… Renseigné à l''onboarding, modifiable ensuite.';

-- `save_startup` gagne un paramètre. Postgres refuse d'ajouter un paramètre
-- par `create or replace` sans créer une SURCHARGE ambiguë : on droppe et on
-- recrée, ce qui fait perdre le grant — il est donc réémis plus bas
-- (cf. AGENTS.md).
drop function if exists public.save_startup(text, text, text, text, text, bigint, bigint, text);

create function public.save_startup(
  p_name text default null,
  p_country text default null,
  p_sector text default null,
  p_stage text default null,
  p_one_liner text default null,
  p_amount bigint default null,
  p_arr bigint default null,
  p_objectif text default null,
  p_horizon text default null
)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_readiness int;
begin
  if auth.uid() is null then raise exception 'non authentifié'; end if;

  -- Garde-fou : un objectif hors liste est ignoré plutôt que de casser.
  if p_objectif is not null and p_objectif not in ('levee', 'diligence') then
    p_objectif := null;
  end if;

  insert into public.startups as s
    (owner_id, name, country, sector, stage, one_liner, amount_sought_usd, arr_usd, objectif, horizon)
  values (
    auth.uid(), coalesce(p_name, ''), p_country, p_sector, p_stage,
    p_one_liner, p_amount, p_arr, coalesce(p_objectif, 'levee'), p_horizon
  )
  on conflict (owner_id) do update set
    -- nullif : une chaîne vide vaut « non renseigné », pas « efface le nom ».
    name              = coalesce(nullif(excluded.name, ''), s.name),
    country           = coalesce(excluded.country, s.country),
    sector            = coalesce(excluded.sector, s.sector),
    stage             = coalesce(excluded.stage, s.stage),
    one_liner         = coalesce(excluded.one_liner, s.one_liner),
    amount_sought_usd = coalesce(excluded.amount_sought_usd, s.amount_sought_usd),
    arr_usd           = coalesce(excluded.arr_usd, s.arr_usd),
    -- p_objectif absent (mise à jour partielle) => on garde l'objectif existant.
    objectif          = coalesce(p_objectif, s.objectif),
    horizon           = coalesce(p_horizon, s.horizon),
    updated_at        = now();

  -- Readiness indicatif : chaque champ rempli compte. Le calendrier n'entre
  -- PAS dans le calcul : le barème vaut 100 sans lui, et l'y ajouter ferait
  -- baisser le score de tous les comptes existants sans qu'ils aient rien
  -- changé.
  select
    (case when name <> '' then 15 else 0 end)
    + (case when country is not null then 10 else 0 end)
    + (case when sector is not null then 10 else 0 end)
    + (case when stage is not null then 10 else 0 end)
    + (case when one_liner is not null then 15 else 0 end)
    + (case when amount_sought_usd is not null then 15 else 0 end)
    + (case when arr_usd is not null then 15 else 0 end)
  into v_readiness
  from public.startups where owner_id = auth.uid();

  update public.startups set readiness = least(v_readiness, 100)
  where owner_id = auth.uid();
end;
$$;

grant execute on function public.save_startup(text, text, text, text, text, bigint, bigint, text, text) to authenticated;
