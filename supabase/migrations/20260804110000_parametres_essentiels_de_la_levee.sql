-- Ce que la maquette 39 affiche et que la base ne portait pas.
--
-- L'écran annonçait « ticket minimum et maximum, recherche d'un lead et part de
-- capital envisagée ne sont pas encore enregistrables : aucune colonne ne les
-- porte ». C'était honnête, et c'était un aveu : les « Paramètres essentiels »
-- de la vue de levée affichaient donc des valeurs qui ne venaient de nulle part.
--
-- POURQUOI DEUX COLONNES POUR LE TICKET plutôt qu'un texte libre. « 25 – 150 M »
-- se compare, se trie, et permettra un jour de dire à un investisseur si son
-- ticket entre dans la fourchette. Un texte ne fait rien de tout cela.
--
-- POURQUOI `usages_fonds` EN JSONB. C'est une répartition — « réseau 60 %,
-- équipe 25 %, BFR 15 % » — dont les postes changent d'une levée à l'autre.
-- Des colonnes fixes obligeraient à en inventer la liste, et à migrer chaque
-- fois qu'un fondateur en nomme un autre.
--
-- Ré-exécutable.

alter table public.raises
  add column if not exists ticket_min bigint,
  add column if not exists ticket_max bigint,
  add column if not exists lead_statut text,
  add column if not exists part_capital numeric(5,2),
  add column if not exists usages_fonds jsonb not null default '[]'::jsonb;

-- Une fourchette inversée est une faute de saisie, pas une donnée : la refuser
-- ici évite d'afficher « 150 – 25 M » sur la vue de levée.
alter table public.raises drop constraint if exists raises_ticket_coherent;
alter table public.raises add constraint raises_ticket_coherent
  check (ticket_min is null or ticket_max is null or ticket_min <= ticket_max);

-- Trois états, et pas davantage : on cherche un lead, on en a un, ou le tour
-- s'en passe. « Peut-être » n'aiderait personne à décider quoi faire ensuite.
alter table public.raises drop constraint if exists raises_lead_statut_connu;
alter table public.raises add constraint raises_lead_statut_connu
  check (lead_statut is null or lead_statut in ('recherche', 'trouve', 'sans_lead'));

-- Une part de capital hors de [0, 100] n'a pas de sens.
alter table public.raises drop constraint if exists raises_part_capital_plausible;
alter table public.raises add constraint raises_part_capital_plausible
  check (part_capital is null or (part_capital >= 0 and part_capital <= 100));


create or replace function public.save_raise(
  p_deal uuid,
  p_montant_cible bigint default null,
  p_montant_engage bigint default null,
  p_devise text default null,
  p_type_tour text default null,
  p_stade text default null,
  p_valorisation_pre bigint default null,
  p_date_cloture date default null,
  p_audience text[] default null,
  p_description text default null,
  p_name text default null,
  p_ticket_min bigint default null,
  p_ticket_max bigint default null,
  p_lead_statut text default null,
  p_part_capital numeric default null,
  p_usages_fonds jsonb default null
)
returns public.raises
language plpgsql security definer set search_path = public as $$
declare
  v_org   uuid := public.deal_org_for_write(p_deal);
  v_raise public.raises;
begin
  if p_audience is not null then
    p_audience := array(
      select x from unnest(p_audience) as x where x in ('vc', 'dfi', 'banque')
    );
  end if;

  -- Un statut de lead inconnu est ignoré plutot que de faire echouer tout
  -- l'enregistrement : le reste de la saisie du fondateur n'y est pour rien.
  if p_lead_statut is not null
     and p_lead_statut not in ('recherche', 'trouve', 'sans_lead') then
    p_lead_statut := null;
  end if;

  select * into v_raise from public.raises
  where deal_id = p_deal and statut = 'en_cours';

  if v_raise.id is null then
    insert into public.raises (
      deal_id, org_id, montant_cible, montant_engage, devise, type_tour,
      stade, valorisation_pre, date_cloture, audience, description, name,
      ticket_min, ticket_max, lead_statut, part_capital, usages_fonds
    ) values (
      p_deal, v_org, p_montant_cible, coalesce(p_montant_engage, 0),
      coalesce(nullif(trim(p_devise), ''), 'USD'), p_type_tour, p_stade,
      p_valorisation_pre, p_date_cloture, coalesce(p_audience, '{}'),
      p_description, nullif(trim(p_name), ''),
      p_ticket_min, p_ticket_max, p_lead_statut, p_part_capital,
      coalesce(p_usages_fonds, '[]'::jsonb)
    )
    returning * into v_raise;
  else
    update public.raises set
      montant_cible    = coalesce(p_montant_cible, montant_cible),
      montant_engage   = coalesce(p_montant_engage, montant_engage),
      devise           = coalesce(nullif(trim(p_devise), ''), devise),
      type_tour        = coalesce(p_type_tour, type_tour),
      stade            = coalesce(p_stade, stade),
      valorisation_pre = coalesce(p_valorisation_pre, valorisation_pre),
      date_cloture     = coalesce(p_date_cloture, date_cloture),
      audience         = coalesce(p_audience, audience),
      description      = coalesce(p_description, description),
      name             = coalesce(nullif(trim(p_name), ''), name),
      ticket_min       = coalesce(p_ticket_min, ticket_min),
      ticket_max       = coalesce(p_ticket_max, ticket_max),
      lead_statut      = coalesce(p_lead_statut, lead_statut),
      part_capital     = coalesce(p_part_capital, part_capital),
      usages_fonds     = coalesce(p_usages_fonds, usages_fonds),
      updated_at       = now()
    where id = v_raise.id
    returning * into v_raise;
  end if;

  perform public.write_audit(
    v_org, 'raise.updated', 'raise', v_raise.id::text,
    jsonb_strip_nulls(jsonb_build_object(
      'montant_cible', p_montant_cible, 'montant_engage', p_montant_engage,
      'devise', p_devise, 'type_tour', p_type_tour, 'stade', p_stade,
      'valorisation_pre', p_valorisation_pre, 'date_cloture', p_date_cloture,
      'audience', to_jsonb(p_audience), 'description', p_description,
      'name', p_name, 'ticket_min', p_ticket_min, 'ticket_max', p_ticket_max,
      'lead_statut', p_lead_statut, 'part_capital', p_part_capital,
      'usages_fonds', p_usages_fonds
    )),
    p_deal
  );

  return v_raise;
end;
$$;

grant execute on function public.save_raise(
  uuid, bigint, bigint, text, text, text, bigint, date, text[], text, text,
  bigint, bigint, text, numeric, jsonb
) to authenticated;
