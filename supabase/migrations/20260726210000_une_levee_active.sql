-- Découplage — Phase 3 : UNE levée active par data room (décision fondateur).
--
-- On restaure la règle « une seule levée en cours par data room » (que la
-- Phase 1 avait levée). Ça garde valides les RPC d'édition de la levée
-- (save_raise & co, portées data room + en_cours). Le multi-levées se fait
-- entre data rooms, pas sur une même data room.
--
-- Ré-exécutable.

-- Dédup préventif : si plusieurs levées en cours existaient sur une même data
-- room (créées pendant la Phase 1-2), on garde la plus récente, on clôture les
-- autres — sinon l'index unique échouerait à la création.
update public.raises set statut = 'cloturee', updated_at = now()
where id in (
  select id from (
    select id, row_number() over (partition by deal_id order by created_at desc) as rn
    from public.raises where statut = 'en_cours'
  ) t where t.rn > 1
);

create unique index if not exists raises_une_en_cours_par_deal
  on public.raises (deal_id) where statut = 'en_cours';

-- create_raise refuse si la data room a déjà une levée active : on ouvre une
-- levée sur une data room qui n'en a pas encore.
create or replace function public.create_raise(p_deal uuid, p_name text default null)
returns public.raises
language plpgsql security definer set search_path = public as $$
declare
  v_org    uuid := public.deal_org_for_write(p_deal);
  v_devise text;
  v_raise  public.raises;
begin
  if exists (select 1 from public.raises where deal_id = p_deal and statut = 'en_cours') then
    raise exception 'cette data room a déjà une levée en cours';
  end if;

  select devise into v_devise from public.raises
  where deal_id = p_deal order by created_at desc limit 1;

  insert into public.raises (deal_id, org_id, name, devise, statut)
  values (
    p_deal, v_org,
    coalesce(nullif(trim(p_name), ''), 'Nouvelle levée'),
    coalesce(v_devise, 'USD'), 'en_cours'
  )
  returning * into v_raise;

  perform public.write_audit(
    v_org, 'raise.opened', 'raise', v_raise.id::text,
    jsonb_build_object('name', p_name), p_deal
  );
  return v_raise;
end;
$$;

grant execute on function public.create_raise(uuid, text) to authenticated;
