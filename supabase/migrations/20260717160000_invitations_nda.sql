-- Kora — Phase 1.4 : invitations + NDA e-signé. Ré-exécutable.

drop function if exists public.accept_invitation(text, text, text) cascade;
drop function if exists public.create_invitation(uuid, text, boolean, text, timestamptz) cascade;
drop function if exists public.invitation_public(text) cascade;
drop table if exists public.ndas cascade;
drop table if exists public.invitations cascade;
drop type if exists public.invitation_status cascade;

-- Pipeline du prototype : Email -> NDA -> Accès
create type public.invitation_status as enum ('sent', 'nda_pending', 'accepted', 'revoked');

create table public.invitations (
  id           uuid primary key default gen_random_uuid(),
  deal_id      uuid not null references public.deals(id) on delete cascade,
  email        text not null,
  -- Jeton non devinable ; c'est la seule chose que l'invité possède.
  token        text not null unique default encode(extensions.gen_random_bytes(32), 'hex'),
  nda_required boolean not null default true,
  -- Niveau accordé sur les dossiers racine à l'acceptation.
  level        public.perm_level not null default 'watermark',
  status       public.invitation_status not null default 'sent',
  expires_at   timestamptz,
  invited_by   uuid references public.profiles(id),
  created_at   timestamptz not null default now()
);
create index invitations_deal_idx on public.invitations (deal_id, status);
create index invitations_email_idx on public.invitations (lower(email));

create table public.ndas (
  id             uuid primary key default gen_random_uuid(),
  invitation_id  uuid not null references public.invitations(id) on delete cascade,
  deal_id        uuid not null references public.deals(id) on delete cascade,
  signer_user_id uuid references public.profiles(id),
  signer_email   text not null,
  signer_name    text not null,
  signed_at      timestamptz not null default now(),
  ip_address     text,
  user_agent     text,
  -- Empreinte de la preuve de signature (qui, quoi, quand, depuis où).
  signature_hash text not null,
  created_at     timestamptz not null default now()
);
create index ndas_deal_idx on public.ndas (deal_id);

-- ---------------------------------------------------------------------------
-- Création d'invitation (owner/admin), auditée
-- ---------------------------------------------------------------------------
create or replace function public.create_invitation(
  p_deal uuid,
  p_email text,
  p_nda_required boolean default true,
  p_level text default 'watermark',
  p_expires timestamptz default null
)
returns public.invitations
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_org uuid;
  v_inv public.invitations;
begin
  select d.org_id into v_org from public.deals d where d.id = p_deal;
  if v_org is null
     or not public.has_org_role(v_org, array['owner', 'admin']::public.org_role[]) then
    raise exception 'accès refusé';
  end if;

  insert into public.invitations (deal_id, email, nda_required, level, expires_at, invited_by, status)
  values (
    p_deal, lower(trim(p_email)), p_nda_required,
    p_level::public.perm_level, p_expires, auth.uid(),
    -- Cast explicite : un CASE renvoie du text, la colonne est un enum.
    (case when p_nda_required then 'nda_pending' else 'sent' end)::public.invitation_status
  )
  returning * into v_inv;

  perform public.write_audit(
    v_org, 'invitation.created', 'invitation', v_inv.id::text,
    jsonb_build_object('email', v_inv.email, 'nda', p_nda_required, 'level', p_level),
    p_deal
  );

  return v_inv;
end;
$$;

-- ---------------------------------------------------------------------------
-- Vue publique d'une invitation (avant authentification)
-- ---------------------------------------------------------------------------
/**
 * Renvoie le strict minimum pour afficher la porte NDA à un visiteur non
 * connecté : nom du deal, email attendu, NDA requis. Jamais le contenu du deal.
 */
create or replace function public.invitation_public(p_token text)
returns table (
  email        text,
  deal_name    text,
  org_name     text,
  nda_required boolean,
  valid        boolean
)
language sql stable security definer set search_path = public as $$
  select i.email,
         d.name,
         o.name,
         i.nda_required,
         (i.status <> 'revoked'
          and i.status <> 'accepted'
          and (i.expires_at is null or i.expires_at > now()))
  from public.invitations i
  join public.deals d on d.id = i.deal_id
  join public.organizations o on o.id = d.org_id
  where i.token = p_token;
$$;

