-- Tous les fondateurs ne lèvent pas : on leur DEMANDE leur objectif.
--
-- Jusqu'ici l'onboarding et tout le pilotage supposaient une levée de fonds.
-- Faux : un fondateur ouvre parfois une data room pour une DUE DILIGENCE
-- (banque, partenaire, audit), sans montant ni pipeline d'investisseurs. On
-- collecte donc l'objectif à l'onboarding, et le pilotage s'y adapte.
--
-- Deux objectifs pour l'instant : 'levee' | 'diligence'. La levée est le seul
-- objectif qui collecte montant, audience et investisseurs — pour la diligence
-- ces champs n'existent tout simplement pas (règle « jamais de données
-- inventées »).
--
-- L'objectif vit à DEUX endroits :
--   - startups.objectif : la réponse du fondateur à l'onboarding (la source).
--   - deals.objectif     : porté par la salle, lu par le pilotage. Amorcé
--                          depuis la startup au moment où la salle est créée.

alter table public.startups
  add column if not exists objectif text not null default 'levee'
  check (objectif in ('levee', 'diligence'));

alter table public.deals
  add column if not exists objectif text not null default 'levee'
  check (objectif in ('levee', 'diligence'));

-- ---------------------------------------------------------------------------
-- save_startup gagne un paramètre. Ajouter un argument change la SIGNATURE :
-- `create or replace` créerait une SURCHARGE, pas un remplacement. On DROP
-- d'abord (ce qui fait perdre le grant), puis on recrée et on ré-accorde.
-- ---------------------------------------------------------------------------
drop function if exists public.save_startup(text, text, text, text, text, bigint, bigint);

create function public.save_startup(
  p_name text default null,
  p_country text default null,
  p_sector text default null,
  p_stage text default null,
  p_one_liner text default null,
  p_amount bigint default null,
  p_arr bigint default null,
  p_objectif text default null
)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_readiness int;
begin
  if auth.uid() is null then raise exception 'non authentifié'; end if;

  -- Garde-fou : un objectif hors liste est ignoré plutôt que de casser.
  if p_objectif is not null and p_objectif not in ('levee', 'diligence') then
    p_objectif := null;
  end if;

  insert into public.startups as s
    (owner_id, name, country, sector, stage, one_liner, amount_sought_usd, arr_usd, objectif)
  values (
    auth.uid(), coalesce(p_name, ''), p_country, p_sector, p_stage,
    p_one_liner, p_amount, p_arr, coalesce(p_objectif, 'levee')
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
    -- p_objectif absent (mise à jour partielle) => on garde l'objectif existant.
    objectif          = coalesce(p_objectif, s.objectif),
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

grant execute on function public.save_startup(text, text, text, text, text, bigint, bigint, text) to authenticated;

-- ---------------------------------------------------------------------------
-- complete_onboarding : mêmes corps qu'avant, plus l'amorçage de l'objectif de
-- la salle depuis la startup. Signature inchangée => `create or replace` suffit.
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

    -- Idempotent : on ne crée la salle que si l'espace est encore vide.
    if v_startup.id is not null
       and not exists (select 1 from public.deals where org_id = v_org) then
      -- Montant en USD (cf. amount_sought_usd), pas la valeur par défaut XOF.
      perform public.create_deal(
        coalesce(nullif(v_startup.name, ''), nullif(trim(p_org_name), ''), 'Ma levée'),
        'VC',
        'USD',
        v_startup.amount_sought_usd
      );

      -- La salle hérite de l'objectif choisi à l'onboarding. Une seule salle
      -- vient d'être créée pour cette org (garde `not exists` ci-dessus).
      update public.deals set objectif = coalesce(v_startup.objectif, 'levee')
      where org_id = v_org;
    end if;
  end if;

  update public.profiles set onboarded = true where id = auth.uid();
  return v_org;
end;
$$;

grant execute on function public.complete_onboarding(text) to authenticated;
