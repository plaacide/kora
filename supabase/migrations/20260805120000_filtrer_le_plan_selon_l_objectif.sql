-- Le plan ne retient plus que ce qui concerne l'objectif déclaré.
--
-- URGENT, ET PAS OPTIONNEL. La migration précédente a fait passer le catalogue
-- de vingt-deux à quarante-quatre exigences. Sans ce filtre, une levée en
-- capital recevrait la balance générale et le grand livre d'un audit, et un
-- dossier bancaire les marques OAPI. Les deux migrations ne se rejouent jamais
-- séparément.
--
-- POURQUOI LE FILTRE N'ÉTAIT PAS LIVRABLE AVANT. Filtrer les vingt-deux
-- exigences d'origine aurait donné à un dossier bancaire une liste de levée
-- amputée de quatre lignes : une promesse plus crédible tout en restant fausse.
-- C'est la rédaction des exigences manquantes qui rend le filtre honnête, pas
-- l'inverse.
--
-- CE QUE ÇA DONNE, mesuré : dette 22 exigences, DFI 21, audit 19, diligence 19,
-- levée 16, autre 6. Six plans distincts là où il n'y en avait qu'un.

create or replace function public.sources_pour_objectif(p_objectif text)
 returns public.checklist_source[]
 language sql
 immutable
as $function$
  select case p_objectif
    when 'levee'     then '{capital,ohada}'::public.checklist_source[]
    when 'dette'     then '{bank,ohada}'::public.checklist_source[]
    when 'dfi'       then '{dfi,ohada}'::public.checklist_source[]
    when 'audit'     then '{audit,ohada}'::public.checklist_source[]
    when 'diligence' then '{diligence,ohada}'::public.checklist_source[]
    when 'autre'     then '{ohada}'::public.checklist_source[]
    else null
  end;
$function$;

comment on function public.sources_pour_objectif(text) is
  'Le modèle de préparation, réduit à sa correspondance : un objectif retient une applicabilité, plus le socle OHADA. NULL pour un objectif inconnu, ce qui fait rendre tout le catalogue plutôt qu''un plan vide.';

create or replace function public.apply_checklist_template(p_deal uuid)
 returns integer
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_org     uuid := public.deal_org_for_write(p_deal);
  v_created int := 0;
  v_item    record;
  v_folder  uuid;
  v_pos     int;
  v_forme    text;
  v_pays     text;
  v_stade    text;
  v_objectif text;
  v_sources  public.checklist_source[];
begin
  select d.objectif into v_objectif from public.deals d where d.id = p_deal;
  v_sources := public.sources_pour_objectif(v_objectif);

  -- Les réponses de l'onboarding. L'entreprise rejoint l'opération par
  -- l'organisation.
  select s.forme_juridique, s.country, s.stage
    into v_forme, v_pays, v_stade
  from public.startups s
  join public.deals d on d.org_id = s.org_id
  where d.id = p_deal
  limit 1;

  for v_item in
    select c.key,
           -- Précédence : forme juridique, puis pays, puis stade. Le niveau
           -- fait exception — c'est le stade qui en décide en premier, puisque
           -- c'est son seul effet.
           coalesce(vf.label,       vp.label,       vs.label,       c.label)       as label,
           coalesce(vf.description, vp.description, vs.description, c.description) as description,
           coalesce(vs.level,       vf.level,       vp.level,       c.level)       as level,
           c.domain, c.sources, c.freshness_days, c.expected_period,
           c.accepted_formats, c.folder_path
    from public.checklist_catalog c
    left join public.checklist_catalog_variants vf
      on vf.catalog_key = c.key and vf.axis = 'forme_juridique' and vf.value = v_forme
    left join public.checklist_catalog_variants vp
      on vp.catalog_key = c.key and vp.axis = 'country'         and vp.value = v_pays
    left join public.checklist_catalog_variants vs
      on vs.catalog_key = c.key and vs.axis = 'stage'           and vs.value = v_stade
    where coalesce(vf.applicable, true)
      and coalesce(vp.applicable, true)
      and coalesce(vs.applicable, true)
      -- LE MODÈLE. Un objectif inconnu laisse `v_sources` à NULL et rend tout
      -- le catalogue : mieux vaut une liste trop large qu'un écran vide devant
      -- quelqu'un qui attend son dossier.
      and (v_sources is null or c.sources && v_sources)
    order by c.domain, c.label
  loop
    select f.id into v_folder
    from public.folders f
    where f.index_path = v_item.folder_path and f.deal_id = p_deal
    limit 1;

    select coalesce(max(position), 0) + 1 into v_pos
    from public.checklist_items
    where deal_id = p_deal and domain = v_item.domain;

    if not exists (
      select 1 from public.checklist_items
      where deal_id = p_deal and catalog_key = v_item.key
    ) then
      insert into public.checklist_items (
        deal_id, catalog_key, domain, label, description, position, folder_id,
        level, sources, freshness_days, expected_period, accepted_formats
      )
      values (
        p_deal, v_item.key, v_item.domain, v_item.label, v_item.description,
        v_pos, v_folder, v_item.level, v_item.sources, v_item.freshness_days,
        v_item.expected_period, v_item.accepted_formats
      );
      v_created := v_created + 1;
    else
      update public.checklist_items ci
      set folder_id = coalesce(ci.folder_id, v_folder),
          label = case when ci.label = any (
                    select l from (
                      select c2.label as l from public.checklist_catalog c2
                       where c2.key = v_item.key
                      union
                      select v2.label from public.checklist_catalog_variants v2
                       where v2.catalog_key = v_item.key and v2.label is not null
                    ) connus)
                  then v_item.label else ci.label end,
          description = case when ci.label = any (
                    select l from (
                      select c2.label as l from public.checklist_catalog c2
                       where c2.key = v_item.key
                      union
                      select v2.label from public.checklist_catalog_variants v2
                       where v2.catalog_key = v_item.key and v2.label is not null
                    ) connus)
                  then v_item.description else ci.description end,
          level = case when ci.label = any (
                    select l from (
                      select c2.label as l from public.checklist_catalog c2
                       where c2.key = v_item.key
                      union
                      select v2.label from public.checklist_catalog_variants v2
                       where v2.catalog_key = v_item.key and v2.label is not null
                    ) connus)
                  then v_item.level else ci.level end
      where ci.deal_id = p_deal and ci.catalog_key = v_item.key;
    end if;
  end loop;

  perform public.recompute_readiness(p_deal);

  if v_created > 0 then
    perform public.write_audit(
      v_org, 'checklist.template_applied', 'deal', p_deal::text,
      jsonb_build_object('items', v_created, 'objectif', v_objectif), p_deal
    );
  end if;

  return v_created;
end;
$function$;
