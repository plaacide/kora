-- Le socle du rôle SAE (structure d'accompagnement).
--
-- Un incubateur, un accélérateur ou un programme de bailleur suit plusieurs
-- startups. Il lui faut savoir où chacune en est de sa préparation — sans
-- devenir membre de leurs organisations.
--
-- LA DÉCISION D'ARCHITECTURE, et tout en découle : le SAE est une
-- ORGANISATION, pas un rôle à l'intérieur de l'organisation de la startup. Le
-- lien se fait d'organisation à organisation.
--
-- Conséquence directe : `can_see_deal` — le prédicat unique qui garde les
-- deals, dossiers, documents, versions et checklists — n'est pas touché. Le
-- SAE ne voit aucun document parce que RIEN ne le lui accorde, et non parce
-- qu'une règle le lui refuse. Une interdiction s'oublie ; une absence de
-- chemin, non.
--
-- L'accès aux documents reste donc possible, mais il passe par le fondateur
-- qui invite les gens du programme comme il invite un investisseur — flux
-- existant, audité, révocable. Le site promet que « le fondateur reste seul
-- maître des accès à sa data room » : cette promesse tient parce que le
-- rattachement à une cohorte ne l'entame en rien.

-- ---------------------------------------------------------------------------
-- Le troisième métier
-- ---------------------------------------------------------------------------

-- Instruction de premier niveau, PAS dans un bloc `do` : Postgres refuse
-- « ALTER TYPE … ADD VALUE » depuis une fonction ou un bloc anonyme
-- (« cannot be executed from a function »). `if not exists` la rend
-- réexécutable sans avoir besoin du bloc.
alter type public.account_type add value if not exists 'sae';

-- ---------------------------------------------------------------------------
-- La cohorte
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_type where typname = 'cohort_status') then
    create type public.cohort_status as enum ('pending', 'accepted', 'revoked');
  end if;
end $$;

/**
 * Rattachement d'une startup à un programme.
 *
 * `startup_org_id` reste null tant que l'invitation n'est pas acceptée : au
 * moment où le programme invite, il ne connaît qu'une adresse e-mail. C'est
 * l'acceptation qui révèle à quelle organisation elle correspond — et elle
 * seule, car c'est le fondateur qui la fait.
 */
create table if not exists public.cohort_links (
  id             uuid primary key default gen_random_uuid(),
  sae_org_id     uuid not null references public.organizations(id) on delete cascade,
  startup_org_id uuid references public.organizations(id) on delete cascade,
  email          text not null,
  -- Jeton non devinable ; c'est la seule chose que l'invité possède.
  token          text not null unique default encode(extensions.gen_random_bytes(32), 'hex'),
  status         public.cohort_status not null default 'pending',
  invited_by     uuid references public.profiles(id),
  created_at     timestamptz not null default now(),
  accepted_at    timestamptz
);

-- Une startup ne se rattache qu'une fois au même programme.
create unique index if not exists cohort_links_unique
  on public.cohort_links (sae_org_id, startup_org_id)
  where startup_org_id is not null;

create index if not exists cohort_links_startup_idx
  on public.cohort_links (startup_org_id);

alter table public.cohort_links enable row level security;

-- Les deux côtés voient le lien : le programme pour piloter sa cohorte, le
-- fondateur pour savoir QUI le suit. Un rattachement invisible à celui qu'il
-- concerne serait une surveillance, pas un accompagnement.
create policy cohort_links_select on public.cohort_links
  for select using (
    public.is_org_internal(sae_org_id)
    or (startup_org_id is not null and public.is_org_internal(startup_org_id))
  );

grant select on public.cohort_links to authenticated;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

/** Le programme suit-il cette organisation ? Lien accepté uniquement. */
create or replace function public.is_sae_of(p_startup_org uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.cohort_links c
    where c.startup_org_id = p_startup_org
      and c.status = 'accepted'
      and public.is_org_internal(c.sae_org_id)
  );
$$;

