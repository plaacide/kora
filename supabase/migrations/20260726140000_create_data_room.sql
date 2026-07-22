-- Multi-data-rooms : créer une salle (= un deal) avec son objectif.
--
-- Le modèle le supporte déjà (un deal = une data room, chacune son objectif,
-- ses dossiers, ses accès). Il manquait le geste côté fondateur : « Nouvelle
-- data room » qui crée le deal ET fixe son objectif (levée | diligence), en
-- réutilisant `create_deal` (qui applique l'arborescence OHADA + audite).
--
-- Une salle de LEVÉE démarre avec un tour en cours vierge, comme l'onboarding.
--
-- Ré-exécutable.

create or replace function public.create_data_room(
  p_name text,
  p_objectif text default 'levee'
)
returns public.deals
language plpgsql security definer set search_path = public as $$
declare
  v_deal public.deals;
  v_obj  text := case when p_objectif in ('levee', 'diligence') then p_objectif else 'levee' end;
begin
  if auth.uid() is null then raise exception 'non authentifié'; end if;

  -- create_deal choisit l'org de façon déterministe et pose le template OHADA.
  v_deal := public.create_deal(coalesce(nullif(trim(p_name), ''), 'Ma data room'), 'VC', 'USD', null);

  update public.deals set objectif = v_obj where id = v_deal.id
  returning * into v_deal;

  if v_obj = 'levee' then
    insert into public.raises (deal_id, org_id, devise, statut)
    values (v_deal.id, v_deal.org_id, 'USD', 'en_cours');
  end if;

  return v_deal;
end;
$$;

grant execute on function public.create_data_room(text, text) to authenticated;
