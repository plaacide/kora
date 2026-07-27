-- Relancer une invitation, et la faire expirer.
--
-- La spec §3 demande de MONTRER les invitations en attente, de les relancer et
-- de les révoquer, avec une expiration à 30 jours. La liste et la révocation
-- existaient ; la relance et l'expiration, non — et une expiration annoncée
-- mais non appliquée est pire que pas d'expiration.
--
-- Même parti que pour les demandes d'accès : l'échéance est CALCULÉE, pas
-- balayée. Une invitation périmée reste `pending` en base ; c'est sa date qui
-- la dit périmée. Pas d'ordonnanceur à installer, et la relance n'a rien à
-- ressusciter — elle repousse simplement le point de départ.

alter table public.cohort_links
  add column if not exists relaunched_at timestamptz;

comment on column public.cohort_links.relaunched_at is
  'Dernière relance. L''échéance de 30 jours court à partir d''ici quand elle '
  'est renseignée, sinon depuis `created_at`.';

/**
 * Relance : repousse l'échéance et rend le jeton, pour renvoyer le même lien.
 *
 * ON NE CHANGE PAS LE JETON. Un invité qui a gardé le premier e-mail doit
 * pouvoir s'en servir : lui invalider son lien parce qu'on lui en a renvoyé un
 * serait le punir d'avoir tardé, exactement l'inverse du but d'une relance.
 *
 * Autant de fois que nécessaire, contrairement aux demandes d'accès qui n'ont
 * droit qu'à une relance. La dissymétrie est voulue : là-bas c'est un
 * demandeur qui insiste auprès de quelqu'un qui ne lui doit rien ; ici c'est un
 * programme qui rappelle une entreprise qu'il accompagne.
 */
create or replace function public.relaunch_cohort_link(p_link uuid)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_link public.cohort_links;
begin
  select * into v_link from public.cohort_links where id = p_link;
  if v_link.id is null then raise exception 'invitation introuvable'; end if;
  if v_link.status <> 'pending' then
    raise exception 'cette invitation a déjà reçu une réponse';
  end if;

  if not exists (
    select 1 from public.memberships m
    where m.user_id = auth.uid() and m.org_id = v_link.sae_org_id
      and m.role in ('owner', 'admin')
  ) then
    raise exception 'accès refusé';
  end if;

  update public.cohort_links
  set relaunched_at = now()
  where id = p_link;

  perform public.write_audit(
    v_link.sae_org_id, 'cohort.invite_relaunched', 'cohort', p_link::text,
    jsonb_build_object('email', v_link.email)
  );

  return v_link.token;
end;
$$;

grant execute on function public.relaunch_cohort_link(uuid) to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- `accept_cohort_link` — signature IDENTIQUE (p_token text) → uuid, donc
-- `create or replace` suffit (cf. AGENTS.md : c'est le changement de FORME qui
-- impose un DROP, pas la réécriture du corps).
--
-- SEUL AJOUT : le refus d'une invitation périmée. Sans lui, l'écran afficherait
-- « expirée » pendant que le bouton continuerait d'accepter.
-- ═══════════════════════════════════════════════════════════════════════════
create or replace function public.accept_cohort_link(p_token text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_link  public.cohort_links;
  v_org   uuid;
  v_email text;
begin
  if auth.uid() is null then raise exception 'non authentifié'; end if;

  select * into v_link from public.cohort_links where token = p_token;
  if v_link is null then raise exception 'invitation introuvable'; end if;
  if v_link.status = 'revoked' then raise exception 'invitation révoquée'; end if;

  -- Périmée : le programme doit relancer. Une invitation de trois mois qu'on
  -- accepte sans prévenir personne surprend les deux côtés.
  if v_link.status = 'pending'
     and now() > coalesce(v_link.relaunched_at, v_link.created_at) + interval '30 days'
  then
    raise exception 'cette invitation a expiré ; demandez au programme de la relancer';
  end if;

  select email into v_email from auth.users where id = auth.uid();
  if lower(v_email) is distinct from v_link.email then
    raise exception 'invitation adressée à une autre adresse';
  end if;

  select m.org_id into v_org
  from public.memberships m
  where m.user_id = auth.uid() and m.role in ('owner', 'admin')
  order by m.created_at
  limit 1;

  if v_org is null then raise exception 'accès refusé'; end if;

  update public.cohort_links
  set startup_org_id = v_org, status = 'accepted', accepted_at = now()
  where id = v_link.id;

  if v_link.cohort_id is not null then
    insert into public.cohort_members (cohort_id, startup_org_id)
    values (v_link.cohort_id, v_org)
    on conflict do nothing;
  end if;

  perform public.write_audit(
    v_link.sae_org_id, 'cohort.accepted', 'cohort', v_link.id::text,
    jsonb_build_object('startup_org', v_org)
  );
  perform public.write_audit(
    v_org, 'cohort.joined', 'cohort', v_link.id::text,
    jsonb_build_object('sae_org', v_link.sae_org_id)
  );

  return v_link.sae_org_id;
end;
$$;

grant execute on function public.accept_cohort_link(text) to authenticated;
