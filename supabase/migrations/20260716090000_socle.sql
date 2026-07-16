-- Kora — migration socle (E1 schéma + RLS multi-tenant, E4 audit immuable)
-- Auth (utilisateurs, mots de passe, 2FA/TOTP) est géré par Supabase Auth (schéma auth).
-- Ce fichier ajoute la couche métier: organisations, membres, et journal d'audit chaîné.

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.org_role as enum ('owner', 'admin', 'member', 'guest');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table public.organizations (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  slug              text not null unique,
  default_currency  text not null default 'XOF',
  branding          jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now()
);

-- Profil applicatif, en miroir de auth.users (1-1).
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text not null default '',
  locale      text not null default 'fr' check (locale in ('fr', 'en')),
  created_at  timestamptz not null default now()
);

create table public.memberships (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  role        public.org_role not null default 'member',
  created_at  timestamptz not null default now(),
  unique (org_id, user_id)
);
create index memberships_user_idx on public.memberships (user_id);
create index memberships_org_idx on public.memberships (org_id);

-- Journal d'audit: append-only, chaîné par hash (par organisation).
create table public.audit_log (
  id            bigint generated always as identity primary key,
  org_id        uuid not null references public.organizations(id) on delete restrict,
  deal_id       uuid,
  actor_id      uuid,
  actor_email   text,
  action        text not null,
  target_type   text,
  target_id     text,
  metadata      jsonb not null default '{}'::jsonb,
  prev_hash     text,
  entry_hash    text not null,
  created_at    timestamptz not null default now()
);
create index audit_log_org_idx on public.audit_log (org_id, id);

-- ---------------------------------------------------------------------------
-- Helpers (SECURITY DEFINER pour éviter la récursion RLS)
-- ---------------------------------------------------------------------------
create or replace function public.is_org_member(p_org uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.memberships m
    where m.org_id = p_org and m.user_id = auth.uid()
  );
$$;

create or replace function public.has_org_role(p_org uuid, p_roles public.org_role[])
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.memberships m
    where m.org_id = p_org and m.user_id = auth.uid() and m.role = any(p_roles)
  );
$$;

create or replace function public.shares_org_with(p_user uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.memberships a
    join public.memberships b on a.org_id = b.org_id
    where a.user_id = auth.uid() and b.user_id = p_user
  );
$$;

create or replace function public.slugify(p_text text)
returns text
language sql immutable as $$
  select trim(both '-' from regexp_replace(lower(coalesce(p_text, '')), '[^a-z0-9]+', '-', 'g'));
$$;

