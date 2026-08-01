-- Revenir sur une résiliation annoncée — écran 77.
--
-- L'écran promet « vous pouvez vous réabonner à tout moment et tout
-- retrouver ». Sans cette fonction, tenir cette promesse obligeait à écrire au
-- support : rien ne savait défaire un `cancel_at_period_end`.
--
-- POURQUOI PAS `set_workspace_plan` AVEC LE MÊME PLAN. Elle recalculerait
-- `current_period_end` à partir d'aujourd'hui — offrant un mois entier à qui
-- résilie puis se ravise dans la foulée. Reprendre n'est pas racheter : on
-- lève l'annonce, la période payée reste celle qu'on a payée.
--
-- Refuse quand le terme est passé : il n'y a plus rien à reprendre, il faut
-- souscrire de nouveau.
--
-- Ré-exécutable.

create or replace function public.resume_workspace_subscription(p_org uuid)
returns public.subscriptions
language plpgsql security definer set search_path = public as $$
declare
  v_row public.subscriptions;
begin
  if not (
    public.has_org_role(p_org, array['owner', 'admin']::public.org_role[])
    or auth.role() = 'service_role'
  ) then
    raise exception 'droits insuffisants';
  end if;

  update public.subscriptions set
    cancel_at_period_end = false,
    updated_at = now()
  where workspace_id = p_org
    and cancel_at_period_end
    and status in ('trialing', 'active', 'past_due', 'manual_contract')
    and (current_period_end is null or current_period_end > now())
  returning * into v_row;

  if v_row.id is null then
    raise exception 'aucune résiliation à reprendre';
  end if;

  insert into public.billing_events (
    workspace_id, subscription_id, event_type, provider, payload
  )
  values (p_org, v_row.id, 'subscription.resumed', 'app', '{}'::jsonb);

  perform public.write_audit(
    p_org, 'subscription.changed', 'subscription', v_row.id::text,
    jsonb_build_object('geste', 'reprise')
  );

  return v_row;
end;
$$;

grant execute on function public.resume_workspace_subscription(uuid) to authenticated;
