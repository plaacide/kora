-- La cohorte NOMMÉE — l'objet que l'onboarding programme crée à l'étape 04.
--
-- `cohort_links` (migration 20260724) suffisait au socle : un lien org-à-org,
-- accepté ou non. Mais un programme ne pense pas en « liens », il pense en
-- « Saison 4 », « Promo Dette 2026 » : une cohorte a un nom, des dates, un
-- objectif et un nombre de places. C'est ce que cette migration ajoute, sans
-- rien retirer.
--
-- CE QUI NE CHANGE PAS, et c'est le cœur : le programme ne voit toujours aucun
-- document. `cohorts` ne référence aucune data room ; elle regroupe des
-- entreprises, pas des pièces. La promesse fondatrice tient parce qu'aucun
-- chemin nouveau ne mène au contenu.
--
-- Une entreprise peut appartenir à PLUSIEURS cohortes (`cohort_members` est
-- n-n) : une même startup peut être dans la Saison 4 d'un accélérateur ET dans
-- son programme Dette. Le rattachement est donc par cohorte, pas par programme.

-- ---------------------------------------------------------------------------
-- La cohorte
-- ---------------------------------------------------------------------------

create table if not exists public.cohorts (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  name        text not null,
  goal        text,                        -- 'leve' | 'dette' | 'conformite' | 'croissance'
  seats       int  not null default 10,    -- palier : dépasser = écran de contact, pas un blocage muet
  starts_on   date,
  ends_on     date,
  archived_at timestamptz,                 -- fige la vitrine, ne révoque rien, n'efface rien
  created_at  timestamptz not null default now()
);

create index if not exists cohorts_org_idx on public.cohorts (org_id);

alter table public.cohorts enable row level security;

-- Seul le programme voit ses cohortes. Une entreprise ne « voit » pas la
-- cohorte en tant qu'objet de pilotage — elle voit le lien qui la concerne
-- (cohort_links), pas la liste des autres membres.
create policy cohorts_select on public.cohorts
  for select using (public.is_org_internal(org_id));

grant select on public.cohorts to authenticated;

-- ---------------------------------------------------------------------------
-- L'appartenance — n-n, révélée à l'acceptation
-- ---------------------------------------------------------------------------

create table if not exists public.cohort_members (
  cohort_id      uuid not null references public.cohorts(id) on delete cascade,
  startup_org_id uuid not null references public.organizations(id) on delete cascade,
  joined_at      timestamptz not null default now(),
  primary key (cohort_id, startup_org_id)
);

create index if not exists cohort_members_startup_idx
  on public.cohort_members (startup_org_id);

alter table public.cohort_members enable row level security;

-- Le programme voit les membres de SES cohortes ; l'entreprise voit ses
-- propres appartenances — jamais celles des autres (fuite de syndication).
create policy cohort_members_select on public.cohort_members
  for select using (
    exists (select 1 from public.cohorts c
            where c.id = cohort_id and public.is_org_internal(c.org_id))
    or public.is_org_internal(startup_org_id)
  );

grant select on public.cohort_members to authenticated;

-- ---------------------------------------------------------------------------
-- L'invitation vise désormais UNE cohorte
-- ---------------------------------------------------------------------------

alter table public.cohort_links
  add column if not exists cohort_id uuid references public.cohorts(id) on delete set null;

