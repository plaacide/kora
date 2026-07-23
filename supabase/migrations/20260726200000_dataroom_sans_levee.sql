-- Découplage — Phase 2 : créer une data room N'OUVRE PLUS de levée d'office.
--
-- Avant, create_data_room insérait une levée en cours si objectif = levée.
-- Désormais une data room est un contenant autonome ; la levée s'ouvre à part
-- (create_raise) et s'attache à la data room choisie. Même signature => simple
-- create or replace du corps.
--
-- Ré-exécutable.

create or replace function public.create_data_room(
  p_name text,
  p_objectif text default 'levee',
  p_template boolean default true
)
returns public.deals
language plpgsql security definer set search_path = public as $$
declare
  v_deal public.deals;
  v_obj  text := case when p_objectif in ('levee', 'diligence') then p_objectif else 'levee' end;
begin
  if auth.uid() is null then raise exception 'non authentifié'; end if;

  v_deal := public.create_deal(coalesce(nullif(trim(p_name), ''), 'Ma data room'), 'VC', 'USD', null);

  update public.deals set objectif = v_obj where id = v_deal.id
  returning * into v_deal;

  if not p_template then
    delete from public.checklist_items where deal_id = v_deal.id;
    delete from public.folders where deal_id = v_deal.id;
  end if;

  -- Plus d'insertion de levée ici : la data room naît sans levée. On en ouvre
  -- une ensuite via create_raise (Phase 2).

  return v_deal;
end;
$$;