-- ---------------------------------------------------------------------------
-- Audit: écriture chaînée (seul point d'écriture autorisé)
-- ---------------------------------------------------------------------------
create or replace function public.write_audit(
  p_org uuid,
  p_action text,
  p_target_type text default null,
  p_target_id text default null,
  p_metadata jsonb default '{}'::jsonb,
  p_deal uuid default null
)
returns bigint
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_prev    text;
  v_created timestamptz := clock_timestamp();
  v_email   text;
  v_payload text;
  v_hash    text;
  v_id      bigint;
begin
  -- Sérialise la chaîne de cette organisation pour éviter toute course sur prev_hash.
  perform pg_advisory_xact_lock(hashtextextended(p_org::text, 0));

  select entry_hash into v_prev
  from public.audit_log
  where org_id = p_org
  order by id desc
  limit 1;

  select email into v_email from auth.users where id = auth.uid();

  v_payload := coalesce(v_prev, 'GENESIS') || '|' || p_org::text || '|'
            || coalesce(p_deal::text, '') || '|' || coalesce(auth.uid()::text, '') || '|'
            || p_action || '|' || coalesce(p_target_type, '') || '|'
            || coalesce(p_target_id, '') || '|' || p_metadata::text || '|'
            || v_created::text;

  v_hash := encode(extensions.digest(v_payload, 'sha256'), 'hex');

  insert into public.audit_log (
    org_id, deal_id, actor_id, actor_email, action,
    target_type, target_id, metadata, prev_hash, entry_hash, created_at
  ) values (
    p_org, p_deal, auth.uid(), v_email, p_action,
    p_target_type, p_target_id, p_metadata, v_prev, v_hash, v_created
  ) returning id into v_id;

  return v_id;
end;
$$;

-- Vérifie l'intégrité de la chaîne d'une organisation.
create or replace function public.verify_audit_chain(p_org uuid)
returns table (ok boolean, broken_at bigint, total bigint)
language plpgsql stable security definer set search_path = public, extensions as $$
declare
  r          record;
  v_prev     text := null;
  v_payload  text;
  v_hash     text;
  v_broken   bigint := null;
  v_total    bigint := 0;
begin
  for r in
    select * from public.audit_log where org_id = p_org order by id asc
  loop
    v_total := v_total + 1;
    v_payload := coalesce(v_prev, 'GENESIS') || '|' || r.org_id::text || '|'
              || coalesce(r.deal_id::text, '') || '|' || coalesce(r.actor_id::text, '') || '|'
              || r.action || '|' || coalesce(r.target_type, '') || '|'
              || coalesce(r.target_id, '') || '|' || r.metadata::text || '|'
              || r.created_at::text;
    v_hash := encode(extensions.digest(v_payload, 'sha256'), 'hex');
    if v_hash <> r.entry_hash or coalesce(r.prev_hash, '') <> coalesce(v_prev, '') then
      v_broken := r.id;
      exit;
    end if;
    v_prev := r.entry_hash;
  end loop;

  return query select (v_broken is null), v_broken, v_total;
end;
$$;

-- Blocage append-only: aucune modification/suppression, même par le propriétaire.
create or replace function public.audit_log_immutable()
returns trigger language plpgsql as $$
begin
  raise exception 'audit_log est append-only (ni UPDATE ni DELETE autorisés)';
end;
$$;

create trigger audit_log_no_update
  before update or delete on public.audit_log
  for each row execute function public.audit_log_immutable();

-- ---------------------------------------------------------------------------
-- Provisioning: profil auto à l'inscription, création d'organisation
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, locale)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'locale', 'fr')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Crée une organisation et rend l'appelant 'owner', de façon atomique + audit.
create or replace function public.create_organization(p_name text, p_currency text default 'XOF')
returns public.organizations
language plpgsql security definer set search_path = public as $$
declare
  v_org  public.organizations;
  v_slug text;
begin
  if auth.uid() is null then
    raise exception 'non authentifié';
  end if;

  v_slug := public.slugify(p_name);
  if v_slug = '' then v_slug := 'org'; end if;
  v_slug := v_slug || '-' || substr(gen_random_uuid()::text, 1, 6);

  insert into public.organizations (name, slug, default_currency)
  values (p_name, v_slug, p_currency)
  returning * into v_org;

  insert into public.memberships (org_id, user_id, role)
  values (v_org.id, auth.uid(), 'owner');

  perform public.write_audit(
    v_org.id, 'org.created', 'organization', v_org.id::text,
    jsonb_build_object('name', p_name)
  );

  return v_org;
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.memberships enable row level security;
alter table public.audit_log enable row level security;

-- organizations
create policy org_select on public.organizations
  for select using (public.is_org_member(id));
create policy org_update on public.organizations
  for update using (public.has_org_role(id, array['owner', 'admin']::public.org_role[]))
  with check (public.has_org_role(id, array['owner', 'admin']::public.org_role[]));

-- profiles
create policy profile_select on public.profiles
  for select using (id = auth.uid() or public.shares_org_with(id));
create policy profile_insert on public.profiles
  for insert with check (id = auth.uid());
create policy profile_update on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- memberships
create policy membership_select on public.memberships
  for select using (user_id = auth.uid() or public.is_org_member(org_id));
create policy membership_insert on public.memberships
  for insert with check (public.has_org_role(org_id, array['owner', 'admin']::public.org_role[]));
create policy membership_update on public.memberships
  for update using (public.has_org_role(org_id, array['owner', 'admin']::public.org_role[]));
create policy membership_delete on public.memberships
  for delete using (public.has_org_role(org_id, array['owner', 'admin']::public.org_role[]));

-- audit_log: lecture seule pour les membres; aucune écriture directe (via write_audit).
create policy audit_select on public.audit_log
  for select using (public.is_org_member(org_id));

-- ---------------------------------------------------------------------------
-- Grants (PostgREST: rôle authenticated)
-- ---------------------------------------------------------------------------
grant select, update on public.organizations to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.memberships to authenticated;
grant select on public.audit_log to authenticated;

grant execute on function public.create_organization(text, text) to authenticated;
grant execute on function public.verify_audit_chain(uuid) to authenticated;
grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.has_org_role(uuid, public.org_role[]) to authenticated;
grant execute on function public.shares_org_with(uuid) to authenticated;
