-- Le socle des Challenges. Rien n'existait en base : voici les six tables.
--
-- ADR-003 est tranchée (6 août, option B et ses deux clauses, amendement du
-- 5 août compris). Trois décisions de cette ADR se lisent DIRECTEMENT dans ce
-- schéma, et il faut savoir les reconnaître :
--
-- 1. UN CHALLENGE S'INSTANCIE PAR COPIE. Les critères d'un modèle sont recopiés
--    dans `challenge_criteria` au moment de la création. Sans cette copie,
--    corriger un modèle Sanza modifierait rétroactivement des Challenges en
--    cours et des progressions déjà acquises — l'écran 12 le promet noir sur
--    blanc : « le modèle original ne sera pas modifié ».
--
-- 2. LA PROGRESSION EST PERSISTÉE, pas dérivée. Un critère « connecté » se
--    valide depuis les faits d'exigence de l'entreprise, mais ces faits
--    transitent par le canal du programme, qui s'éteint avec le lien. Une
--    progression dérivée deviendrait donc VIDE à la sortie de cohorte :
--    l'écran afficherait 0 / 4 là où l'entreprise avait fait 3 / 4. C'est le
--    pire des trois résultats, parce qu'il a l'air d'une donnée et non d'une
--    absence. `fige_le` marque la rupture du lien ; une ligne figée n'est
--    JAMAIS réévaluée.
--
-- 3. L'OPÉRATION PRÉSENTÉE EST DÉSIGNÉE PAR L'ENTREPRISE. Une entreprise peut
--    mener plusieurs opérations ; « États financiers disponibles ✓ » ne veut
--    rien dire tant qu'on n'a pas dit DE LAQUELLE. Résoudre au hasard, ce
--    serait rejouer la mine `limit 1` sans `order by`, désamorcée sept fois
--    ici. D'où `startups.presented_deal_id`, écrite par l'entreprise seule.
--
-- ⚠️ `checklist_items.catalog_key` est NULLABLE : les exigences ajoutées à la
-- main n'ont pas de clé stable. Un critère connecté ne peut donc s'accrocher
-- qu'au CATALOGUE. C'est une limite du modèle, à écrire dans l'écran plutôt
-- qu'à découvrir en production.
--
-- Ré-exécutable.

-- ---------------------------------------------------------------------------
-- Les énumérations
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.challenge_source as enum ('manuel', 'connecte');
exception when duplicate_object then null; end $$;

do $$ begin
  -- `a_faire` et `fait` suffisent : « en retard » et « en cours » se
  -- DÉDUISENT de l'échéance et du compte, ils ne se stockent pas. Deux
  -- sources pour un même état finiraient par se contredire.
  create type public.challenge_progress_status as enum ('a_faire', 'fait');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.challenge_progress_origin as enum ('confirme', 'auto');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- L'opération présentée — ADR-003, clause 1
-- ---------------------------------------------------------------------------
alter table public.startups
  add column if not exists presented_deal_id uuid
    references public.deals(id) on delete set null;

comment on column public.startups.presented_deal_id is
  'L''opération que l''entreprise choisit de présenter. Écrite par elle SEULE — '
  'jamais par le programme (écran 26). Sans elle, un critère connecté ne sait '
  'pas quelle opération lire.';

-- ---------------------------------------------------------------------------
-- Les modèles
-- ---------------------------------------------------------------------------
-- `org_id` NULL = modèle Sanza, visible de tous. Non NULL = modèle d'un
-- programme, visible de lui seul. Une seule table plutôt que deux : les écrans
-- 10 et 16 montrent les mêmes cartes, et deux tables auraient dupliqué chaque
-- règle de lecture.
create table if not exists public.challenge_templates (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid references public.organizations(id) on delete cascade,
  title       text not null,
  category    text,
  duration    text,
  description text,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  archived_at timestamptz
);

create index if not exists challenge_templates_org_idx
  on public.challenge_templates (org_id) where archived_at is null;

create table if not exists public.challenge_template_criteria (
  id          uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.challenge_templates(id) on delete cascade,
  label       text not null,
  source      public.challenge_source not null default 'manuel',
  -- La clé du catalogue qu'un critère connecté observe. NULL pour un critère
  -- manuel, et pour un critère connecté dont l'exigence n'est pas au catalogue.
  catalog_key text,
  required    boolean not null default true,
  -- Écran 12 : un critère STRUCTUREL d'un modèle Sanza ne se supprime pas.
  structural  boolean not null default false,
  position    int not null default 0
);

create index if not exists challenge_template_criteria_idx
  on public.challenge_template_criteria (template_id, position);

-- ---------------------------------------------------------------------------
-- Les instances
-- ---------------------------------------------------------------------------
create table if not exists public.challenges (
  id          uuid primary key default gen_random_uuid(),
  cohort_id   uuid not null references public.cohorts(id) on delete cascade,
  org_id      uuid not null references public.organizations(id) on delete cascade,
  -- D'où il vient, pour l'affichage seulement. Le modèle peut disparaître sans
  -- emporter les Challenges qu'il a servi à créer — c'est tout l'objet de la
  -- copie.
  template_id uuid references public.challenge_templates(id) on delete set null,
  title       text not null,
  category    text,
  due_on      date,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  archived_at timestamptz
);

