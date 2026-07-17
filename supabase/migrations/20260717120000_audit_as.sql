-- Audit écrit par le serveur pour le compte d'un utilisateur (viewer).
-- Le client privilégié (service_role) n'a pas de auth.uid() : l'acteur est
-- passé explicitement. Réservé à service_role — sinon un utilisateur pourrait
-- forger des entrées au nom d'un autre.

create or replace function public.write_audit_as(
  p_actor uuid,
  p_org uuid,
  p_action text,
  p_target_type text default null,
  p_target_id text default null,
  p_metadata jsonb default '{}'::jsonb,
  p_deal uuid default null
)
returns bigint
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_prev    text;
  v_created timestamptz := clock_timestamp();
  v_email   text;
  v_payload text;
  v_hash    text;
  v_id      bigint;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_org::text, 0));

  select entry_hash into v_prev
  from public.audit_log
  where org_id = p_org
  order by id desc
  limit 1;

  select email into v_email from auth.users where id = p_actor;

  -- Format identique à write_audit() : verify_audit_chain() doit pouvoir
  -- recalculer la chaîne indifféremment de qui a écrit l'entrée.
  v_payload := coalesce(v_prev, 'GENESIS') || '|' || p_org::text || '|'
            || coalesce(p_deal::text, '') || '|' || coalesce(p_actor::text, '') || '|'
            || p_action || '|' || coalesce(p_target_type, '') || '|'
            || coalesce(p_target_id, '') || '|' || p_metadata::text || '|'
            || v_created::text;

  v_hash := encode(extensions.digest(v_payload, 'sha256'), 'hex');

  insert into public.audit_log (
    org_id, deal_id, actor_id, actor_email, action,
    target_type, target_id, metadata, prev_hash, entry_hash, created_at
  ) values (
    p_org, p_deal, p_actor, v_email, p_action,
    p_target_type, p_target_id, p_metadata, v_prev, v_hash, v_created
  ) returning id into v_id;

  return v_id;
end;
$$;

-- Verrouillage : accessible au serveur uniquement.
revoke all on function public.write_audit_as(uuid, uuid, text, text, text, jsonb, uuid) from public;
revoke all on function public.write_audit_as(uuid, uuid, text, text, text, jsonb, uuid) from anon;
revoke all on function public.write_audit_as(uuid, uuid, text, text, text, jsonb, uuid) from authenticated;
grant execute on function public.write_audit_as(uuid, uuid, text, text, text, jsonb, uuid) to service_role;
