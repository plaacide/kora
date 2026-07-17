-- Kora — CRUD métier (deals, dossiers, documents). Ré-exécutable.
--
-- Principe conservé : aucune écriture directe par le client. Tout passe par
-- des RPC qui vérifient les droits ET écrivent l'audit dans la même
-- transaction. Un client ne peut donc pas muter sans laisser de trace.

drop function if exists public.update_deal(uuid, text, text, text, numeric, text, int) cascade;
drop function if exists public.delete_deal(uuid) cascade;
drop function if exists public.set_deal_stage(uuid, text) cascade;
drop function if exists public.rename_folder(uuid, text) cascade;
drop function if exists public.delete_folder(uuid) cascade;
drop function if exists public.rename_document(uuid, text) cascade;
drop function if exists public.delete_document(uuid) cascade;
drop function if exists public.move_document(uuid, uuid) cascade;

-- ---------------------------------------------------------------------------
-- Helper : org d'un deal + contrôle d'accès en écriture
-- ---------------------------------------------------------------------------
create or replace function public.deal_org_for_write(p_deal uuid)
returns uuid
language plpgsql stable security definer set search_path = public as $$
declare
  v_org uuid;
begin
  select d.org_id into v_org from public.deals d where d.id = p_deal;
  if v_org is null then
    raise exception 'deal introuvable';
  end if;
  -- Les invités ne modifient jamais la structure : réservé à l'équipe interne.
  if not public.has_org_role(v_org, array['owner', 'admin', 'member']::public.org_role[]) then
    raise exception 'accès refusé';
  end if;
  return v_org;
end;
$$;

-- ---------------------------------------------------------------------------
-- Deals
-- ---------------------------------------------------------------------------
create or replace function public.update_deal(
  p_deal uuid,
  p_name text default null,
  p_type text default null,
  p_currency text default null,
  p_amount numeric default null,
  p_stage text default null,
  p_readiness int default null
)
returns public.deals
language plpgsql security definer set search_path = public as $$
declare
  v_org  uuid := public.deal_org_for_write(p_deal);
  v_deal public.deals;
begin
  -- coalesce : seuls les champs fournis sont modifiés.
  update public.deals set
    name = coalesce(nullif(trim(p_name), ''), name),
    type = coalesce(nullif(trim(p_type), ''), type),
    currency = coalesce(nullif(trim(p_currency), ''), currency),
    amount = coalesce(p_amount, amount),
    stage = coalesce(p_stage::public.deal_stage, stage),
    readiness_score = coalesce(p_readiness, readiness_score)
  where id = p_deal
  returning * into v_deal;

  perform public.write_audit(
    v_org, 'deal.updated', 'deal', p_deal::text,
    jsonb_strip_nulls(jsonb_build_object(
      'name', p_name, 'type', p_type, 'currency', p_currency,
      'amount', p_amount, 'stage', p_stage, 'readiness', p_readiness
    )),
    p_deal
  );

  return v_deal;
end;
$$;

/** Changement d'étape isolé : c'est l'action du pipeline. */
create or replace function public.set_deal_stage(p_deal uuid, p_stage text)
returns public.deals
language plpgsql security definer set search_path = public as $$
declare
  v_org  uuid := public.deal_org_for_write(p_deal);
  v_old  text;
  v_deal public.deals;
begin
  select stage::text into v_old from public.deals where id = p_deal;

  update public.deals set stage = p_stage::public.deal_stage
  where id = p_deal returning * into v_deal;

  perform public.write_audit(
    v_org, 'deal.stage_changed', 'deal', p_deal::text,
    jsonb_build_object('from', v_old, 'to', p_stage), p_deal
  );

  return v_deal;
end;
$$;

