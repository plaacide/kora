-- Corrige l'effacement du nom de la startup lors d'une mise à jour partielle.
--
-- `save_startup` est appelée deux fois pendant l'onboarding fondateur : une
-- fois à l'étape 1 (identité de la startup), une fois à l'étape 2 (montants).
-- Le second appel ne transmet pas le nom — c'est légitime, c'est une mise à
-- jour partielle.
--
-- Le défaut : `coalesce(p_name, '')` dans le VALUES transformait un nom absent
-- en CHAÎNE VIDE. Dans la clause de conflit, `coalesce(excluded.name, s.name)`
-- ne voyait donc plus un null mais une chaîne vide — qu'elle écrasait
-- consciencieusement par-dessus le nom déjà enregistré.
--
-- Résultat : la fiche que les investisseurs consultent se retrouvait sans nom,
-- alors que l'organisation, elle, portait le bon. Constaté en parcourant
-- l'onboarding de bout en bout : `startups.name` valait ''.
--
-- Les autres champs n'étaient pas touchés parce qu'ils transmettent bien null.
--
-- `nullif(excluded.name, '')` rétablit la sémantique voulue : une chaîne vide
-- signifie « non renseigné », donc on garde la valeur existante.

create or replace function public.save_startup(
  p_name text default null,
  p_country text default null,
  p_sector text default null,
  p_stage text default null,
  p_one_liner text default null,
  p_amount bigint default null,
  p_arr bigint default null
)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_readiness int;
begin
  if auth.uid() is null then raise exception 'non authentifié'; end if;
  insert into public.startups as s
    (owner_id, name, country, sector, stage, one_liner, amount_sought_usd, arr_usd)
  values (
    auth.uid(), coalesce(p_name, ''), p_country, p_sector, p_stage,
    p_one_liner, p_amount, p_arr
  )
  on conflict (owner_id) do update set
    -- nullif : une chaîne vide vaut « non renseigné », pas « efface le nom ».
    name              = coalesce(nullif(excluded.name, ''), s.name),
    country           = coalesce(excluded.country, s.country),
    sector            = coalesce(excluded.sector, s.sector),
    stage             = coalesce(excluded.stage, s.stage),
    one_liner         = coalesce(excluded.one_liner, s.one_liner),
    amount_sought_usd = coalesce(excluded.amount_sought_usd, s.amount_sought_usd),
    arr_usd           = coalesce(excluded.arr_usd, s.arr_usd),
    updated_at        = now();

  -- Readiness indicatif : chaque champ rempli compte.
  select
    (case when name <> '' then 15 else 0 end)
    + (case when country is not null then 10 else 0 end)
    + (case when sector is not null then 10 else 0 end)
    + (case when stage is not null then 10 else 0 end)
    + (case when one_liner is not null then 15 else 0 end)
    + (case when amount_sought_usd is not null then 15 else 0 end)
    + (case when arr_usd is not null then 15 else 0 end)
  into v_readiness
  from public.startups where owner_id = auth.uid();

  update public.startups set readiness = least(v_readiness, 100)
  where owner_id = auth.uid();
end;
$$;

grant execute on function public.save_startup(text, text, text, text, text, bigint, bigint) to authenticated;

-- Répare les fiches déjà créées avec un nom vide : on reprend le nom de leur
-- organisation, qui l'a correctement conservé.
update public.startups s
set name = o.name, updated_at = now()
from public.organizations o
where s.org_id = o.id and coalesce(s.name, '') = '';


-- ---------------------------------------------------------------------------
-- Une fondatrice qui termine son onboarding doit trouver SA data room.
--
-- Jusqu'ici, l'onboarding recueillait l'identité de la startup et le montant
-- recherché, puis déposait la fondatrice dans un espace vide qui lui disait
-- « créez un deal » — du vocabulaire de fonds, alors que l'écran de bienvenue
-- venait de lui promettre « complétez votre data room ». Rien à compléter.
--
-- Pour une startup, la levée EST le deal. On le crée donc à partir de ce
-- qu'elle vient de saisir, avec l'arborescence OHADA appliquée par
-- `create_deal`.
-- ---------------------------------------------------------------------------
create or replace function public.complete_onboarding(p_org_name text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_org uuid;
  v_slug text;
  v_type text;
  v_startup public.startups;
begin
  if auth.uid() is null then raise exception 'non authentifié'; end if;

  -- Idempotent : si l'utilisateur a déjà une org, on la réutilise.
  select m.org_id into v_org
  from public.memberships m where m.user_id = auth.uid() limit 1;

  if v_org is null then
    v_slug := public.slugify(coalesce(nullif(trim(p_org_name), ''), 'espace')) || '-' ||
              substr(gen_random_uuid()::text, 1, 6);
    insert into public.organizations (name, slug)
    values (coalesce(nullif(trim(p_org_name), ''), 'Mon espace'), v_slug)
    returning id into v_org;

    insert into public.memberships (user_id, org_id, role)
    values (auth.uid(), v_org, 'owner');

    perform public.write_audit(v_org, 'org.created', 'organization', v_org::text,
      jsonb_build_object('name', p_org_name), null);
  end if;

  -- Rattache la startup du fondateur à son org.
  update public.startups set org_id = v_org
  where owner_id = auth.uid() and org_id is null;

  select account_type::text into v_type from public.profiles where id = auth.uid();

  if v_type = 'founder' then
    select * into v_startup from public.startups where owner_id = auth.uid();

    -- Idempotent : on ne crée la levée que si l'espace est encore vide, pour
    -- qu'un second passage dans l'onboarding ne duplique pas la data room.
    if v_startup.id is not null
       and not exists (select 1 from public.deals where org_id = v_org) then
      -- Devise USD, PAS la valeur par défaut XOF : le montant saisi pendant
      -- l'onboarding est libellé en dollars (`amount_sought_usd`). Le passer
      -- en XOF afficherait « 1 500 000 FCFA » à une fondatrice qui a demandé
      -- 1,5 M$ — un facteur 600 sur le montant de sa levée.
      perform public.create_deal(
        coalesce(nullif(v_startup.name, ''), nullif(trim(p_org_name), ''), 'Ma levée'),
        'VC',
        'USD',
        v_startup.amount_sought_usd
      );
    end if;
  end if;

  update public.profiles set onboarded = true where id = auth.uid();
  return v_org;
end;
$$;

grant execute on function public.complete_onboarding(text) to authenticated;
