-- Documenter les levées ANTÉRIEURES à la plateforme.
--
-- Un fondateur arrive presque toujours avec un passé (Pre-Seed, Seed déjà
-- bouclés ailleurs). Jusqu'ici l'historique de financement ne se remplissait
-- qu'en clôturant une levée faite SUR Sanza. On ajoute donc le geste
-- « ajouter un tour passé » : insertion directe d'une levée déjà `cloturee`.
--
-- Aucun conflit avec l'index partiel unique (il ne porte que sur 'en_cours').
--
-- Ré-exécutable.

create or replace function public.add_past_raise(
  p_deal uuid,
  p_montant bigint default null,
  p_stade text default null,
  p_devise text default null,
  p_date date default null,
  p_description text default null
)
returns public.raises
language plpgsql security definer set search_path = public as $$
declare
  v_org   uuid := public.deal_org_for_write(p_deal);
  v_raise public.raises;
begin
  insert into public.raises (
    deal_id, org_id, montant_cible, devise, stade, date_cloture, description, statut
  ) values (
    p_deal, v_org, p_montant,
    coalesce(nullif(trim(p_devise), ''), 'USD'),
    p_stade, p_date, p_description, 'cloturee'
  )
  returning * into v_raise;

  perform public.write_audit(
    v_org, 'raise.added_past', 'raise', v_raise.id::text,
    jsonb_strip_nulls(jsonb_build_object('montant', p_montant, 'stade', p_stade, 'date', p_date)),
    p_deal
  );
  return v_raise;
end;
$$;

grant execute on function public.add_past_raise(uuid, bigint, text, text, date, text) to authenticated;

-- Supprimer un tour (corriger une saisie d'historique). Interne seul, audité.
create or replace function public.delete_raise(p_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_deal uuid;
  v_org  uuid;
begin
  select deal_id into v_deal from public.raises where id = p_id;
  if v_deal is null then
    raise exception 'levée introuvable';
  end if;
  v_org := public.deal_org_for_write(v_deal);  -- contrôle d'accès

  delete from public.raises where id = p_id;

  perform public.write_audit(
    v_org, 'raise.deleted', 'raise', p_id::text, '{}'::jsonb, v_deal
  );
end;
$$;

grant execute on function public.delete_raise(uuid) to authenticated;
