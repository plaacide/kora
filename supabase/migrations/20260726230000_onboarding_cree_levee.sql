-- L'onboarding « je veux lever des fonds » doit CRÉER la levée.
--
-- Défaut constaté en test (compte CoolBricks) : le fondateur choisit « lever
-- des fonds », saisit un montant cible… et arrive sur un accueil qui affiche
-- l'objectif mais AUCUNE levée. En effet `complete_onboarding` créait la data
-- room avec le montant (deals.amount) mais jamais la ligne `raises` — et
-- l'accueil, faute de levée, retombait sur `deals.amount` pour l'objectif.
-- D'où l'incohérence : un objectif affiché sans levée derrière.
--
-- On crée donc la levée dans le même geste, avec le montant saisi. Elle porte
-- un nom PROPRE (le stade choisi à l'onboarding : « Seed », « Série A »…),
-- pas le nom de la data room — le fondateur avait justement relevé que
-- reprendre ce nom n'avait pas de sens.
--
-- Ré-exécutable.

create or replace function public.complete_onboarding(p_org_name text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_org uuid;
  v_slug text;
  v_type text;
  v_startup public.startups;
  v_deal public.deals;
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
      v_deal := public.create_deal(
        coalesce(nullif(v_startup.name, ''), nullif(trim(p_org_name), ''), 'Ma data room'),
        'VC',
        'USD',
        v_startup.amount_sought_usd
      );

      -- La salle hérite de l'objectif choisi à l'onboarding.
      update public.deals set objectif = coalesce(v_startup.objectif, 'levee')
      where id = v_deal.id;

      -- « Lever des fonds » => la levée existe VRAIMENT, avec le montant saisi.
      if coalesce(v_startup.objectif, 'levee') = 'levee' then
        insert into public.raises (
          deal_id, org_id, name, montant_cible, devise, stade, statut
        ) values (
          v_deal.id, v_org,
          coalesce(nullif(trim(v_startup.stage), ''), 'Première levée'),
          v_startup.amount_sought_usd,
          'USD',
          case trim(v_startup.stage)
            when 'Pré-seed'  then 'pre_seed'
            when 'Seed'      then 'seed'
            when 'Série A'   then 'serie_a'
            when 'Série B+'  then 'serie_b_plus'
            else null
          end,
          'en_cours'
        );
      end if;
    end if;
  end if;

  update public.profiles set onboarded = true where id = auth.uid();
  return v_org;
end;
$$;

grant execute on function public.complete_onboarding(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Rattrapage : les data rooms d'objectif « levée » créées SANS levée (dont
-- celles issues d'un onboarding avant ce correctif) en reçoivent une, avec le
-- montant déjà porté par la data room. On ne touche pas à celles qui en ont
-- déjà une (même clôturée) : l'index unique reste respecté.
-- ---------------------------------------------------------------------------
insert into public.raises (deal_id, org_id, name, montant_cible, devise, stade, statut)
select
  d.id,
  d.org_id,
  coalesce(
    nullif(trim((select s.stage from public.startups s where s.org_id = d.org_id limit 1)), ''),
    'Première levée'
  ),
  d.amount::bigint,
  coalesce(nullif(d.currency, ''), 'USD'),
  case trim((select s.stage from public.startups s where s.org_id = d.org_id limit 1))
    when 'Pré-seed'  then 'pre_seed'
    when 'Seed'      then 'seed'
    when 'Série A'   then 'serie_a'
    when 'Série B+'  then 'serie_b_plus'
    else null
  end,
  'en_cours'
from public.deals d
where coalesce(d.objectif, 'levee') = 'levee'
  and not exists (select 1 from public.raises r where r.deal_id = d.id);
