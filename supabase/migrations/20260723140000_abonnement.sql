-- L'abonnement, encaissé à la main.
--
-- L'offre est publiée depuis le site : Fondateur à 15 000 F/mois avec le
-- premier mois offert, Programme à 150 000 F/mois. Rien ne l'appliquait : pas
-- de plan, pas d'échéance, pas de blocage. Tout le monde avait tout,
-- indéfiniment.
--
-- On encaisse d'abord à la main (mobile money, virement) et on inscrit
-- simplement jusqu'à quand l'organisation est à jour. Aucun agrégateur, aucun
-- webhook : à ce volume, une ligne de SQL par paiement coûte moins cher qu'une
-- intégration, et laisse changer les prix sans rien réécrire.
--
--   update public.organizations
--   set paid_until = '2026-09-30', plan = 'founder'
--   where name = '…';

alter table public.organizations
  add column if not exists plan text not null default 'founder',
  -- Date jusqu'à laquelle l'organisation est à jour. `null` = jamais soumise
  -- à l'abonnement (comptes internes, démonstrations).
  add column if not exists paid_until timestamptz;

alter table public.organizations
  drop constraint if exists organizations_plan_check;
alter table public.organizations
  add constraint organizations_plan_check check (plan in ('founder', 'program'));

-- ---------------------------------------------------------------------------
-- Les organisations DÉJÀ en place ne sont pas coupées
-- ---------------------------------------------------------------------------

-- Elles se sont inscrites sans que l'abonnement existe : leur appliquer une
-- échéance rétroactive, c'est verrouiller un client réel par surprise, un
-- matin, à cause d'une migration. On leur laisse un an, et la vraie date se
-- pose ensuite à la main, en connaissance de cause.
update public.organizations
set paid_until = now() + interval '1 year'
where paid_until is null;

-- ---------------------------------------------------------------------------
-- L'organisation est-elle à jour ?
-- ---------------------------------------------------------------------------

create or replace function public.org_active(p_org uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(paid_until is null or paid_until > now(), false)
  from public.organizations where id = p_org;
$$;

grant execute on function public.org_active(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Le verrou
-- ---------------------------------------------------------------------------

/**
 * Toutes les écritures passent par ici — 29 RPC l'appellent. C'est donc le
 * seul endroit où poser le verrou : ajouter la vérification écran par écran
 * aurait garanti d'en oublier un, et l'oubli n'aurait pas ressemblé à un
 * défaut mais à une fonctionnalité gratuite.
 *
 * La LECTURE reste ouverte au niveau de la base. Le blocage de lecture se fait
 * dans l'application, qui peut expliquer pourquoi et proposer de payer ; une
 * erreur SQL, elle, ne sait rien expliquer.
 */
create or replace function public.deal_org_for_write(p_deal uuid)
returns uuid
language plpgsql stable security definer set search_path = public as $$
declare
  v_org uuid;
begin
  select d.org_id into v_org from public.deals d where d.id = p_deal;
  if v_org is null then
    raise exception 'deal introuvable';
  end if;
  -- Les invités ne modifient jamais la structure : réservé à l'équipe interne.
  if not public.has_org_role(v_org, array['owner', 'admin', 'member']::public.org_role[]) then
    raise exception 'accès refusé';
  end if;
  if not public.org_active(v_org) then
    raise exception 'abonnement expiré';
  end if;
  return v_org;
end;
$$;

-- ---------------------------------------------------------------------------
-- Le nouvel arrivant a son mois offert
-- ---------------------------------------------------------------------------

-- Posé par déclencheur et non par `default` : la valeur dépend de l'instant de
-- création, et un `default now() + interval` serait évalué correctement mais
-- resterait invisible à la lecture de la table. Ici l'intention est écrite.
create or replace function public.organizations_set_trial()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.paid_until is null then
    new.paid_until := now() + interval '1 month';
  end if;
  return new;
end;
$$;

drop trigger if exists organizations_trial on public.organizations;
create trigger organizations_trial
  before insert on public.organizations
  for each row execute function public.organizations_set_trial();
