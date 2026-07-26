-- Supprimer un dossier NON VIDE, en connaissance de cause.
--
-- `delete_folder` refusait tout dossier contenant un document ou un
-- sous-dossier. Le garde-fou était juste dans son intention — « effacer des
-- documents en cascade sans que l'utilisateur en ait conscience » — mais il
-- répondait par un refus sec, sans issue : un fondateur qui réorganise son
-- arborescence devait vider chaque dossier à la main, feuille par feuille.
--
-- La bonne réponse n'est pas d'interdire, c'est de MONTRER. D'où deux
-- fonctions : l'une décrit ce qui va disparaître, l'autre exécute.
--
-- CE QUI SURVIT, ET C'EST L'ESSENTIEL. Les exigences de due diligence ne sont
-- PAS supprimées : `checklist_items.folder_id` est en `on delete set null`.
-- Une exigence perd son dossier de rattachement et, si sa preuve était dans le
-- dossier effacé, elle repasse « à fournir » — le déclencheur sur
-- `checklist_item_documents` s'en charge et recalcule le readiness. Le dossier
-- de diligence reste donc complet en nombre d'exigences ; c'est son taux de
-- complétude qui baisse, ce qui est exactement la vérité.

/**
 * Ce que la suppression emporterait. Aucune écriture — sert à remplir la
 * confirmation, pour qu'elle nomme des nombres plutôt que « êtes-vous sûr ».
 */
create or replace function public.folder_delete_impact(p_folder uuid)
returns table (
  sous_dossiers    int,
  documents        int,
  exigences_liees  int,
  exigences_a_refaire int,
  acces_perdus     int
)
language plpgsql security definer set search_path = public as $$
declare
  v_deal uuid;
begin
  select deal_id into v_deal from public.folders where id = p_folder;
  if v_deal is null then raise exception 'dossier introuvable'; end if;
  -- Même contrôle d'accès que la suppression : voir l'impact, c'est déjà lire
  -- la structure du dossier.
  perform public.deal_org_for_write(v_deal);

  return query
  with recursive arbre as (
    select id from public.folders where id = p_folder
    union all
    select f.id from public.folders f join arbre a on f.parent_id = a.id
  ),
  docs as (
    select d.id from public.documents d where d.folder_id in (select id from arbre)
  )
  select
    -- Le dossier lui-même ne compte pas comme son propre sous-dossier.
    (select count(*)::int - 1 from arbre),
    (select count(*)::int from docs),
    -- Exigences rattachées à l'un de ces dossiers : elles SURVIVENT, elles
    -- perdent seulement leur rattachement.
    (select count(*)::int from public.checklist_items c
      where c.folder_id in (select id from arbre)),
    -- Exigences qui repasseront « à fournir » : toutes leurs preuves sont
    -- dans le périmètre supprimé. Une exigence qui garde une preuve ailleurs
    -- reste satisfaite — l'annoncer perdue serait faux.
    (select count(*)::int from (
       select l.item_id
       from public.checklist_item_documents l
       group by l.item_id
       having bool_and(l.document_id in (select id from docs))
          and count(*) filter (where l.document_id in (select id from docs)) > 0
     ) t),
    (select count(*)::int from public.permissions p
      where p.folder_id in (select id from arbre) and p.level <> 'none');
end;
$$;

/**
 * Suppression. `p_cascade` à false conserve le comportement d'origine — refus
 * si le dossier n'est pas vide — pour que le code déjà déployé ne change pas
 * de sens pendant la fenêtre de déploiement.
 *
 * Postgres n'ajoute pas un paramètre par `create or replace` sans fabriquer
 * une surcharge ambiguë : on droppe, on recrée, on réémet le grant perdu
 * (cf. AGENTS.md).
 */
drop function if exists public.delete_folder(uuid);

create function public.delete_folder(p_folder uuid, p_cascade boolean default false)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_deal uuid;
  v_org  uuid;
  v_name text;
  v_docs int;
  v_sous int;
begin
  select deal_id, name into v_deal, v_name from public.folders where id = p_folder;
  if v_deal is null then raise exception 'dossier introuvable'; end if;
  v_org := public.deal_org_for_write(v_deal);

  -- Décompte récursif : un sous-dossier peut contenir les documents, et un
  -- comptage sur le seul niveau courant annoncerait « 0 document » avant d'en
  -- effacer trente.
  with recursive arbre as (
    select id from public.folders where id = p_folder
    union all
    select f.id from public.folders f join arbre a on f.parent_id = a.id
  )
  select
    (select count(*) from public.documents where folder_id in (select id from arbre)),
    (select count(*) - 1 from arbre)
  into v_docs, v_sous;

  if not coalesce(p_cascade, false) then
    if v_docs > 0 then
      raise exception 'le dossier contient % document(s)', v_docs;
    end if;
    if v_sous > 0 then
      raise exception 'le dossier contient des sous-dossiers';
    end if;
  end if;

  -- L'audit porte les NOMBRES, pas seulement le nom : une ligne « dossier
  -- supprimé » ne dit pas qu'elle a emporté trente pièces. Le journal doit
  -- pouvoir répondre plus tard à « où sont passés ces documents ? ».
  perform public.write_audit(
    v_org, 'folder.deleted', 'folder', p_folder::text,
    jsonb_build_object(
      'name', v_name,
      'documents', v_docs,
      'sous_dossiers', v_sous,
      'cascade', coalesce(p_cascade, false)
    ),
    v_deal
  );

  -- Les cascades font le reste : sous-dossiers et documents partent, les
  -- exigences perdent leur rattachement sans disparaître, et le déclencheur
  -- sur les preuves remet chaque exigence concernée à « à fournir ».
  delete from public.folders where id = p_folder;
  perform public.reindex_deal(v_deal);
end;
$$;

grant execute on function public.folder_delete_impact(uuid) to authenticated;
grant execute on function public.delete_folder(uuid, boolean) to authenticated;
