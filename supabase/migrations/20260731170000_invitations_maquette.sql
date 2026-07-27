-- Les invitations telles que la maquette les montre (écrans 08, 09, 10).
--
-- TROIS MANQUES, tous visibles à l'écran 09 :
--
-- 1. ON INVITE UN NOM, pas une adresse. La maquette affiche « Kalyx Foods /
--    contact@kalyxfoods.ci » avec un avatar dès l'invitation — donc avant toute
--    acceptation, quand aucune organisation n'existe encore côté entreprise.
--    Le nom est saisi par le programme au moment d'inviter.
--
-- 2. « LIEN OUVERT » est un statut à part entière, entre ENVOYÉE et À RELANCER.
--    Il se mesure : c'est la première ouverture de `/rejoindre/<token>`. La
--    distinction porte tout le sens de l'écran — une invitation ouverte sans
--    suite se relance par téléphone, une invitation jamais ouverte se relance
--    par e-mail. Ce ne sont pas les mêmes gestes.
--
-- 3. « Relancer tout le monde » — la relance groupée, en un appel plutôt qu'en
--    N aller-retours depuis le navigateur.

alter table public.cohort_links
  add column if not exists company_name text,
  add column if not exists opened_at    timestamptz;

comment on column public.cohort_links.company_name is
  'Nom saisi par le programme à l''invitation. L''entreprise n''a pas encore '
  'd''organisation à ce stade — c''est ce nom qui s''affiche jusqu''à ce '
  'qu''elle accepte, et l''organisation réelle prend le relais ensuite.';

comment on column public.cohort_links.opened_at is
  'Première ouverture du lien. Distingue « LIEN OUVERT » de « ENVOYÉE » — un '
  'invité qui a ouvert sans finir se relance autrement que celui qui n''a rien vu.';

/**
 * Horodate la première ouverture du lien.
 *
 * APPELÉE PAR N'IMPORTE QUI, y compris un visiteur sans compte : c'est le
 * propre d'un lien d'invitation, on l'ouvre avant de s'inscrire. Le jeton fait
 * 256 bits — le détenir suffit à prouver qu'on est le destinataire.
 *
 * `coalesce` : on garde la PREMIÈRE ouverture. Écraser à chaque visite ferait
 * dire « ouvert à l'instant » d'un lien ouvert il y a trois semaines, et
 * effacerait justement le signal qu'on cherche.
 */
create or replace function public.mark_cohort_link_opened(p_token text)
returns void
language sql volatile security definer set search_path = public as $$
  update public.cohort_links
  set opened_at = coalesce(opened_at, now())
  where token = p_token and status = 'pending';
$$;

grant execute on function public.mark_cohort_link_opened(text) to anon, authenticated;

/**
 * Relance TOUTES les invitations en attente d'une cohorte, et rend ce qu'il
 * faut pour envoyer les e-mails : adresse, nom, jeton.
 *
 * Un seul aller-retour. La version naïve — appeler la relance unitaire en
 * boucle depuis le navigateur — multiplie les allers-retours et laisse la
 * moitié du travail fait si l'onglet se ferme.
 */
create or replace function public.relaunch_cohort_links(p_cohort uuid)
returns table (
  email        text,
  company_name text,
  token        text
)
language plpgsql security definer set search_path = public as $$
declare
  v_org uuid;
begin
  select c.org_id into v_org from public.cohorts c where c.id = p_cohort;
  if v_org is null then raise exception 'cohorte inconnue'; end if;

  if not exists (
    select 1 from public.memberships m
    where m.user_id = auth.uid() and m.org_id = v_org
      and m.role in ('owner', 'admin')
  ) then
    raise exception 'accès refusé';
  end if;

  return query
  update public.cohort_links cl
  set relaunched_at = now()
  where cl.cohort_id = p_cohort and cl.status = 'pending'
  returning cl.email, cl.company_name, cl.token;

  perform public.write_audit(
    v_org, 'cohort.invites_relaunched', 'cohort', p_cohort::text, '{}'::jsonb
  );
end;
$$;

grant execute on function public.relaunch_cohort_links(uuid) to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- `invite_to_cohort` — DROP puis recréation : ajouter un paramètre par
-- `create or replace` créerait une surcharge au lieu de remplacer, et
-- PostgREST choisirait selon les arguments transmis (cf. AGENTS.md). Le
-- `grant` perdu au DROP est réémis.
--
-- Signature reprise de la DERNIÈRE définition en date (20260728130000), palier
-- compris, plus `p_name`.
-- ═══════════════════════════════════════════════════════════════════════════
drop function if exists public.invite_to_cohort(text, uuid);

create or replace function public.invite_to_cohort(
  p_email  text,
  p_cohort uuid default null,
  p_name   text default null
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

  if p_cohort is not null and not exists (
    select 1 from public.cohorts c where c.id = p_cohort and c.org_id = v_org
  ) then
    raise exception 'cohorte inconnue';
  end if;

  select cohort_limit into v_limit from public.organizations where id = v_org;
  select count(*) into v_count
  from public.cohort_links
  where sae_org_id = v_org and status <> 'revoked';

  if v_count >= coalesce(v_limit, 10) then
    raise exception 'palier atteint : % startups sur votre plan. Contactez-nous pour l''étendre.', coalesce(v_limit, 10);
  end if;

  insert into public.cohort_links (sae_org_id, email, invited_by, cohort_id, company_name)
  values (
    v_org, lower(trim(p_email)), auth.uid(), p_cohort,
    nullif(trim(coalesce(p_name, '')), '')
  )
  returning * into v_link;

  perform public.write_audit(
    v_org, 'cohort.invited', 'cohort', v_link.id::text,
    jsonb_build_object('email', v_link.email, 'cohort', p_cohort, 'name', v_link.company_name)
  );

  return v_link;
end;
$$;

grant execute on function public.invite_to_cohort(text, uuid, text) to authenticated;

-- `invitation_apercu` rend aussi le nom saisi : l'écran d'acceptation peut
-- alors dire « Kalyx Foods » plutôt qu'une adresse.
--
-- DROP obligatoire : ajouter une colonne au `returns table` CHANGE le type de
-- retour, et `create or replace` échoue en 42P13 (cf. AGENTS.md).
drop function if exists public.invitation_apercu(text);

create or replace function public.invitation_apercu(p_token text)
returns table (
  email        text,
  statut       text,
  programme    text,
  cohorte      text,
  company_name text
)
language sql stable security definer set search_path = public as $$
  select
    cl.email,
    cl.status,
    coalesce(o.name, 'Un programme'),
    c.name,
    cl.company_name
  from public.cohort_links cl
  left join public.organizations o on o.id = cl.sae_org_id
  left join public.cohorts c on c.id = cl.cohort_id
  where cl.token = p_token
    and coalesce(trim(p_token), '') <> ''
  limit 1;
$$;

grant execute on function public.invitation_apercu(text) to anon, authenticated;
