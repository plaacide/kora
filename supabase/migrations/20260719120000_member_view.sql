-- ---------------------------------------------------------------------------
-- Un membre interne voit les documents de son deal
--
-- `effective_permission` n'accordait l'accès automatique qu'aux rôles
-- owner/admin. Un `member` — l'équipe interne du fonds ou de l'entreprise —
-- tombait donc dans le parcours « invité » : sans droit explicite sur le
-- dossier, il obtenait 'none' et la visionneuse renvoyait « accès refusé »…
-- sur un document qu'il venait lui-même de téléverser.
--
-- Incohérence : partout ailleurs (menu, gardes de pages, is_org_internal) le
-- rôle `member` est traité comme interne. On aligne ici : owner/admin/member
-- voient l'ensemble du deal, en clair (niveau 'edit' = pas de filigrane, comme
-- pour owner/admin). La gestion des droits, elle, reste réservée à
-- owner/admin (set_permission le vérifie séparément).
-- ---------------------------------------------------------------------------

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

  -- Interne (owner/admin/member) : accès complet au deal, sans filigrane.
  if exists (
    select 1 from public.memberships m
    where m.org_id = v_org and m.user_id = p_user
      and m.role in ('owner', 'admin', 'member')
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
