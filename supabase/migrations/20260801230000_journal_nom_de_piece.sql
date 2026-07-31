-- Le journal doit nommer la pièce qu'on retire.
--
-- `detach_checklist_document` n'écrivait que l'identifiant du document. Le
-- panneau affichait donc « a retiré « une pièce » » — une ligne qui dit qu'il
-- s'est passé quelque chose sans dire quoi, c'est-à-dire une ligne inutile
-- exactement le jour où on relit le journal pour comprendre.
--
-- Même correction pour `dismiss_checklist_suggestion`, écrite hier avec le
-- même oubli.
--
-- Le nom est capturé AVANT la suppression du lien : après, le document existe
-- toujours, mais rien ne garantit qu'il existera encore au moment où on relira
-- le journal. Un journal qui dépend d'une jointure vivante n'est pas un
-- journal.
--
-- Ré-exécutable.

create or replace function public.detach_checklist_document(p_item uuid, p_doc uuid)
returns int
language plpgsql security definer set search_path = public as $$
declare
  v_deal  uuid;
  v_org   uuid;
  v_label text;
  v_nom   text;
begin
  select deal_id, label into v_deal, v_label
  from public.checklist_items where id = p_item;
  if v_deal is null then raise exception 'élément introuvable'; end if;
  v_org := public.deal_org_for_write(v_deal);

  select name into v_nom from public.documents where id = p_doc;

  delete from public.checklist_item_documents
  where item_id = p_item and document_id = p_doc;

  perform public.write_audit(
    v_org, 'checklist.document_unlinked', 'checklist', p_item::text,
    jsonb_build_object('label', v_label, 'document', p_doc, 'document_name', v_nom),
    v_deal
  );

  -- Le déclencheur a déjà synchronisé le statut ; on relit le score.
  return public.recompute_readiness(v_deal);
end;
$$;

grant execute on function public.detach_checklist_document(uuid, uuid) to authenticated;


create or replace function public.dismiss_checklist_suggestion(
  p_item uuid,
  p_doc uuid
)
returns int
language plpgsql security definer set search_path = public as $$
declare
  v_deal  uuid;
  v_org   uuid;
  v_label text;
  v_nom   text;
begin
  select deal_id, label into v_deal, v_label
  from public.checklist_items where id = p_item;
  if v_deal is null then raise exception 'élément introuvable'; end if;
  v_org := public.deal_org_for_write(v_deal);

  select name into v_nom from public.documents where id = p_doc;

  delete from public.checklist_item_documents
  where item_id = p_item and document_id = p_doc and not confirmed;

  perform public.write_audit(
    v_org, 'checklist.suggestion_dismissed', 'checklist', p_item::text,
    jsonb_build_object('label', v_label, 'document', p_doc, 'document_name', v_nom),
    v_deal
  );

  return public.sync_checklist_status(p_item);
end;
$$;

grant execute on function public.dismiss_checklist_suggestion(uuid, uuid)
  to authenticated;
