-- Le socle des Dealrooms — ADR-002, option B.
--
-- En base, la vitrine n'existait pas comme objet : `listing_consents`,
-- `showcase_entries` et `showcase_access` sont toutes indexées sur
-- `cohort_id`. Une cohorte avait donc AU PLUS UNE vitrine, sans nom, sans
-- statut, sans marque, sans audience propre. Les écrans demandent l'inverse —
-- un objet nommé, quatre statuts, un branding, une audience, et des
-- entreprises tirées de PLUSIEURS cohortes (écran 22). Ce n'était pas une
-- colonne qui manquait, c'était l'entité.
--
-- ⚠️ LES TABLES `showcase_*` NE SONT PAS SUPPRIMÉES, contrairement à ce que
-- la suite n°2 d'ADR-002 envisageait. Vérification faite : NEUF fichiers de la
-- V1 les lisent encore, dont `/vitrine` et `/vitrine/[org]`, qui tournent
-- aujourd'hui en production. Les supprimer casserait le produit en service.
-- La suite n°3 de l'ADR le demandait justement — « vérifier qu'aucun écran V1
-- ne lit encore `showcase_entries` avant de supprimer ». La réponse est non.
-- La suppression sera un lot à part, après la bascule de la V1.
--
-- ⚠️ LES ACCORDS NE SE MIGRENT PAS. C'est le point produit de l'ADR, et il est
-- délibéré : un `listing_consent` donné pour une cohorte ne vaut pas accord
-- pour une Dealroom future, brandée autrement, montrée à une audience que
-- l'entreprise ne connaît pas. Chaque entreprise redonne son accord, Dealroom
-- par Dealroom.
--
-- ⚠️ L'ACCÈS N'EST PLUS NOMINATIF — arbitrage d'ADR-005 du 6 août. La Dealroom
-- s'ouvre SANS COMPTE : le lien EST l'accès. `showcase_access` liait un jeton à
-- une adresse ; `dealroom_links` lie un jeton à une DEALROOM, et plusieurs
-- liens peuvent coexister — c'est la seule façon d'en révoquer un sans couper
-- les autres, puisqu'on ne peut plus retirer l'accès à quelqu'un qui n'a pas
-- d'identité.
--
-- Ré-exécutable.

-- ---------------------------------------------------------------------------
-- Les statuts
-- ---------------------------------------------------------------------------
-- TROIS statuts stockés, pas quatre. « Prête à publier » se DÉDUIT — un
-- brouillon dont toutes les entreprises ont donné leur accord est prêt. Le
-- stocker créerait deux sources qui finiraient par se contredire, exactement
-- comme « en retard » côté Challenges.
do $$ begin
  create type public.dealroom_status as enum ('brouillon', 'publiee', 'archivee');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.dealroom_consent as enum ('attente', 'accorde', 'refuse', 'retire');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- La Dealroom
-- ---------------------------------------------------------------------------
create table if not exists public.dealrooms (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations(id) on delete cascade,
  -- L'IDENTIFIANT PUBLIC EST OPAQUE, et c'est devenu critique depuis
  -- l'arbitrage d'ADR-005 : la page s'ouvrant sans compte, ce jeton est le
  -- SEUL secret qui protège la Dealroom. Un slug lisible — « demo-day-2026 »
  -- — se devine, et révélerait au passage l'existence et le nom des
  -- Dealrooms d'un programme.
  slug          text not null unique default encode(gen_random_bytes(12), 'hex'),
  internal_name text not null,
  public_title  text,
  subtitle      text,
  description   text,
  contact_email text,
  status        public.dealroom_status not null default 'brouillon',
  published_at  timestamptz,
  archived_at   timestamptz,
  created_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now()
);

create index if not exists dealrooms_org_idx
  on public.dealrooms (org_id) where archived_at is null;

create table if not exists public.dealroom_branding (
  dealroom_id      uuid primary key references public.dealrooms(id) on delete cascade,
  -- Des clés du bucket `branding`, public — même régime que le logo d'un
  -- programme, et pour la même raison : la page qu'elles décorent est ouverte.
  logo             text,
  banner           text,
  accent           text,
  theme            text,
  partners         text[] not null default '{}',
  powered_by_sanza boolean not null default true
);

-- LE MULTI-COHORTES EST LA RAISON D'ÊTRE DE CE MODÈLE. L'écran 22 mêle
-- « Saison 4 · Agri & Agro » et « Fintech 2026 » dans une même Dealroom ;
-- l'ancienne vitrine, indexée sur une cohorte, ne pouvait pas l'exprimer.
create table if not exists public.dealroom_cohorts (
  dealroom_id uuid not null references public.dealrooms(id) on delete cascade,
  cohort_id   uuid not null references public.cohorts(id) on delete cascade,
  primary key (dealroom_id, cohort_id)
);

-- Une entreprise publiée, et l'OPÉRATION qu'elle présente. `deal_id` est
-- nullable : une entreprise peut figurer dans une Dealroom avant d'avoir
-- désigné son opération — l'écran 26 le montre, et c'est elle qui choisit.
create table if not exists public.dealroom_entries (
  dealroom_id    uuid not null references public.dealrooms(id) on delete cascade,
  startup_org_id uuid not null references public.organizations(id) on delete cascade,
  deal_id        uuid references public.deals(id) on delete set null,
  published_at   timestamptz,
  unpublished_at timestamptz,
  primary key (dealroom_id, startup_org_id)
);

