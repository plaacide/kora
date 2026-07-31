-- Une invitation porte son périmètre.
--
-- `accept_invitation` accordait TOUS les dossiers racine, au niveau de
-- l'invitation. L'assistant de partage (maquette 21) fait pourtant choisir les
-- dossiers un par un — un choix que rien en base ne pouvait retenir, donc un
-- choix qui aurait été ignoré à l'acceptation. Le fondateur aurait décoché
-- « Fiscalité » et l'invité l'aurait vu.
--
-- On ajoute donc où écrire ce choix. Deux propriétés tiennent la migration :
--
--   · RÉTROCOMPATIBLE — une invitation sans périmètre garde l'ancien
--     comportement (tous les dossiers racine). Les invitations déjà envoyées,
--     et la V1 qui appelle `create_invitation` sans périmètre, continuent
--     exactement comme avant.
--   · LE CHOIX EST VÉRIFIÉ À L'ÉCRITURE — un dossier d'une autre opération est
--     refusé au moment de créer l'invitation, pas silencieusement ignoré à
--     l'acceptation.
--
-- Hors périmètre de cette migration : les exceptions PIÈCE par pièce
-- (« Rapport d'audit 2024.pdf restera masqué »). Le droit se pose sur un
-- dossier — `permissions.folder_id` est `not null` — et masquer une pièce
-- dans un dossier ouvert demande un autre modèle. C'est une décision produit
-- à part, pas une conséquence de celle-ci.

create table if not exists public.invitation_folders (
  invitation_id uuid not null
    references public.invitations(id) on delete cascade,
  folder_id     uuid not null
    references public.folders(id) on delete cascade,
  primary key (invitation_id, folder_id)
);

create index if not exists invitation_folders_folder_idx
  on public.invitation_folders (folder_id);

alter table public.invitation_folders enable row level security;

-- Même prédicat que les invitations : qui voit l'invitation voit son périmètre.
drop policy if exists invitation_folders_select on public.invitation_folders;
create policy invitation_folders_select on public.invitation_folders
  for select using (exists (
    select 1 from public.invitations i
    where i.id = invitation_folders.invitation_id
      and public.can_see_deal(i.deal_id)
  ));

grant select on public.invitation_folders to authenticated;


-- ---------------------------------------------------------------------------
-- Créer une invitation AVEC son périmètre
-- ---------------------------------------------------------------------------

-- L'ancienne signature est retirée plutôt que laissée à côté : deux fonctions
-- de même nom dont l'une a un paramètre par défaut rendent l'appel à cinq
-- arguments ambigu, et PostgREST refuse de choisir.
drop function if exists public.create_invitation(uuid, text, boolean, text, timestamptz);

create or replace function public.create_invitation(
  p_deal uuid,
  p_email text,
  p_nda_required boolean default true,
  p_level text default 'watermark',
  p_expires timestamptz default null,
  -- `null` = tous les dossiers racine, comme avant. Un tableau VIDE est refusé :
  -- une invitation qui n'ouvre rien est une erreur de saisie, pas une intention.
  p_folders uuid[] default null
)
returns public.invitations
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_org      uuid;
  v_inv      public.invitations;
  v_expires  timestamptz;
  v_valides  int;
begin
  select d.org_id into v_org from public.deals d where d.id = p_deal;
  if v_org is null
     or not public.has_org_role(v_org, array['owner', 'admin']::public.org_role[]) then
    raise exception 'accès refusé';
  end if;

  if p_folders is not null and cardinality(p_folders) = 0 then
    raise exception 'un accès doit ouvrir au moins un dossier';
  end if;

  -- Un dossier d'une AUTRE opération n'ouvrirait rien ici et donnerait un
  -- périmètre mensonger à l'écran. On refuse au lieu de filtrer en silence.
  if p_folders is not null then
    select count(*) into v_valides
    from public.folders f
    where f.id = any(p_folders) and f.deal_id = p_deal;

    if v_valides <> cardinality(p_folders) then
      raise exception 'périmètre invalide : un dossier n''appartient pas à cette opération';
    end if;
  end if;

  -- Le défaut s'applique ICI et non dans la signature : `default now() + …`
  -- serait évalué à la déclaration de la fonction, pas à chaque appel.
  v_expires := coalesce(p_expires, now() + interval '90 days');

  insert into public.invitations (deal_id, email, nda_required, level, expires_at, invited_by, status)
  values (
    p_deal, lower(trim(p_email)), p_nda_required,
    p_level::public.perm_level, v_expires, auth.uid(),
    -- Cast explicite : un CASE renvoie du text, la colonne est un enum.
    (case when p_nda_required then 'nda_pending' else 'sent' end)::public.invitation_status
  )
  returning * into v_inv;

  if p_folders is not null then
    insert into public.invitation_folders (invitation_id, folder_id)
    select v_inv.id, unnest(p_folders)
    on conflict do nothing;
  end if;

  perform public.write_audit(
    v_org, 'invitation.created', 'invitation', v_inv.id::text,
    jsonb_build_object(
      'email', v_inv.email, 'nda', p_nda_required, 'level', p_level,
      -- Tracé : un auditeur doit pouvoir distinguer une échéance choisie par
      -- le fondateur d'une échéance posée par défaut.
      'expires_at', v_expires,
      'expires_default', p_expires is null,
      -- Et un périmètre choisi d'un périmètre par défaut.
      'folders', coalesce(cardinality(p_folders), 0),
      'folders_default', p_folders is null
    ),
    p_deal
  );

  return v_inv;
end;
$$;

grant execute on function public.create_invitation(uuid, text, boolean, text, timestamptz, uuid[])
  to authenticated;


-- ---------------------------------------------------------------------------
-- Accepter : n'ouvrir que ce qui a été choisi
-- ---------------------------------------------------------------------------

create or replace function public.accept_invitation(
  p_token text,
  p_signer_name text default null,
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

  -- Les dossiers CHOISIS s'il y en a, tous les dossiers racine sinon. Le
  -- `not exists` couvre les invitations créées avant cette migration : leur
  -- périmètre est vide et doit rester « tout », pas « rien ».
  for v_folder in
    select f.id from public.folders f
    join public.invitation_folders inf
      on inf.folder_id = f.id and inf.invitation_id = v_inv.id
    where f.deal_id = v_inv.deal_id
    union
    select f.id from public.folders f
    where f.deal_id = v_inv.deal_id
      and f.parent_id is null
      and not exists (
        select 1 from public.invitation_folders inf
        where inf.invitation_id = v_inv.id
      )
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
    jsonb_build_object(
      'email', lower(v_email), 'level', v_inv.level,
      -- Ce qui a réellement été ouvert : c'est la question qu'un auditeur
      -- pose en premier, et elle ne se relit pas dans `permissions` une fois
      -- les droits modifiés à la main.
      'folders', (
        select count(*) from public.invitation_folders inf
        where inf.invitation_id = v_inv.id
      )
    ),
    v_inv.deal_id
  );

  return v_inv.deal_id;
end;
$$;

grant execute on function public.accept_invitation(text, text, text, text) to authenticated;
