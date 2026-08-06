-- L'avancement de TOUS les Challenges d'une cohorte, en une lecture.
--
-- `challenge_companies()` rend le détail d'UN Challenge. L'écran 09b en
-- affiche quatre, chacun avec sa barre segmentée — quatre appels, donc, là où
-- un seul suffit. À la volumétrie visée ce n'est pas une question de
-- performance mais de forme : une page qui fait N+1 allers-retours finit
-- toujours par en faire N+1 de trop ailleurs.
--
-- La fonction rend des FAITS BRUTS — combien de critères requis, combien de
-- faits, par entreprise et par Challenge. « En retard », « en cours » et « à
-- faire » se déduisent dans le domaine, où la règle se teste sans base et où
-- l'ordre d'évaluation est écrit noir sur blanc.
--
-- Ré-exécutable.

create or replace function public.cohort_challenge_progress(p_cohort uuid)
returns table (
  challenge_id uuid,
  startup_org  uuid,
  startup_name text,
  requis       bigint,
  faits        bigint,
  fige         boolean
)
language sql
stable
security definer
set search_path to 'public'
as $$
  select c.id,
         a.startup_org_id,
         o.name,
         (select count(*) from public.challenge_criteria cr
           where cr.challenge_id = c.id and cr.required),
         (select count(*) from public.challenge_progress p
           join public.challenge_criteria cr on cr.id = p.criterion_id
           where p.challenge_id = c.id
             and p.startup_org_id = a.startup_org_id
             and cr.required and p.status = 'fait'),
         exists (
           select 1 from public.challenge_progress p
           where p.challenge_id = c.id
             and p.startup_org_id = a.startup_org_id
             and p.frozen_at is not null
         )
  from public.challenges c
  join public.challenge_assignments a on a.challenge_id = c.id
  left join public.organizations o on o.id = a.startup_org_id
  where c.cohort_id = p_cohort
    and c.archived_at is null
    and public.is_org_member(c.org_id)
  order by c.created_at, o.name;
$$;

grant execute on function public.cohort_challenge_progress(uuid) to authenticated;
