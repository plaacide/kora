-- Changer de plan — chapitres 14, 15, 16 et 18 de l'architecture pricing.
--
-- Ces règles vivent en base et non dans l'application, pour la même raison que
-- les droits : un changement de plan sera déclenché par un webhook de
-- prestataire, par une activation administrative ou par un écran. Trois portes,
-- une seule serrure.
--
-- CE QUE LE DOCUMENT TRANCHE, ET QU'IL FAUT RESPECTER À LA LETTRE :
--
--   §14 — un passage vers un plan SUPÉRIEUR s'applique tout de suite, et met
--         fin à l'essai en cours.
--   §15 — un passage vers un plan INFÉRIEUR ne supprime RIEN. Il prend effet à
--         la fin de la période déjà payée, sauf intervention administrative.
--         Les opérations en trop restent : c'est la CRÉATION d'une nouvelle qui
--         se refuse, jamais l'existant qui s'efface.
--   §16 — un impayé laisse l'accès en lecture. On ne supprime pas les données
--         d'un client qui a payé onze mois sur douze.
--
-- Ré-exécutable.

/**
 * Le rang d'un plan dans son segment.
 *
 * `display_order` sert déjà à l'affichage, et il suit le prix : Ready 1, Raise
 * 2, Close 3. S'en servir pour distinguer montée et descente évite une seconde
 * colonne qui finirait par le contredire.
 */
create or replace function public.plan_rank(p_plan uuid)
returns int
language sql stable security definer set search_path = public as $$
  select display_order from public.plans where id = p_plan;
$$;

grant execute on function public.plan_rank(uuid) to authenticated;


/**
 * Poser le plan d'un espace de travail.
 *
 * `p_mode` dit COMMENT le changement a été obtenu — virement reçu, activation
 * administrative, paiement en ligne. Il n'est pas décoratif : c'est lui qui
 * justifiera, six mois plus tard, pourquoi une organisation a le plan Close
 * sans qu'aucune transaction n'apparaisse chez le prestataire.
 *
 * `p_effective` vaut `now` ou `period_end`. Le second n'est permis que pour une
 * descente : différer une MONTÉE ferait payer sans servir.
 */
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

  -- La fin de période : un mois ou un an selon l'intervalle, à partir
  -- d'aujourd'hui. Une descente différée garde la fin déjà payée.
  v_fin := case
    when p_effective = 'period_end' and v_actuel.current_period_end is not null
      then v_actuel.current_period_end
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
    update public.subscriptions set
      plan_id = v_plan.id,
      -- §14.2 : souscrire pendant l'essai y met fin. Laisser `trialing` ferait
      -- retomber l'organisation au plan gratuit à la date d'échéance, alors
      -- qu'elle vient justement de payer.
      status = 'active',
      billing_interval = p_interval,
      current_period_start = case
        when p_effective = 'period_end' then current_period_start else now()
      end,
      current_period_end = v_fin,
      trial_start = null,
      trial_end = null,
      cancel_at_period_end = false,
      updated_at = now()
    where id = v_actuel.id
    returning * into v_row;
  end if;

  insert into public.billing_events (
    workspace_id, subscription_id, event_type, provider, payload
  )
  values (
    p_org, v_row.id,
    case when v_montee then 'plan.upgraded' else 'plan.downgraded' end,
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
      'plan', p_plan_code, 'mode', p_mode, 'reference', p_reference
    ))
  );

  return v_row;
end;
$$;

grant execute on function public.set_workspace_plan(
  uuid, text, text, text, text, text
) to authenticated;


/**
 * Résilier.
 *
 * Par défaut à la fin de la période déjà payée : ce qui est réglé est dû, et
 * couper le jour de la demande reviendrait à garder l'argent sans le service.
 * Rien n'est supprimé — §15 et §16 l'interdisent tous les deux.
 */
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
  if not public.has_org_role(p_org, array['owner', 'admin']::public.org_role[]) then
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
 * L'essai arrivé à terme retombe au plan gratuit — §17.
 *
 * Écrite pour être appelée par une tâche planifiée. Elle ne supprime rien : les
 * données restent, seules les fonctions du plan supérieur se referment.
 */
create or replace function public.expire_trials()
returns int
language plpgsql security definer set search_path = public as $$
declare
  v_gratuit uuid;
  v_compte  int;
begin
  select id into v_gratuit from public.plans where code = 'business_ready';

  with expires as (
    update public.subscriptions s set
      plan_id = v_gratuit,
      status = 'active',
      trial_end = null,
      current_period_start = now(),
      current_period_end = null,
      updated_at = now()
    where s.status = 'trialing'
      and s.trial_end is not null
      and s.trial_end <= now()
    returning s.id, s.workspace_id
  )
  insert into public.billing_events (
    workspace_id, subscription_id, event_type, provider, payload
  )
  select e.workspace_id, e.id, 'trial.expired', 'system',
         jsonb_build_object('plan', 'business_ready')
  from expires e;

  get diagnostics v_compte = row_count;
  return v_compte;
end;
$$;

-- Appelée par une tâche planifiée, jamais par un client.
revoke execute on function public.expire_trials() from authenticated;