/** Suppression réservée aux owner/admin : elle emporte toute la data room. */
create or replace function public.delete_deal(p_deal uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_org  uuid;
  v_name text;
begin
  select d.org_id, d.name into v_org, v_name from public.deals d where d.id = p_deal;
  if v_org is null then raise exception 'deal introuvable'; end if;

  if not public.has_org_role(v_org, array['owner', 'admin']::public.org_role[]) then
    raise exception 'seuls les administrateurs peuvent supprimer un deal';
  end if;

  -- L'audit est écrit AVANT : la trace doit survivre à la suppression.
  perform public.write_audit(
    v_org, 'deal.deleted', 'deal', p_deal::text,
    jsonb_build_object('name', v_name), null
  );

  delete from public.deals where id = p_deal;
end;
$$;

-- ---------------------------------------------------------------------------
-- Dossiers
-- ---------------------------------------------------------------------------
create or replace function public.rename_folder(p_folder uuid, p_name text)
returns public.folders
language plpgsql security definer set search_path = public as $$
declare
  v_deal   uuid;
  v_org    uuid;
  v_folder public.folders;
begin
  select deal_id into v_deal from public.folders where id = p_folder;
  if v_deal is null then raise exception 'dossier introuvable'; end if;
  v_org := public.deal_org_for_write(v_deal);

  update public.folders set name = trim(p_name)
  where id = p_folder returning * into v_folder;

  perform public.write_audit(
    v_org, 'folder.renamed', 'folder', p_folder::text,
    jsonb_build_object('name', trim(p_name)), v_deal
  );

  return v_folder;
end;
$$;

create or replace function public.delete_folder(p_folder uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_deal uuid;
  v_org  uuid;
  v_name text;
  v_docs int;
begin
  select deal_id, name into v_deal, v_name from public.folders where id = p_folder;
  if v_deal is null then raise exception 'dossier introuvable'; end if;
  v_org := public.deal_org_for_write(v_deal);

  -- Garde-fou : supprimer un dossier plein effacerait des documents en
  -- cascade sans que l'utilisateur en ait conscience.
  select count(*) into v_docs from public.documents where folder_id = p_folder;
  if v_docs > 0 then
    raise exception 'le dossier contient % document(s)', v_docs;
  end if;
  if exists (select 1 from public.folders where parent_id = p_folder) then
    raise exception 'le dossier contient des sous-dossiers';
  end if;

  perform public.write_audit(
    v_org, 'folder.deleted', 'folder', p_folder::text,
    jsonb_build_object('name', v_name), v_deal
  );

  delete from public.folders where id = p_folder;
  perform public.reindex_deal(v_deal);
end;
$$;

-- ---------------------------------------------------------------------------
-- Documents
-- ---------------------------------------------------------------------------
create or replace function public.rename_document(p_doc uuid, p_name text)
returns public.documents
language plpgsql security definer set search_path = public as $$
declare
  v_deal uuid;
  v_org  uuid;
  v_doc  public.documents;
begin
  select deal_id into v_deal from public.documents where id = p_doc;
  if v_deal is null then raise exception 'document introuvable'; end if;
  v_org := public.deal_org_for_write(v_deal);

  update public.documents set name = trim(p_name)
  where id = p_doc returning * into v_doc;

  perform public.write_audit(
    v_org, 'document.renamed', 'document', p_doc::text,
    jsonb_build_object('name', trim(p_name)), v_deal
  );

  return v_doc;
end;
$$;

create or replace function public.move_document(p_doc uuid, p_folder uuid)
returns public.documents
language plpgsql security definer set search_path = public as $$
declare
  v_deal uuid;
  v_org  uuid;
  v_pos  int;
  v_doc  public.documents;
begin
  select deal_id into v_deal from public.documents where id = p_doc;
  if v_deal is null then raise exception 'document introuvable'; end if;
  v_org := public.deal_org_for_write(v_deal);

  -- Un document ne peut pas franchir la frontière d'un deal.
  if not exists (
    select 1 from public.folders f where f.id = p_folder and f.deal_id = v_deal
  ) then
    raise exception 'dossier invalide';
  end if;

  select coalesce(max(position), 0) + 1 into v_pos
  from public.documents where folder_id = p_folder;

  update public.documents set folder_id = p_folder, position = v_pos
  where id = p_doc returning * into v_doc;

  perform public.reindex_deal(v_deal);
  perform public.write_audit(
    v_org, 'document.moved', 'document', p_doc::text,
    jsonb_build_object('folder', p_folder), v_deal
  );

  select * into v_doc from public.documents where id = p_doc;
  return v_doc;
end;
$$;

create or replace function public.delete_document(p_doc uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_deal uuid;
  v_org  uuid;
  v_name text;
begin
  select deal_id, name into v_deal, v_name from public.documents where id = p_doc;
  if v_deal is null then raise exception 'document introuvable'; end if;
  v_org := public.deal_org_for_write(v_deal);

  perform public.write_audit(
    v_org, 'document.deleted', 'document', p_doc::text,
    jsonb_build_object('name', v_name), v_deal
  );

  -- Les objets du bucket sont nettoyés par le serveur (clé privilégiée) :
  -- la RLS ne donne aucun droit de suppression sur storage au client.
  delete from public.documents where id = p_doc;
  perform public.reindex_deal(v_deal);
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
grant execute on function public.update_deal(uuid, text, text, text, numeric, text, int) to authenticated;
grant execute on function public.set_deal_stage(uuid, text) to authenticated;
grant execute on function public.delete_deal(uuid) to authenticated;
grant execute on function public.rename_folder(uuid, text) to authenticated;
grant execute on function public.delete_folder(uuid) to authenticated;
grant execute on function public.rename_document(uuid, text) to authenticated;
grant execute on function public.move_document(uuid, uuid) to authenticated;
grant execute on function public.delete_document(uuid) to authenticated;
