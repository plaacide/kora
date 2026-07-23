-- DÉCOUPLAGE data room ↔ levée — Phase 1 (fondations, non destructif).
--
-- Décisions fondateur :
--   · une data room peut porter PLUSIEURS levées actives (data room 1 → N levées) ;
--   · chaque levée a son PROPRE NOM, indépendant du nom de la data room.
--
-- La levée (raises) pointe déjà vers sa data room via `deal_id` : le lien
-- existe. On ajoute le nom, on lève la contrainte « une seule en cours », et on
-- expose les gestes attacher / changer de data room. L'existant continue de
-- fonctionner (les écrans actuels lisent toujours la 1ʳᵉ levée en cours).
--
-- Ré-exécutable.

-- Nom propre de la levée.
alter table public.raises
  add column if not exists name text;

-- Amorçage : les levées existantes prennent le nom de leur data room, pour
-- qu'aucune ne soit sans nom.
update public.raises r
set name = coalesce(nullif(trim(r.name), ''), d.name, 'Levée')
from public.deals d
where d.id = r.deal_id and (r.name is null or trim(r.name) = '');

-- Plusieurs levées actives par data room : on retire l'index unique partiel.
drop index if exists public.raises_une_en_cours_par_deal;

-- ---------------------------------------------------------------------------
-- create_raise : ouvrir une NOUVELLE levée attachée à une data room (deal).
-- Nom propre. Ne touche pas aux autres levées de la data room.
-- ---------------------------------------------------------------------------
create or replace function public.create_raise(p_deal uuid, p_name text default null)
returns public.raises
language plpgsql security definer set search_path = public as $$
declare
  v_org    uuid := public.deal_org_for_write(p_deal);
  v_devise text;
  v_raise  public.raises;
begin
  -- Devise reprise d'une levée existante de la data room, sinon USD.
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

-- ---------------------------------------------------------------------------
-- set_raise_deal : rattacher une levée à une AUTRE data room (même org).
-- ---------------------------------------------------------------------------
create or replace function public.set_raise_deal(p_raise uuid, p_deal uuid)
returns public.raises
language plpgsql security definer set search_path = public as $$
declare
  v_org_cible uuid := public.deal_org_for_write(p_deal); -- accès à la cible
  v_org_src   uuid;
  v_raise     public.raises;
begin
  select org_id into v_org_src from public.raises where id = p_raise;
  if v_org_src is null then raise exception 'levée introuvable'; end if;

  -- On reste dans la même organisation : rattacher une levée à la data room
  -- d'une autre org n'a pas de sens et poserait un problème d'accès.
  if v_org_src <> v_org_cible then
    raise exception 'la data room cible doit appartenir à la même organisation';
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

-- ---------------------------------------------------------------------------
-- set_raise_name : renommer une levée (nom propre).
-- ---------------------------------------------------------------------------
create or replace function public.set_raise_name(p_raise uuid, p_name text)
returns public.raises
language plpgsql security definer set search_path = public as $$
declare
  v_deal  uuid;
  v_org   uuid;
  v_raise public.raises;
begin
  select deal_id into v_deal from public.raises where id = p_raise;
  if v_deal is null then raise exception 'levée introuvable'; end if;
  v_org := public.deal_org_for_write(v_deal);

  update public.raises set name = coalesce(nullif(trim(p_name), ''), name), updated_at = now()
  where id = p_raise
  returning * into v_raise;

  perform public.write_audit(
    v_org, 'raise.updated', 'raise', p_raise::text,
    jsonb_build_object('name', p_name), v_deal
  );
  return v_raise;
end;
$$;

grant execute on function public.set_raise_name(uuid, text) to authenticated;
