-- Cycle de vie de la levée : clôturer un tour, en ouvrir un nouveau.
--
-- La table `raises` porte déjà `statut` ('en_cours' | 'cloturee') et un index
-- partiel unique garantissant une seule levée en cours par deal. Il manquait le
-- geste : clôturer la levée courante (elle passe en historique) et ouvrir un
-- nouveau tour (le précédent est clôturé, un tour vierge démarre).
--
-- Ré-exécutable.

-- ---------------------------------------------------------------------------
-- Clôturer la levée en cours (elle rejoint l'historique de financement).
-- ---------------------------------------------------------------------------
create or replace function public.close_raise(p_deal uuid)
returns public.raises
language plpgsql security definer set search_path = public as $$
declare
  v_org   uuid := public.deal_org_for_write(p_deal);
  v_raise public.raises;
begin
  update public.raises set statut = 'cloturee', updated_at = now()
  where deal_id = p_deal and statut = 'en_cours'
  returning * into v_raise;

  if v_raise.id is null then
    raise exception 'aucune levée en cours';
  end if;

  perform public.write_audit(
    v_org, 'raise.closed', 'raise', v_raise.id::text, '{}'::jsonb, p_deal
  );
  return v_raise;
end;
$$;

grant execute on function public.close_raise(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Ouvrir un nouveau tour : REFUSE si une levée est déjà en cours — on ne
-- clôture jamais silencieusement le tour actuel. Le fondateur doit d'abord
-- appeler close_raise (geste explicite). La devise est reprise du dernier tour.
-- ---------------------------------------------------------------------------
create or replace function public.open_raise(p_deal uuid)
returns public.raises
language plpgsql security definer set search_path = public as $$
declare
  v_org    uuid := public.deal_org_for_write(p_deal);
  v_devise text;
  v_raise  public.raises;
begin
  if exists (select 1 from public.raises where deal_id = p_deal and statut = 'en_cours') then
    raise exception 'une levée est déjà en cours — clôturez-la d''abord';
  end if;

  select devise into v_devise from public.raises
  where deal_id = p_deal order by created_at desc limit 1;

  insert into public.raises (deal_id, org_id, devise, statut)
  values (p_deal, v_org, coalesce(v_devise, 'USD'), 'en_cours')
  returning * into v_raise;

  perform public.write_audit(
    v_org, 'raise.opened', 'raise', v_raise.id::text, '{}'::jsonb, p_deal
  );
  return v_raise;
end;
$$;

grant execute on function public.open_raise(uuid) to authenticated;
