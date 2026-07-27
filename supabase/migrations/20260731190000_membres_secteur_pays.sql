-- Le secteur et le pays des entreprises de la cohorte.
--
-- La maquette écrit « Construction · Abidjan » sous le nom de l'entreprise :
-- c'est ce qui permet de la reconnaître d'un coup d'œil, sans ouvrir sa fiche.
--
-- Ces deux champs vivent sur `startups`, dont la politique est
-- `for select using (owner_id = auth.uid())` — le propriétaire, et lui seul.
-- Une requête directe depuis l'écran du programme reviendrait donc vide, en
-- silence, exactement comme les quatre fois précédentes. On étend la fonction
-- qui sert déjà les noms.
--
-- DROP obligatoire : ajouter des colonnes au `returns table` change le type de
-- retour, et `create or replace` échoue en 42P13 (cf. AGENTS.md).
--
-- CE QUI SORT : nom, secteur, pays. Pas le montant recherché, pas la
-- préparation, pas l'objectif — ceux-là transitent déjà par leurs propres
-- chemins, et une fonction qui rend « tout ce qui pourrait servir » finit par
-- rendre ce qu'elle ne devrait pas.

drop function if exists public.cohort_members_named(uuid);

create or replace function public.cohort_members_named(p_cohort uuid)
returns table (
  startup_org_id uuid,
  name           text,
  sector         text,
  country        text
)
language sql stable security definer set search_path = public as $$
  select
    cm.startup_org_id,
    o.name,
    s.sector,
    s.country
  from public.cohort_members cm
  join public.organizations o on o.id = cm.startup_org_id
  join public.cohorts c on c.id = cm.cohort_id
  -- `left join` : une entreprise peut avoir rejoint sans avoir rempli sa
  -- fiche. Une jointure stricte la ferait DISPARAÎTRE de la cohorte — un
  -- membre absent de sa propre liste est pire qu'un secteur manquant.
  left join public.startups s on s.org_id = cm.startup_org_id
  where cm.cohort_id = p_cohort
    and public.is_org_member(c.org_id)
  order by o.name;
$$;

grant execute on function public.cohort_members_named(uuid) to authenticated;
