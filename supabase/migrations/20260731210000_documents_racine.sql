-- Un document peut vivre à la RACINE de la data room, sans dossier.
--
-- Décision fondateur : « on peut déplacer le fichier ensuite, ou même le
-- laisser ainsi ». L'écran de dépôt (maquette 14) propose de glisser des
-- fichiers avant d'avoir ouvert un dossier ; jusqu'ici la base l'interdisait,
-- `documents.folder_id` étant NOT NULL.
--
-- Rendre la colonne nullable ne suffit pas : trois mécanismes supposaient
-- qu'un document a toujours un dossier. Ils sont repris ici, dans le même
-- mouvement, faute de quoi un fichier déposé à la racine serait au mieux
-- illisible, au pire visible de qui ne devrait pas.
--
-- Ré-exécutable.

alter table public.documents alter column folder_id drop not null;

-- ---------------------------------------------------------------------------
-- 1. LECTURE — un document racine ne se partage pas
-- ---------------------------------------------------------------------------
-- `can_see_deal` suffit à voir les documents : un invité ayant accès à UN
-- dossier peut donc lister les NOMS de toute l'opération. Le cloisonnement
-- réel se joue au contenu, via `my_permission(folder_id)`.
--
-- Or un accès se pose sur un dossier. Un document sans dossier n'a aucun
-- dossier où poser — ou retirer — un droit : son nom serait exposé à tout
-- invité de l'opération, sans recours. Et le nom suffit à trahir
-- (« Term sheet Sequoia.pdf »).
--
-- La racine devient donc une zone d'équipe : visible des internes seuls. Pour
-- partager une pièce, on la range dans un dossier — ce qui est de toute façon
-- le geste qui permet d'en régler l'accès.
drop policy if exists document_select on public.documents;
create policy document_select on public.documents
  for select using (
    public.can_see_deal(deal_id)
    and (
      folder_id is not null
      or exists (
        select 1 from public.deals d
        where d.id = documents.deal_id and public.is_org_internal(d.org_id)
      )
    )
  );

-- Les versions portent `storage_key`, la clé du fichier dans le bucket privé :
-- le même cloisonnement s'applique, sinon la racine fuirait par ce chemin.
drop policy if exists version_select on public.document_versions;
create policy version_select on public.document_versions
  for select using (exists (
    select 1 from public.documents doc
    where doc.id = document_versions.document_id
      and public.can_see_deal(doc.deal_id)
      and (
        doc.folder_id is not null
        or exists (
          select 1 from public.deals d
          where d.id = doc.deal_id and public.is_org_internal(d.org_id)
        )
      )
  ));

-- ---------------------------------------------------------------------------
-- 2. DROITS — savoir ce qu'on peut faire d'un document racine
-- ---------------------------------------------------------------------------
-- `effective_permission` part du dossier : sans dossier, elle ne retrouve pas
-- l'opération et rend `none`. La visionneuse refuserait donc le document à son
-- propre auteur.
--
-- Cette fonction répond pour un DOCUMENT, quel que soit son rangement. Elle
-- est le point d'entrée à utiliser côté application ; `my_permission` reste
-- valable pour les dossiers.
create or replace function public.my_document_permission(p_doc uuid)
returns public.perm_level
language plpgsql stable security definer set search_path = public as $$
declare
  v_folder uuid;
  v_deal   uuid;
  v_org    uuid;
begin
  select folder_id, deal_id into v_folder, v_deal
  from public.documents where id = p_doc;

  if v_deal is null then return 'none'; end if;

  -- Rangé : la règle habituelle, remontée de l'arborescence comprise.
  if v_folder is not null then
    return public.effective_permission(auth.uid(), v_folder);
  end if;

  -- À la racine : l'équipe interne, et personne d'autre.
  select org_id into v_org from public.deals where id = v_deal;
  if public.has_org_role(v_org, array['owner', 'admin', 'member']::public.org_role[]) then
    return 'edit';
  end if;

  return 'none';
end;
$$;

grant execute on function public.my_document_permission(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. DÉPÔT — accepter l'absence de dossier
-- ---------------------------------------------------------------------------
-- `p_folder` peut désormais être null. Un dossier FOURNI reste vérifié : le
-- passer d'une autre opération doit toujours être refusé.
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

  if p_folder is not null and not exists (
    select 1 from public.folders f where f.id = p_folder and f.deal_id = p_deal
  ) then
    raise exception 'dossier invalide';
  end if;

  -- `is not distinct from` et non `=` : en SQL, `null = null` ne vaut pas
  -- vrai, et le rang des pièces de la racine repartirait de 1 à chaque dépôt.
  select coalesce(max(position), 0) + 1 into v_pos
  from public.documents
  where deal_id = p_deal and folder_id is not distinct from p_folder;

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
-- 4. NUMÉROTATION — ne pas oublier la racine
-- ---------------------------------------------------------------------------
-- La jointure sur `folders` écartait les documents sans dossier : leur
-- `index_path` serait resté vide, et la colonne « # » de la data room aurait
-- affiché un tiret pour toujours. Les pièces racine sont numérotées à plat
-- (« 1 », « 2 »), sans préfixe de dossier — elles n'en ont pas.
create or replace function public.reindex_deal(p_deal uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  r record;
begin
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

  for r in
    select d.id,
           case
             when f.id is null then
               row_number() over (partition by d.folder_id order by d.position, d.created_at)::text
             else
               f.index_path || '.' ||
               row_number() over (partition by d.folder_id order by d.position, d.created_at)::text
           end as path
    from public.documents d
    left join public.folders f on f.id = d.folder_id
    where d.deal_id = p_deal
  loop
    update public.documents set index_path = r.path where id = r.id;
  end loop;
end;
$$;
