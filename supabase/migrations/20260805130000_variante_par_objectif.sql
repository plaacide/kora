-- Un quatrième axe de variante : l'objectif.
--
-- POURQUOI IL MANQUAIT. Le niveau d'une exigence est une colonne unique du
-- catalogue. Impossible, jusqu'ici, de dire qu'une pièce est REQUISE pour une
-- diligence et seulement RECOMMANDÉE pour un bailleur — il aurait fallu choisir
-- l'un ou l'autre, et affaiblir un modèle pour en servir un autre.
--
-- LE CAS QUI L'A RÉVÉLÉ. Un bailleur peut demander les contrats, les litiges et
-- les assurances, mais « selon la matérialité, l'instrument et les risques du
-- projet — pas comme trois documents obligatoires dans tous les dossiers ».
-- Les étiqueter sans pouvoir les nuancer aurait rendu obligatoire ce qui est
-- conditionnel : exactement le défaut que tout ce chantier corrige.
--
-- Précédence pour le niveau : le stade d'abord — c'est son seul effet —, puis
-- l'objectif, puis la forme juridique, puis le pays.

alter table public.checklist_catalog_variants
  drop constraint if exists checklist_catalog_variants_axis_check;

alter table public.checklist_catalog_variants
  add constraint checklist_catalog_variants_axis_check
  check (axis in ('forme_juridique', 'country', 'stage', 'objectif'));

update public.checklist_catalog
set sources = sources || '{dfi}'::public.checklist_source[]
where key in ('contrats_significatifs', 'litiges_en_cours', 'assurances')
  and not ('dfi' = any(sources));

insert into public.checklist_catalog_variants
  (catalog_key, axis, value, label, description, level, applicable)
values
  ('contrats_significatifs', 'objectif', 'dfi', null,
   'Les engagements qui portent l''activité du projet. Un bailleur les demande selon la matérialité et les risques — rassemblez d''abord ceux qui conditionnent les flux du projet financé.',
   'recommended', true),
  ('litiges_en_cours', 'objectif', 'dfi', null,
   'Procédures et réclamations en cours, avec leur exposition estimée. Demandé selon la matérialité et le profil de risque du projet, pas systématiquement.',
   'recommended', true)
on conflict (catalog_key, axis, value) do nothing;

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
           coalesce(vf.label,       vp.label,       vs.label,       vo.label,       c.label)       as label,
           coalesce(vf.description, vp.description, vs.description, vo.description, c.description) as description,
           coalesce(vs.level,       vo.level,       vf.level,       vp.level,       c.level)       as level,
           c.domain, c.sources, c.freshness_days, c.expected_period,
           c.accepted_formats, c.folder_path
    from public.checklist_catalog c
    left join public.checklist_catalog_variants vf
      on vf.catalog_key = c.key and vf.axis = 'forme_juridique' and vf.value = v_forme
    left join public.checklist_catalog_variants vp
      on vp.catalog_key = c.key and vp.axis = 'country'         and vp.value = v_pays
    left join public.checklist_catalog_variants vs
      on vs.catalog_key = c.key and vs.axis = 'stage'           and vs.value = v_stade
    left join public.checklist_catalog_variants vo
      on vo.catalog_key = c.key and vo.axis = 'objectif'        and vo.value = v_objectif
    where coalesce(vf.applicable, true)
      and coalesce(vp.applicable, true)
      and coalesce(vs.applicable, true)
      and coalesce(vo.applicable, true)
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
