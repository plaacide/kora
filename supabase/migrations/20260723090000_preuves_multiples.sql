-- Une exigence peut demander PLUSIEURS preuves.
--
-- Le modèle actuel porte `checklist_items.document_id` : une colonne, donc
-- une seule preuve. Or cinq exigences du modèle OHADA en réclament plusieurs
-- par nature, et ce n'est pas un cas limite :
--
--   · Procès-verbaux d'assemblée        — 3 exercices
--   · États financiers certifiés        — 3 exercices
--   · Rapport du commissaire aux comptes— le général ET le spécial
--   · Registre des bénéficiaires effectifs — un acte par bénéficiaire
--   · Attestations d'assurance          — une par police
--
-- Aujourd'hui, rattacher le PV 2025 DÉTACHE silencieusement le PV 2024 : le
-- fondateur croit avoir fourni trois pièces, la data room n'en garde qu'une,
-- et rien à l'écran ne le lui dit. C'est une perte de données silencieuse, pas
-- une gêne d'ergonomie.
--
-- On remplace donc la colonne par une table de liaison. Pas de coexistence des
-- deux : deux sources de vérité pour la même question divergent toujours, et
-- c'est le genre d'écart qu'on ne découvre qu'en production.

-- ---------------------------------------------------------------------------
-- La table de liaison
-- ---------------------------------------------------------------------------

create table if not exists public.checklist_item_documents (
  item_id     uuid not null references public.checklist_items(id) on delete cascade,
  -- `cascade` et non `set null` : une preuve supprimée n'est plus une preuve.
  -- La ligne disparaît, et le déclencheur plus bas remet l'exigence à jour.
  document_id uuid not null references public.documents(id) on delete cascade,
  linked_at   timestamptz not null default now(),
  linked_by   uuid references auth.users(id) on delete set null,
  -- Rattacher deux fois la même pièce à la même exigence n'a pas de sens ;
  -- la clé primaire rend le geste idempotent plutôt qu'erroné.
  primary key (item_id, document_id)
);

create index checklist_item_documents_doc_idx
  on public.checklist_item_documents (document_id);

alter table public.checklist_item_documents enable row level security;

-- Même prédicat que `checklist_items` : qui voit l'exigence voit ses preuves.
create policy checklist_item_documents_select on public.checklist_item_documents
  for select using (exists (
    select 1 from public.checklist_items i
    where i.id = checklist_item_documents.item_id and public.can_see_deal(i.deal_id)
  ));

grant select on public.checklist_item_documents to authenticated;

-- ---------------------------------------------------------------------------
-- Reprise de l'existant
-- ---------------------------------------------------------------------------

insert into public.checklist_item_documents (item_id, document_id)
select id, document_id from public.checklist_items where document_id is not null
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Le statut suit le nombre de preuves
-- ---------------------------------------------------------------------------

/**
 * Aligne le statut d'une exigence sur ses preuves, puis recalcule le score.
 *
 * Règles inchangées par rapport à la preuve unique, seul le seuil se déplace
 * de « la colonne est remplie » à « il reste au moins une preuve » :
 *   · première preuve sur une exigence « à faire »  -> « fait »
 *   · dernière preuve retirée d'une exigence « faite » -> « à faire »
 *   · « en cours » n'est jamais écrasé : le fondateur a exprimé une intention.
 */
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
  from public.checklist_item_documents where item_id = p_item;

  if v_n > 0 and v_statut = 'todo' then
    update public.checklist_items set status = 'done' where id = p_item;
  elsif v_n = 0 and v_statut = 'done' then
    update public.checklist_items set status = 'todo' where id = p_item;
  end if;

  return public.recompute_readiness(v_deal);
end;
$$;

/**
 * Supprimer un document retire ses liens (cascade) — mais la cascade ne
 * repasse pas par la RPC de détachement. Sans ce déclencheur, une exigence
 * resterait « faite » avec zéro preuve, et le readiness mentirait.
 */
create or replace function public.checklist_documents_after_delete()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.sync_checklist_status(old.item_id);
  return old;
end;
$$;

drop trigger if exists checklist_documents_sync on public.checklist_item_documents;
create trigger checklist_documents_sync
  after delete on public.checklist_item_documents
  for each row execute function public.checklist_documents_after_delete();

-- ---------------------------------------------------------------------------
-- Rattacher / détacher
-- ---------------------------------------------------------------------------

create or replace function public.attach_checklist_document(p_item uuid, p_doc uuid)
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

  insert into public.checklist_item_documents (item_id, document_id, linked_by)
  values (p_item, p_doc, auth.uid())
  on conflict do nothing;

  perform public.write_audit(
    v_org, 'checklist.document_linked', 'checklist', p_item::text,
    jsonb_build_object('label', v_label, 'document', p_doc, 'document_name', v_nom),
    v_deal
  );

  return public.sync_checklist_status(p_item);
end;
$$;

create or replace function public.detach_checklist_document(p_item uuid, p_doc uuid)
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
  where item_id = p_item and document_id = p_doc;

  perform public.write_audit(
    v_org, 'checklist.document_unlinked', 'checklist', p_item::text,
    jsonb_build_object('label', v_label, 'document', p_doc),
    v_deal
  );

  -- Le déclencheur a déjà synchronisé le statut ; on relit le score.
  return public.recompute_readiness(v_deal);
end;
$$;

grant execute on function public.attach_checklist_document(uuid, uuid) to authenticated;
grant execute on function public.detach_checklist_document(uuid, uuid) to authenticated;
grant execute on function public.sync_checklist_status(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Retrait de l'ancienne voie
-- ---------------------------------------------------------------------------

-- La colonne et sa RPC disparaissent ensemble : laisser l'une sans l'autre
-- inviterait à écrire dans une source de vérité morte.
drop function if exists public.link_checklist_document(uuid, uuid);
alter table public.checklist_items drop column if exists document_id;
