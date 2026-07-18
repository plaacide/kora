-- ---------------------------------------------------------------------------
-- Personas : investisseur vs fondateur (onboarding ramifié)
--
-- Jusqu'ici tout nouvel inscrit tombait sur « Créez votre organisation », ce
-- qui n'a aucun sens pour un investisseur. On introduit un type de compte,
-- choisi à l'inscription, et deux parcours d'onboarding distincts.
--
-- Écritures via RPC security definer (règle projet). Lecture de SES propres
-- données sous RLS.
-- ---------------------------------------------------------------------------

do $$ begin
  create type public.account_type as enum ('investor', 'founder');
exception when duplicate_object then null; end $$;

alter table public.profiles
  add column if not exists account_type public.account_type;
alter table public.profiles
  add column if not exists onboarded boolean not null default false;

-- --- Profil investisseur ---------------------------------------------------
create table if not exists public.investor_profiles (
  user_id       uuid primary key references public.profiles(id) on delete cascade,
  investor_type text,
  organisation  text,
  ticket_usd    bigint,
  sectors       text[] not null default '{}',
  geographies   text[] not null default '{}',
  stages        text[] not null default '{}',
  updated_at    timestamptz not null default now()
);

-- --- Fiche startup (fondateur) ---------------------------------------------
create table if not exists public.startups (
  id                uuid primary key default gen_random_uuid(),
  owner_id          uuid not null references public.profiles(id) on delete cascade,
  org_id            uuid references public.organizations(id) on delete set null,
  name              text not null default '',
  country           text,
  sector            text,
  stage             text,
  one_liner         text,
  amount_sought_usd bigint,
  arr_usd           bigint,
  readiness         int not null default 0,
  updated_at        timestamptz not null default now(),
  unique (owner_id)
);

alter table public.investor_profiles enable row level security;
alter table public.startups enable row level security;

drop policy if exists investor_self on public.investor_profiles;
drop policy if exists startup_self on public.startups;

-- Chacun ne lit que ses propres données d'onboarding.
create policy investor_self on public.investor_profiles
  for select using (user_id = auth.uid());
create policy startup_self on public.startups
  for select using (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- RPC d'écriture
-- ---------------------------------------------------------------------------

create or replace function public.set_account_type(p_type text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'non authentifié'; end if;
  update public.profiles
  set account_type = p_type::public.account_type
  where id = auth.uid();
end;
$$;

create or replace function public.save_investor_profile(
  p_type text default null,
  p_org text default null,
  p_ticket bigint default null,
  p_sectors text[] default null,
  p_geographies text[] default null,
  p_stages text[] default null
)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'non authentifié'; end if;
  insert into public.investor_profiles as ip
    (user_id, investor_type, organisation, ticket_usd, sectors, geographies, stages)
  values (
    auth.uid(), p_type, p_org, p_ticket,
    coalesce(p_sectors, '{}'), coalesce(p_geographies, '{}'), coalesce(p_stages, '{}')
  )
  on conflict (user_id) do update set
    investor_type = coalesce(excluded.investor_type, ip.investor_type),
    organisation  = coalesce(excluded.organisation, ip.organisation),
    ticket_usd    = coalesce(excluded.ticket_usd, ip.ticket_usd),
    sectors       = case when p_sectors is null then ip.sectors else excluded.sectors end,
    geographies   = case when p_geographies is null then ip.geographies else excluded.geographies end,
    stages        = case when p_stages is null then ip.stages else excluded.stages end,
    updated_at    = now();
end;
$$;

create or replace function public.save_startup(
  p_name text default null,
  p_country text default null,
  p_sector text default null,
  p_stage text default null,
  p_one_liner text default null,
  p_amount bigint default null,
  p_arr bigint default null
)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_readiness int;
begin
  if auth.uid() is null then raise exception 'non authentifié'; end if;
  insert into public.startups as s
    (owner_id, name, country, sector, stage, one_liner, amount_sought_usd, arr_usd)
  values (
    auth.uid(), coalesce(p_name, ''), p_country, p_sector, p_stage,
    p_one_liner, p_amount, p_arr
  )
  on conflict (owner_id) do update set
    name              = coalesce(excluded.name, s.name),
    country           = coalesce(excluded.country, s.country),
    sector            = coalesce(excluded.sector, s.sector),
    stage             = coalesce(excluded.stage, s.stage),
    one_liner         = coalesce(excluded.one_liner, s.one_liner),
    amount_sought_usd = coalesce(excluded.amount_sought_usd, s.amount_sought_usd),
    arr_usd           = coalesce(excluded.arr_usd, s.arr_usd),
    updated_at        = now();

  -- Readiness indicatif : chaque champ rempli compte.
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

-- Termine l'onboarding : crée l'espace de travail (org) + membership owner,
-- rattache la startup si fondateur, et marque le profil comme onboardé.
create or replace function public.complete_onboarding(p_org_name text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_org uuid;
  v_slug text;
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

  update public.profiles set onboarded = true where id = auth.uid();
  return v_org;
end;
$$;

grant execute on function public.set_account_type(text) to authenticated;
grant execute on function public.save_investor_profile(text, text, bigint, text[], text[], text[]) to authenticated;
grant execute on function public.save_startup(text, text, text, text, text, bigint, bigint) to authenticated;
grant execute on function public.complete_onboarding(text) to authenticated;