grant execute on function public.is_sae_of(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Inviter une startup
-- ---------------------------------------------------------------------------

create or replace function public.invite_to_cohort(p_email text)
returns public.cohort_links
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_org  uuid;
  v_link public.cohort_links;
begin
  -- L'organisation du programme : celle où l'appelant décide.
  select m.org_id into v_org
  from public.memberships m
  where m.user_id = auth.uid() and m.role in ('owner', 'admin')
  order by m.created_at
  limit 1;

  if v_org is null then raise exception 'accès refusé'; end if;
  if not public.org_active(v_org) then raise exception 'abonnement expiré'; end if;

  insert into public.cohort_links (sae_org_id, email, invited_by)
  values (v_org, lower(trim(p_email)), auth.uid())
  returning * into v_link;

  perform public.write_audit(
    v_org, 'cohort.invited', 'cohort', v_link.id::text,
    jsonb_build_object('email', v_link.email)
  );

  return v_link;
end;
$$;

-- ---------------------------------------------------------------------------
-- Accepter — c'est le FONDATEUR qui le fait
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

  -- Même garde-fou que pour les invitations investisseur : on n'accepte que ce
  -- qui nous est adressé, sinon un lien fuité rattacherait n'importe qui.
  if lower(v_email) is distinct from v_link.email then
    raise exception 'invitation adressée à une autre adresse';
  end if;

  -- L'organisation où le fondateur DÉCIDE. Un simple membre ne peut pas
  -- engager sa startup dans un programme.
  select m.org_id into v_org
  from public.memberships m
  where m.user_id = auth.uid() and m.role in ('owner', 'admin')
  order by m.created_at
  limit 1;

  if v_org is null then raise exception 'accès refusé'; end if;

  update public.cohort_links
  set startup_org_id = v_org, status = 'accepted', accepted_at = now()
  where id = v_link.id;

  -- Tracé des DEUX côtés : le programme doit voir qui a rejoint, la startup
  -- doit garder trace de ce qu'elle a accepté et quand.
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

-- ---------------------------------------------------------------------------
-- Se détacher — des deux côtés
-- ---------------------------------------------------------------------------

create or replace function public.revoke_cohort_link(p_link uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_link public.cohort_links;
begin
  select * into v_link from public.cohort_links where id = p_link;
  if v_link is null then raise exception 'lien introuvable'; end if;

  -- Le fondateur peut se détacher, le programme peut retirer une startup.
  -- Retenir quelqu'un dans une cohorte qu'il quitte n'aurait aucun sens.
  if not (
    public.is_org_internal(v_link.sae_org_id)
    or (v_link.startup_org_id is not null
        and public.is_org_internal(v_link.startup_org_id))
  ) then
    raise exception 'accès refusé';
  end if;

  update public.cohort_links set status = 'revoked' where id = p_link;

  perform public.write_audit(
    v_link.sae_org_id, 'cohort.revoked', 'cohort', p_link::text,
    jsonb_build_object('startup_org', v_link.startup_org_id)
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Le canal de lecture : ce que le programme voit, et RIEN d'autre
-- ---------------------------------------------------------------------------

/**
 * Le portefeuille du programme.
 *
 * Fonction et non politique RLS : une politique ouvre une TABLE, et il aurait
 * alors fallu se souvenir, à chaque colonne ajoutée à `deals`, qu'un SAE la
 * lit aussi. Ici la liste des colonnes est écrite noir sur blanc — ce qui n'y
 * figure pas ne sort pas.
 *
 * Les pièces manquantes sont incluses : c'est ce qui sépare un tableau de bord
 * d'un cockpit. Un directeur de programme qui lit « 40 % » ne sait pas quoi
 * faire ; « il manque le RCCM et les états financiers » se relance.
 *
 * Les documents, eux, n'apparaissent nulle part : ni nom de fichier, ni clé de
 * stockage, ni version.
 */
create or replace function public.sae_portfolio()
returns table (
  startup_org uuid,
  startup_name text,
  deal_id uuid,
  deal_name text,
  stage text,
  amount numeric,
  currency text,
  readiness int,
  items_total bigint,
  items_done bigint,
  missing text[]
)
language sql stable security definer set search_path = public as $$
  select
    o.id,
    o.name,
    d.id,
    d.name,
    d.stage::text,
    d.amount,
    d.currency,
    d.readiness_score,
    count(ci.id),
    count(ci.id) filter (where ci.status = 'done'),
    (array_agg(ci.label order by ci.position)
       filter (where ci.status <> 'done'))[1:5]
  from public.cohort_links c
  join public.organizations o on o.id = c.startup_org_id
  join public.deals d on d.org_id = o.id
  left join public.checklist_items ci on ci.deal_id = d.id
  where c.status = 'accepted'
    and public.is_org_internal(c.sae_org_id)
  group by o.id, o.name, d.id, d.name, d.stage, d.amount, d.currency,
           d.readiness_score;
$$;

grant execute on function public.invite_to_cohort(text) to authenticated;
grant execute on function public.accept_cohort_link(text) to authenticated;
grant execute on function public.revoke_cohort_link(uuid) to authenticated;
grant execute on function public.sae_portfolio() to authenticated;

-- ---------------------------------------------------------------------------
-- La mine du même acabit, côté base
-- ---------------------------------------------------------------------------

-- `create_deal` prenait `limit 1` SANS `order by` : l'organisation était
-- choisie arbitrairement. Sans effet tant qu'une personne n'appartient qu'à
-- une organisation — précisément l'hypothèse que le rôle SAE fait sauter, un
-- directeur de programme appartenant à la sienne et, potentiellement, à
-- d'autres. Le tri rend le choix reproductible.
create or replace function public.create_deal(
  p_name text, p_type text, p_currency text, p_amount numeric
)
returns public.deals
language plpgsql security definer set search_path = public as $$
declare
  v_org  uuid;
  v_deal public.deals;
begin
  select m.org_id into v_org
  from public.memberships m
  where m.user_id = auth.uid() and m.role in ('owner', 'admin', 'member')
  order by m.created_at
  limit 1;

  if v_org is null then raise exception 'aucune organisation'; end if;
  if not public.org_active(v_org) then raise exception 'abonnement expiré'; end if;

  insert into public.deals (org_id, name, type, currency, amount, created_by)
  values (v_org, p_name, p_type, p_currency, p_amount, auth.uid())
  returning * into v_deal;

  perform public.apply_dataroom_template(v_deal.id);
  perform public.apply_checklist_template(v_deal.id);

  perform public.write_audit(
    v_org, 'deal.created', 'deal', v_deal.id::text,
    jsonb_build_object('name', p_name, 'type', p_type), v_deal.id
  );

  return v_deal;
end;
$$;

grant execute on function public.create_deal(text, text, text, numeric) to authenticated;