-- ---------------------------------------------------------------------------
-- Créer une cohorte (étape 04 de l'onboarding, ou depuis /cohortes)
-- ---------------------------------------------------------------------------

create or replace function public.create_cohort(
  p_name      text,
  p_seats     int  default null,
  p_starts_on date default null,
  p_ends_on   date default null,
  p_goal      text default null
)
returns public.cohorts
language plpgsql security definer set search_path = public as $$
declare
  v_org    uuid;
  v_limit  int;
  v_cohort public.cohorts;
begin
  -- L'organisation où l'appelant DÉCIDE.
  select m.org_id into v_org
  from public.memberships m
  where m.user_id = auth.uid() and m.role in ('owner', 'admin')
  order by m.created_at
  limit 1;

  if v_org is null then raise exception 'accès refusé'; end if;
  if not public.org_active(v_org) then raise exception 'abonnement expiré'; end if;
  if coalesce(trim(p_name), '') = '' then raise exception 'nom requis'; end if;

  -- Le palier par défaut vient de l'organisation (cohort_limit), pas d'un
  -- nombre magique : c'est la même valeur que le reste du produit connaît.
  select cohort_limit into v_limit from public.organizations where id = v_org;

  insert into public.cohorts (org_id, name, seats, starts_on, ends_on, goal)
  values (
    v_org, trim(p_name),
    greatest(coalesce(p_seats, v_limit, 10), 1),
    p_starts_on, p_ends_on, p_goal
  )
  returning * into v_cohort;

  perform public.write_audit(
    v_org, 'cohort.created', 'cohort', v_cohort.id::text,
    jsonb_build_object('name', v_cohort.name)
  );

  return v_cohort;
end;
$$;

grant execute on function
  public.create_cohort(text, int, date, date, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Inviter dans une cohorte précise
-- ---------------------------------------------------------------------------

-- Changement de signature : on ajoute la cible `p_cohort`. AGENTS.md l'impose —
-- « create or replace » ne peut pas changer la forme d'une fonction, il faut la
-- retirer d'abord (ce qui perd le grant, réémis plus bas).
drop function if exists public.invite_to_cohort(text);

create or replace function public.invite_to_cohort(
  p_email  text,
  p_cohort uuid default null
)
returns public.cohort_links
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_org  uuid;
  v_link public.cohort_links;
begin
  select m.org_id into v_org
  from public.memberships m
  where m.user_id = auth.uid() and m.role in ('owner', 'admin')
  order by m.created_at
  limit 1;

  if v_org is null then raise exception 'accès refusé'; end if;
  if not public.org_active(v_org) then raise exception 'abonnement expiré'; end if;

  -- La cohorte, si fournie, doit appartenir au programme appelant.
  if p_cohort is not null and not exists (
    select 1 from public.cohorts c where c.id = p_cohort and c.org_id = v_org
  ) then
    raise exception 'cohorte inconnue';
  end if;

  insert into public.cohort_links (sae_org_id, email, invited_by, cohort_id)
  values (v_org, lower(trim(p_email)), auth.uid(), p_cohort)
  returning * into v_link;

  perform public.write_audit(
    v_org, 'cohort.invited', 'cohort', v_link.id::text,
    jsonb_build_object('email', v_link.email, 'cohort', p_cohort)
  );

  return v_link;
end;
$$;

grant execute on function public.invite_to_cohort(text, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Accepter : rattache aussi à la cohorte visée (si l'invitation en désignait une)
-- ---------------------------------------------------------------------------

create or replace function public.accept_cohort_link(p_token text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_link  public.cohort_links;
  v_org   uuid;
  v_email text;
begin
  if auth.uid() is null then raise exception 'non authentifié'; end if;

  select * into v_link from public.cohort_links where token = p_token;
  if v_link is null then raise exception 'invitation introuvable'; end if;
  if v_link.status = 'revoked' then raise exception 'invitation révoquée'; end if;

  select email into v_email from auth.users where id = auth.uid();
  if lower(v_email) is distinct from v_link.email then
    raise exception 'invitation adressée à une autre adresse';
  end if;

  select m.org_id into v_org
  from public.memberships m
  where m.user_id = auth.uid() and m.role in ('owner', 'admin')
  order by m.created_at
  limit 1;

  if v_org is null then raise exception 'accès refusé'; end if;

  update public.cohort_links
  set startup_org_id = v_org, status = 'accepted', accepted_at = now()
  where id = v_link.id;

  -- Nouveau : matérialiser l'appartenance à la cohorte nommée, si l'invitation
  -- en désignait une. `on conflict` — accepter deux fois ne duplique pas.
  if v_link.cohort_id is not null then
    insert into public.cohort_members (cohort_id, startup_org_id)
    values (v_link.cohort_id, v_org)
    on conflict do nothing;
  end if;

  perform public.write_audit(
    v_link.sae_org_id, 'cohort.accepted', 'cohort', v_link.id::text,
    jsonb_build_object('startup_org', v_org)
  );
  perform public.write_audit(
    v_org, 'cohort.joined', 'cohort', v_link.id::text,
    jsonb_build_object('sae_org', v_link.sae_org_id)
  );

  return v_link.sae_org_id;
end;
$$;

grant execute on function public.accept_cohort_link(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Lire ses cohortes (écran /cohortes) — compteurs, jamais de documents
-- ---------------------------------------------------------------------------

/**
 * La liste des cohortes du programme, avec ce qui se lit sur une carte :
 * places, entreprises rattachées, invitations en attente. Aucun document, par
 * construction — la fonction ne joint jamais `documents` ni `deals`.
 */
create or replace function public.program_cohorts()
returns table (
  id             uuid,
  name           text,
  goal           text,
  seats          int,
  starts_on      date,
  ends_on        date,
  archived_at    timestamptz,
  members_count  bigint,
  pending_count  bigint
)
language sql stable security definer set search_path = public as $$
  select
    c.id, c.name, c.goal, c.seats, c.starts_on, c.ends_on, c.archived_at,
    (select count(*) from public.cohort_members m where m.cohort_id = c.id),
    (select count(*) from public.cohort_links l
       where l.cohort_id = c.id and l.status = 'pending')
  from public.cohorts c
  where public.is_org_internal(c.org_id)
  order by c.archived_at nulls first, c.created_at desc;
$$;

grant execute on function public.program_cohorts() to authenticated;
