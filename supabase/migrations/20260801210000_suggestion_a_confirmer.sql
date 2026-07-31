-- Une suggestion n'est pas une preuve tant qu'elle n'est pas confirmée.
--
-- Le parcours de dépôt perdait ses suggestions. Le fondateur déposait cinq
-- pièces, Sanza proposait des associations à l'écran 17, et s'il fermait cet
-- écran sans confirmer — un onglet refermé, un téléphone qui sonne — tout le
-- travail de rapprochement était jeté. Rien en base n'en gardait trace.
--
-- La suggestion est donc ÉCRITE dès le dépôt, marquée non confirmée. Trois
-- conséquences, et c'est ce qui fait l'intérêt du changement :
--
--   · elle survit à la fermeture de l'écran ;
--   · l'exigence peut dire « Pièce à confirmer » — le sixième état de la
--     maquette 11, qui n'avait jusqu'ici aucun producteur ;
--   · elle ne compte PAS comme une preuve. `sync_checklist_status` ne regarde
--     que les liens confirmés : une suggestion ne doit pas faire passer une
--     exigence pour prête, ni gonfler le score de préparation.
--
-- Le défaut reste `true` : tout ce qui existe a été confirmé à la main, et
-- l'association manuelle depuis l'écran 12 le restera.
--
-- Ré-exécutable.

alter table public.checklist_item_documents
  add column if not exists confirmed boolean not null default true;


-- ---------------------------------------------------------------------------
-- Rattacher, ou seulement suggérer
-- ---------------------------------------------------------------------------
-- Une seule fonction pour les deux gestes : confirmer une suggestion, c'est
-- rappeler `attach` avec `p_confirmed = true`. Deux fonctions séparées
-- laisseraient un jour l'une écrire ce que l'autre ne saurait pas relire.
drop function if exists public.attach_checklist_document(uuid, uuid);

create or replace function public.attach_checklist_document(
  p_item uuid,
  p_doc uuid,
  p_confirmed boolean default true
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

  -- Une preuve ne peut pas venir d'un autre deal.
  select name into v_nom from public.documents
  where id = p_doc and deal_id = v_deal;
  if v_nom is null then raise exception 'document invalide'; end if;

  insert into public.checklist_item_documents (item_id, document_id, linked_by, confirmed)
  values (p_item, p_doc, auth.uid(), p_confirmed)
  on conflict (item_id, document_id) do update
    -- Une confirmation écrase une suggestion. L'inverse est refusé : suggérer
    -- par-dessus une preuve confirmée la dégraderait sans que personne ne
    -- l'ait demandé.
    set confirmed = public.checklist_item_documents.confirmed or excluded.confirmed,
        linked_at = case
          when public.checklist_item_documents.confirmed then public.checklist_item_documents.linked_at
          else now()
        end;

  perform public.write_audit(
    v_org,
    case when p_confirmed then 'checklist.document_linked'
         else 'checklist.document_suggested' end,
    'checklist', p_item::text,
    jsonb_build_object('label', v_label, 'document', p_doc, 'document_name', v_nom),
    v_deal
  );

  return public.sync_checklist_status(p_item);
end;
$$;

grant execute on function public.attach_checklist_document(uuid, uuid, boolean)
  to authenticated;


-- ---------------------------------------------------------------------------
-- Le statut ne suit que les preuves CONFIRMÉES
-- ---------------------------------------------------------------------------
-- Sans ce filtre, déposer un fichier suffirait à rendre une exigence « prête »
-- sur la foi d'une suggestion automatique — et le score de préparation
-- annoncerait un dossier complet que personne n'a relu.
create or replace function public.sync_checklist_status(p_item uuid)
returns int
language plpgsql security definer set search_path = public as $$
declare
  v_deal   uuid;
  v_statut public.checklist_status;
  v_n      int;
begin
  select deal_id, status into v_deal, v_statut
  from public.checklist_items where id = p_item;
  if v_deal is null then return null; end if;

  select count(*) into v_n
  from public.checklist_item_documents
  where item_id = p_item and confirmed;

  if v_n > 0 and v_statut = 'todo' then
    update public.checklist_items set status = 'done' where id = p_item;
  elsif v_n = 0 and v_statut = 'done' then
    update public.checklist_items set status = 'todo' where id = p_item;
  end if;

  return public.recompute_readiness(v_deal);
end;
$$;

grant execute on function public.sync_checklist_status(uuid) to authenticated;


-- ---------------------------------------------------------------------------
-- Écarter une suggestion
-- ---------------------------------------------------------------------------
-- Refuser n'est pas la même chose que détacher une preuve : on jette une
-- proposition de la machine, pas un document que quelqu'un avait validé. Le
-- journal doit pouvoir les distinguer — sinon on ne saura jamais si
-- l'algorithme propose juste.
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
begin
  select deal_id, label into v_deal, v_label
  from public.checklist_items where id = p_item;
  if v_deal is null then raise exception 'élément introuvable'; end if;
  v_org := public.deal_org_for_write(v_deal);

  delete from public.checklist_item_documents
  where item_id = p_item and document_id = p_doc and not confirmed;

  perform public.write_audit(
    v_org, 'checklist.suggestion_dismissed', 'checklist', p_item::text,
    jsonb_build_object('label', v_label, 'document', p_doc), v_deal
  );

  return public.sync_checklist_status(p_item);
end;
$$;

grant execute on function public.dismiss_checklist_suggestion(uuid, uuid)
  to authenticated;
