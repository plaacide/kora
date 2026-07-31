-- Encaisser réellement — la notification du prestataire ouvre le plan.
--
-- LE PROBLÈME QUE CETTE MIGRATION RÈGLE. `set_workspace_plan` et
-- `cancel_workspace_subscription` exigent d'être propriétaire ou administrateur
-- de l'organisation. C'est juste pour un humain — et impossible pour un
-- webhook, qui n'a aucune session : `auth.uid()` y est nul, donc `has_org_role`
-- répond faux et le paiement encaissé n'ouvrirait jamais rien.
--
-- CE QU'IL NE FAUT SURTOUT PAS FAIRE : accepter « auth.uid() est nul » comme
-- laissez-passer. Le rôle `anon` a lui aussi un `auth.uid()` nul. Ce serait
-- ouvrir le changement de plan à n'importe quel visiteur. On teste donc le RÔLE
-- (`service_role`), qui vient d'un jeton signé et ne s'usurpe pas.
--
-- Ré-exécutable.

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
  -- Un humain doit avoir le rôle ; une machine doit être LA machine.
  if not (
    public.has_org_role(p_org, array['owner', 'admin']::public.org_role[])
    or auth.role() = 'service_role'
  ) then
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
      -- §14.2 : souscrire pendant l'essai y met fin.
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


create or replace function public.cancel_workspace_subscription(
  p_org uuid,
  p_immediat boolean default false,
  p_motif text default null
)
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
    status = case when p_immediat then 'cancelled' else status end,
    cancel_at_period_end = not p_immediat,
    updated_at = now()
  where workspace_id = p_org
    and status in ('trialing', 'active', 'past_due', 'manual_contract', 'pending')
  returning * into v_row;

  if v_row.id is null then raise exception 'aucun abonnement en cours'; end if;

  insert into public.billing_events (
    workspace_id, subscription_id, event_type, provider, payload
  )
  values (
    p_org, v_row.id, 'subscription.cancelled', 'manual',
    jsonb_strip_nulls(jsonb_build_object('immediat', p_immediat, 'motif', p_motif))
  );

  perform public.write_audit(
    p_org, 'subscription.cancelled', 'subscription', v_row.id::text,
    jsonb_strip_nulls(jsonb_build_object('immediat', p_immediat, 'motif', p_motif))
  );

  return v_row;
end;
$$;

grant execute on function public.cancel_workspace_subscription(uuid, boolean, text)
  to authenticated;


/**
 * Appliquer une notification de prestataire, une seule fois.
 *
 * L'IDEMPOTENCE VIT ICI ET NON DANS L'APPLICATION. Tous les prestataires
 * rejouent leurs notifications — c'est même leur devoir quand ils n'ont pas
 * reçu de réponse. Si l'application décidait seule, deux envois simultanés
 * passeraient tous les deux le « ai-je déjà vu cet événement ? » avant que l'un
 * n'écrive. L'unicité `(provider, external_event_id)` de `billing_events` est
 * le seul juge qui ne se trompe pas, parce qu'il est atomique.
 *
 * Rend ce qui s'est passé, en clair : « deja_traite », « plan_active »,
 * « resiliation_enregistree » ou « enregistre ». Un webhook muet est un webhook
 * qu'on ne saura pas déboguer à trois heures du matin.
 */
create or replace function public.apply_billing_event(
  p_provider text,
  p_event_id text,
  p_type text,
  p_org uuid,
  p_plan_code text default null,
  p_interval text default 'month',
  p_payload jsonb default '{}'::jsonb
)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_insere uuid;
begin
  if auth.role() <> 'service_role' then
    raise exception 'réservé au serveur';
  end if;

  insert into public.billing_events (
    workspace_id, event_type, provider, external_event_id, payload, processed_at
  )
  values (p_org, p_type, p_provider, p_event_id, p_payload, now())
  on conflict (provider, external_event_id) do nothing
  returning id into v_insere;

  -- Déjà vu : on s'arrête AVANT d'agir. C'est tout l'intérêt.
  if v_insere is null then
    return 'deja_traite';
  end if;

  if p_org is null then
    -- Un paiement dont on ignore l'organisation ne peut rien ouvrir. On le
    -- garde tout de même en base : il faudra comprendre d'où il venait.
    return 'enregistre';
  end if;

  if p_type in ('payment.succeeded', 'subscription.renewed') and p_plan_code is not null then
    perform public.set_workspace_plan(
      p_org, p_plan_code, p_interval, p_provider, p_event_id, 'now'
    );
    return 'plan_active';
  end if;

  if p_type = 'subscription.cancelled' then
    -- Fin de période, jamais immédiat : le §15 interdit de retirer ce qui a
    -- été payé, et le prestataire ne nous dit pas que le client a renoncé au
    -- temps qu'il a réglé.
    perform public.cancel_workspace_subscription(p_org, false, 'Résiliation confirmée par ' || p_provider);
    return 'resiliation_enregistree';
  end if;

  return 'enregistre';
end;
$$;

-- Ni un client, ni un visiteur : seul le serveur.
revoke execute on function public.apply_billing_event(text, text, text, uuid, text, text, jsonb)
  from public, anon, authenticated;
