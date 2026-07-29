-- L'objectif du fondateur cesse d'être replié sur deux valeurs.
--
-- L'onboarding V2 propose QUATRE objectifs — lever en capital, obtenir un
-- financement bancaire, répondre à une institution ou un bailleur, répondre à
-- une diligence — mais `saveV2Objective` n'en enregistrait que deux : tout ce
-- qui n'était pas 'diligence' devenait 'levee'. Un fondateur qui préparait un
-- dossier bancaire était donc traité comme une levée en capital, et sa réponse
-- était perdue au moment même où on la lui demandait.
--
-- La migration d'origine (20260726090000) annonçait « deux objectifs pour
-- l'instant ». On passe à quatre, aux mêmes endroits : startups.objectif est
-- la réponse du fondateur, deals.objectif est portée par la data room.
--
-- Les valeurs existantes restent valides : rien à reprendre. Les comptes déjà
-- créés gardent 'levee' — on ne peut pas deviner après coup lequel des trois
-- objectifs non-diligence ils avaient choisi, et l'inventer serait pire que
-- l'imprécision.
--
-- Ré-exécutable.

-- ---------------------------------------------------------------------------
-- Contraintes
-- ---------------------------------------------------------------------------
alter table public.startups drop constraint if exists startups_objectif_check;
alter table public.startups add constraint startups_objectif_check
  check (objectif in ('levee', 'dette', 'dfi', 'diligence'));

alter table public.deals drop constraint if exists deals_objectif_check;
alter table public.deals add constraint deals_objectif_check
  check (objectif in ('levee', 'dette', 'dfi', 'diligence'));

comment on column public.startups.objectif is
  'Objectif déclaré à l''onboarding : levee | dette | dfi | diligence.';
comment on column public.deals.objectif is
  'Objectif de la data room, amorcé depuis la startup à sa création.';

-- ---------------------------------------------------------------------------
-- save_startup — même signature, seul le garde-fou s'élargit.
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
     and p_objectif not in ('levee', 'dette', 'dfi', 'diligence') then
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

-- ---------------------------------------------------------------------------
-- create_data_room — même signature, même élargissement.
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
                   when p_objectif in ('levee', 'dette', 'dfi', 'diligence')
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

-- ---------------------------------------------------------------------------
-- complete_onboarding — la levée s'ouvre pour les trois objectifs de
-- financement, pas seulement 'levee'.
--
-- Avant cette migration, 'dette' et 'dfi' étaient enregistrés comme 'levee' et
-- ouvraient donc une ligne dans `raises`. On garde ce comportement à
-- l'identique : corriger l'objectif ne doit pas, au passage, retirer sa levée
-- à un fondateur qui l'avait. Savoir si un dossier bancaire ou un dossier
-- bailleur mérite vraiment une levée est une décision produit distincte.
-- ---------------------------------------------------------------------------
create or replace function public.complete_onboarding(
  p_org_name text,
  p_create_room boolean default true
)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_org uuid;
  v_slug text;
  v_type text;
  v_startup public.startups;
  v_deal public.deals;
begin
  if auth.uid() is null then raise exception 'non authentifié'; end if;

  -- Idempotent : si l'utilisateur a déjà une org, on la réutilise.
  select m.org_id into v_org
  from public.memberships m where m.user_id = auth.uid() limit 1;

  if v_org is null then
    v_slug := public.slugify(coalesce(nullif(trim(p_org_name), ''), 'espace')) || '-' ||
              substr(gen_random_uuid()::text, 1, 6);
    insert into public.organizations (name, slug)
    values (coalesce(nullif(trim(p_org_name), ''), 'Mon espace'), v_slug)
    returning id into v_org;

    insert into public.memberships (user_id, org_id, role)
    values (auth.uid(), v_org, 'owner');

    perform public.write_audit(v_org, 'org.created', 'organization', v_org::text,
      jsonb_build_object('name', p_org_name), null);
  end if;

  -- Rattache la startup du fondateur à son org.
  update public.startups set org_id = v_org
  where owner_id = auth.uid() and org_id is null;

  select account_type::text into v_type from public.profiles where id = auth.uid();

  if v_type = 'founder' and coalesce(p_create_room, true) then
    select * into v_startup from public.startups where owner_id = auth.uid();

    -- Idempotent : on ne crée la salle que si l'espace est encore vide.
    if v_startup.id is not null
       and not exists (select 1 from public.deals where org_id = v_org) then
      -- Montant en USD (cf. amount_sought_usd), pas la valeur par défaut XOF.
      v_deal := public.create_deal(
        coalesce(nullif(v_startup.name, ''), nullif(trim(p_org_name), ''), 'Ma data room'),
        'VC',
        'USD',
        v_startup.amount_sought_usd
      );

      -- La salle hérite de l'objectif choisi à l'onboarding.
      update public.deals set objectif = coalesce(v_startup.objectif, 'levee')
      where id = v_deal.id;

      -- Un objectif de financement => la levée existe VRAIMENT, avec le
      -- montant saisi. Une diligence n'en ouvre pas.
      if coalesce(v_startup.objectif, 'levee') in ('levee', 'dette', 'dfi') then
        insert into public.raises (
          deal_id, org_id, name, montant_cible, devise, stade, statut
        ) values (
          v_deal.id, v_org,
          coalesce(nullif(trim(v_startup.stage), ''), 'Première levée'),
          v_startup.amount_sought_usd,
          'USD',
          case trim(v_startup.stage)
            when 'Pré-seed'  then 'pre_seed'
            when 'Seed'      then 'seed'
            when 'Série A'   then 'serie_a'
            when 'Série B+'  then 'serie_b_plus'
            else null
          end,
          'en_cours'
        );
      end if;
    end if;
  end if;

  update public.profiles set onboarded = true where id = auth.uid();
  return v_org;
end;
$$;
