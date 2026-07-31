-- Faire respecter les limites — §15 et §16.
--
-- Le service savait dire qu'une organisation dépassait ; personne ne l'écoutait.
-- Un plan dont les limites ne sont jamais opposées n'est pas un plan, c'est une
-- suggestion.
--
-- CE QUE LE §15 IMPOSE, ET QU'IL FAUT TENIR : on empêche la CRÉATION au-delà de
-- la limite, on ne supprime JAMAIS l'existant. Une entreprise qui descend de
-- Close à Raise garde ses trois opérations ; elle ne peut simplement plus en
-- ouvrir une quatrième. C'est la différence entre une contrainte commerciale et
-- une punition.
--
-- POURQUOI DES TRIGGERS PLUTÔT QUE DES GARDES DANS LES RPC. Ouvrir une
-- opération passe par `create_deal`, mais aussi par l'onboarding et les
-- gabarits ; inviter passe par `create_invitation` et par `accept_invitation`.
-- Poser le contrôle dans chaque fonction obligerait à recopier trois corps
-- entiers pour y ajouter une ligne — et à les voir diverger au premier
-- correctif. La table est le seul endroit par lequel TOUT passe.
--
-- POURQUOI LE COMPTE VIT ICI ET NON DANS L'APPLICATION. Il y restera pour
-- l'affichage, mais un contrôle qui ne vit QUE dans l'application se contourne
-- en appelant la RPC directement.
--
-- Ré-exécutable.

/**
 * L'usage réel d'un espace de travail pour une limite donnée.
 *
 * Il se COMPTE, il ne s'incrémente pas. Un compteur incrémental finit toujours
 * par mentir — un incident, une suppression hors application — et une
 * organisation se verrait alors refuser ce à quoi elle a droit.
 */
create or replace function public.workspace_usage(p_org uuid, p_feature text)
returns bigint
language plpgsql stable security definer set search_path = public as $$
declare
  v_valeur bigint := 0;
begin
  if p_feature = 'internal_users' then
    -- §7.3 : les invités externes ne sont jamais facturés.
    select count(*) into v_valeur from public.memberships m
    where m.org_id = p_org and m.role::text <> 'guest';

  elsif p_feature = 'active_deals' then
    -- « Active » veut dire non archivée : `deals` n'a pas de colonne d'état.
    select count(*) into v_valeur from public.deals d
    where d.org_id = p_org and d.archived_at is null;

  elsif p_feature = 'external_visitors' then
    -- Des PERSONNES, pas des invitations : une même adresse invitée sur trois
    -- opérations reste une personne, et n'en coûte pas trois.
    select count(distinct lower(i.email)) into v_valeur
    from public.invitations i
    join public.deals d on d.id = i.deal_id
    where d.org_id = p_org and i.status <> 'revoked';

  elsif p_feature = 'storage_gb' then
    select coalesce(ceil(sum(v.size_bytes)::numeric / 1073741824), 0) into v_valeur
    from public.document_versions v
    join public.documents doc on doc.id = v.document_id
    join public.deals d on d.id = doc.deal_id
    where d.org_id = p_org;

  else
    -- Ce qui ne se recalcule pas vit dans la table prévue au §8.8.
    select coalesce(used_value, 0) into v_valeur
    from public.usage_counters
    where workspace_id = p_org and feature_code = p_feature
    order by period_end desc limit 1;
  end if;

  return coalesce(v_valeur, 0);
end;
$$;

grant execute on function public.workspace_usage(uuid, text) to authenticated;


/**
 * La limite du plan en cours.
 *
 * Trois réponses, et la nuance décide de tout :
 *   `null` — illimité. C'est l'argument de vente du plan Raise.
 *   `0`    — le plan n'ouvre pas cette fonction.
 *   `n`    — le plafond.
 *
 * Sans abonnement, c'est le plan gratuit qui s'applique : une organisation sans
 * droits ne pourrait rien faire, pas même s'abonner.
 */
create or replace function public.workspace_limit(p_org uuid, p_feature text)
returns bigint
language plpgsql stable security definer set search_path = public as $$
declare
  v_plan   uuid;
  v_actif  boolean;
  v_limite bigint;
