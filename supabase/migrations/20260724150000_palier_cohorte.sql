-- Les paliers de cohorte, appliqués.
--
-- Le site vend le plan Programme « jusqu'à 10 startups, paliers 25 et 50 ».
-- Rien ne le contraignait : un programme pouvait en inviter mille. Le palier
-- devient une vraie limite.
--
-- Une colonne `cohort_limit`, posée à la main comme `paid_until` — même
-- philosophie d'encaissement : à réception d'un paiement de palier, on écrit
--
--   update public.organizations set cohort_limit = 25 where name = '…';
--
-- Pas de table de plans, pas d'abonnement automatique : à ce volume, une ligne
-- par palier coûte moins qu'une machinerie, et laisse ajuster un cas
-- particulier sans redéployer.

alter table public.organizations
  add column if not exists cohort_limit int not null default 10;

-- ---------------------------------------------------------------------------
-- Le plafond mord à l'invitation
-- ---------------------------------------------------------------------------

/**
 * On compte les liens NON révoqués : une startup retirée libère sa place, une
 * invitation encore en attente occupe la sienne — sinon un programme
 * contournerait le palier en inondant d'invitations jamais acceptées.
 */
create or replace function public.invite_to_cohort(p_email text)
returns public.cohort_links
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_org   uuid;
  v_link  public.cohort_links;
  v_limit int;
  v_count int;
begin
  select m.org_id into v_org
  from public.memberships m
  where m.user_id = auth.uid() and m.role in ('owner', 'admin')
  order by m.created_at
  limit 1;

  if v_org is null then raise exception 'accès refusé'; end if;
  if not public.org_active(v_org) then raise exception 'abonnement expiré'; end if;

  select cohort_limit into v_limit from public.organizations where id = v_org;
  select count(*) into v_count
  from public.cohort_links
  where sae_org_id = v_org and status <> 'revoked';

  if v_count >= v_limit then
    -- Message actionnable, pas un code : le programme doit comprendre qu'il
    -- s'agit d'un palier à faire évoluer, pas d'un bug.
    raise exception 'palier atteint : % startups sur votre plan. Contactez-nous pour l''étendre.', v_limit;
  end if;

  insert into public.cohort_links (sae_org_id, email, invited_by)
  values (v_org, lower(trim(p_email)), auth.uid())
  returning * into v_link;

  perform public.write_audit(
    v_org, 'cohort.invited', 'cohort', v_link.id::text,
    jsonb_build_object('email', v_link.email),
    null
  );

  return v_link;
end;
$$;

grant execute on function public.invite_to_cohort(text) to authenticated;
