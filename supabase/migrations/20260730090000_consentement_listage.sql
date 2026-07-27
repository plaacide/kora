-- L'entreprise accepte d'être listée, et DÉSIGNE la salle.
--
-- CE QUI MANQUAIT, et qui bloquait tout. `listing_consents` est lue à trois
-- endroits — le détail de cohorte, `demanderAcces`, `publish_showcase` — et
-- n'était écrite NULLE PART. Aucune entreprise ne pouvait donc consentir, donc
-- aucune fiche ne pouvait être publiée, donc la vitrine restait vide, donc
-- aucun investisseur ne pouvait être invité ni demander l'accès.
--
-- Toute la chaîne du dealroom tenait à une table que rien ne remplissait.
--
-- PAR COHORTE, pas par programme (§2 des règles) : accepter d'être dans le
-- dealroom de la Saison 4 n'autorise pas celui du programme Dette. La clé
-- unique `(startup_org_id, cohort_id)` le porte déjà.
--
-- LA SALLE EST DÉSIGNÉE PAR L'ENTREPRISE, jamais choisie par le programme —
-- c'est écrit dans le commentaire de la colonne. D'où la signature : on
-- consent DEPUIS une salle, et c'est celle-là que la fiche pointera.

create or replace function public.grant_listing_consent(
  p_cohort uuid,
  p_deal   uuid
)
returns public.listing_consents
language plpgsql security definer set search_path = public as $$
declare
  v_org      uuid;
  v_program  uuid;
  v_consent  public.listing_consents;
begin
  if auth.uid() is null then raise exception 'non authentifié'; end if;

  select d.org_id into v_org from public.deals d where d.id = p_deal;
  if v_org is null then raise exception 'salle inconnue'; end if;

  -- Responsable, pas simple membre : accepter que les chiffres de
  -- l'entreprise s'affichent devant des investisseurs l'engage.
  if not exists (
    select 1 from public.memberships m
    where m.user_id = auth.uid() and m.org_id = v_org
      and m.role in ('owner', 'admin')
  ) then
    raise exception 'réservé aux responsables de l''entreprise';
  end if;

  if not public.org_active(v_org) then raise exception 'abonnement expiré'; end if;

  select c.org_id into v_program
  from public.cohorts c
  where c.id = p_cohort and c.archived_at is null;
  if v_program is null then raise exception 'cohorte inconnue ou archivée'; end if;

  -- On ne consent qu'auprès d'une cohorte qu'on a REJOINTE. Sans ce contrôle,
  -- une entreprise pourrait se lister dans le dealroom de n'importe qui.
  if not exists (
    select 1 from public.cohort_members cm
    where cm.cohort_id = p_cohort and cm.startup_org_id = v_org
  ) then
    raise exception 'vous n''appartenez pas à cette cohorte';
  end if;

  -- Re-consentir depuis une AUTRE salle déplace la désignation, sans créer de
  -- second accord : la clé unique est (entreprise, cohorte), et une entreprise
  -- ne montre qu'une salle par cohorte. L'écran doit le dire avant le clic.
  insert into public.listing_consents (startup_org_id, program_org_id, cohort_id, deal_id)
  values (v_org, v_program, p_cohort, p_deal)
  on conflict (startup_org_id, cohort_id) do update
    set deal_id    = excluded.deal_id,
        program_org_id = excluded.program_org_id,
        granted_at = now(),
        revoked_at = null
  returning * into v_consent;

  perform public.write_audit(
    v_org, 'listing_consent.granted', 'cohort', p_cohort::text,
    jsonb_build_object('program', v_program, 'deal', p_deal), p_deal
  );

  return v_consent;
end;
$$;

-- RETIRER LE CONSENTEMENT NE DÉPUBLIE PAS TOUT SEUL, et c'est un choix.
-- `publish_showcase` refusera de (re)publier sans accord vivant, mais une fiche
-- déjà en ligne reste en ligne jusqu'à ce que le programme la retire.
--
-- Ce n'est pas un oubli : dépublier dans la seconde couperait sous les pieds
-- d'un investisseur en train de lire une fiche, et le programme doit être au
-- courant qu'une de ses entreprises s'est retirée. Le rendre automatique le
-- lui cacherait.
create or replace function public.revoke_listing_consent(p_cohort uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_org uuid;
begin
  if auth.uid() is null then raise exception 'non authentifié'; end if;

  select lc.startup_org_id into v_org
  from public.listing_consents lc
  where lc.cohort_id = p_cohort
    and public.is_org_member(lc.startup_org_id);

  if v_org is null then raise exception 'accord introuvable'; end if;

  if not exists (
    select 1 from public.memberships m
    where m.user_id = auth.uid() and m.org_id = v_org
      and m.role in ('owner', 'admin')
  ) then
    raise exception 'réservé aux responsables de l''entreprise';
  end if;

  update public.listing_consents
  set revoked_at = now()
  where startup_org_id = v_org and cohort_id = p_cohort and revoked_at is null;

  perform public.write_audit(
    v_org, 'listing_consent.revoked', 'cohort', p_cohort::text, '{}'::jsonb
  );
end;
$$;

grant execute on function public.grant_listing_consent(uuid, uuid) to authenticated;
grant execute on function public.revoke_listing_consent(uuid) to authenticated;
