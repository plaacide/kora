-- Une échéance se termine à la fin du jour dit.
--
-- Le fondateur choisit « 15 octobre » dans un champ date. Le navigateur en
-- fait `2026-10-15T00:00:00Z`, c'est-à-dire le tout DÉBUT du 15. L'accès
-- mourait donc la veille au soir : l'invité qui ouvrait le lien le 15 au matin
-- lisait « invitation expirée », alors que l'écran du fondateur annonçait
-- toujours « expire le 15 oct. 2026 ». Les deux étaient d'accord sur la date
-- et en désaccord sur ce qu'elle veut dire.
--
-- Une échéance, dans la tête de qui la pose, c'est un dernier jour ENTIER.
-- On normalise donc toute échéance à 23:59:59 du jour choisi, y compris celle
-- que la base pose elle-même à quatre-vingt-dix jours.
--
-- FUSEAU. La normalisation se fait en UTC. Pour Dakar et Abidjan (UTC+0),
-- c'est exact à la seconde. Pour Lagos (UTC+1) ou Nairobi (UTC+3), l'accès
-- survit d'une à trois heures au-delà de minuit local. Le jour où une
-- organisation portera son fuseau, c'est ici qu'il faudra le lire — le
-- calcul est déjà isolé dans une fonction pour ça.
--
-- Ré-exécutable.

/**
 * 23:59:59 du jour de `p_moment`, en UTC.
 *
 * Isolée plutôt qu'écrite en ligne : elle sert à la création d'une invitation
 * et servira à toute prolongation. Deux calculs d'échéance qui divergent, ce
 * sont deux dates affichées différemment pour le même accès.
 */
create or replace function public.fin_de_journee(p_moment timestamptz)
returns timestamptz
language sql immutable as $$
  select (
    date_trunc('day', p_moment at time zone 'UTC')
    + interval '1 day' - interval '1 second'
  ) at time zone 'UTC';
$$;

grant execute on function public.fin_de_journee(timestamptz) to authenticated;


create or replace function public.create_invitation(
  p_deal uuid,
  p_email text,
  p_nda_required boolean default true,
  p_level text default 'watermark',
  p_expires timestamptz default null,
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
  -- Puis la fin de journée, pour que le dernier jour soit un jour entier.
  v_expires := public.fin_de_journee(
    coalesce(p_expires, now() + interval '90 days')
  );

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
    select v_inv.id, f.id from unnest(p_folders) as f(id)
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
-- Les échéances déjà posées à minuit
-- ---------------------------------------------------------------------------
-- Elles portent la même erreur : leur dernier jour n'a jamais existé. On les
-- rattrape, sans toucher à celles qui ont une heure choisie — elles viennent
-- d'ailleurs et on ne sait pas ce qu'elles voulaient dire.
--
-- Les permissions recopient l'échéance de leur invitation à l'acceptation :
-- elles sont donc rattrapées aussi, sinon l'accès se fermerait quand même la
-- veille au soir, une couche plus bas.
update public.invitations
set expires_at = public.fin_de_journee(expires_at)
where expires_at is not null
  and (expires_at at time zone 'UTC')::time = '00:00:00';

update public.permissions
set expires_at = public.fin_de_journee(expires_at)
where expires_at is not null
  and (expires_at at time zone 'UTC')::time = '00:00:00';
