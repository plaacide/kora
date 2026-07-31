-- Refermer une data room.
--
-- On pouvait ouvrir un accès, pas le fermer. C'est le manque le plus grave de
-- Partage et accès : une invitation envoyée par erreur, un investisseur qui
-- sort du tour, un cabinet dont le mandat s'achève — rien ne permettait de
-- reprendre ce qui avait été donné. La seule issue était d'attendre les
-- quatre-vingt-dix jours d'échéance.
--
-- CE QUE RÉVOQUER VEUT DIRE, précisément :
--
--   · l'invitation passe à `revoked` — le jeton cesse d'ouvrir quoi que ce
--     soit, `accept_invitation` le refuse déjà ;
--   · les `permissions` de cette personne SUR CETTE OPÉRATION sont
--     supprimées — pas mises à `none` : une règle absente est plus sûre
--     qu'une règle qu'on pourrait rouvrir par mégarde ;
--   · le geste est journalisé. Retirer un accès est un acte de sécurité ; un
--     auditeur doit pouvoir dire qui a fermé quoi, et quand.
--
-- CE QUE ÇA NE FAIT PAS, et c'est délibéré :
--
--   · l'appartenance `guest` à l'organisation reste. La retirer couperait
--     l'accès aux AUTRES opérations où cette personne est légitimement
--     invitée. `can_see_deal` s'appuie sur les permissions, pas sur elle.
--   · l'historique reste. Les consultations passées ont eu lieu ; les effacer
--     détruirait la preuve que la révocation est justement censée encadrer.
--
-- LIMITE ASSUMÉE. Les permissions ne portent pas l'invitation qui les a
-- créées. Si la même personne a reçu DEUX invitations sur la même opération,
-- en révoquer une ferme son accès entier. C'est la lecture la plus sûre — et
-- la plus intuitive : le fondateur croit fermer la porte à quelqu'un, pas à
-- l'un de ses deux jeux de clés.
--
-- Ré-exécutable, et idempotent : révoquer deux fois ne casse rien.

create or replace function public.revoke_invitation(p_invitation uuid)
returns int
language plpgsql security definer set search_path = public as $$
declare
  v_inv     public.invitations;
  v_org     uuid;
  v_user    uuid;
  v_retires int := 0;
begin
  select * into v_inv from public.invitations where id = p_invitation;
  if v_inv.id is null then raise exception 'invitation introuvable'; end if;

  -- Vérifie le droit d'écrire sur l'opération, et lève sinon.
  v_org := public.deal_org_for_write(v_inv.deal_id);

  update public.invitations
  set status = 'revoked'
  where id = p_invitation;

  -- Le compte de l'invité, s'il en a créé un. Une invitation jamais acceptée
  -- n'a aucune permission à retirer : la révocation se limite alors au jeton.
  select id into v_user
  from public.profiles
  where lower(email) = lower(v_inv.email)
  limit 1;

  if v_user is not null then
    with supprimees as (
      delete from public.permissions
      where deal_id = v_inv.deal_id and user_id = v_user
      returning 1
    )
    select count(*) into v_retires from supprimees;
  end if;

  perform public.write_audit(
    v_org, 'invitation.revoked', 'invitation', p_invitation::text,
    jsonb_build_object(
      'email', v_inv.email,
      'level', v_inv.level,
      -- Combien de dossiers se sont refermés : c'est la question qu'on pose
      -- en relisant un journal, et elle ne se rejoue pas après coup.
      'permissions_removed', v_retires
    ),
    v_inv.deal_id
  );

  return v_retires;
end;
$$;

grant execute on function public.revoke_invitation(uuid) to authenticated;
