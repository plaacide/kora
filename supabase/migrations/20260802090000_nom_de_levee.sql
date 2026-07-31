-- `save_raise` sait tout enregistrer d'une levée, sauf son nom.
--
-- Le nom n'était posé qu'à la création (`create_raise`), et l'écran de
-- configuration le propose pourtant en premier champ. Faute de paramètre,
-- l'application l'écrivait directement sur la table — or `raises` porte un
-- `revoke update ... from authenticated` : l'écriture était refusée SANS
-- erreur, zéro ligne touchée. Le fondateur saisissait « Série A 2027 »,
-- l'écran répondait « enregistré », et le titre restait « Nouvelle levée ».
--
-- C'est le pire genre de panne : silencieuse, et du côté qui donne confiance.
--
-- Ré-exécutable.

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
  p_name text default null
)
returns public.raises
language plpgsql security definer set search_path = public as $$
declare
  v_org   uuid := public.deal_org_for_write(p_deal);
  v_raise public.raises;
begin
  -- Audience : ne garder que des valeurs connues (filtre défensif).
  if p_audience is not null then
    p_audience := array(
      select x from unnest(p_audience) as x where x in ('vc', 'dfi', 'banque')
    );
  end if;

  select * into v_raise from public.raises
  where deal_id = p_deal and statut = 'en_cours';

  if v_raise.id is null then
    insert into public.raises (
      deal_id, org_id, montant_cible, montant_engage, devise, type_tour,
      stade, valorisation_pre, date_cloture, audience, description, name
    ) values (
      p_deal, v_org, p_montant_cible, coalesce(p_montant_engage, 0),
      coalesce(nullif(trim(p_devise), ''), 'USD'), p_type_tour, p_stade,
      p_valorisation_pre, p_date_cloture, coalesce(p_audience, '{}'),
      p_description, nullif(trim(p_name), '')
    )
    returning * into v_raise;
  else
    -- coalesce : mise à jour partielle, seuls les champs fournis changent.
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
      'name', p_name
    )),
    p_deal
  );

  return v_raise;
end;
$$;

-- L'ancienne signature à dix arguments est retirée : deux fonctions de même
-- nom dont l'une a un paramètre de plus rendraient l'appel ambigu, et
-- PostgREST refuserait de choisir.
drop function if exists public.save_raise(
  uuid, bigint, bigint, text, text, text, bigint, date, text[], text
);

grant execute on function public.save_raise(
  uuid, bigint, bigint, text, text, text, bigint, date, text[], text, text
) to authenticated;
