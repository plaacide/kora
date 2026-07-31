-- Inviter un collaborateur dans l'organisation — écran 33.
--
-- Rien n'existait. `invitations` invite un INVITÉ EXTERNE sur une opération :
-- filigrane, échéance, périmètre de dossiers, NDA. Un collaborateur interne
-- n'est pas cela — il rejoint l'entreprise, pas un dossier — et lui appliquer
-- la table des invités reviendrait à confondre les deux populations que
-- l'écran 33 existe justement pour séparer.
--
-- POURQUOI UNE INVITATION ET PAS UN AJOUT DIRECT. On pourrait insérer une
-- ligne dans `memberships` à partir d'une adresse : la RLS l'autorise à un
-- owner. Ce serait rattacher quelqu'un à une organisation sans qu'il l'ait
-- voulu, et lui ouvrir toutes les data rooms de l'entreprise. Dans un produit
-- dont l'objet est le contrôle de qui voit quoi, l'accord de la personne n'est
-- pas une politesse : c'est la même règle que partout ailleurs.
--
-- Ré-exécutable.

create table if not exists public.org_invitations (
  id      uuid primary key default gen_random_uuid(),
  org_id  uuid not null references public.organizations(id) on delete cascade,
  email   text not null,
  -- Le rôle promis. Il est posé à l'invitation et non à l'acceptation : la
  -- personne doit savoir ce qu'elle accepte.
  role    public.org_role not null,
  token   text not null unique default encode(gen_random_bytes(24), 'hex'),
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  -- Une invitation qui traîne est une porte ouverte. Quinze jours par défaut,
  -- posés par la RPC.
  expires_at timestamptz,
  accepted_at timestamptz,
  accepted_by uuid references auth.users(id) on delete set null,
  revoked_at  timestamptz
);

create index if not exists org_invitations_org_idx
  on public.org_invitations (org_id, accepted_at, revoked_at);

-- Une seule invitation vivante par adresse et par organisation : deux liens
-- valides pour la même personne, c'est un lien qu'on croit révoqué et qui ne
-- l'est pas.
create unique index if not exists org_invitations_vivante_idx
  on public.org_invitations (org_id, lower(email))
  where accepted_at is null and revoked_at is null;

alter table public.org_invitations enable row level security;

drop policy if exists org_invitations_select on public.org_invitations;
create policy org_invitations_select on public.org_invitations
  for select using (public.is_org_internal(org_id));

revoke insert, update, delete on public.org_invitations from authenticated;


/**
 * Inviter — écran 33.
 *
 * Le `token` n'est pas rendu par hasard : l'appelant en fait un lien. Si
 * l'e-mail échoue, l'invitation existe quand même et le lien reste
 * transmissible à la main. Un envoi raté ne doit pas annuler un geste réussi.
 */
create or replace function public.invite_member(
  p_org uuid,
  p_email text,
  p_role text,
  p_expires timestamptz default null
)
returns public.org_invitations
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_row   public.org_invitations;
  v_email text := lower(trim(p_email));
  v_user  uuid;
begin
  if not public.has_org_role(p_org, array['owner', 'admin']::public.org_role[]) then
    raise exception 'droits insuffisants';
  end if;

  if v_email is null or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'adresse invalide';
  end if;

  -- `guest` n'est pas un rôle d'équipe. L'accepter ici ferait entrer un invité
  -- externe par la porte des collaborateurs.
  if p_role not in ('owner', 'admin', 'member', 'internal_viewer') then
    raise exception 'rôle interne attendu';
  end if;

  if p_role = 'owner'
     and not public.has_org_role(p_org, array['owner']::public.org_role[]) then
    raise exception 'seul un propriétaire nomme un propriétaire';
  end if;

  -- Déjà dans l'équipe : le dire vaut mieux qu'envoyer un lien qui échouera.
  select u.id into v_user from auth.users u where lower(u.email) = v_email;
  if v_user is not null and exists (
    select 1 from public.memberships m
    where m.org_id = p_org and m.user_id = v_user
      and m.role::text <> 'guest'
  ) then
    raise exception 'déjà dans l''équipe';
  end if;

  -- Réinviter quelqu'un remplace son invitation en cours plutôt que d'en
  -- empiler une seconde : c'est ce que veut dire « renvoyer l'invitation ».
  update public.org_invitations
  set revoked_at = now()
  where org_id = p_org and lower(email) = v_email
    and accepted_at is null and revoked_at is null;

  insert into public.org_invitations (org_id, email, role, invited_by, expires_at)
  values (
    p_org, v_email, p_role::public.org_role, auth.uid(),
    coalesce(p_expires, now() + interval '15 days')
  )
  returning * into v_row;

  perform public.write_audit(
    p_org, 'member.invited', 'org_invitation', v_row.id::text,
    jsonb_build_object('email', v_email, 'role', p_role)
  );

  return v_row;
