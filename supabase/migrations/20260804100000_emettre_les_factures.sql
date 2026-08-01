-- Émettre une facture à chaque paiement encaissé.
--
-- QUI ÉMET LA FACTURE. Pas Genius Pay : eux encaissent, ils ne vendent rien.
-- C'est Sanza qui vend un abonnement, donc c'est Sanza qui doit la pièce
-- comptable. La table existait depuis le socle et personne ne l'alimentait :
-- l'écran affichait « aucune facture » à une organisation qui venait de payer.
--
-- LA NUMÉROTATION EST CONTINUE ET SANS TROU, par année civile. Une numérotation
-- à trous est un défaut comptable dans la plupart des juridictions de la zone
-- UEMOA — un contrôleur qui voit sauter le numéro 7 demande où il est passé.
-- D'où le verrou consultatif : deux paiements simultanés ne peuvent pas
-- réserver le même numéro.
--
-- Ré-exécutable.

create or replace function public.emettre_facture(
  p_org uuid,
  p_subscription uuid,
  p_montant bigint,
  p_devise text default 'XOF',
  p_provider text default null,
  p_reference text default null
)
returns public.invoices
language plpgsql security definer set search_path = public as $$
declare
  v_annee int := extract(year from now());
  v_rang  int;
  v_row   public.invoices;
begin
  -- Un verrou par organisation et par année : le temps de lire le dernier
  -- numéro et d'écrire le suivant, personne d'autre ne le fait.
  perform pg_advisory_xact_lock(hashtext(p_org::text || v_annee::text));

  select count(*) + 1 into v_rang
  from public.invoices
  where workspace_id = p_org
    and extract(year from coalesce(issued_at, created_at)) = v_annee;

  insert into public.invoices (
    workspace_id, subscription_id, number, status, currency, total_amount,
    issued_at, paid_at, provider, external_invoice_id
  )
  values (
    p_org, p_subscription,
    format('SANZA-%s-%s', v_annee, lpad(v_rang::text, 4, '0')),
    'paid', p_devise, p_montant,
    now(), now(), p_provider, p_reference
  )
  returning * into v_row;

  return v_row;
end;
$$;

revoke execute on function public.emettre_facture(uuid, uuid, bigint, text, text, text)
  from public, anon, authenticated;


/**
 * `apply_billing_event` émet désormais la facture en même temps qu'elle ouvre
 * le plan. Les deux gestes sont indissociables : un plan ouvert sans facture
 * est une vente sans trace.
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
  v_abo    public.subscriptions;
  v_montant bigint;
  v_devise  text;
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

  if v_insere is null then
    return 'deja_traite';
  end if;

  if p_org is null then
    return 'enregistre';
  end if;

  if p_type in ('payment.succeeded', 'subscription.renewed') and p_plan_code is not null then
    v_abo := public.set_workspace_plan(
      p_org, p_plan_code, p_interval, p_provider, p_event_id, 'now'
    );

    -- Le montant réellement encaissé, s'il est dans la notification ; sinon le
    -- tarif du plan. On préfère le premier : c'est ce que le client a payé, et
    -- une facture doit dire cela, pas ce qu'elle aurait dû coûter.
    v_montant := coalesce(
      nullif(p_payload #>> '{data,amount}', '')::numeric::bigint,
      nullif(p_payload #>> '{montant}', '')::numeric::bigint,
      (select pp.unit_amount from public.plan_prices pp
         join public.plans pl on pl.id = pp.plan_id
        where pl.code = p_plan_code and pp.billing_interval = p_interval
        limit 1)
    );

    v_devise := coalesce(
      nullif(p_payload #>> '{data,currency}', ''),
      nullif(p_payload #>> '{devise}', ''),
      'XOF'
    );

    if v_montant is not null and v_montant > 0 then
      perform public.emettre_facture(
        p_org, v_abo.id, v_montant, v_devise, p_provider,
        coalesce(nullif(p_payload #>> '{data,reference}', ''), p_event_id)
      );
    end if;

    return 'plan_active';
  end if;

  if p_type = 'subscription.cancelled' then
    perform public.cancel_workspace_subscription(p_org, false, 'Résiliation confirmée par ' || p_provider);
    return 'resiliation_enregistree';
  end if;

  return 'enregistre';
end;
$$;

revoke execute on function public.apply_billing_event(text, text, text, uuid, text, text, jsonb)
  from public, anon, authenticated;
