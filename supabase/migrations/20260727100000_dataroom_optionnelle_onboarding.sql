-- La data room devient un CHOIX de l'onboarding, plus un automatisme.
--
-- Jusqu'ici, terminer l'inscription créait l'organisation ET la data room ET la
-- levée, sans jamais le demander. Deux conséquences :
--
--  1. le fondateur ne choisissait ni le nom de sa salle, ni son modèle de
--     dossiers — il découvrait une arborescence déjà faite ;
--  2. l'application se contredisait. Le tableau de bord et /deal proposent
--     « Créez votre data room » à un fondateur qui n'en a pas — un état que
--     cette fonction rendait INATTEIGNABLE, puisqu'elle en créait toujours une.
--     Ces écrans annonçaient donc une étape déjà faite.
--
-- `p_create_room` tranche : à false, on ne crée que l'organisation et son
-- membership, et le fondateur crée sa salle quand il veut, avec le nom et le
-- modèle qu'il veut. La valeur par défaut reste `true` pour que l'ancien code
-- déployé continue de fonctionner pendant la fenêtre de déploiement.
--
-- Postgres n'ajoute pas un paramètre par `create or replace` sans fabriquer une
-- surcharge ambiguë : on droppe, on recrée, et on réémet le grant que le drop
-- fait perdre (cf. AGENTS.md).
drop function if exists public.complete_onboarding(text);

create function public.complete_onboarding(
  p_org_name text,
  p_create_room boolean default true
)
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

  if v_type = 'founder' and coalesce(p_create_room, true) then
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

grant execute on function public.complete_onboarding(text, boolean) to authenticated;
