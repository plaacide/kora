-- Kora — Phase 1.1 : deals, arborescence indexée, documents, versions, stockage.
-- Ré-exécutable (aucune donnée métier à ce stade).

-- ---------------------------------------------------------------------------
-- Reset
-- ---------------------------------------------------------------------------
drop function if exists public.create_deal(text, text, text, numeric) cascade;
drop function if exists public.create_folder(uuid, uuid, text) cascade;
drop function if exists public.register_document(uuid, uuid, text, text, bigint, text) cascade;
drop function if exists public.reindex_deal(uuid) cascade;
drop table if exists public.document_versions cascade;
drop table if exists public.documents cascade;
drop table if exists public.folders cascade;
drop table if exists public.deals cascade;
drop type if exists public.deal_stage cascade;
drop type if exists public.doc_status cascade;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.deal_stage as enum (
  'sourcing', 'screening', 'due_diligence', 'ic', 'signed', 'passed'
);

create type public.doc_status as enum ('uploading', 'processing', 'ready', 'failed');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table public.deals (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.organizations(id) on delete cascade,
  name            text not null,
  type            text not null default 'VC',
  currency        text not null default 'XOF',
  amount          numeric(20, 2),
  stage           public.deal_stage not null default 'sourcing',
  readiness_score int not null default 0 check (readiness_score between 0 and 100),
  created_by      uuid references public.profiles(id),
  created_at      timestamptz not null default now()
);
create index deals_org_idx on public.deals (org_id, stage);

create table public.folders (
  id         uuid primary key default gen_random_uuid(),
  deal_id    uuid not null references public.deals(id) on delete cascade,
  parent_id  uuid references public.folders(id) on delete cascade,
  name       text not null,
  position   int not null default 1,
  -- Index affiché ("2.3"), recalculé par reindex_deal().
  index_path text not null default '',
  created_at timestamptz not null default now()
);
create index folders_deal_idx on public.folders (deal_id, parent_id, position);

create table public.documents (
  id                 uuid primary key default gen_random_uuid(),
  deal_id            uuid not null references public.deals(id) on delete cascade,
  folder_id          uuid not null references public.folders(id) on delete cascade,
  name               text not null,
  position           int not null default 1,
  index_path         text not null default '',
  status             public.doc_status not null default 'uploading',
  current_version_id uuid,
  created_by         uuid references public.profiles(id),
  created_at         timestamptz not null default now()
);
create index documents_folder_idx on public.documents (folder_id, position);
create index documents_deal_idx on public.documents (deal_id);

create table public.document_versions (
  id          uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  version_no  int not null default 1,
  -- Chemin dans le bucket privé `documents`. Jamais exposé au client.
  storage_key text not null,
  mime_type   text,
  size_bytes  bigint,
  page_count  int,
  sha256      text,
  uploaded_by uuid references public.profiles(id),
  created_at  timestamptz not null default now(),
  unique (document_id, version_no)
);
create index document_versions_doc_idx on public.document_versions (document_id, version_no desc);

alter table public.documents
  add constraint documents_current_version_fk
  foreign key (current_version_id) references public.document_versions(id)
  on delete set null;

