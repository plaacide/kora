-- ---------------------------------------------------------------------------
-- Checklist de DD personnalisable
--
-- Jusqu'ici la checklist venait d'un modèle figé. L'équipe interne (fonds,
-- advisor, ou startup qui pilote sa levée) doit pouvoir CRÉER ses propres
-- exigences, les renommer et les supprimer — chaque investisseur a sa grille.
--
-- La catégorie reste l'enum existant (ohada / financier / dfi) : ces trois
-- familles couvrent le juridique, le financier et les exigences DFI. Réservé
-- à l'équipe interne, audité, et le score de readiness est recalculé (ajouter
-- une exigence non satisfaite fait légitimement baisser le %).
-- ---------------------------------------------------------------------------

create or replace function public.add_checklist_item(
  p_deal uuid,
  p_category text,
  p_label text,
  p_description text default ''
)
returns public.checklist_items
language plpgsql security definer set search_path = public as $$
declare
  v_org  uuid;
  v_pos  int;
  v_item public.checklist_items;
begin
  v_org := public.deal_org_for_write(p_deal);
  if length(trim(coalesce(p_label, ''))) < 2 then
    raise exception 'intitulé trop court';
  end if;

  -- Contrainte unique (deal, category, label) : on refuse un doublon proprement.
  if exists (
    select 1 from public.checklist_items
    where deal_id = p_deal
      and category = p_category::public.checklist_category
      and label = trim(p_label)
  ) then
    raise exception 'exigence déjà présente';
  end if;

  select coalesce(max(position), 0) + 1 into v_pos
  from public.checklist_items
  where deal_id = p_deal and category = p_category::public.checklist_category;

  insert into public.checklist_items (deal_id, category, label, description, position)
  values (
    p_deal,
    p_category::public.checklist_category,
    trim(p_label),
    coalesce(trim(p_description), ''),
    v_pos
  )
  returning * into v_item;

  perform public.write_audit(
    v_org, 'checklist.item_added', 'checklist', v_item.id::text,
    jsonb_build_object('label', trim(p_label), 'category', p_category), p_deal
  );

  -- Nouvelle exigence à faire -> le dénominateur change, on recalcule.
  perform public.recompute_readiness(p_deal);
  return v_item;
end;
$$;

create or replace function public.update_checklist_item(
  p_item uuid,
  p_label text,
  p_description text default ''
)
returns public.checklist_items
language plpgsql security definer set search_path = public as $$
declare
  v_deal uuid;
  v_org  uuid;
  v_item public.checklist_items;
begin
  select deal_id into v_deal from public.checklist_items where id = p_item;
  if v_deal is null then raise exception 'élément introuvable'; end if;
  v_org := public.deal_org_for_write(v_deal);
  if length(trim(coalesce(p_label, ''))) < 2 then
    raise exception 'intitulé trop court';
  end if;

  update public.checklist_items
  set label = trim(p_label),
      description = coalesce(trim(p_description), '')
  where id = p_item
  returning * into v_item;

  perform public.write_audit(
    v_org, 'checklist.item_updated', 'checklist', p_item::text,
    jsonb_build_object('label', trim(p_label)), v_deal
  );
  return v_item;
end;
$$;

create or replace function public.delete_checklist_item(p_item uuid)
returns int
language plpgsql security definer set search_path = public as $$
declare
  v_deal  uuid;
  v_org   uuid;
  v_label text;
begin
  select deal_id, label into v_deal, v_label
  from public.checklist_items where id = p_item;
  if v_deal is null then raise exception 'élément introuvable'; end if;
  v_org := public.deal_org_for_write(v_deal);

  delete from public.checklist_items where id = p_item;

  perform public.write_audit(
    v_org, 'checklist.item_deleted', 'checklist', p_item::text,
    jsonb_build_object('label', v_label), v_deal
  );

  -- Retirer une exigence change aussi le score.
  return public.recompute_readiness(v_deal);
end;
$$;

grant execute on function public.add_checklist_item(uuid, text, text, text) to authenticated;
grant execute on function public.update_checklist_item(uuid, text, text) to authenticated;
grant execute on function public.delete_checklist_item(uuid) to authenticated;