-- L'ACCORD EST UN CONTRAT, pas un drapeau. Il porte ses dates, et le retrait
-- ne l'efface pas — on doit pouvoir dire qu'un accord a existé puis a été
-- retiré, sinon l'historique ment par omission.
create table if not exists public.dealroom_consents (
  dealroom_id    uuid not null references public.dealrooms(id) on delete cascade,
  startup_org_id uuid not null references public.organizations(id) on delete cascade,
  status         public.dealroom_consent not null default 'attente',
  granted_at     timestamptz,
  revoked_at     timestamptz,
  primary key (dealroom_id, startup_org_id)
);

-- ---------------------------------------------------------------------------
-- L'accès — le lien EST l'accès (ADR-005, option B)
-- ---------------------------------------------------------------------------
-- PLUSIEURS LIENS PAR DEALROOM, et c'est la conséquence directe de
-- l'arbitrage. On ne retire pas l'accès à quelqu'un qui n'a pas d'identité :
-- révoquer, c'est éteindre UN lien. Sans plusieurs liens, la seule révocation
-- possible couperait tout le monde d'un coup.
--
-- `label` sert à s'en souvenir — « envoyé à la BOAD », « LinkedIn » — pour
-- pouvoir couper le bon.
create table if not exists public.dealroom_links (
  id          uuid primary key default gen_random_uuid(),
  dealroom_id uuid not null references public.dealrooms(id) on delete cascade,
  token       text not null unique default encode(gen_random_bytes(16), 'hex'),
  label       text,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  revoked_at  timestamptz
);

create index if not exists dealroom_links_dealroom_idx
  on public.dealroom_links (dealroom_id) where revoked_at is null;

-- ---------------------------------------------------------------------------
-- La lecture — RLS
-- ---------------------------------------------------------------------------
-- ⚠️ AUCUNE POLITIQUE NE S'APPUIE SUR UNE AUTRE DE CES TABLES. La leçon des
-- Challenges est reprise d'emblée : deux politiques qui se citent produisent
-- `42P17 infinite recursion`, que rien ne détecte avant la première requête.
-- D'où `dealroom_org()`, `security definer`, qui rompt tout cycle possible.
create or replace function public.dealroom_org(p_dealroom uuid)
returns uuid
language sql stable security definer set search_path = public as $fn$
  select d.org_id from public.dealrooms d where d.id = p_dealroom;
$fn$;

grant execute on function public.dealroom_org(uuid) to authenticated;

alter table public.dealrooms         enable row level security;
alter table public.dealroom_branding enable row level security;
alter table public.dealroom_cohorts  enable row level security;
alter table public.dealroom_entries  enable row level security;
alter table public.dealroom_consents enable row level security;
alter table public.dealroom_links    enable row level security;

-- Une Dealroom se lit par son PROGRAMME. La lecture PUBLIQUE — celle de
-- l'investisseur sans compte — ne passe pas par la RLS mais par une fonction
-- `security definer` prenant le jeton en argument : c'est le seul moyen de
-- servir quelqu'un qui n'est pas authentifié du tout.
drop policy if exists dealrooms_select on public.dealrooms;
create policy dealrooms_select on public.dealrooms
  for select using (public.is_org_member(org_id));

drop policy if exists dealroom_branding_select on public.dealroom_branding;
create policy dealroom_branding_select on public.dealroom_branding
  for select using (public.is_org_member(public.dealroom_org(dealroom_id)));

drop policy if exists dealroom_cohorts_select on public.dealroom_cohorts;
create policy dealroom_cohorts_select on public.dealroom_cohorts
  for select using (public.is_org_member(public.dealroom_org(dealroom_id)));

drop policy if exists dealroom_links_select on public.dealroom_links;
create policy dealroom_links_select on public.dealroom_links
  for select using (public.is_org_member(public.dealroom_org(dealroom_id)));

-- L'ENTREPRISE VOIT CE QUI LA CONCERNE. Elle doit pouvoir constater qu'elle
-- figure dans une Dealroom, et relire l'accord qu'on lui demande — sans quoi
-- le consentement serait donné à l'aveugle.
drop policy if exists dealroom_entries_select on public.dealroom_entries;
create policy dealroom_entries_select on public.dealroom_entries
  for select using (
    public.is_org_member(startup_org_id)
    or public.is_org_member(public.dealroom_org(dealroom_id))
  );

drop policy if exists dealroom_consents_select on public.dealroom_consents;
create policy dealroom_consents_select on public.dealroom_consents
  for select using (
    public.is_org_member(startup_org_id)
    or public.is_org_member(public.dealroom_org(dealroom_id))
  );

-- AUCUNE POLITIQUE D'ÉCRITURE : tout passera par des RPC auditées. Publier
-- une entreprise devant des investisseurs n'est pas une écriture de données,
-- c'est un engagement pris en son nom.
