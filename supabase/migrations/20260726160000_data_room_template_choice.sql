-- Créer une data room : AVEC le modèle (arborescence OHADA/UEMOA + checklist de
-- diligence, le comportement actuel) OU de ZÉRO (data room vide, à monter soi-
-- même).
--
-- `create_deal` applique toujours les deux templates. Pour l'option « de zéro »,
-- on crée normalement puis on retire l'arborescence et la checklist — les
-- dossiers viennent d'être créés, ils sont vides, la suppression est propre.
--
-- Ajout d'un 3ᵉ paramètre => la signature change : on DROP l'ancienne version
-- (arité 2) avant de recréer, puis on ré-accorde le grant.
--
-- Ré-exécutable.

drop function if exists public.create_data_room(text, text);

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

  -- create_deal choisit l'org, pose le template OHADA + la checklist, et audite.
  v_deal := public.create_deal(coalesce(nullif(trim(p_name), ''), 'Ma data room'), 'VC', 'USD', null);

  update public.deals set objectif = v_obj where id = v_deal.id
  returning * into v_deal;

  -- « De zéro » : on repart d'une data room vide. On retire la checklist
  -- d'abord (elle référence des dossiers), puis l'arborescence.
  if not p_template then
    delete from public.checklist_items where deal_id = v_deal.id;
    delete from public.folders where deal_id = v_deal.id;
  end if;

  if v_obj = 'levee' then
    insert into public.raises (deal_id, org_id, devise, statut)
    values (v_deal.id, v_deal.org_id, 'USD', 'en_cours');
  end if;

  return v_deal;
end;
$$;

grant execute on function public.create_data_room(text, text, boolean) to authenticated;
