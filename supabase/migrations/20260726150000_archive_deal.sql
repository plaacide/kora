-- Archiver une data room : la ranger hors de la liste active, sans la perdre.
--
-- `archived_at` (null = active) plutôt que de surcharger `stage` (qui porte la
-- sémantique de pipeline pour les fonds). Une salle archivée reste consultable
-- et réouvrable ; elle sort simplement du flux courant.
--
-- Ré-exécutable.

alter table public.deals
  add column if not exists archived_at timestamptz;

create or replace function public.set_deal_archived(p_deal uuid, p_archived boolean)
returns public.deals
language plpgsql security definer set search_path = public as $$
declare
  v_org  uuid := public.deal_org_for_write(p_deal);
  v_deal public.deals;
begin
  update public.deals
  set archived_at = case when p_archived then now() else null end
  where id = p_deal
  returning * into v_deal;

  perform public.write_audit(
    v_org,
    case when p_archived then 'deal.archived' else 'deal.unarchived' end,
    'deal', p_deal::text, '{}'::jsonb, p_deal
  );
  return v_deal;
end;
$$;

grant execute on function public.set_deal_archived(uuid, boolean) to authenticated;
