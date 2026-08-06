-- Les politiques des Challenges se citaient l'une l'autre.
--
-- > 42P17: infinite recursion detected in policy for relation
-- > "challenge_assignments"
--
-- Écrites en ligne dans `socle_des_challenges`, elles formaient une boucle :
-- celle des Challenges interrogeait les assignations — pour qu'une entreprise
-- voie le Challenge qu'on lui a confié — et celle des assignations
-- interrogeait les Challenges, pour qu'un programme voie qui il a assigné.
-- PostgreSQL n'y voit pas une symétrie mais un cycle, et TOUTE lecture échoue.
--
-- C'est exactement le défaut déjà rencontré sur les mises à jour, et le remède
-- est le même : `security definer` contourne la RLS de la table lue, ce qui
-- rompt le cycle. Chaque fonction ne rend qu'un booléen ou un identifiant sur
-- la ligne demandée — elle n'expose rien de plus que ce que la politique
-- décidait déjà.
--
-- ⚠️ NI `tsc`, NI `next build`, NI LA RELECTURE DU SQL ne le détectent. La
-- migration s'applique sans une plainte ; c'est la première requête réelle qui
-- tombe. Ici, la création d'un Challenge.
--
-- Ré-exécutable.

create or replace function public.challenge_org(p_challenge uuid)
returns uuid
language sql stable security definer set search_path = public as $fn$
  select c.org_id from public.challenges c where c.id = p_challenge;
$fn$;

grant execute on function public.challenge_org(uuid) to authenticated;

create or replace function public.is_challenge_assignee(p_challenge uuid)
returns boolean
language sql stable security definer set search_path = public as $fn$
  select exists (
    select 1 from public.challenge_assignments a
    where a.challenge_id = p_challenge
      and public.is_org_member(a.startup_org_id)
  );
$fn$;

grant execute on function public.is_challenge_assignee(uuid) to authenticated;

-- Un Challenge se lit par son PROGRAMME, et par l'ENTREPRISE à qui il est
-- confié — écran 42, la vue côté fondateur.
drop policy if exists challenges_select on public.challenges;
create policy challenges_select on public.challenges
  for select using (
    public.is_org_member(org_id) or public.is_challenge_assignee(id)
  );

drop policy if exists challenge_criteria_select on public.challenge_criteria;
create policy challenge_criteria_select on public.challenge_criteria
  for select using (
    public.is_org_member(public.challenge_org(challenge_id))
    or public.is_challenge_assignee(challenge_id)
  );

drop policy if exists challenge_assignments_select on public.challenge_assignments;
create policy challenge_assignments_select on public.challenge_assignments
  for select using (
    public.is_org_member(startup_org_id)
    or public.is_org_member(public.challenge_org(challenge_id))
  );

drop policy if exists challenge_progress_select on public.challenge_progress;
create policy challenge_progress_select on public.challenge_progress
  for select using (
    public.is_org_member(startup_org_id)
    or public.is_org_member(public.challenge_org(challenge_id))
  );
