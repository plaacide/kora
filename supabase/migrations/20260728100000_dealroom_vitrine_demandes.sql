-- Persona Programme — vitrine et demandes d'accès.
-- Modèle §2 de PROGRAMME-COHORTES-DEALROOM.md, moins ce que la migration
-- 20260728090000 (branche feat/accelerateurs) pose déjà : `cohorts`,
-- `cohort_members`, `cohort_links.cohort_id`.
--
-- ⚠️ HORODATAGE VOLONTAIREMENT POSTÉRIEUR à 20260728090000 : deux tables ci-
-- dessous référencent `cohorts`. Appliquée avant, cette migration échouerait.
--
-- LA RÈGLE QUI COMMANDE TOUT LE RESTE (§0.1) : le programme ne lit JAMAIS un
-- document. Rien ici n'ouvre une pièce. Ces tables portent des CONSENTEMENTS,
-- des PUBLICATIONS et des DEMANDES — jamais un accès au contenu. Le seul objet
-- qui accorde un accès reste `permissions`, et il n'est écrit que par la
-- startup ou par un mandat qu'elle a signé.

-- ── Accord de listage ────────────────────────────────────────────────────
-- PAR COHORTE, et c'est une décision produit, pas un détail : accepter d'être
-- dans le dealroom de la Saison 4 n'autorise pas celui du programme Dette.
-- La startup DÉSIGNE aussi la salle que la vitrine pointera : sans salle
-- désignée, elle n'est pas listable — plusieurs salles sans choix explicite
-- laisseraient le programme décider à sa place.
create table if not exists public.listing_consents (
  id              uuid primary key default gen_random_uuid(),
  startup_org_id  uuid not null references public.organizations(id) on delete cascade,
  program_org_id  uuid not null references public.organizations(id) on delete cascade,
  cohort_id       uuid not null references public.cohorts(id) on delete cascade,
  deal_id         uuid references public.deals(id) on delete set null,
  granted_at      timestamptz not null default now(),
  revoked_at      timestamptz,
  unique (startup_org_id, cohort_id)
);

comment on column public.listing_consents.deal_id is
  'Salle DÉSIGNÉE par l''entreprise. Nulle = non listable : le programme ne choisit pas à sa place.';

-- ── Publication en vitrine ───────────────────────────────────────────────
-- Choisie entreprise par entreprise. Dépublier n'est PAS révoquer : on retire
-- une fiche de la devanture, on ne coupe aucun accès déjà accordé.
create table if not exists public.showcase_entries (
  id              uuid primary key default gen_random_uuid(),
  cohort_id       uuid not null references public.cohorts(id) on delete cascade,
  startup_org_id  uuid not null references public.organizations(id) on delete cascade,
  published_at    timestamptz not null default now(),
  unpublished_at  timestamptz,
  unique (cohort_id, startup_org_id)
);

-- ── Mandat ───────────────────────────────────────────────────────────────
-- Par SALLE et révocable. C'est le seul cas où le programme accorde un accès
-- lui-même — parce que l'entreprise l'a explicitement mandaté pour cette
-- salle-là. Sans mandat, il recommande, elle tranche.
create table if not exists public.mandates (
  id              uuid primary key default gen_random_uuid(),
  startup_org_id  uuid not null references public.organizations(id) on delete cascade,
  program_org_id  uuid not null references public.organizations(id) on delete cascade,
  deal_id         uuid not null references public.deals(id) on delete cascade,
  granted_at      timestamptz not null default now(),
  revoked_at      timestamptz,
  unique (startup_org_id, program_org_id, deal_id)
);

-- ── Demandes d'accès ─────────────────────────────────────────────────────
-- Gardés : le reste du fichier est idempotent (`if not exists`), un
-- `create type` nu le rendrait rejouable une seule fois.
do $$ begin
  create type public.access_request_status as enum (
    'pending', 'recommended', 'forwarded', 'dismissed', 'granted', 'refused'
  );
exception when duplicate_object then null; end $$;

