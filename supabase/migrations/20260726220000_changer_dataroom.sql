-- Découplage — Phase 4 : changer la data room attachée à une levée.
--
-- set_raise_deal existe déjà (Phase 1). On le durcit : refuser proprement si on
-- déplace une levée EN COURS vers une data room qui a DÉJÀ une levée en cours
-- (règle « une active par data room » ; sinon l'index unique lèverait une
-- erreur brute). Même signature => create or replace.
--
-- Ré-exécutable.

create or replace function public.set_raise_deal(p_raise uuid, p_deal uuid)
returns public.raises
language plpgsql security definer set search_path = public as $$
declare
  v_org_cible uuid := public.deal_org_for_write(p_deal); -- accès à la cible
  v_org_src   uuid;
  v_statut    text;
  v_raise     public.raises;
begin
  select org_id, statut into v_org_src, v_statut from public.raises where id = p_raise;
  if v_org_src is null then raise exception 'levée introuvable'; end if;

  if v_org_src <> v_org_cible then
    raise exception 'la data room cible doit appartenir à la même organisation';
  end if;

  -- Une data room a au plus une levée active.
  if v_statut = 'en_cours' and exists (
    select 1 from public.raises
    where deal_id = p_deal and statut = 'en_cours' and id <> p_raise
  ) then
    raise exception 'la data room cible a déjà une levée en cours';
  end if;

  update public.raises set deal_id = p_deal, updated_at = now()
  where id = p_raise
  returning * into v_raise;

  perform public.write_audit(
    v_org_cible, 'raise.moved', 'raise', p_raise::text,
    jsonb_build_object('deal', p_deal), p_deal
  );
  return v_raise;
end;
$$;

grant execute on function public.set_raise_deal(uuid, uuid) to authenticated;