begin
  select s.plan_id into v_plan
  from public.subscriptions s
  where s.workspace_id = p_org
    and s.status in ('trialing', 'active', 'past_due', 'manual_contract');

  if v_plan is null then
    select id into v_plan from public.plans where code = 'business_ready';
  end if;

  select e.is_enabled, e.limit_value into v_actif, v_limite
  from public.plan_entitlements e
  join public.features f on f.id = e.feature_id
  where e.plan_id = v_plan and f.code = p_feature;

  if v_actif is null or not v_actif then return 0; end if;
  return v_limite;
end;
$$;

grant execute on function public.workspace_limit(uuid, text) to authenticated;


/**
 * Refuser au-delà de la limite.
 *
 * Le message porte le CODE de la limite : c'est lui que l'application traduit
 * en une phrase qui propose une issue. Un refus sans issue est une impasse.
 */
create or replace function public.assert_within_limit(
  p_org uuid,
  p_feature text,
  p_quantite int default 1
)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_limite bigint := public.workspace_limit(p_org, p_feature);
begin
  if v_limite is null then return; end if;   -- illimité

  if public.workspace_usage(p_org, p_feature) + p_quantite > v_limite then
    raise exception 'limite atteinte : %', p_feature;
  end if;
end;
$$;

grant execute on function public.assert_within_limit(uuid, text, int) to authenticated;


-- ---------------------------------------------------------------------------
-- Les trois gestes qu'une limite peut refuser
-- ---------------------------------------------------------------------------

/**
 * `auth.uid()` nul veut dire « pas un geste d'utilisateur ».
 *
 * Les migrations, les tâches planifiées et les scripts d'administration
 * s'exécutent sans session. Leur opposer une limite commerciale bloquerait un
 * rattrapage de données le jour où on en a le plus besoin — et n'ajouterait
 * aucune sécurité, puisque ces chemins ne sont pas ceux d'un client.
 */
create or replace function public.limite_operations()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return new; end if;
  perform public.assert_within_limit(new.org_id, 'active_deals', 1);
  return new;
end;
$$;

drop trigger if exists deals_limite on public.deals;
create trigger deals_limite
  before insert on public.deals
  for each row execute function public.limite_operations();


/**
 * Les collaborateurs internes.
 *
 * Un `guest` ne compte pas : c'est un investisseur invité, et le §7.3 interdit
 * de le facturer. Il ne doit donc pas non plus se voir refuser l'entrée parce
 * que l'équipe est complète.
 */
create or replace function public.limite_collaborateurs()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return new; end if;
  if new.role::text = 'guest' then return new; end if;
  perform public.assert_within_limit(new.org_id, 'internal_users', 1);
  return new;
end;
$$;

drop trigger if exists memberships_limite on public.memberships;
create trigger memberships_limite
  before insert on public.memberships
  for each row execute function public.limite_collaborateurs();


/**
 * Les visiteurs externes.
 *
 * On ne compte que les PERSONNES : réinviter quelqu'un déjà présent, ou
 * l'inviter sur une seconde opération, n'ajoute personne. Compter les
 * invitations refuserait un second accès à un investisseur déjà admis — ce
 * qui n'a aucun sens commercial et se lirait comme un bug.
 */
create or replace function public.limite_visiteurs()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_org   uuid;
  v_connu boolean;
begin
  if auth.uid() is null then return new; end if;

  select d.org_id into v_org from public.deals d where d.id = new.deal_id;
  if v_org is null then return new; end if;

  select exists (
    select 1 from public.invitations i
    join public.deals d on d.id = i.deal_id
    where d.org_id = v_org
      and lower(i.email) = lower(new.email)
      and i.status <> 'revoked'
  ) into v_connu;

  if not v_connu then
    perform public.assert_within_limit(v_org, 'external_visitors', 1);
  end if;

  return new;
end;
$$;

drop trigger if exists invitations_limite on public.invitations;
create trigger invitations_limite
  before insert on public.invitations
  for each row execute function public.limite_visiteurs();