end;
$$;

grant execute on function public.invite_member(uuid, text, text, timestamptz) to authenticated;


/**
 * Ce que le lien montre AVANT qu'on l'accepte.
 *
 * Sans cette fonction, la page d'acceptation devrait lire `org_invitations` —
 * qu'elle ne peut pas voir, puisqu'on n'est pas encore membre. Elle ne rend
 * que le nom de l'organisation, le rôle proposé et l'adresse concernée : de
 * quoi décider, rien de plus. Un lien deviné ne révèle donc rien d'autre.
 */
create or replace function public.org_invitation_preview(p_token text)
returns table (
  organisation text,
  role text,
  email text,
  expiree boolean,
  revoquee boolean,
  acceptee boolean
)
language sql stable security definer set search_path = public as $$
  select o.name, i.role::text, i.email,
         i.expires_at is not null and i.expires_at <= now(),
         i.revoked_at is not null,
         i.accepted_at is not null
  from public.org_invitations i
  join public.organizations o on o.id = i.org_id
  where i.token = p_token;
$$;

grant execute on function public.org_invitation_preview(text) to anon, authenticated;


/**
 * Accepter — la personne rejoint l'équipe.
 *
 * Le contrôle central est le même que pour les invités externes : on n'accepte
 * qu'une invitation adressée à SON adresse. Sans lui, un lien transféré ferait
 * entrer n'importe qui dans l'entreprise.
 */
create or replace function public.accept_org_invitation(p_token text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_inv   public.org_invitations;
  v_email text;
begin
  if auth.uid() is null then
    raise exception 'non authentifié';
  end if;

  select * into v_inv from public.org_invitations where token = p_token;
  if v_inv.id is null then raise exception 'invitation introuvable'; end if;
  if v_inv.revoked_at is not null then raise exception 'invitation révoquée'; end if;
  if v_inv.accepted_at is not null then raise exception 'invitation déjà acceptée'; end if;
  if v_inv.expires_at is not null and v_inv.expires_at <= now() then
    raise exception 'invitation expirée';
  end if;

  select email into v_email from auth.users where id = auth.uid();
  if lower(v_email) <> lower(v_inv.email) then
    raise exception 'cette invitation ne vous est pas destinée';
  end if;

  -- `on conflict` : la personne peut déjà être `guest` de cette organisation,
  -- invitée sur une opération avant d'en devenir collaboratrice. Son rôle
  -- monte alors, il ne se dédouble pas.
  insert into public.memberships (org_id, user_id, role)
  values (v_inv.org_id, auth.uid(), v_inv.role)
  on conflict (org_id, user_id) do update set role = excluded.role;

  update public.org_invitations
  set accepted_at = now(), accepted_by = auth.uid()
  where id = v_inv.id;

  perform public.write_audit(
    v_inv.org_id, 'member.joined', 'org_invitation', v_inv.id::text,
    jsonb_build_object('email', v_inv.email, 'role', v_inv.role::text)
  );

  return v_inv.org_id;
end;
$$;

grant execute on function public.accept_org_invitation(text) to authenticated;


/** Révoquer une invitation non encore acceptée. */
create or replace function public.revoke_org_invitation(p_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_org   uuid;
  v_email text;
begin
  select org_id, email into v_org, v_email
  from public.org_invitations
  where id = p_id and accepted_at is null and revoked_at is null;

  if v_org is null then
    raise exception 'invitation introuvable ou déjà traitée';
  end if;

  if not public.has_org_role(v_org, array['owner', 'admin']::public.org_role[]) then
    raise exception 'droits insuffisants';
  end if;

  update public.org_invitations set revoked_at = now() where id = p_id;

  perform public.write_audit(
    v_org, 'member.invitation_revoked', 'org_invitation', p_id::text,
    jsonb_build_object('email', v_email)
  );
end;
$$;

grant execute on function public.revoke_org_invitation(uuid) to authenticated;
