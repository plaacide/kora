-- Restaure le contrôle du palier, perdu à la réconciliation des deux branches.
--
-- CE QUI S'EST PASSÉ. La migration 20260728090000 (branche feat/accelerateurs)
-- redéfinit `invite_to_cohort` pour lui ajouter le paramètre `p_cohort`. Son
-- corps a été réécrit à partir de la version d'origine, pas de la dernière en
-- date : le contrôle de `organizations.cohort_limit`, introduit par
-- 20260724150000_palier_cohorte, n'y figure plus.
--
-- Comme sa migration est la dernière appliquée, c'est sa version qui fait foi.
-- Le palier n'était donc PLUS appliqué : un programme au plan « 10 startups »
-- pouvait en inviter cent. Aucun test ne le signalait — la fonction marche,
-- elle a seulement cessé de refuser.
--
-- C'est le piège que documente AGENTS.md : « reprendre la signature depuis la
-- DERNIÈRE définition en date ». Il vaut pour le CORPS autant que pour la
-- signature.
--
-- Cette migration reprend leur version — paramètre `p_cohort`, vérification
-- d'appartenance de la cohorte, audit enrichi — et lui rend le palier.
-- Rien de leur apport n'est écrasé.

create or replace function public.invite_to_cohort(
  p_email  text,
  p_cohort uuid default null
)
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

  -- La cohorte, si fournie, doit appartenir au programme appelant.
  if p_cohort is not null and not exists (
    select 1 from public.cohorts c where c.id = p_cohort and c.org_id = v_org
  ) then
    raise exception 'cohorte inconnue';
  end if;

  -- PALIER — restauré. Le compte porte sur les liens non révoqués de tout le
  -- programme, pas d'une seule cohorte : le plan se vend par nombre de
  -- startups accompagnées, quelle que soit la cohorte qui les héberge.
  select cohort_limit into v_limit from public.organizations where id = v_org;
  select count(*) into v_count
  from public.cohort_links
  where sae_org_id = v_org and status <> 'revoked';

  if v_count >= coalesce(v_limit, 10) then
    -- Message nommant le palier : « limite atteinte » sans le chiffre oblige
    -- à deviner, et le dépassement doit mener à un contact, pas à un mur muet.
    raise exception 'palier atteint : % startups sur votre plan. Contactez-nous pour l''étendre.', coalesce(v_limit, 10);
  end if;

  insert into public.cohort_links (sae_org_id, email, invited_by, cohort_id)
  values (v_org, lower(trim(p_email)), auth.uid(), p_cohort)
  returning * into v_link;

  perform public.write_audit(
    v_org, 'cohort.invited', 'cohort', v_link.id::text,
    jsonb_build_object('email', v_link.email, 'cohort', p_cohort)
  );

  return v_link;
end;
$$;

grant execute on function public.invite_to_cohort(text, uuid) to authenticated;