-- ---------------------------------------------------------------------------
-- Acceptation : signature NDA -> membership invité + droits + audit
-- ---------------------------------------------------------------------------
/**
 * Appelée par un utilisateur AUTHENTIFIÉ dont l'email correspond à
 * l'invitation. C'est ce lien email <-> compte qui rend l'audit crédible :
 * on sait nommément qui a signé et qui lira ensuite les documents.
 */
create or replace function public.accept_invitation(
  p_token text,
  p_signer_name text,
  p_ip text default null,
  p_user_agent text default null
)
returns uuid
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_inv    public.invitations;
  v_org    uuid;
  v_email  text;
  v_folder record;
  v_hash   text;
  v_now    timestamptz := clock_timestamp();
begin
  if auth.uid() is null then
    raise exception 'non authentifié';
  end if;

  select * into v_inv from public.invitations where token = p_token;
  if v_inv is null then
    raise exception 'invitation introuvable';
  end if;
  if v_inv.status = 'revoked' then
    raise exception 'invitation révoquée';
  end if;
  if v_inv.expires_at is not null and v_inv.expires_at <= now() then
    raise exception 'invitation expirée';
  end if;

  select email into v_email from auth.users where id = auth.uid();

  -- Garde-fou central : on ne peut accepter qu'une invitation qui nous est
  -- adressée. Sans ça, un lien fuité ouvrirait la room à n'importe qui.
  if lower(v_email) <> lower(v_inv.email) then
    raise exception 'cette invitation ne vous est pas destinée';
  end if;

  select d.org_id into v_org from public.deals d where d.id = v_inv.deal_id;

  -- Accès invité à l'organisation (idempotent).
  insert into public.memberships (org_id, user_id, role)
  values (v_org, auth.uid(), 'guest')
  on conflict (org_id, user_id) do nothing;

  -- Droits sur les dossiers racine, au niveau prévu par l'invitation.
  for v_folder in
    select f.id from public.folders f
    where f.deal_id = v_inv.deal_id and f.parent_id is null
  loop
    insert into public.permissions (deal_id, user_id, folder_id, level, expires_at, granted_by)
    values (v_inv.deal_id, auth.uid(), v_folder.id, v_inv.level, v_inv.expires_at, v_inv.invited_by)
    on conflict (user_id, folder_id) do update
      set level = excluded.level, expires_at = excluded.expires_at;
  end loop;

  if v_inv.nda_required then
    v_hash := encode(extensions.digest(
      coalesce(p_signer_name, '') || '|' || lower(v_email) || '|' ||
      v_inv.deal_id::text || '|' || v_now::text || '|' || coalesce(p_ip, ''),
      'sha256'
    ), 'hex');

    insert into public.ndas (
      invitation_id, deal_id, signer_user_id, signer_email,
      signer_name, signed_at, ip_address, user_agent, signature_hash
    ) values (
      v_inv.id, v_inv.deal_id, auth.uid(), lower(v_email),
      p_signer_name, v_now, p_ip, p_user_agent, v_hash
    );

    perform public.write_audit(
      v_org, 'nda.signed', 'invitation', v_inv.id::text,
      jsonb_build_object('signer', p_signer_name, 'email', lower(v_email), 'hash', v_hash),
      v_inv.deal_id
    );
  end if;

  update public.invitations set status = 'accepted' where id = v_inv.id;

  perform public.write_audit(
    v_org, 'invitation.accepted', 'invitation', v_inv.id::text,
    jsonb_build_object('email', lower(v_email), 'level', v_inv.level),
    v_inv.deal_id
  );

  return v_inv.deal_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.invitations enable row level security;
alter table public.ndas enable row level security;

-- Le jeton n'est jamais lisible via l'API : seuls owner/admin voient les
-- invitations, et l'invité passe par invitation_public(token).
create policy invitation_select on public.invitations
  for select using (exists (
    select 1 from public.deals d
    where d.id = invitations.deal_id
      and public.has_org_role(d.org_id, array['owner', 'admin']::public.org_role[])
  ));

create policy nda_select on public.ndas
  for select using (
    signer_user_id = auth.uid()
    or exists (
      select 1 from public.deals d
      where d.id = ndas.deal_id and public.is_org_member(d.org_id)
    )
  );

grant select on public.invitations to authenticated;
grant select on public.ndas to authenticated;

grant execute on function public.create_invitation(uuid, text, boolean, text, timestamptz) to authenticated;
grant execute on function public.accept_invitation(text, text, text, text) to authenticated;
-- Visiteur non connecté : doit pouvoir afficher la porte NDA.
grant execute on function public.invitation_public(text) to anon, authenticated;
