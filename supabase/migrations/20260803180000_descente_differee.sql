-- Une descente de plan ne retire pas ce qui est déjà payé — §15.
--
-- Ma première écriture changeait le plan À L'INSTANT même quand l'effet était
-- demandé à la fin de période : elle ne conservait que la date de fin. Un
-- client ayant réglé le plan Close jusqu'en 2027 le perdait le jour où il
-- annonçait vouloir descendre. C'est exactement ce que le §15 interdit.
--
-- Une descente différée n'applique donc rien : elle ANNONCE. Le plan payé court
-- jusqu'à son terme, et trois colonnes portent la suite.
--
-- Ré-exécutable.

alter table public.subscriptions
  add column if not exists pending_plan_id uuid references public.plans(id),
  add column if not exists pending_effective_at timestamptz,
  add column if not exists pending_interval text;


create or replace function public.set_workspace_plan(
  p_org uuid,
  p_plan_code text,
  p_interval text default 'month',
  p_mode text default 'manual',
  p_reference text default null,
  p_effective text default 'now'
)
returns public.subscriptions
language plpgsql security definer set search_path = public as $$
declare
  v_plan    public.plans;
  v_actuel  public.subscriptions;
  v_row     public.subscriptions;
  v_montee  boolean;
  v_fin     timestamptz;
begin
  if not public.has_org_role(p_org, array['owner', 'admin']::public.org_role[]) then
    raise exception 'droits insuffisants';
  end if;

  select * into v_plan from public.plans where code = p_plan_code and is_active;
  if v_plan.id is null then raise exception 'plan inconnu'; end if;

  select * into v_actuel from public.subscriptions
  where workspace_id = p_org
    and status in ('trialing', 'active', 'past_due', 'manual_contract', 'pending');

  v_montee := v_actuel.id is null
    or public.plan_rank(v_plan.id) >= public.plan_rank(v_actuel.plan_id);

  -- Une montée différée n'a pas de sens : on facturerait sans servir.
  if p_effective = 'period_end' and v_montee then
    p_effective := 'now';
  end if;

  if p_effective = 'period_end'
     and v_actuel.id is not null
     and v_actuel.current_period_end is not null then
    -- On n'écrit PAS `plan_id` : le plan payé reste servi jusqu'à son terme.
    update public.subscriptions set
      pending_plan_id = v_plan.id,
      pending_interval = p_interval,
      pending_effective_at = v_actuel.current_period_end,
      cancel_at_period_end = false,
      updated_at = now()
    where id = v_actuel.id
    returning * into v_row;
  else
    v_fin := case
      when p_interval = 'year' then now() + interval '1 year'
      else now() + interval '1 month'
    end;

    if v_actuel.id is null then
      insert into public.subscriptions (
        workspace_id, plan_id, status, billing_interval,
        current_period_start, current_period_end
      )
      values (p_org, v_plan.id, 'active', p_interval, now(), v_fin)
      returning * into v_row;
    else
      -- §14.2 : souscrire pendant l'essai y met fin. Laisser `trialing` ferait
      -- retomber l'organisation au plan gratuit à l'échéance, alors qu'elle
      -- vient justement de payer.
      update public.subscriptions set
        plan_id = v_plan.id,
        status = 'active',
        billing_interval = p_interval,
        current_period_start = now(),
        current_period_end = v_fin,
        trial_start = null,
        trial_end = null,
        cancel_at_period_end = false,
        pending_plan_id = null,
        pending_interval = null,
        pending_effective_at = null,
        updated_at = now()
      where id = v_actuel.id
      returning * into v_row;
    end if;
  end if;

  insert into public.billing_events (
    workspace_id, subscription_id, event_type, provider, payload
  )
  values (
    p_org, v_row.id,
    case when v_montee then 'plan.upgraded' else 'plan.downgrade_scheduled' end,
    p_mode,
    jsonb_strip_nulls(jsonb_build_object(
      'plan', p_plan_code, 'intervalle', p_interval,
      'reference', p_reference, 'effet', p_effective,
      'plan_precedent', (select code from public.plans where id = v_actuel.plan_id)
    ))
  );

  perform public.write_audit(
    p_org, 'subscription.changed', 'subscription', v_row.id::text,
    jsonb_strip_nulls(jsonb_build_object(
      'plan', p_plan_code, 'mode', p_mode, 'reference', p_reference,
      'effet', p_effective
    ))
  );

  return v_row;
end;
$$;

grant execute on function public.set_workspace_plan(
  uuid, text, text, text, text, text
) to authenticated;


/**
 * Basculer les descentes arrivées à échéance.
 *
 * Écrite pour une tâche planifiée, comme `expire_trials`. Sans elle, une
 * descente annoncée le resterait pour toujours — et le client garderait un plan
 * qu'il ne paie plus.
 */
create or replace function public.apply_pending_plans()
returns int
language plpgsql security definer set search_path = public as $$
declare
  v_compte int;
begin
  with bascules as (
    update public.subscriptions s set
      plan_id = s.pending_plan_id,
      billing_interval = coalesce(s.pending_interval, s.billing_interval),
      current_period_start = now(),
      current_period_end = case
        when coalesce(s.pending_interval, s.billing_interval) = 'year'
          then now() + interval '1 year'
        else now() + interval '1 month'
      end,
      pending_plan_id = null,
      pending_interval = null,
      pending_effective_at = null,
      updated_at = now()
    where s.pending_plan_id is not null
      and s.pending_effective_at is not null
      and s.pending_effective_at <= now()
    returning s.id, s.workspace_id, s.plan_id
  )
  insert into public.billing_events (
    workspace_id, subscription_id, event_type, provider, payload
  )
  select b.workspace_id, b.id, 'plan.downgraded', 'system',
         jsonb_build_object('plan', (select code from public.plans where id = b.plan_id))
  from bascules b;

  get diagnostics v_compte = row_count;
  return v_compte;
end;
$$;

-- Appelée par une tâche planifiée, jamais par un client.
revoke execute on function public.apply_pending_plans() from authenticated;