create table if not exists public.access_requests (
  id              uuid primary key default gen_random_uuid(),
  investor_user   uuid not null references auth.users(id) on delete cascade,
  program_org_id  uuid not null references public.organizations(id) on delete cascade,
  startup_org_id  uuid not null references public.organizations(id) on delete cascade,
  deal_id         uuid not null references public.deals(id) on delete cascade,
  -- L'instrument vient du filtre actif au moment de la demande : un
  -- investisseur qui lisait la fiche en « dette » ne demande pas la même chose
  -- qu'en « equity », et la startup doit le savoir avant de répondre.
  instrument      text check (instrument in ('equity', 'dette', 'mezzanine')),
  message         text,
  status          public.access_request_status not null default 'pending',
  program_note    text,
  decided_by      uuid references auth.users(id) on delete set null,
  decided_at      timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists access_requests_program_idx
  on public.access_requests (program_org_id, status, created_at desc);
create index if not exists access_requests_startup_idx
  on public.access_requests (startup_org_id, status, created_at desc);

-- ── Questions et suggestions ─────────────────────────────────────────────
-- DEUX OBJETS, pas un chat. Une question attend une réponse et se relance ;
-- une suggestion n'attend rien et passe « lue » au premier affichage. Un fil
-- libre non lu est une dette — les règles §9 le refusent explicitement.
do $$ begin
  create type public.program_thread_type as enum ('question', 'suggestion');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.program_thread_status as enum ('open', 'answered', 'read');
exception when duplicate_object then null; end $$;

create table if not exists public.program_threads (
  id              uuid primary key default gen_random_uuid(),
  program_org_id  uuid not null references public.organizations(id) on delete cascade,
  startup_org_id  uuid not null references public.organizations(id) on delete cascade,
  type            public.program_thread_type not null,
  body            text not null,
  status          public.program_thread_status not null default 'open',
  author          uuid references auth.users(id) on delete set null,
  answered_body   text,
  answered_at     timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists program_threads_startup_idx
  on public.program_threads (startup_org_id, created_at desc);

-- ── Notes privées du programme ───────────────────────────────────────────
-- Privées AU PROGRAMME : l'entreprise ne les voit jamais. C'est pour cela
-- qu'elles sont une table à part et non un champ de `program_threads` — un
-- champ partagé finit toujours par fuiter dans une requête trop large.
create table if not exists public.program_notes (
  id              uuid primary key default gen_random_uuid(),
  program_org_id  uuid not null references public.organizations(id) on delete cascade,
  startup_org_id  uuid not null references public.organizations(id) on delete cascade,
  body            text not null,
  author          uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now()
);

-- ── RLS ──────────────────────────────────────────────────────────────────
alter table public.listing_consents enable row level security;
alter table public.showcase_entries enable row level security;
alter table public.mandates         enable row level security;
alter table public.access_requests  enable row level security;
alter table public.program_threads  enable row level security;
alter table public.program_notes    enable row level security;

-- Le consentement se DONNE et se RETIRE par l'entreprise seule. Le programme
-- le lit — il doit savoir qui il peut lister — mais ne peut pas se l'accorder.
drop policy if exists listing_consents_select on public.listing_consents;
create policy listing_consents_select on public.listing_consents
  for select using (
    public.is_org_member(startup_org_id) or public.is_org_member(program_org_id)
  );
drop policy if exists listing_consents_write on public.listing_consents;
create policy listing_consents_write on public.listing_consents
  for all using (public.is_org_member(startup_org_id))
  with check (public.is_org_member(startup_org_id));

-- La publication appartient au programme ; l'entreprise la LIT, pour savoir
-- où elle apparaît.
drop policy if exists showcase_entries_select on public.showcase_entries;
create policy showcase_entries_select on public.showcase_entries
  for select using (
    public.is_org_member(startup_org_id)
    or exists (
      select 1 from public.cohorts c
      where c.id = cohort_id and public.is_org_member(c.org_id)
    )
  );
drop policy if exists showcase_entries_write on public.showcase_entries;
create policy showcase_entries_write on public.showcase_entries
  for all using (
    exists (select 1 from public.cohorts c
            where c.id = cohort_id and public.is_org_member(c.org_id))
  )
  with check (
    exists (select 1 from public.cohorts c
            where c.id = cohort_id and public.is_org_member(c.org_id))
  );

-- Le mandat se donne par l'entreprise, uniquement.
drop policy if exists mandates_select on public.mandates;
create policy mandates_select on public.mandates
  for select using (
    public.is_org_member(startup_org_id) or public.is_org_member(program_org_id)
  );
drop policy if exists mandates_write on public.mandates;
create policy mandates_write on public.mandates
  for all using (public.is_org_member(startup_org_id))
  with check (public.is_org_member(startup_org_id));

-- Une demande se lit par ses trois parties : l'investisseur qui l'a faite,
-- le programme qui filtre, l'entreprise qui tranche.
drop policy if exists access_requests_select on public.access_requests;
create policy access_requests_select on public.access_requests
  for select using (
    investor_user = auth.uid()
    or public.is_org_member(program_org_id)
    or public.is_org_member(startup_org_id)
  );
drop policy if exists access_requests_insert on public.access_requests;
create policy access_requests_insert on public.access_requests
  for insert with check (investor_user = auth.uid());
-- L'écriture des transitions passe par des RPC auditées (section suivante) :
-- aucune policy d'UPDATE, donc aucun changement de statut sans passer par
-- elles, et donc aucun changement sans trace au journal de l'entreprise.

-- Questions et suggestions : visibles des deux organisations concernées
-- uniquement — jamais d'un tiers.
drop policy if exists program_threads_select on public.program_threads;
create policy program_threads_select on public.program_threads
  for select using (
    public.is_org_member(program_org_id) or public.is_org_member(startup_org_id)
  );
drop policy if exists program_threads_insert on public.program_threads;
create policy program_threads_insert on public.program_threads
  for insert with check (public.is_org_member(program_org_id));

-- Notes privées : le programme, et lui seul. Pas de policy pour l'entreprise,
-- c'est le sens même de « privée ».
drop policy if exists program_notes_all on public.program_notes;
create policy program_notes_all on public.program_notes
  for all using (public.is_org_member(program_org_id))
  with check (public.is_org_member(program_org_id));

-- ── Transitions d'une demande ────────────────────────────────────────────
/**
 * Le programme FILTRE : il recommande, transmet sans avis, ou écarte. Il
 * n'accorde pas — sauf mandat explicite de l'entreprise sur cette salle.
 *
 * Chaque transition s'écrit au journal d'audit de l'ENTREPRISE, pas à celui du
 * programme (§5). C'est elle qui doit pouvoir répondre plus tard à « qui a
 * demandé, ce que le programme a recommandé, qui a tranché, quand ». Un refus
 * se conserve : rien n'est effacé, seul le statut change.
 *
 * Aucune policy d'UPDATE n'existe sur `access_requests` : cette fonction est
 * donc la SEULE voie de changement d'état, et il ne peut pas y avoir de
 * transition non auditée.
 */
create or replace function public.decide_access_request(
  p_request uuid,
  p_decision public.access_request_status,
  p_note text default null
)
returns void
language plpgsql security definer set search_path = public as $$
declare
  r public.access_requests;
  v_mandat boolean;
begin
  if auth.uid() is null then raise exception 'non authentifié'; end if;

  select * into r from public.access_requests where id = p_request;
  if r.id is null then raise exception 'demande introuvable'; end if;

  -- Le programme filtre ; l'entreprise tranche. Chacun ses transitions.
  if p_decision in ('recommended', 'forwarded', 'dismissed') then
    if not public.is_org_member(r.program_org_id) then
      raise exception 'réservé au programme';
    end if;
  elsif p_decision in ('granted', 'refused') then
    -- L'entreprise décide toujours. Le programme ne le peut QUE s'il détient
    -- un mandat vivant sur cette salle précise — c'est la seule brèche, et
    -- elle est ouverte par l'entreprise elle-même.
    select exists (
      select 1 from public.mandates m
      where m.startup_org_id = r.startup_org_id
        and m.program_org_id = r.program_org_id
        and m.deal_id = r.deal_id
        and m.revoked_at is null
    ) into v_mandat;

    if not public.is_org_member(r.startup_org_id)
       and not (v_mandat and public.is_org_member(r.program_org_id)) then
      raise exception 'décision réservée à l''entreprise, sauf mandat';
    end if;
  else
    raise exception 'transition non permise';
  end if;

  update public.access_requests
  set status = p_decision,
      program_note = coalesce(p_note, program_note),
      decided_by = auth.uid(),
      decided_at = now()
  where id = p_request;

  -- Au journal de l'ENTREPRISE. Le programme y figure comme acteur, pas comme
  -- propriétaire de la trace.
  perform public.write_audit(
    r.startup_org_id,
    'access_request.' || p_decision::text,
    'access_request',
    p_request::text,
    jsonb_build_object(
      'instrument', r.instrument,
      'par_le_programme', public.is_org_member(r.program_org_id),
      'sous_mandat', coalesce(v_mandat, false)
    ),
    r.deal_id
  );
end;
$$;

/**
 * Publication de la vitrine. Les DEUX conditions sont vérifiées ICI, pas dans
 * l'écran : consentement actif ET dossier entamé. Une garde côté interface se
 * contourne ; celle-ci, non.
 */
create or replace function public.publish_showcase(
  p_cohort uuid,
  p_startups uuid[]
)
returns int
language plpgsql security definer set search_path = public as $$
declare
  v_org uuid;
  v_n   int := 0;
  s     uuid;
begin
  if auth.uid() is null then raise exception 'non authentifié'; end if;

  select org_id into v_org from public.cohorts where id = p_cohort;
  if v_org is null then raise exception 'cohorte introuvable'; end if;
  if not public.is_org_member(v_org) then raise exception 'réservé au programme'; end if;

  foreach s in array coalesce(p_startups, '{}') loop
    -- Consentement vivant pour CETTE cohorte, avec une salle désignée…
    if not exists (
      select 1 from public.listing_consents lc
      where lc.startup_org_id = s and lc.cohort_id = p_cohort
        and lc.revoked_at is null and lc.deal_id is not null
    ) then continue; end if;

    -- …et dossier entamé : publier une fiche vide dessert l'entreprise autant
    -- que le programme.
    if not exists (
      select 1 from public.documents d
      join public.listing_consents lc
        on lc.deal_id = d.deal_id and lc.startup_org_id = s and lc.cohort_id = p_cohort
    ) then continue; end if;

    insert into public.showcase_entries (cohort_id, startup_org_id)
    values (p_cohort, s)
    on conflict (cohort_id, startup_org_id)
      do update set unpublished_at = null, published_at = now();
    v_n := v_n + 1;
  end loop;

  perform public.write_audit(
    v_org, 'showcase.published', 'cohort', p_cohort::text,
    jsonb_build_object('entreprises', v_n), null
  );
  return v_n;
end;
$$;

grant execute on function public.decide_access_request(uuid, public.access_request_status, text) to authenticated;
grant execute on function public.publish_showcase(uuid, uuid[]) to authenticated;
