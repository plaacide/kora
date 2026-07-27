-- Une demande sans réponse expire à 30 jours, et se relance UNE FOIS (§5).
--
-- CE QUI MANQUAIT. Rien. Ni colonne, ni délai, ni affichage : une demande
-- restait `pending` indéfiniment. Or c'est le pire état pour l'investisseur —
-- il ne sait pas s'il a été oublié ou écarté en silence — et pour l'entreprise,
-- qui voit sa file grossir de demandes que plus personne ne suivra.
--
-- SANS TÂCHE PLANIFIÉE. L'expiration est CALCULÉE, pas balayée : il n'y a pas
-- d'ordonnanceur sur cette installation, et en fabriquer un pour changer un
-- statut serait disproportionné. Une demande expirée reste donc `pending` en
-- base ; c'est son échéance qui la dit périmée. Deux avantages inattendus :
-- la relance n'a rien à « ressusciter », et l'historique reste lisible — on
-- voit quand la demande a été faite, pas quand un robot est passé.
--
-- ⚠️ Corollaire : tout ce qui DÉCIDE d'une demande doit vérifier l'échéance.
-- Un statut qui ment doit être rattrapé partout, sinon il ne ment qu'à moitié.
-- D'où la garde ajoutée à `decide_access_request` plus bas.

alter table public.access_requests
  add column if not exists relaunched_at timestamptz;

comment on column public.access_requests.relaunched_at is
  'Relance unique par l''investisseur. Repousse l''échéance de 30 jours à '
  'compter de cette date. Non nul = la relance est consommée.';

-- Le délai vit ICI, pas dans chaque requête. Immutable pour rester utilisable
-- dans un index si le volume l'exige un jour.
create or replace function public.access_request_deadline(
  p_created   timestamptz,
  p_relaunched timestamptz
)
returns timestamptz
language sql immutable set search_path = public as $$
  select coalesce(p_relaunched, p_created) + interval '30 days';
$$;

/**
 * L'investisseur relance sa demande restée sans réponse.
 *
 * UNE SEULE FOIS, et c'est le point. Une relance illimitée transforme la file
 * du programme en boîte de réclamation, et retire à l'expiration tout son sens.
 * `relaunched_at` non nul suffit à le dire : pas de compteur, pas d'état
 * intermédiaire à maintenir.
 *
 * Relançable AVANT comme APRÈS l'échéance. Interdire la relance d'une demande
 * périmée obligerait l'investisseur à en déposer une nouvelle — même effet,
 * mais l'historique perdrait le lien entre les deux.
 */
create or replace function public.relaunch_access_request(p_request uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  r public.access_requests;
begin
  if auth.uid() is null then raise exception 'non authentifié'; end if;

  select * into r from public.access_requests where id = p_request;
  if r.id is null then raise exception 'demande introuvable'; end if;

  -- L'auteur, et lui seul. Ni le programme ni l'entreprise ne relancent une
  -- demande à la place de celui qui l'a faite.
  if r.investor_user is distinct from auth.uid() then
    raise exception 'réservé à l''auteur de la demande';
  end if;

  if r.status <> 'pending' then
    raise exception 'cette demande a déjà reçu une réponse';
  end if;

  if r.relaunched_at is not null then
    raise exception 'vous avez déjà relancé cette demande une fois';
  end if;

  update public.access_requests
  set relaunched_at = now()
  where id = p_request;

  -- Au journal de l'ENTREPRISE : c'est chez elle que la demande attend.
  perform public.write_audit(
    r.startup_org_id, 'access_request.relaunched', 'access_request',
    p_request::text, '{}'::jsonb, r.deal_id
  );
end;
$$;

grant execute on function public.access_request_deadline(timestamptz, timestamptz) to authenticated;
grant execute on function public.relaunch_access_request(uuid) to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- `decide_access_request` — signature REPRISE À L'IDENTIQUE de la migration
-- 20260728140000, y compris le `default null` de `p_note` (cf. AGENTS.md :
-- retirer un défaut par `create or replace` échoue en 42P13).
--
-- SEUL AJOUT : le refus de décider d'une demande périmée. Sans lui, l'écran
-- afficherait « expirée » tout en laissant le bouton fonctionner — et
-- l'expiration ne serait qu'une décoration.
-- ═══════════════════════════════════════════════════════════════════════════
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

  -- Périmée : plus personne ne décide. L'investisseur relance, ou dépose une
  -- nouvelle demande. Accorder un accès sur une demande de trois mois, c'est
  -- répondre à quelqu'un qui n'attend plus.
  if r.status = 'pending'
     and now() > public.access_request_deadline(r.created_at, r.relaunched_at)
  then
    raise exception 'cette demande a expiré ; elle doit être relancée';
  end if;

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
