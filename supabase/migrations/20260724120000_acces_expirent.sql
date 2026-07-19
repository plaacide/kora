-- Un accès accordé n'est plus éternel par défaut.
--
-- Le mécanisme existait déjà entièrement : `invitations.expires_at` se propage
-- aux `permissions` à l'acceptation, et `can_see_deal` refuse une permission
-- échue. Il n'était simplement JAMAIS rempli — le champ restait à null, et
-- null veut dire « pour toujours ».
--
-- Conséquence concrète, celle qui a motivé ce changement : un chargé de
-- programme invité dans une data room y garde son accès après le départ du
-- programme, après sa fermeture, indéfiniment. Les permissions sont attachées
-- à des PERSONNES ; rien ne les rattache au programme, donc rien ne les
-- retire quand il s'éteint. Le fondateur, lui, ne pense pas à faire le ménage
-- dans une liste qu'il ne consulte plus.
--
-- Quatre-vingt-dix jours parce que c'est l'ordre de grandeur d'une due
-- diligence. Assez pour ne jamais gêner une opération en cours, assez court
-- pour qu'un accès oublié se referme tout seul. Le fondateur reste libre de
-- fixer une autre date, y compris nulle : ce n'est pas une contrainte, c'est
-- un défaut qui va dans le bon sens.
--
-- Les accès DÉJÀ ouverts ne sont pas touchés : leur poser une échéance
-- rétroactive fermerait des portes ouvertes en connaissance de cause, sans
-- prévenir personne. Le nouveau défaut ne vaut que pour les invitations à
-- venir.

-- Signature reprise à l'identique de la définition en place — y compris les
-- cinq valeurs par défaut. `create or replace` refuse d'en retirer une
-- (42P13), et un DROP ferait perdre les grants (cf. AGENTS.md).
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
  v_org     uuid;
  v_inv     public.invitations;
  v_expires timestamptz;
begin
  select d.org_id into v_org from public.deals d where d.id = p_deal;
  if v_org is null
     or not public.has_org_role(v_org, array['owner', 'admin']::public.org_role[]) then
    raise exception 'accès refusé';
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

  perform public.write_audit(
    v_org, 'invitation.created', 'invitation', v_inv.id::text,
    jsonb_build_object(
      'email', v_inv.email, 'nda', p_nda_required, 'level', p_level,
      -- Tracé : un auditeur doit pouvoir distinguer une échéance choisie par
      -- le fondateur d'une échéance posée par défaut.
      'expires_at', v_expires,
      'expires_default', p_expires is null
    ),
    p_deal
  );

  return v_inv;
end;
$$;

grant execute on function public.create_invitation(uuid, text, boolean, text, timestamptz) to authenticated;

-- ---------------------------------------------------------------------------
-- Prolonger un accès
-- ---------------------------------------------------------------------------

/**
 * Repousse l'échéance d'un invité sur tout un deal.
 *
 * Sans ce geste, l'expiration par défaut serait une impasse : le fondateur
 * verrait un accès se fermer sans pouvoir le rouvrir autrement qu'en
 * réinvitant, ce qui refait signer le NDA — absurde pour quelqu'un qui l'a
 * déjà signé.
 */
create or replace function public.extend_access(
  p_deal uuid,
  p_user uuid,
  p_days int default 90
)
returns timestamptz
language plpgsql security definer set search_path = public as $$
declare
  v_org     uuid;
  v_expires timestamptz := now() + make_interval(days => p_days);
begin
  v_org := public.deal_org_for_write(p_deal);

  update public.permissions
  set expires_at = v_expires
  where deal_id = p_deal and user_id = p_user;

  perform public.write_audit(
    v_org, 'permission.extended', 'permission', p_user::text,
    jsonb_build_object('until', v_expires, 'days', p_days),
    p_deal
  );

  return v_expires;
end;
$$;

grant execute on function public.extend_access(uuid, uuid, int) to authenticated;
