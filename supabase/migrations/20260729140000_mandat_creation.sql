-- Donner et retirer un mandat.
--
-- CE QUI MANQUAIT. `mandates` existe depuis le 28/07, et
-- `decide_access_request` l'honore déjà : avec un mandat vivant, le programme
-- peut accorder l'accès directement. Mais rien n'a jamais créé de mandat —
-- aucune fonction, aucun écran. La branche entière était donc morte, et le
-- badge « MANDAT ACCORDÉ » de `/demandes` ne pouvait pas s'afficher.
--
-- POURQUOI PAS SIMPLEMENT LA RLS. `mandates_write` autorise déjà le membre de
-- l'entreprise. Mais un mandat est le geste le plus lourd du produit : il
-- délègue à un TIERS le droit d'ouvrir sa data room. Trois raisons de le faire
-- passer par une fonction :
--
--   · il doit s'écrire au journal d'audit dans la même transaction — c'est la
--     trace que l'entreprise a bien consenti, et elle vaut le jour où l'on se
--     demande qui a laissé entrer qui ;
--   · seul un responsable doit pouvoir le donner. La RLS s'arrête à
--     « membre » : un lecteur de l'organisation pouvait mandater ;
--   · le programme doit réellement accompagner cette entreprise. Sans cette
--     vérification, on pouvait mandater n'importe quelle organisation, y
--     compris un concurrent.

create or replace function public.grant_mandate(
  p_deal    uuid,
  p_program uuid
)
returns public.mandates
language plpgsql security definer set search_path = public as $$
declare
  v_org     uuid;
  v_mandat  public.mandates;
begin
  if auth.uid() is null then raise exception 'non authentifié'; end if;

  select d.org_id into v_org from public.deals d where d.id = p_deal;
  if v_org is null then raise exception 'salle inconnue'; end if;

  -- Responsable, pas simple membre : déléguer l'ouverture de sa data room
  -- n'est pas un geste de lecteur.
  if not exists (
    select 1 from public.memberships m
    where m.user_id = auth.uid() and m.org_id = v_org
      and m.role in ('owner', 'admin')
  ) then
    raise exception 'réservé aux responsables de l''entreprise';
  end if;

  if not public.org_active(v_org) then raise exception 'abonnement expiré'; end if;

  -- Le programme doit accompagner cette entreprise, dans une cohorte vivante.
  -- Sans ce contrôle, une entreprise pouvait mandater une organisation qui ne
  -- l'accompagne pas — un concurrent, par exemple.
  if not exists (
    select 1
    from public.cohort_members cm
    join public.cohorts c on c.id = cm.cohort_id
    where cm.startup_org_id = v_org
      and c.org_id = p_program
      and c.archived_at is null
  ) then
    raise exception 'ce programme ne vous accompagne dans aucune cohorte';
  end if;

  -- Re-donner un mandat révoqué le RÉOUVRE, sans doublon. `granted_at` repart
  -- à maintenant : c'est la date du consentement en cours qui compte, pas
  -- celle d'un consentement qu'on avait retiré.
  insert into public.mandates (startup_org_id, program_org_id, deal_id)
  values (v_org, p_program, p_deal)
  on conflict (startup_org_id, program_org_id, deal_id) do update
    set revoked_at = null,
        granted_at = now()
  returning * into v_mandat;

  -- Au journal de l'ENTREPRISE : c'est elle qui consent, et c'est chez elle
  -- que la question se posera.
  perform public.write_audit(
    v_org, 'mandate.granted', 'deal', p_deal::text,
    jsonb_build_object('program', p_program), p_deal
  );

  return v_mandat;
end;
$$;

-- RÉVOQUER NE REPREND RIEN. Les accès que le programme a accordés pendant le
-- mandat restent ouverts : ils ont été accordés au nom de l'entreprise, et un
-- investisseur qui perd son accès sans explication le vit comme une rupture.
-- Retirer le mandat empêche les accès FUTURS ; les accès en cours se retirent
-- un par un depuis l'écran des permissions, en connaissance de cause.
create or replace function public.revoke_mandate(
  p_deal    uuid,
  p_program uuid
)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_org uuid;
begin
  if auth.uid() is null then raise exception 'non authentifié'; end if;

  select d.org_id into v_org from public.deals d where d.id = p_deal;
  if v_org is null then raise exception 'salle inconnue'; end if;

  if not exists (
    select 1 from public.memberships m
    where m.user_id = auth.uid() and m.org_id = v_org
      and m.role in ('owner', 'admin')
  ) then
    raise exception 'réservé aux responsables de l''entreprise';
  end if;

  update public.mandates
  set revoked_at = now()
  where startup_org_id = v_org
    and program_org_id = p_program
    and deal_id = p_deal
    and revoked_at is null;

  perform public.write_audit(
    v_org, 'mandate.revoked', 'deal', p_deal::text,
    jsonb_build_object('program', p_program), p_deal
  );
end;
$$;

grant execute on function public.grant_mandate(uuid, uuid) to authenticated;
grant execute on function public.revoke_mandate(uuid, uuid) to authenticated;
