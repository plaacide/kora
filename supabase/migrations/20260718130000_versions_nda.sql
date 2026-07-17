-- Kora — versions de documents + NDA consultable. Ré-exécutable.

drop function if exists public.add_document_version(uuid, text, bigint, text) cascade;
drop function if exists public.restore_document_version(uuid, uuid) cascade;
drop function if exists public.my_ndas() cascade;

-- ---------------------------------------------------------------------------
-- Versions
-- ---------------------------------------------------------------------------
/**
 * Ajoute une version à un document existant.
 *
 * Les versions précédentes ne sont JAMAIS écrasées : dans une data room,
 * savoir ce qui a été montré à un investisseur au moment T fait partie de la
 * preuve. On empile, on ne remplace pas.
 */
create or replace function public.add_document_version(
  p_doc uuid,
  p_storage_key text,
  p_size bigint default null,
  p_mime text default null
)
returns public.document_versions
language plpgsql security definer set search_path = public as $$
declare
  v_deal uuid;
  v_org  uuid;
  v_no   int;
  v_ver  public.document_versions;
  v_name text;
begin
  select deal_id, name into v_deal, v_name from public.documents where id = p_doc;
  if v_deal is null then raise exception 'document introuvable'; end if;
  v_org := public.deal_org_for_write(v_deal);

  select coalesce(max(version_no), 0) + 1 into v_no
  from public.document_versions where document_id = p_doc;

  insert into public.document_versions
    (document_id, version_no, storage_key, size_bytes, mime_type, uploaded_by)
  values (p_doc, v_no, p_storage_key, p_size, p_mime, auth.uid())
  returning * into v_ver;

  update public.documents
  set current_version_id = v_ver.id, status = 'ready'
  where id = p_doc;

  perform public.write_audit(
    v_org, 'document.version_added', 'document', p_doc::text,
    jsonb_build_object('name', v_name, 'version', v_no), v_deal
  );

  return v_ver;
end;
$$;

/** Remet une version antérieure comme version courante (sans rien supprimer). */
create or replace function public.restore_document_version(p_doc uuid, p_version uuid)
returns public.documents
language plpgsql security definer set search_path = public as $$
declare
  v_deal uuid;
  v_org  uuid;
  v_no   int;
  v_doc  public.documents;
begin
  select deal_id into v_deal from public.documents where id = p_doc;
  if v_deal is null then raise exception 'document introuvable'; end if;
  v_org := public.deal_org_for_write(v_deal);

  -- Une version ne peut pas être rattachée à un autre document.
  select version_no into v_no
  from public.document_versions
  where id = p_version and document_id = p_doc;
  if v_no is null then raise exception 'version invalide'; end if;

  update public.documents set current_version_id = p_version
  where id = p_doc returning * into v_doc;

  perform public.write_audit(
    v_org, 'document.version_restored', 'document', p_doc::text,
    jsonb_build_object('version', v_no), v_deal
  );

  return v_doc;
end;
$$;

-- ---------------------------------------------------------------------------
-- NDA consultable
-- ---------------------------------------------------------------------------
/**
 * Les NDA que l'appelant peut légitimement voir : les siens, et — s'il est
 * membre interne — ceux signés sur les deals de son organisation.
 *
 * Un signataire doit pouvoir relire ce qu'il a signé : un engagement qu'on ne
 * peut pas relire n'en est pas vraiment un.
 */
create or replace function public.my_ndas()
returns table (
  id             uuid,
  deal_name      text,
  org_name       text,
  signer_name    text,
  signer_email   text,
  signed_at      timestamptz,
  ip_address     text,
  signature_hash text,
  is_mine        boolean
)
language sql stable security definer set search_path = public as $$
  select n.id,
         d.name,
         o.name,
         n.signer_name,
         n.signer_email,
         n.signed_at,
         n.ip_address,
         n.signature_hash,
         (n.signer_user_id = auth.uid())
  from public.ndas n
  join public.deals d on d.id = n.deal_id
  join public.organizations o on o.id = d.org_id
  where n.signer_user_id = auth.uid()
     or public.is_org_internal(d.org_id)
  order by n.signed_at desc;
$$;

grant execute on function public.add_document_version(uuid, text, bigint, text) to authenticated;
grant execute on function public.restore_document_version(uuid, uuid) to authenticated;
grant execute on function public.my_ndas() to authenticated;
