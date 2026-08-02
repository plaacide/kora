-- La structure de la data room sort de la procédure, et suit l'objectif.
--
-- MÊME DÉFAUT QUE LA CHECKLIST AVANT LE LOT B : un littéral JSONB de 6,4 Ko
-- dans le corps d'`apply_dataroom_template`, et trente-deux dossiers identiques
-- pour tout le monde. Un dossier d'audit recevait « Marques OAPI » et « Noms de
-- domaine ».
--
-- LA RÈGLE, ET POURQUOI ELLE NE DEMANDE AUCUN TRAVAIL ÉDITORIAL. Les dossiers
-- se dérivent du plan lui-même : une section apparaît ENTIÈRE ou pas du tout,
-- selon qu'une exigence de l'objectif y range une pièce. Un second référentiel
-- de dossiers finirait par diverger du premier ; celui-ci en découle et ne le
-- peut pas.
--
-- ENTIÈRE, ET NON RÉDUITE AUX SEULS DOSSIERS RÉFÉRENCÉS. « Baux & immobilier »
-- et « Contrats fournisseurs » ne sont réclamés par aucune exigence, et un
-- investisseur les demandera pourtant. Une section amputée ferait déposer ces
-- pièces au mauvais endroit.
--
-- CE QUE ÇA DONNE, mesuré : audit et autre 12 dossiers, levée 27, dette et DFI
-- 28, diligence 32. Le contenu est repris de la définition RÉELLEMENT en base,
-- jamais retapé.

create table public.dataroom_catalog (
  section     int  not null,
  ordre       int  not null,
  name        text not null,
  description text not null default '',
  primary key (section, ordre)
);

comment on table public.dataroom_catalog is
  'La structure documentaire de référence. `ordre` = 0 désigne la section elle-même, les suivants ses sous-dossiers. Une section est retenue en entier ou pas du tout — voir apply_dataroom_template.';

alter table public.dataroom_catalog enable row level security;

with def as (
  select pg_get_functiondef(p.oid) as d
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'apply_dataroom_template'
),
arbre as (
  select noeud, rang
  from def, jsonb_array_elements(
    replace((regexp_match(d, '(\[\s*\{\s*"name".*?\])''::jsonb', 'ns'))[1], '''''', '''')::jsonb
  ) with ordinality as t(noeud, rang)
)
insert into public.dataroom_catalog (section, ordre, name, description)
select rang, 0, noeud->>'name', coalesce(noeud->>'description', '') from arbre
union all
select a.rang, e.rang, e.enfant->>'name', coalesce(e.enfant->>'description', '')
from arbre a,
     lateral (select enfant, rang from jsonb_array_elements(a.noeud->'children')
                with ordinality as x(enfant, rang)) e;

create or replace function public.sections_pour_objectif(p_objectif text)
 returns int[]
 language sql
 stable
as $function$
  select case
    when public.sources_pour_objectif(p_objectif) is null
      then (select array_agg(distinct section) from public.dataroom_catalog)
    else (
      select coalesce(array_agg(distinct split_part(c.folder_path, '.', 1)::int), '{}')
      from public.checklist_catalog c
      where c.folder_path is not null
        and c.sources && public.sources_pour_objectif(p_objectif)
    )
  end;
$function$;

create or replace function public.apply_dataroom_template(p_deal uuid)
 returns integer
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_org      uuid := public.deal_org_for_write(p_deal);
  v_created  int := 0;
  v_parent   uuid;
  v_pos      int := 0;
  v_cpos     int;
  v_section  record;
  v_enfant   record;
  v_objectif text;
  v_sections int[];
begin
  select d.objectif into v_objectif from public.deals d where d.id = p_deal;
  v_sections := public.sections_pour_objectif(v_objectif);

  for v_section in
    select section, name, description
    from public.dataroom_catalog
    where ordre = 0 and section = any(v_sections)
    order by section
  loop
    v_pos := v_pos + 1;

    select id into v_parent
    from public.folders
    where deal_id = p_deal and parent_id is null and name = v_section.name;

    if v_parent is null then
      insert into public.folders (deal_id, parent_id, name, description, position)
      values (p_deal, null, v_section.name, v_section.description, v_pos)
      returning id into v_parent;
      v_created := v_created + 1;
    else
      update public.folders set description = v_section.description
      where id = v_parent and description = '';
    end if;

    v_cpos := 0;
    for v_enfant in
      select name, description from public.dataroom_catalog
      where section = v_section.section and ordre > 0
      order by ordre
    loop
      v_cpos := v_cpos + 1;
      if not exists (
        select 1 from public.folders
        where deal_id = p_deal and parent_id = v_parent and name = v_enfant.name
      ) then
        insert into public.folders (deal_id, parent_id, name, description, position)
        values (p_deal, v_parent, v_enfant.name, v_enfant.description, v_cpos);
        v_created := v_created + 1;
      end if;
    end loop;
  end loop;

  perform public.reindex_deal(p_deal);

  if v_created > 0 then
    perform public.write_audit(
      v_org, 'dataroom.template_applied', 'deal', p_deal::text,
      jsonb_build_object('folders', v_created, 'objectif', v_objectif), p_deal
    );
  end if;

  return v_created;
end;
$function$;
