-- La preuve vaut la pièce.
--
-- Jusqu'ici, rattacher un document à une exigence écrivait `document_id` et
-- s'arrêtait là : ni le statut ni le score ne bougeaient. Le fondateur
-- déposait le pacte d'actionnaires, le désignait comme preuve, et sa jauge
-- restait à zéro tant qu'il ne cochait pas la case à la main.
--
-- Pour un produit qui promet de guider pièce par pièce, c'est le contraire de
-- ce qu'on attend : le geste utile ne compte pas, seul le geste administratif
-- compte. On aligne donc l'état sur la réalité.
--
-- Règles, volontairement symétriques et prévisibles :
--   · rattacher une preuve à une pièce « à faire »  -> la pièce passe à « fait »
--   · retirer la preuve d'une pièce « faite »       -> elle retombe à « à faire »
--   · une pièce « en cours » n'est pas promue : le fondateur a exprimé une
--     intention (« je travaille dessus »), on ne la contredit pas
--
-- Le score est recalculé dans les deux cas — c'est ce qui manquait.
-- Marquer « fait » à la main sans document reste possible : certaines preuves
-- vivent ailleurs (attestation remise en main propre, acte chez le notaire).

-- La fonction passait de `returns void` à `returns int` (le nouveau score) :
-- Postgres refuse un changement de type de retour via CREATE OR REPLACE, il
-- faut supprimer d'abord. `cascade` n'est pas nécessaire, rien n'en dépend.
drop function if exists public.link_checklist_document(uuid, uuid);

create or replace function public.link_checklist_document(p_item uuid, p_doc uuid)
returns int
language plpgsql security definer set search_path = public as $$
declare
  v_deal    uuid;
  v_org     uuid;
  v_label   text;
  v_statut  public.checklist_status;
  v_nouveau public.checklist_status;
  v_score   int;
begin
  select deal_id, label, status into v_deal, v_label, v_statut
  from public.checklist_items where id = p_item;
  if v_deal is null then raise exception 'élément introuvable'; end if;
  v_org := public.deal_org_for_write(v_deal);

  -- Une preuve ne peut pas venir d'un autre deal.
  if p_doc is not null and not exists (
    select 1 from public.documents d where d.id = p_doc and d.deal_id = v_deal
  ) then
    raise exception 'document invalide';
  end if;

  v_nouveau := v_statut;
  if p_doc is not null and v_statut = 'todo' then
    v_nouveau := 'done';
  elsif p_doc is null and v_statut = 'done' then
    v_nouveau := 'todo';
  end if;

  update public.checklist_items
  set document_id = p_doc, status = v_nouveau
  where id = p_item;

  perform public.write_audit(
    v_org, 'checklist.document_linked', 'checklist', p_item::text,
    jsonb_build_object(
      'label', v_label,
      'document', p_doc,
      -- Le changement de statut induit est tracé : un auditeur doit pouvoir
      -- distinguer une pièce validée par une preuve d'une pièce cochée à la
      -- main.
      'status', v_nouveau,
      'status_auto', v_nouveau is distinct from v_statut
    ),
    v_deal
  );

  v_score := public.recompute_readiness(v_deal);
  return v_score;
end;
$$;

grant execute on function public.link_checklist_document(uuid, uuid) to authenticated;
