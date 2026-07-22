-- « Documents clés » CURÉS : le fondateur marque lui-même ses fichiers
-- importants (une étoile), au lieu du proxy « les plus regardés ».
--
-- Ré-exécutable.

alter table public.documents
  add column if not exists is_key boolean not null default false;

create or replace function public.set_document_key(p_doc uuid, p_key boolean)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_deal uuid;
  v_org  uuid;
begin
  select deal_id into v_deal from public.documents where id = p_doc;
  if v_deal is null then raise exception 'document introuvable'; end if;
  v_org := public.deal_org_for_write(v_deal);  -- contrôle d'accès interne

  update public.documents set is_key = p_key where id = p_doc;

  perform public.write_audit(
    v_org, 'document.key_set', 'document', p_doc::text,
    jsonb_build_object('key', p_key), v_deal
  );
end;
$$;

grant execute on function public.set_document_key(uuid, boolean) to authenticated;