create index if not exists challenges_cohort_idx
  on public.challenges (cohort_id) where archived_at is null;

-- LES CRITÈRES SONT UNE COPIE, pas une référence. Voir l'en-tête, point 1.
create table if not exists public.challenge_criteria (
  id           uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  label        text not null,
  source       public.challenge_source not null default 'manuel',
  catalog_key  text,
  required     boolean not null default true,
  position     int not null default 0
);

create index if not exists challenge_criteria_idx
  on public.challenge_criteria (challenge_id, position);

create table if not exists public.challenge_assignments (
  challenge_id   uuid not null references public.challenges(id) on delete cascade,
  startup_org_id uuid not null references public.organizations(id) on delete cascade,
  assigned_at    timestamptz not null default now(),
  primary key (challenge_id, startup_org_id)
);

-- ---------------------------------------------------------------------------
-- La progression — ADR-003, amendement du 5 août
-- ---------------------------------------------------------------------------
create table if not exists public.challenge_progress (
  challenge_id   uuid not null references public.challenges(id) on delete cascade,
  startup_org_id uuid not null references public.organizations(id) on delete cascade,
  criterion_id   uuid not null references public.challenge_criteria(id) on delete cascade,
  status         public.challenge_progress_status not null default 'a_faire',
  origin         public.challenge_progress_origin,
  reached_at     timestamptz,
  -- Renseignée à la rupture du lien de cohorte. Une ligne figée n'est JAMAIS
  -- réévaluée : une entreprise qui revient ouvre un nouveau lien, pas une
  -- reprise du passé.
  frozen_at      timestamptz,
  primary key (challenge_id, startup_org_id, criterion_id)
);

create index if not exists challenge_progress_startup_idx
  on public.challenge_progress (startup_org_id, challenge_id);

-- ---------------------------------------------------------------------------
-- La lecture — RLS
-- ---------------------------------------------------------------------------
alter table public.challenge_templates          enable row level security;
alter table public.challenge_template_criteria  enable row level security;
alter table public.challenges                   enable row level security;
alter table public.challenge_criteria           enable row level security;
alter table public.challenge_assignments        enable row level security;
alter table public.challenge_progress           enable row level security;

-- Les modèles Sanza (org_id NULL) sont lisibles de tout compte connecté ; les
-- modèles d'un programme, de lui seul.
drop policy if exists challenge_templates_select on public.challenge_templates;
create policy challenge_templates_select on public.challenge_templates
  for select using (org_id is null or public.is_org_member(org_id));

drop policy if exists challenge_template_criteria_select on public.challenge_template_criteria;
create policy challenge_template_criteria_select on public.challenge_template_criteria
  for select using (exists (
    select 1 from public.challenge_templates t
    where t.id = template_id
      and (t.org_id is null or public.is_org_member(t.org_id))
  ));

-- Un Challenge se lit par son PROGRAMME, et par l'ENTREPRISE à qui il est
-- assigné — écran 42, la vue côté fondateur.
drop policy if exists challenges_select on public.challenges;
create policy challenges_select on public.challenges
  for select using (
    public.is_org_member(org_id)
    or exists (
      select 1 from public.challenge_assignments a
      where a.challenge_id = id and public.is_org_member(a.startup_org_id)
    )
  );

drop policy if exists challenge_criteria_select on public.challenge_criteria;
create policy challenge_criteria_select on public.challenge_criteria
  for select using (exists (
    select 1 from public.challenges c
    where c.id = challenge_id
      and (
        public.is_org_member(c.org_id)
        or exists (
          select 1 from public.challenge_assignments a
          where a.challenge_id = c.id and public.is_org_member(a.startup_org_id)
        )
      )
  ));

drop policy if exists challenge_assignments_select on public.challenge_assignments;
create policy challenge_assignments_select on public.challenge_assignments
  for select using (
    public.is_org_member(startup_org_id)
    or exists (
      select 1 from public.challenges c
      where c.id = challenge_id and public.is_org_member(c.org_id)
    )
  );

drop policy if exists challenge_progress_select on public.challenge_progress;
create policy challenge_progress_select on public.challenge_progress
  for select using (
    public.is_org_member(startup_org_id)
    or exists (
      select 1 from public.challenges c
      where c.id = challenge_id and public.is_org_member(c.org_id)
    )
  );

-- AUCUNE POLITIQUE D'ÉCRITURE. Tout passe par des RPC `security definer`, qui
-- vérifient les droits ET auditent dans la même transaction. C'est la règle
-- produit du dépôt, et elle vaut ici plus qu'ailleurs : un Challenge assigné
-- est une demande faite à une entreprise, pas une ligne de données.
