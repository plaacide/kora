-- Kora — Phase 1.3 : permissions par dossier, héritées, expirables.
-- Ré-exécutable.

drop function if exists public.set_permission(uuid, uuid, uuid, text, timestamptz) cascade;
drop function if exists public.my_permission(uuid) cascade;
drop function if exists public.effective_permission(uuid, uuid) cascade;
drop table if exists public.permissions cascade;
drop type if exists public.perm_level cascade;

-- Ordre = niveaux croissants du prototype.
create type public.perm_level as enum (
  'none', 'watermark', 'view', 'download', 'edit'
);

create table public.permissions (
  id         uuid primary key default gen_random_uuid(),
  deal_id    uuid not null references public.deals(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  folder_id  uuid not null references public.folders(id) on delete cascade,
  level      public.perm_level not null default 'none',
  expires_at timestamptz,
  granted_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (user_id, folder_id)
);
create index permissions_deal_idx on public.permissions (deal_id, user_id);
create index permissions_folder_idx on public.permissions (folder_id);

/**
 * Niveau effectif d'un utilisateur sur un dossier.
 *
 * Règles :
 *  - owner/admin de l'organisation : 'edit' (ils administrent la room).
 *  - sinon : on remonte l'arborescence depuis le dossier ; la règle la PLUS
 *    SPÉCIFIQUE gagne (un droit posé sur 2.3 prime sur celui posé sur 2).
 *  - une règle expirée est ignorée -> on continue de remonter.
 *  - défaut : 'none'. L'accès est fermé par défaut, jamais ouvert.
 */
create or replace function public.effective_permission(p_user uuid, p_folder uuid)
returns public.perm_level
language plpgsql stable security definer set search_path = public as $$
declare
  v_deal  uuid;
  v_org   uuid;
  v_cur   uuid := p_folder;
  v_found public.perm_level;
  v_guard int := 0;
begin
  select f.deal_id into v_deal from public.folders f where f.id = p_folder;
  if v_deal is null then return 'none'; end if;

  select d.org_id into v_org from public.deals d where d.id = v_deal;

  if exists (
    select 1 from public.memberships m
    where m.org_id = v_org and m.user_id = p_user
      and m.role in ('owner', 'admin')
  ) then
    return 'edit';
  end if;

  -- Garde-fou : arborescence corrompue (cycle) -> on refuse plutôt que boucler.
  while v_cur is not null and v_guard < 50 loop
    v_found := null;

    select p.level into v_found
    from public.permissions p
    where p.user_id = p_user
      and p.folder_id = v_cur
      and (p.expires_at is null or p.expires_at > now())
    limit 1;

    if v_found is not null then return v_found; end if;

    select f.parent_id into v_cur from public.folders f where f.id = v_cur;
    v_guard := v_guard + 1;
  end loop;

  return 'none';
end;
$$;

/** Niveau de l'appelant (utilisé par la visionneuse). */
create or replace function public.my_permission(p_folder uuid)
returns public.perm_level
language sql stable security definer set search_path = public as $$
  select public.effective_permission(auth.uid(), p_folder);
$$;

/** Pose/modifie un droit. Réservé aux owner/admin. Audité. */
create or replace function public.set_permission(
  p_deal uuid,
  p_user uuid,
  p_folder uuid,
  p_level text,
  p_expires timestamptz default null
)
returns public.permissions
language plpgsql security definer set search_path = public as $$
declare
  v_org  uuid;
  v_perm public.permissions;
begin
  select d.org_id into v_org from public.deals d where d.id = p_deal;
  if v_org is null
     or not public.has_org_role(v_org, array['owner', 'admin']::public.org_role[]) then
    raise exception 'accès refusé';
  end if;

  if not exists (
    select 1 from public.folders f where f.id = p_folder and f.deal_id = p_deal
  ) then
    raise exception 'dossier invalide';
  end if;

  insert into public.permissions (deal_id, user_id, folder_id, level, expires_at, granted_by)
  values (p_deal, p_user, p_folder, p_level::public.perm_level, p_expires, auth.uid())
  on conflict (user_id, folder_id) do update
    set level = excluded.level,
        expires_at = excluded.expires_at,
        granted_by = excluded.granted_by
  returning * into v_perm;

  perform public.write_audit(
    v_org, 'permission.set', 'folder', p_folder::text,
    jsonb_build_object('user', p_user, 'level', p_level, 'expires_at', p_expires),
    p_deal
  );

  return v_perm;
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.permissions enable row level security;

create policy permission_select on public.permissions
  for select using (exists (
    select 1 from public.deals d
    where d.id = permissions.deal_id and public.is_org_member(d.org_id)
  ));

-- Aucune écriture directe : tout passe par set_permission() (audité).

grant select on public.permissions to authenticated;
grant execute on function public.my_permission(uuid) to authenticated;
grant execute on function public.set_permission(uuid, uuid, uuid, text, timestamptz) to authenticated;
grant execute on function public.effective_permission(uuid, uuid) to authenticated;
