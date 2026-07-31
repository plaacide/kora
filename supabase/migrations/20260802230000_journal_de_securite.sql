-- Le journal de sécurité — écran 34.
--
-- La maquette promet « connexions, révocations, 2FA », et renvoie vers un
-- journal de sécurité. Aucune de ces lignes n'existait : `audit_log` ne portait
-- que des actions documentaires. L'écran affichait donc un lien vers un journal
-- vide, et trois sessions inventées.
--
-- POURQUOI UNE RPC PLUTÔT QUE `write_audit`. L'activation d'un facteur TOTP se
-- fait dans le NAVIGATEUR — c'est Supabase qui la gère, l'application n'en voit
-- que le résultat. Le geste doit donc être journalisé depuis le client, et un
-- client ne doit jamais choisir l'organisation qu'il inscrit au journal.
-- `log_security_event` la déduit de l'appelant : il ne peut écrire que chez
-- lui.
--
-- Les actions sont fermées à une liste. Un journal où l'on peut écrire
-- n'importe quel verbe cesse d'être une preuve : il devient un champ de texte
-- libre avec un horodatage.
--
-- Ré-exécutable.

create or replace function public.log_security_event(
  p_action text,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_org uuid;
begin
  if auth.uid() is null then
    raise exception 'non authentifié';
  end if;

  if p_action not in (
    'security.mfa_enabled',
    'security.mfa_disabled',
    'security.sessions_revoked'
  ) then
    raise exception 'action de sécurité inconnue';
  end if;

  -- L'organisation vient de l'appelant, jamais du paramètre. La plus ancienne
  -- s'il en a plusieurs : c'est celle que le poste de pilotage ouvre par
  -- défaut, donc celle dont il regarde le journal.
  select org_id into v_org
  from public.memberships
  where user_id = auth.uid() and role::text <> 'guest'
  order by created_at
  limit 1;

  -- Un utilisateur sans organisation interne n'a pas de journal où écrire. Ce
  -- n'est pas une erreur : il peut activer sa 2FA avant de rejoindre une
  -- équipe, et refuser l'activation pour cette raison serait absurde.
  if v_org is null then
    return;
  end if;

  perform public.write_audit(
    v_org, p_action, 'account', auth.uid()::text,
    coalesce(p_metadata, '{}'::jsonb)
  );
end;
$$;

grant execute on function public.log_security_event(text, jsonb) to authenticated;
