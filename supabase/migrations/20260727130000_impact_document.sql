-- Impact de la suppression d'un DOCUMENT, sur le même principe que celui d'un
-- dossier (migration 20260727120000).
--
-- Même classe de problème : l'effet ne se voit pas là où l'on clique. Effacer
-- un document depuis la data room peut faire retomber une exigence de due
-- diligence à « à fournir » et faire baisser le readiness — deux écrans plus
-- loin. Le geste doit le dire avant, pas le faire découvrir après.
--
-- Comme pour les dossiers, rien n'est détruit côté checklist : l'exigence
-- survit, elle perd une preuve. Le déclencheur sur `checklist_item_documents`
-- s'occupe du statut et du readiness.

create or replace function public.document_delete_impact(p_doc uuid)
returns table (
  exigences_liees      int,
  exigences_a_refaire  int
)
language plpgsql security definer set search_path = public as $$
declare
  v_deal uuid;
begin
  select deal_id into v_deal from public.documents where id = p_doc;
  if v_deal is null then raise exception 'document introuvable'; end if;
  perform public.deal_org_for_write(v_deal);

  return query
  select
    -- Exigences dont ce document est une preuve.
    (select count(*)::int from public.checklist_item_documents l
      where l.document_id = p_doc),
    -- Parmi elles, celles dont c'est la SEULE preuve : ce sont les seules qui
    -- repasseront « à fournir ». Une exigence appuyée sur trois pièces reste
    -- satisfaite quand on en retire une — l'annoncer perdue serait faux.
    (select count(*)::int from public.checklist_item_documents l
      where l.document_id = p_doc
        and (select count(*) from public.checklist_item_documents x
              where x.item_id = l.item_id) = 1);
end;
$$;

grant execute on function public.document_delete_impact(uuid) to authenticated;
