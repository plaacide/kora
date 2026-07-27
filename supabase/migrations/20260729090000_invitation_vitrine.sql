-- Inviter un investisseur à la vitrine, et lui retirer l'accès.
--
-- CE QUI MANQUAIT. `showcase_access` et `accept_showcase_invite()` existaient
-- depuis la migration `20260728110000`, mais rien ne créait jamais de ligne :
-- aucune action, aucun écran. La vitrine était donc close par construction —
-- une audience sans porte d'entrée. Ces deux fonctions sont cette porte.
--
-- POURQUOI DES RPC ALORS QUE LA RLS SUFFIRAIT. Les politiques d'écriture de
-- `showcase_access` autorisent déjà le membre du programme. Mais la règle du
-- dépôt veut que toute écriture passe par une fonction qui vérifie les droits
-- ET audite dans la MÊME transaction : une invitation qui part sans trace au
-- journal est une invitation que personne ne peut expliquer trois mois plus
-- tard, quand un investisseur inconnu se promène dans la vitrine.

create or replace function public.invite_to_showcase(
  p_cohort uuid,
  p_email  text
)
returns public.showcase_access
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_org    uuid;
  v_email  text := lower(trim(p_email));
  v_acces  public.showcase_access;
begin
  if v_email = '' or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'adresse invalide';
  end if;

  select c.org_id into v_org from public.cohorts c where c.id = p_cohort;
  if v_org is null then raise exception 'cohorte inconnue'; end if;

  -- Même exigence que pour inviter une startup : seul un responsable engage
  -- le programme vis-à-vis d'un tiers.
  if not exists (
    select 1 from public.memberships m
    where m.user_id = auth.uid() and m.org_id = v_org
      and m.role in ('owner', 'admin')
  ) then
    raise exception 'accès refusé';
  end if;

  if not public.org_active(v_org) then raise exception 'abonnement expiré'; end if;

  -- Ré-inviter une adresse déjà invitée ne crée pas de doublon : on RÉOUVRE.
  -- Le jeton précédent reste valable — l'investisseur qui a gardé le premier
  -- e-mail n'est pas puni d'avoir tardé.
  insert into public.showcase_access (cohort_id, email, invited_by)
  values (p_cohort, v_email, auth.uid())
  on conflict (cohort_id, email) do update
    set revoked_at = null,
        invited_at = now(),
        invited_by = auth.uid()
  returning * into v_acces;

  perform public.write_audit(
    v_org, 'showcase.invited', 'cohort', p_cohort::text,
    jsonb_build_object('email', v_email)
  );

  return v_acces;
end;
$$;

-- RÉVOQUER N'EST PAS DÉPUBLIER, et ce n'est pas non plus retirer un accès à
-- une data room. Cela ferme la vitrine à cette personne. Les accès aux salles
-- qu'elle a pu obtenir par une demande acceptée vivent dans `memberships` et
-- `permissions` — ils ne bougent pas ici. Les couper depuis la vitrine
-- surprendrait l'entreprise, qui les a accordés elle-même.
create or replace function public.revoke_showcase_access(p_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_org   uuid;
  v_email text;
begin
  select c.org_id, a.email into v_org, v_email
  from public.showcase_access a
  join public.cohorts c on c.id = a.cohort_id
  where a.id = p_id;

  if v_org is null then raise exception 'invitation inconnue'; end if;

  if not exists (
    select 1 from public.memberships m
    where m.user_id = auth.uid() and m.org_id = v_org
      and m.role in ('owner', 'admin')
  ) then
    raise exception 'accès refusé';
  end if;

  update public.showcase_access set revoked_at = now() where id = p_id;

  perform public.write_audit(
    v_org, 'showcase.access_revoked', 'cohort', p_id::text,
    jsonb_build_object('email', v_email)
  );
end;
$$;

grant execute on function public.invite_to_showcase(uuid, text) to authenticated;
grant execute on function public.revoke_showcase_access(uuid) to authenticated;
