-- Le socle des abonnements — chapitre 8 de l'architecture pricing.
--
-- L'écran Abonnement affichait trois cartes de prix écrites en dur, et rien ne
-- vivait derrière. Ce qui suit n'est pas un écran : c'est le système que le
-- document exige, et qui doit servir dans TOUT Sanza sans que la règle métier
-- soit recopiée d'un composant à l'autre.
--
-- LE PRINCIPE QUI COMMANDE TOUT LE RESTE (§7.1) : aucun composant n'a le droit
-- d'écrire `if (plan === "raise")`. Un droit se demande au service central, qui
-- le lit ici. Sans cette table, la règle finirait dispersée dans quarante
-- fichiers et on ne saurait plus, six mois plus tard, ce que le plan Raise ouvre
-- vraiment.
--
-- SÉPARER CE QUI EST SÉPARÉ (§7.2) : le segment de client, le plan, le prix,
-- la fonctionnalité, la limite, l'abonnement, l'usage. Sept notions, sept
-- tables. Les fondre ferait gagner une jointure et perdre la possibilité de
-- changer un prix sans toucher aux droits.
--
-- LES VISITEURS EXTERNES NE SONT JAMAIS FACTURÉS (§7.3). C'est pourquoi les
-- compteurs d'usage comptent les MEMBRES INTERNES et non les `memberships` :
-- un investisseur invité sur une data room ne coûte rien à personne.
--
-- Ré-exécutable.

