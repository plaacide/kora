-- ==========================================================================
-- Kora — migrations en attente, à exécuter d'un bloc dans le SQL editor.
-- Rejouable sans risque. Ordre : cloisonnement invités, puis accès membre.
-- ==========================================================================

-- ---------------------------------------------------------------------------
-- Cloisonnement des invités PAR DEAL
--
-- Jusqu'ici la lecture d'un deal reposait sur `is_org_member`, qui ne
-- distingue pas un associé d'un invité. Conséquence vérifiée : un investisseur
-- invité sur un deal voyait TOUS les deals de l'organisation — leur nom, leur
-- arborescence, le nom des documents, la checklist et le journal d'audit.
-- Le contenu des fichiers restait protégé, mais l'existence même d'une
-- opération confidentielle fuitait.
--
-- L'invitation est pourtant déjà par deal (`invitations.deal_id`) et se
-- matérialise par des lignes `permissions(deal_id, user_id, folder_id)`.
-- C'est cette réalité que la RLS doit refléter :
--
--   interne (owner/admin/member)  → tous les deals de son organisation
--   invité (guest)                → uniquement les deals où il a une
--                                   permission active
-- ---------------------------------------------------------------------------

-- Idempotent : la migration est rejouable.
drop policy if exists deal_select on public.deals;
drop policy if exists folder_select on public.folders;
drop policy if exists document_select on public.documents;
drop policy if exists version_select on public.document_versions;
drop policy if exists checklist_select on public.checklist_items;
drop policy if exists audit_select on public.audit_log;

-- ---------------------------------------------------------------------------
-- Le prédicat central
-- ---------------------------------------------------------------------------

/**
 * Vrai si l'utilisateur courant a le droit de savoir que ce deal existe.
 *
 * `security definer` : la fonction lit `permissions` et `memberships` en
 * contournant leur propre RLS, ce qui évite une récursion de politiques.
 * Elle ne renvoie qu'un booléen sur le deal demandé — elle n'expose rien.
 *
 * Une permission `none` ou expirée ne donne pas accès : c'est la même règle
 * que `effective_permission`, dupliquée ici volontairement (la RLS ne doit
 * pas dépendre d'une fonction qui, elle, peut être assouplie plus tard).
 */
create or replace function public.can_see_deal(p_deal uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    -- Interne : accès à tous les deals de son organisation.
    select 1 from public.deals d
    where d.id = p_deal and public.is_org_internal(d.org_id)
  ) or exists (
    -- Invité : uniquement là où on lui a ouvert quelque chose.
    select 1 from public.permissions p
    where p.deal_id = p_deal
      and p.user_id = auth.uid()
      and p.level <> 'none'
      and (p.expires_at is null or p.expires_at > now())
  );
$$;

grant execute on function public.can_see_deal(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Politiques réécrites
-- ---------------------------------------------------------------------------

create policy deal_select on public.deals
  for select using (public.can_see_deal(id));

create policy folder_select on public.folders
  for select using (public.can_see_deal(deal_id));

create policy document_select on public.documents
  for select using (public.can_see_deal(deal_id));

create policy checklist_select on public.checklist_items
  for select using (public.can_see_deal(deal_id));

-- `document_versions` porte `storage_key` : c'est la clé du fichier dans le
-- bucket privé. Le même cloisonnement s'applique.
create policy version_select on public.document_versions
  for select using (exists (
    select 1 from public.documents doc
    where doc.id = document_versions.document_id
      and public.can_see_deal(doc.deal_id)
  ));

-- Le journal d'audit reste un outil d'organisation : il raconte qui a fait
-- quoi sur l'ensemble des deals, y compris les entrées sans deal_id
-- (création d'org, sécurité). Un invité n'a rien à y voir — sauf ses propres
-- actions, qui sont sa preuve de ce qu'il a signé et consulté.
create policy audit_select on public.audit_log
  for select using (
    public.is_org_internal(org_id)
    or actor_id = auth.uid()
  );


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
