-- ---------------------------------------------------------------------------
-- `objectif` passe de quatre à six valeurs : + 'audit', + 'autre'.
--
-- POURQUOI. L'écran « Nouvelle opération » proposait six intentions, la base
-- n'en acceptait que quatre. Les deux orphelines — « Préparer un audit » et
-- « Autre demande documentaire » — étaient enregistrées comme 'levee' par une
-- table de correspondance côté application.
--
-- Conséquences observées : le rail annonçait « Levée en capital » sur une
-- opération d'audit, et `complete_onboarding` lui ouvrait une ligne dans
-- `raises` — puisque 'levee' fait partie des objectifs de financement. Le
-- fondateur héritait d'un onglet « Lever » dont son audit n'a que faire.
--
-- C'est exactement le défaut que la migration précédente disait corriger pour
-- 'dette' et 'dfi' : « une étiquette fausse sur l'écran qu'on regarde toute la
-- journée finit par être crue ». Il survivait pour ces deux-là.
--
-- CE QUI NE CHANGE PAS. La levée ne s'ouvre toujours que pour les trois
-- objectifs de FINANCEMENT ('levee', 'dette', 'dfi'). 'diligence' n'en ouvrait
-- pas ; 'audit' et 'autre' n'en ouvriront pas davantage — c'est précisément ce
-- qu'on vient réparer, et `complete_onboarding` n'a donc pas à être touchée.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- Contraintes
-- ---------------------------------------------------------------------------
alter table public.startups drop constraint if exists startups_objectif_check;
alter table public.startups add constraint startups_objectif_check
  check (objectif in ('levee', 'dette', 'dfi', 'diligence', 'audit', 'autre'));

alter table public.deals drop constraint if exists deals_objectif_check;
alter table public.deals add constraint deals_objectif_check
  check (objectif in ('levee', 'dette', 'dfi', 'diligence', 'audit', 'autre'));

comment on column public.startups.objectif is
  'Objectif déclaré à l''onboarding : levee | dette | dfi | diligence | audit | autre.';
comment on column public.deals.objectif is
  'Objectif de la data room, amorcé depuis la startup à sa création.';

-- ---------------------------------------------------------------------------
-- save_startup — le garde-fou accepte les deux nouvelles valeurs.
--
-- Seule cette ligne change : le reste du corps est repris à l'identique de
-- `20260731200000_objectif_quatre_valeurs.sql`, `create or replace` exigeant
-- la fonction entière.
-- ---------------------------------------------------------------------------
create or replace function public.save_startup(
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
  if p_objectif is not null
     and p_objectif not in ('levee', 'dette', 'dfi', 'diligence', 'audit', 'autre') then
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
    horizon           = coalesce(excluded.horizon, s.horizon),
    updated_at        = now();

  select public.startup_readiness(auth.uid()) into v_readiness;
  update public.startups set readiness_score = v_readiness where owner_id = auth.uid();
end;
$$;

grant execute on function public.save_startup(
  text, text, text, text, text, bigint, bigint, text, text
) to authenticated;

-- ---------------------------------------------------------------------------
-- create_data_room — même élargissement.
-- ---------------------------------------------------------------------------
create or replace function public.create_data_room(
  p_name text,
  p_objectif text default 'levee',
  p_template boolean default true
)
returns public.deals
language plpgsql security definer set search_path = public as $$
declare
  v_deal public.deals;
  v_obj  text := case
                   when p_objectif in ('levee', 'dette', 'dfi', 'diligence', 'audit', 'autre')
                   then p_objectif
                   else 'levee'
                 end;
begin
  if auth.uid() is null then raise exception 'non authentifié'; end if;

  v_deal := public.create_deal(coalesce(nullif(trim(p_name), ''), 'Ma data room'), 'VC', 'USD', null);

  update public.deals set objectif = v_obj where id = v_deal.id
  returning * into v_deal;

  if not p_template then
    delete from public.checklist_items where deal_id = v_deal.id;
    delete from public.folders where deal_id = v_deal.id;
  end if;

  return v_deal;
end;
$$;

grant execute on function public.create_data_room(text, text, boolean) to authenticated;
