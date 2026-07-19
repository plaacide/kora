-- `create_deal` choisissait l'organisation au hasard.
--
-- Il faisait `limit 1` SANS `order by` : sur une personne appartenant à
-- plusieurs organisations, le deal atterrissait dans l'une d'elles sans qu'on
-- puisse dire laquelle. Sans effet tant qu'on n'en a qu'une — précisément
-- l'hypothèse que le rôle SAE fait sauter.
--
-- Isolé dans sa propre migration : il ne dépend pas des cohortes, et un échec
-- ici ne doit pas empêcher le socle de s'appliquer.

-- `create_deal` prenait `limit 1` SANS `order by` : l'organisation était
-- choisie arbitrairement. Sans effet tant qu'une personne n'appartient qu'à
-- une organisation — précisément l'hypothèse que le rôle SAE fait sauter, un
-- directeur de programme appartenant à la sienne et, potentiellement, à
-- d'autres. Le tri rend le choix reproductible.
-- Les valeurs par défaut sont reprises À L'IDENTIQUE de la définition en
-- place. Les omettre n'est pas neutre : Postgres refuse de les retirer par
-- « create or replace » (42P13, « cannot remove parameter defaults ») et exige
-- un DROP — qui aurait fait perdre les grants au passage.
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
begin
  select m.org_id into v_org
  from public.memberships m
  where m.user_id = auth.uid() and m.role in ('owner', 'admin', 'member')
  order by m.created_at
  limit 1;

  if v_org is null then raise exception 'aucune organisation'; end if;
  if not public.org_active(v_org) then raise exception 'abonnement expiré'; end if;

  insert into public.deals (org_id, name, type, currency, amount, created_by)
  values (v_org, p_name, p_type, p_currency, p_amount, auth.uid())
  returning * into v_deal;

  perform public.apply_dataroom_template(v_deal.id);
  perform public.apply_checklist_template(v_deal.id);

  perform public.write_audit(
    v_org, 'deal.created', 'deal', v_deal.id::text,
    jsonb_build_object('name', p_name, 'type', p_type), v_deal.id
  );

  return v_deal;
end;
$$;

grant execute on function public.create_deal(text, text, text, numeric) to authenticated;