-- ---------------------------------------------------------------------------
-- 8.1 Les trois segments de clientèle
-- ---------------------------------------------------------------------------
create table if not exists public.customer_segments (
  id   uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.customer_segments (code, name, description) values
  ('business', 'Entreprises',
   'Startups, PME et fondateurs en recherche de financement.'),
  ('program', 'Programmes',
   'Incubateurs, accélérateurs, ONG et bailleurs qui suivent une cohorte.'),
  ('funder', 'Financeurs',
   'Fonds, banques et institutions qui instruisent des dossiers.')
on conflict (code) do update set
  name = excluded.name, description = excluded.description, updated_at = now();


-- ---------------------------------------------------------------------------
-- 8.2 et 8.3 Les plans et leurs prix
-- ---------------------------------------------------------------------------
create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  segment_id uuid not null references public.customer_segments(id),
  code text unique not null,
  name text not null,
  description text,
  billing_type text not null
    check (billing_type in ('monthly', 'annual', 'cohort', 'custom')),
  is_free boolean not null default false,
  -- « à partir de » : le prix existe mais se négocie. L'écran doit afficher
  -- « Devis » plutôt qu'un montant qu'on ne peut pas encaisser.
  is_custom_pricing boolean not null default false,
  is_active boolean not null default true,
  display_order int not null default 0,
  badge text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.plan_prices (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  currency text not null default 'XOF',
  billing_interval text not null
    check (billing_interval in ('month', 'year', 'cohort', 'custom')),
  -- En unités entières de la devise : le franc CFA n'a pas de centimes, et un
  -- montant en virgule flottante finit toujours par perdre une unité.
  unit_amount bigint,
  billing_period_count int not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (plan_id, currency, billing_interval)
);


-- ---------------------------------------------------------------------------
-- 8.4 et 8.5 Les fonctionnalités et ce que chaque plan en ouvre
-- ---------------------------------------------------------------------------
create table if not exists public.features (
  id   uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  category text not null,
  -- `boolean` : on l'a ou on ne l'a pas. `limit` : on en a un nombre.
  kind text not null default 'boolean' check (kind in ('boolean', 'limit')),
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.plan_entitlements (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  feature_id uuid not null references public.features(id) on delete cascade,
  is_enabled boolean not null default true,
  -- `null` sur une limite veut dire ILLIMITÉ, et non zéro. La nuance décide de
  -- tout : « visiteurs externes illimités » est l'argument de vente du plan
  -- Raise, et un zéro par défaut le transformerait en interdiction.
  limit_value bigint,
  created_at timestamptz not null default now(),
  unique (plan_id, feature_id)
);


-- ---------------------------------------------------------------------------
-- 8.6 L'abonnement d'un espace de travail
-- ---------------------------------------------------------------------------
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  -- L'espace de travail EST l'organisation dans Sanza. On garde le nom du
  -- document pour que le vocabulaire de facturation reste lisible.
  workspace_id uuid not null
    references public.organizations(id) on delete cascade,
  plan_id uuid not null references public.plans(id),
  status text not null default 'active' check (status in (
    'trialing', 'active', 'past_due', 'paused',
    'cancelled', 'expired', 'pending', 'manual_contract'
  )),
  billing_interval text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  trial_start timestamptz,
  trial_end timestamptz,
  cancel_at_period_end boolean not null default false,
  -- L'identité du client chez le prestataire de paiement. Aucun nom de
  -- prestataire dans le schéma : le document interdit d'en dépendre d'un seul.
  external_customer_id text,
  external_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Un espace de travail n'a qu'un abonnement vivant. Deux feraient deux
-- factures et deux jeux de droits contradictoires.
create unique index if not exists subscriptions_vivante_idx
  on public.subscriptions (workspace_id)
  where status in ('trialing', 'active', 'past_due', 'manual_contract', 'pending');

create table if not exists public.subscription_addons (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null
    references public.subscriptions(id) on delete cascade,
  addon_code text not null,
  quantity int not null default 1,
  unit_amount bigint,
  currency text not null default 'XOF',
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- ---------------------------------------------------------------------------
-- 8.8 à 8.10 L'usage, les événements de facturation, les factures
-- ---------------------------------------------------------------------------
create table if not exists public.usage_counters (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null
    references public.organizations(id) on delete cascade,
  feature_code text not null,
  period_start timestamptz not null,
  period_end timestamptz not null,
  used_value bigint not null default 0,
  updated_at timestamptz not null default now(),
  unique (workspace_id, feature_code, period_start, period_end)
);

create table if not exists public.billing_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.organizations(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  event_type text not null,
  provider text,
  external_event_id text,
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  -- L'idempotence des webhooks tient à cette contrainte : un prestataire
  -- rejoue ses notifications, et une facture payée deux fois est un litige.
  unique (provider, external_event_id)
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null
    references public.organizations(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  number text,
  status text not null default 'draft',
  currency text not null default 'XOF',
  total_amount bigint not null default 0,
  issued_at timestamptz,
  due_at timestamptz,
  paid_at timestamptz,
  provider text,
  external_invoice_id text,
  created_at timestamptz not null default now()
);


-- ---------------------------------------------------------------------------
-- 19. Sécurité : le catalogue est public, l'abonnement ne l'est pas
-- ---------------------------------------------------------------------------
alter table public.customer_segments enable row level security;
alter table public.plans enable row level security;
alter table public.plan_prices enable row level security;
alter table public.features enable row level security;
alter table public.plan_entitlements enable row level security;
alter table public.subscriptions enable row level security;
alter table public.subscription_addons enable row level security;
alter table public.usage_counters enable row level security;
alter table public.billing_events enable row level security;
alter table public.invoices enable row level security;

/**
 * Le catalogue se lit sans compte.
 *
 * C'est une page de tarification : la cacher derrière une authentification
 * empêcherait de la consulter avant de s'inscrire, ce qui est exactement le
 * moment où on la consulte.
 */
do $$
declare t text;
begin
  foreach t in array array['customer_segments', 'plans', 'plan_prices', 'features', 'plan_entitlements']
  loop
    execute format('drop policy if exists %I_public on public.%I', t, t);
    execute format(
      'create policy %I_public on public.%I for select using (true)', t, t
    );
  end loop;
end $$;

-- L'abonnement, l'usage et les factures : à l'organisation seule.
drop policy if exists subscriptions_select on public.subscriptions;
create policy subscriptions_select on public.subscriptions
  for select using (public.is_org_internal(workspace_id));

drop policy if exists usage_counters_select on public.usage_counters;
create policy usage_counters_select on public.usage_counters
  for select using (public.is_org_internal(workspace_id));

drop policy if exists invoices_select on public.invoices;
create policy invoices_select on public.invoices
  for select using (
    public.has_org_role(workspace_id, array['owner', 'admin']::public.org_role[])
  );

drop policy if exists subscription_addons_select on public.subscription_addons;
create policy subscription_addons_select on public.subscription_addons
  for select using (exists (
    select 1 from public.subscriptions s
    where s.id = subscription_addons.subscription_id
      and public.is_org_internal(s.workspace_id)
  ));

-- `billing_events` ne se lit pas depuis l'application : ce sont des
-- notifications de prestataire, traitées côté serveur. Aucune politique de
-- lecture — donc personne, hors clé de service.

-- Tout est écrit par le serveur : un client qui pourrait modifier son
-- abonnement s'offrirait le plan Institution.
revoke insert, update, delete on
  public.customer_segments, public.plans, public.plan_prices, public.features,
  public.plan_entitlements, public.subscriptions, public.subscription_addons,
  public.usage_counters, public.billing_events, public.invoices
from authenticated;