-- ---------------------------------------------------------------------------
-- Indexation automatique : "1.", "2.3", "2.3.1"
-- ---------------------------------------------------------------------------
create or replace function public.reindex_deal(p_deal uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  r record;
begin
  -- Dossiers : parcours récursif, index = chemin des positions.
  with recursive tree as (
    select f.id, f.parent_id,
           row_number() over (partition by f.parent_id order by f.position, f.created_at)::text as path
    from public.folders f
    where f.deal_id = p_deal and f.parent_id is null
    union all
    select c.id, c.parent_id,
           t.path || '.' || row_number() over (partition by c.parent_id order by c.position, c.created_at)::text
    from public.folders c
    join tree t on c.parent_id = t.id
    where c.deal_id = p_deal
  )
  update public.folders f
  set index_path = tree.path
  from tree
  where f.id = tree.id;

  -- Documents : index = index du dossier + rang dans le dossier.
  for r in
    select d.id,
           f.index_path || '.' ||
           row_number() over (partition by d.folder_id order by d.position, d.created_at)::text as path
    from public.documents d
    join public.folders f on f.id = d.folder_id
    where d.deal_id = p_deal
  loop
    update public.documents set index_path = r.path where id = r.id;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC métier (seuls points d'écriture, audités)
-- ---------------------------------------------------------------------------
create or replace function public.create_deal(
  p_name text,
  p_type text default 'VC',
  p_currency text default 'XOF',
  p_amount numeric default null
)
returns public.deals
language plpgsql security definer set search_path = public as $$
declare
  v_org  uuid;
  v_deal public.deals;
  v_names text[] := array[
    'Corporate', 'Financier', 'Juridique',
    'RH', 'Propriété intellectuelle', 'Conformité'
  ];
  v_i int;
begin
  select m.org_id into v_org
  from public.memberships m
  where m.user_id = auth.uid()
    and m.role in ('owner', 'admin', 'member')
  limit 1;

  if v_org is null then
    raise exception 'aucune organisation';
  end if;

  insert into public.deals (org_id, name, type, currency, amount, created_by)
  values (v_org, p_name, p_type, p_currency, p_amount, auth.uid())
  returning * into v_deal;

  -- Template de data room par défaut (cf. prototype).
  for v_i in 1 .. array_length(v_names, 1) loop
    insert into public.folders (deal_id, name, position)
    values (v_deal.id, v_names[v_i], v_i);
  end loop;

  perform public.reindex_deal(v_deal.id);
  perform public.write_audit(
    v_org, 'deal.created', 'deal', v_deal.id::text,
    jsonb_build_object('name', p_name, 'type', p_type), v_deal.id
  );

  return v_deal;
end;
$$;

create or replace function public.create_folder(
  p_deal uuid,
  p_parent uuid,
  p_name text
)
returns public.folders
language plpgsql security definer set search_path = public as $$
declare
  v_org    uuid;
  v_pos    int;
  v_folder public.folders;
begin
  select d.org_id into v_org from public.deals d where d.id = p_deal;
  if v_org is null or not public.is_org_member(v_org) then
    raise exception 'accès refusé';
  end if;

  select coalesce(max(position), 0) + 1 into v_pos
  from public.folders
  where deal_id = p_deal and parent_id is not distinct from p_parent;

  insert into public.folders (deal_id, parent_id, name, position)
  values (p_deal, p_parent, p_name, v_pos)
  returning * into v_folder;

  perform public.reindex_deal(p_deal);
  perform public.write_audit(
    v_org, 'folder.created', 'folder', v_folder.id::text,
    jsonb_build_object('name', p_name), p_deal
  );

  select * into v_folder from public.folders where id = v_folder.id;
  return v_folder;
end;
$$;

/**
 * Enregistre un document après upload direct navigateur -> Storage.
 * Le client n'écrit jamais dans `documents` en direct : il passe par ici,
 * ce qui garantit l'indexation et la trace d'audit.
 */
create or replace function public.register_document(
  p_deal uuid,
  p_folder uuid,
  p_name text,
  p_storage_key text,
  p_size bigint default null,
  p_mime text default null
)
returns public.documents
language plpgsql security definer set search_path = public as $$
declare
  v_org uuid;
  v_pos int;
  v_doc public.documents;
  v_ver public.document_versions;
begin
  select d.org_id into v_org from public.deals d where d.id = p_deal;
  if v_org is null or not public.is_org_member(v_org) then
    raise exception 'accès refusé';
  end if;

  if not exists (
    select 1 from public.folders f where f.id = p_folder and f.deal_id = p_deal
  ) then
    raise exception 'dossier invalide';
  end if;

  select coalesce(max(position), 0) + 1 into v_pos
  from public.documents where folder_id = p_folder;

  insert into public.documents (deal_id, folder_id, name, position, status, created_by)
  values (p_deal, p_folder, p_name, v_pos, 'processing', auth.uid())
  returning * into v_doc;

  insert into public.document_versions
    (document_id, version_no, storage_key, size_bytes, mime_type, uploaded_by)
  values (v_doc.id, 1, p_storage_key, p_size, p_mime, auth.uid())
  returning * into v_ver;

  update public.documents
  set current_version_id = v_ver.id, status = 'ready'
  where id = v_doc.id;

  perform public.reindex_deal(p_deal);
  perform public.write_audit(
    v_org, 'document.uploaded', 'document', v_doc.id::text,
    jsonb_build_object('name', p_name, 'size', p_size), p_deal
  );

  select * into v_doc from public.documents where id = v_doc.id;
  return v_doc;
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.deals enable row level security;
alter table public.folders enable row level security;
alter table public.documents enable row level security;
alter table public.document_versions enable row level security;

create policy deal_select on public.deals
  for select using (public.is_org_member(org_id));
create policy deal_update on public.deals
  for update using (public.has_org_role(org_id, array['owner', 'admin', 'member']::public.org_role[]));

create policy folder_select on public.folders
  for select using (exists (
    select 1 from public.deals d where d.id = folders.deal_id and public.is_org_member(d.org_id)
  ));

create policy document_select on public.documents
  for select using (exists (
    select 1 from public.deals d where d.id = documents.deal_id and public.is_org_member(d.org_id)
  ));

-- Les versions portent storage_key : lecture réservée aux membres.
create policy version_select on public.document_versions
  for select using (exists (
    select 1 from public.documents doc
    join public.deals d on d.id = doc.deal_id
    where doc.id = document_versions.document_id and public.is_org_member(d.org_id)
  ));

-- ---------------------------------------------------------------------------
-- Stockage : bucket privé + policies
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do update set public = false;

drop policy if exists "kora_docs_insert" on storage.objects;
drop policy if exists "kora_docs_select" on storage.objects;
drop policy if exists "kora_docs_update" on storage.objects;
drop policy if exists "kora_docs_delete" on storage.objects;

-- Convention de chemin : {org_id}/{deal_id}/{uuid}/{fichier}
-- INSERT autorisé aux membres de l'org (upload direct navigateur).
create policy "kora_docs_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'documents'
    and public.is_org_member(((storage.foldername(name))[1])::uuid)
  );

-- PAS de policy SELECT/UPDATE/DELETE pour `authenticated` :
-- aucun client ne peut télécharger un document depuis le bucket.
-- La lecture passera exclusivement par le serveur (viewer filigrané),
-- qui utilisera la clé service_role. C'est ce qui rend le blocage réel.

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
grant select on public.deals to authenticated;
grant update on public.deals to authenticated;
grant select on public.folders to authenticated;
grant select on public.documents to authenticated;
grant select on public.document_versions to authenticated;

grant execute on function public.create_deal(text, text, text, numeric) to authenticated;
grant execute on function public.create_folder(uuid, uuid, text) to authenticated;
grant execute on function public.register_document(uuid, uuid, text, text, bigint, text) to authenticated;
