-- « Accorder l'accès » doit accorder un accès.
--
-- CE QUI MANQUAIT. `decide_access_request` (migration 20260728100000) changeait
-- le STATUT d'une demande et l'écrivait au journal — rien de plus. Une demande
-- passée à `granted` laissait donc l'investisseur exactement où il était : à la
-- porte. L'écran aurait dit « accordé », la data room serait restée fermée, et
-- personne n'aurait compris pourquoi.
--
-- Le geste est le même que l'acceptation d'une invitation : rattacher
-- l'investisseur à l'organisation en INVITÉ, puis lui ouvrir les dossiers
-- racine. On reprend donc exactement ce que fait `accept_invitation`, plutôt
-- que d'inventer une seconde façon d'accorder — deux chemins vers le même
-- droit finissent toujours par diverger.
--
-- NIVEAU « FILIGRANE », le plus restrictif qui permette de lire. C'est déjà le
-- défaut des invitations, et c'est le bon ici : l'entreprise a accepté qu'on
-- CONSULTE son dossier, pas qu'on l'emporte. Monter le niveau reste son geste,
-- depuis son écran d'autorisations.
--
-- Le retrait est symétrique : `refused` après un `granted` retire les droits.
-- Sans cela, refuser après avoir accordé aurait changé un mot sans fermer la
-- porte.

create or replace function public.decide_access_request(
  p_request uuid,
  p_decision public.access_request_status,
  p_note text default null
)
returns void
language plpgsql security definer set search_path = public as $$
declare
  r        public.access_requests;
  v_mandat boolean := false;
  v_org    uuid;
  v_folder record;
begin
  if auth.uid() is null then raise exception 'non authentifié'; end if;

  select * into r from public.access_requests where id = p_request;
  if r.id is null then raise exception 'demande introuvable'; end if;

  -- Le programme filtre ; l'entreprise tranche. Chacun ses transitions.
  if p_decision in ('recommended', 'forwarded', 'dismissed') then
    if not public.is_org_member(r.program_org_id) then
      raise exception 'réservé au programme';
    end if;
  elsif p_decision in ('granted', 'refused') then
    select exists (
      select 1 from public.mandates m
      where m.startup_org_id = r.startup_org_id
        and m.program_org_id = r.program_org_id
        and m.deal_id = r.deal_id
        and m.revoked_at is null
    ) into v_mandat;

    if not public.is_org_member(r.startup_org_id)
       and not (v_mandat and public.is_org_member(r.program_org_id)) then
      raise exception 'décision réservée à l''entreprise, sauf mandat';
    end if;
  else
    raise exception 'transition non permise';
  end if;

  update public.access_requests
  set status = p_decision,
      program_note = coalesce(p_note, program_note),
      decided_by = auth.uid(),
      decided_at = now()
  where id = p_request;

  -- L'ACCÈS RÉEL, et non le seul mot « accordé ».
  if p_decision = 'granted' then
    select org_id into v_org from public.deals where id = r.deal_id;

    insert into public.memberships (org_id, user_id, role)
    values (v_org, r.investor_user, 'guest')
    on conflict (org_id, user_id) do nothing;

    for v_folder in
      select f.id from public.folders f
      where f.deal_id = r.deal_id and f.parent_id is null
    loop
      insert into public.permissions (deal_id, user_id, folder_id, level, granted_by)
      values (r.deal_id, r.investor_user, v_folder.id, 'watermark', auth.uid())
      on conflict (user_id, folder_id) do update set level = excluded.level;
    end loop;

  elsif p_decision = 'refused' then
    -- Symétrie : refuser après avoir accordé doit FERMER la porte, pas
    -- seulement changer un mot.
    update public.permissions
    set level = 'none'
    where deal_id = r.deal_id and user_id = r.investor_user;
  end if;

  perform public.write_audit(
    r.startup_org_id,
    'access_request.' || p_decision::text,
    'access_request',
    p_request::text,
    jsonb_build_object(
      'instrument', r.instrument,
      'par_le_programme', public.is_org_member(r.program_org_id),
      'sous_mandat', v_mandat
    ),
    r.deal_id
  );
end;
$$;

grant execute on function public.decide_access_request(uuid, public.access_request_status, text) to authenticated;
