-- ---------------------------------------------------------------------------
-- Jalons de deal + Notes d'IC
--
-- Deux petits modèles internes (côté vendeur) qui alimentent la fiche de deal
-- fidèle au prototype (sections « Jalons » et « Notes d'IC ») et les cartes du
-- dashboard (« à traiter » / prochain jalon). Réservés à l'équipe interne :
-- un investisseur invité ne voit ni le calendrier interne ni les notes du
-- comité. Écritures via RPC security definer, auditées dans la même
-- transaction — comme le reste.
-- ---------------------------------------------------------------------------

-- Rejouable.
drop policy if exists milestone_select on public.milestones;
drop policy if exists ic_note_select on public.ic_notes;

do $$ begin
  create type public.milestone_status as enum ('pending', 'done');
exception when duplicate_object then null; end $$;

-- --- Jalons ----------------------------------------------------------------
create table if not exists public.milestones (
  id         uuid primary key default gen_random_uuid(),
  deal_id    uuid not null references public.deals(id) on delete cascade,
  org_id     uuid not null references public.organizations(id) on delete restrict,
  label      text not null,
  due_date   date,
  status     public.milestone_status not null default 'pending',
  position   int not null default 1,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
create index if not exists milestones_deal_idx
  on public.milestones (deal_id, due_date);

-- --- Notes d'IC ------------------------------------------------------------
create table if not exists public.ic_notes (
  id         uuid primary key default gen_random_uuid(),
  deal_id    uuid not null references public.deals(id) on delete cascade,
  org_id     uuid not null references public.organizations(id) on delete restrict,
  body       text not null,
  author_id  uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
create index if not exists ic_notes_deal_idx
  on public.ic_notes (deal_id, created_at desc);

alter table public.milestones enable row level security;
alter table public.ic_notes  enable row level security;

-- Lecture réservée à l'équipe interne (jamais les invités).
create policy milestone_select on public.milestones
  for select using (public.is_org_internal(org_id));
create policy ic_note_select on public.ic_notes
  for select using (public.is_org_internal(org_id));

-- ---------------------------------------------------------------------------
-- RPC d'écriture (security definer : contrôle interne + audit)
-- ---------------------------------------------------------------------------

create or replace function public.add_milestone(
  p_deal uuid,
  p_label text,
  p_due date default null
)
returns public.milestones
language plpgsql security definer set search_path = public as $$
declare
  v_org uuid;
  v_pos int;
  v_m   public.milestones;
begin
  v_org := public.deal_org_for_write(p_deal);
  if length(trim(coalesce(p_label, ''))) < 2 then
    raise exception 'libellé trop court';
  end if;

  select coalesce(max(position), 0) + 1 into v_pos
  from public.milestones where deal_id = p_deal;

  insert into public.milestones (deal_id, org_id, label, due_date, position, created_by)
  values (p_deal, v_org, trim(p_label), p_due, v_pos, auth.uid())
  returning * into v_m;

  perform public.write_audit(
    v_org, 'milestone.added', 'milestone', v_m.id::text,
    jsonb_build_object('label', left(trim(p_label), 120), 'due', p_due), p_deal
  );
  return v_m;
end;
$$;

create or replace function public.toggle_milestone(p_id uuid)
returns public.milestones
language plpgsql security definer set search_path = public as $$
declare
  v_deal uuid;
  v_org  uuid;
  v_m    public.milestones;
begin
  select deal_id into v_deal from public.milestones where id = p_id;
  if v_deal is null then raise exception 'jalon introuvable'; end if;
  v_org := public.deal_org_for_write(v_deal);

  update public.milestones
  set status = case when status = 'done' then 'pending' else 'done' end
  where id = p_id
  returning * into v_m;

  perform public.write_audit(
    v_org, 'milestone.toggled', 'milestone', p_id::text,
    jsonb_build_object('status', v_m.status), v_deal
  );
  return v_m;
end;
$$;

create or replace function public.delete_milestone(p_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_deal uuid;
  v_org  uuid;
begin
  select deal_id into v_deal from public.milestones where id = p_id;
  if v_deal is null then raise exception 'jalon introuvable'; end if;
  v_org := public.deal_org_for_write(v_deal);

  delete from public.milestones where id = p_id;
  perform public.write_audit(
    v_org, 'milestone.deleted', 'milestone', p_id::text, '{}'::jsonb, v_deal
  );
end;
$$;

create or replace function public.add_ic_note(p_deal uuid, p_body text)
returns public.ic_notes
language plpgsql security definer set search_path = public as $$
declare
  v_org uuid;
  v_n   public.ic_notes;
begin
  v_org := public.deal_org_for_write(p_deal);
  if length(trim(coalesce(p_body, ''))) < 2 then
    raise exception 'note vide';
  end if;

  insert into public.ic_notes (deal_id, org_id, body, author_id)
  values (p_deal, v_org, trim(p_body), auth.uid())
  returning * into v_n;

  perform public.write_audit(
    v_org, 'ic_note.added', 'ic_note', v_n.id::text,
    jsonb_build_object('body', left(trim(p_body), 120)), p_deal
  );
  return v_n;
end;
$$;

create or replace function public.delete_ic_note(p_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_deal uuid;
  v_org  uuid;
begin
  select deal_id into v_deal from public.ic_notes where id = p_id;
  if v_deal is null then raise exception 'note introuvable'; end if;
  v_org := public.deal_org_for_write(v_deal);

  delete from public.ic_notes where id = p_id;
  perform public.write_audit(
    v_org, 'ic_note.deleted', 'ic_note', p_id::text, '{}'::jsonb, v_deal
  );
end;
$$;

grant execute on function public.add_milestone(uuid, text, date) to authenticated;
grant execute on function public.toggle_milestone(uuid) to authenticated;
grant execute on function public.delete_milestone(uuid) to authenticated;
grant execute on function public.add_ic_note(uuid, text) to authenticated;
grant execute on function public.delete_ic_note(uuid) to authenticated;
