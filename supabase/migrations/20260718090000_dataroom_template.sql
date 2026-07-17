-- Kora — template de data room pré-enregistré (structure du prototype).
-- Ré-exécutable.

drop function if exists public.apply_dataroom_template(uuid) cascade;

/**
 * Crée l'arborescence standard d'une data room de transaction africaine.
 *
 * Idempotent : ne crée que les dossiers absents. Peut donc être appliqué à
 * un deal existant sans dupliquer ce qui s'y trouve déjà.
 */
create or replace function public.apply_dataroom_template(p_deal uuid)
returns int
language plpgsql security definer set search_path = public as $$
declare
  v_org     uuid := public.deal_org_for_write(p_deal);
  v_created int := 0;
  v_parent  uuid;
  v_root    text;
  v_child   text;
  v_pos     int;
  v_cpos    int;
  -- Structure du prototype : racine + sous-dossiers.
  v_tree jsonb := '[
    {"name": "Corporate", "children": ["Statuts", "Registre des actionnaires", "PV d''assemblées"]},
    {"name": "Financier", "children": ["Comptes annuels", "Budget", "Projections"]},
    {"name": "Juridique", "children": ["Contrats clients", "Litiges"]},
    {"name": "RH", "children": ["Organigramme", "Contrats clés"]},
    {"name": "Propriété intellectuelle", "children": ["Marques"]},
    {"name": "Conformité", "children": ["KYC bénéficiaires"]}
  ]'::jsonb;
  v_node jsonb;
begin
  v_pos := 0;

  for v_node in select * from jsonb_array_elements(v_tree) loop
    v_pos := v_pos + 1;
    v_root := v_node->>'name';

    select id into v_parent
    from public.folders
    where deal_id = p_deal and parent_id is null and name = v_root;

    if v_parent is null then
      insert into public.folders (deal_id, parent_id, name, position)
      values (p_deal, null, v_root, v_pos)
      returning id into v_parent;
      v_created := v_created + 1;
    end if;

    v_cpos := 0;
    for v_child in select jsonb_array_elements_text(v_node->'children') loop
      v_cpos := v_cpos + 1;
      if not exists (
        select 1 from public.folders
        where deal_id = p_deal and parent_id = v_parent and name = v_child
      ) then
        insert into public.folders (deal_id, parent_id, name, position)
        values (p_deal, v_parent, v_child, v_cpos);
        v_created := v_created + 1;
      end if;
    end loop;
  end loop;

  perform public.reindex_deal(p_deal);

  if v_created > 0 then
    perform public.write_audit(
      v_org, 'dataroom.template_applied', 'deal', p_deal::text,
      jsonb_build_object('folders', v_created), p_deal
    );
  end if;

  return v_created;
end;
$$;

/** create_deal utilise désormais le template complet. */
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
  where m.user_id = auth.uid()
    and m.role in ('owner', 'admin', 'member')
  limit 1;

  if v_org is null then
    raise exception 'aucune organisation';
  end if;

  insert into public.deals (org_id, name, type, currency, amount, created_by)
  values (v_org, p_name, p_type, p_currency, p_amount, auth.uid())
  returning * into v_deal;

  perform public.apply_dataroom_template(v_deal.id);

  perform public.write_audit(
    v_org, 'deal.created', 'deal', v_deal.id::text,
    jsonb_build_object('name', p_name, 'type', p_type), v_deal.id
  );

  return v_deal;
end;
$$;

-- ---------------------------------------------------------------------------
-- Alimentation des panneaux de la data room (en un appel, pas N)
-- ---------------------------------------------------------------------------
drop function if exists public.my_folder_levels(uuid) cascade;
drop function if exists public.deal_folder_access(uuid) cascade;

/** Niveau effectif de l'appelant sur chaque dossier du deal. */
create or replace function public.my_folder_levels(p_deal uuid)
returns table (folder_id uuid, level public.perm_level)
language sql stable security definer set search_path = public as $$
  select f.id, public.effective_permission(auth.uid(), f.id)
  from public.folders f
  where f.deal_id = p_deal;
$$;

/**
 * Qui a accès à quoi, dossier par dossier.
 *
 * N'expose QUE les personnes ayant réellement un droit (niveau <> 'none') :
 * lister toute l'organisation révélerait des identités à un invité — le même
 * problème de confidentialité que celui corrigé dans guest_privacy.
 */
create or replace function public.deal_folder_access(p_deal uuid)
returns table (
  folder_id  uuid,
  full_name  text,
  role       public.org_role,
  level      public.perm_level,
  expires_at timestamptz
)
language sql stable security definer set search_path = public as $$
  select f.id,
         coalesce(nullif(p.full_name, ''), split_part(p.email, '@', 1)),
         m.role,
         public.effective_permission(m.user_id, f.id),
         (select min(pe.expires_at) from public.permissions pe
          where pe.user_id = m.user_id and pe.folder_id = f.id)
  from public.folders f
  join public.deals d on d.id = f.deal_id
  join public.memberships m on m.org_id = d.org_id
  join public.profiles p on p.id = m.user_id
  where f.deal_id = p_deal
    and public.is_org_internal(d.org_id)          -- réservé à l'équipe interne
    and public.effective_permission(m.user_id, f.id) <> 'none'
  order by f.id, m.role;
$$;

grant execute on function public.apply_dataroom_template(uuid) to authenticated;
grant execute on function public.create_deal(text, text, text, numeric) to authenticated;
grant execute on function public.my_folder_levels(uuid) to authenticated;
grant execute on function public.deal_folder_access(uuid) to authenticated;
