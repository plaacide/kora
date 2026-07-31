-- Changer le rôle d'un collaborateur, ou le retirer — écran 33.
--
-- `memberships` est déjà écrivable directement : ses politiques réservent
-- l'écriture à owner et admin. On pourrait donc s'en tenir à un UPDATE. Ce
-- serait une erreur, pour trois raisons que la RLS ne sait pas porter.
--
--   1. LE DERNIER PROPRIÉTAIRE. Rétrograder ou retirer le seul owner laisse
--      une organisation que plus personne ne peut administrer : ni changer un
--      rôle, ni inviter, ni clôturer une levée. C'est irréversible depuis
--      l'application — il faudrait passer par la base.
--   2. SE RETIRER SOI-MÊME. Un admin qui se supprime perd l'accès à l'instant
--      même, souvent par erreur de ligne dans un tableau. On le refuse : quitter
--      une organisation est un geste distinct, qui n'a pas sa place dans l'écran
--      qui sert à gérer les autres.
--   3. LE JOURNAL. « Fatou est passée d'administrateur à contributeur » est
--      exactement ce qu'un journal d'audit existe pour retenir. Un UPDATE nu
--      n'écrit rien.
--
-- Ré-exécutable.

/**
 * Poser le rôle d'un membre.
 *
 * `p_role` arrive en texte et non en `org_role` : PostgREST résout les
 * surcharges par les arguments reçus, et un paramètre typé enum oblige l'appelant
 * à connaître le nom exact du type. Le cast échoue de toute façon si la valeur
 * n'existe pas.
 */
create or replace function public.set_member_role(p_member uuid, p_role text)
returns public.memberships
language plpgsql security definer set search_path = public as $$
declare
  v_row     public.memberships;
  v_avant   public.org_role;
  v_org     uuid;
  v_user    uuid;
  v_owners  int;
  v_email   text;
begin
  select org_id, user_id, role into v_org, v_user, v_avant
  from public.memberships where id = p_member;

  if v_org is null then
    raise exception 'membre introuvable';
  end if;

  if not public.has_org_role(v_org, array['owner', 'admin']::public.org_role[]) then
    raise exception 'droits insuffisants';
  end if;

  -- Seul un propriétaire nomme un propriétaire. Un admin qui pourrait le faire
  -- pourrait se promouvoir lui-même : le garde-fou du dernier owner ne servirait
  -- alors plus à rien.
  if p_role = 'owner'
     and not public.has_org_role(v_org, array['owner']::public.org_role[]) then
    raise exception 'seul un propriétaire nomme un propriétaire';
  end if;

  if v_avant = 'owner' and p_role <> 'owner' then
    select count(*) into v_owners
    from public.memberships
    where org_id = v_org and role = 'owner';

    if v_owners <= 1 then
      raise exception 'dernier propriétaire';
    end if;
  end if;

  update public.memberships
  set role = p_role::public.org_role
  where id = p_member
  returning * into v_row;

  select email into v_email from public.profiles where id = v_user;

  perform public.write_audit(
    v_org, 'member.role_changed', 'membership', p_member::text,
    jsonb_strip_nulls(jsonb_build_object(
      'membre', v_email, 'avant', v_avant::text, 'apres', p_role
    ))
  );

  return v_row;
end;
$$;

grant execute on function public.set_member_role(uuid, text) to authenticated;


/**
 * Retirer un collaborateur de l'organisation.
 *
 * Ses dépôts, ses versions et ses lignes de journal restent : elles portent son
 * identifiant, pas son appartenance. Retirer quelqu'un ferme sa porte, cela
 * n'efface pas ce qu'il a fait — sans quoi le journal cesserait d'être une
 * preuve.
 */
create or replace function public.remove_member(p_member uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_org    uuid;
  v_user   uuid;
  v_role   public.org_role;
  v_owners int;
  v_email  text;
begin
  select org_id, user_id, role into v_org, v_user, v_role
  from public.memberships where id = p_member;

  if v_org is null then
    raise exception 'membre introuvable';
  end if;

  if not public.has_org_role(v_org, array['owner', 'admin']::public.org_role[]) then
    raise exception 'droits insuffisants';
  end if;

  if v_user = auth.uid() then
    raise exception 'retrait de soi-même';
  end if;

  if v_role = 'owner' then
    select count(*) into v_owners
    from public.memberships where org_id = v_org and role = 'owner';

    if v_owners <= 1 then
      raise exception 'dernier propriétaire';
    end if;
  end if;

  select email into v_email from public.profiles where id = v_user;

  delete from public.memberships where id = p_member;

  perform public.write_audit(
    v_org, 'member.removed', 'membership', p_member::text,
    jsonb_strip_nulls(jsonb_build_object('membre', v_email, 'role', v_role::text))
  );
end;
$$;

grant execute on function public.remove_member(uuid) to authenticated;
