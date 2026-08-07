-- Le Challenge vu par l'ENTREPRISE — écran 42.
--
-- C'est le seul écran du paquet qui se place du côté du fondateur, et il bute
-- sur la frontière dans l'autre sens : une entreprise n'a pas le droit de lire
-- la fiche de l'organisation qui l'accompagne. Une jointure vers
-- `organizations` rendrait donc ZÉRO ligne — sans erreur, sans journal —, et
-- l'écran afficherait « Proposé par — ».
--
-- La fonction énumère ce que l'entreprise a besoin de savoir, et rien de plus :
-- le titre, la catégorie, l'échéance, le NOM du programme, et sa propre
-- identité. Pas l'identifiant du programme, pas ses autres cohortes, pas les
-- autres entreprises assignées.
--
-- Ré-exécutable.

create or replace function public.challenge_for_startup(p_challenge uuid)
returns table (
  title        text,
  category     text,
  due_on       date,
  programme    text,
  startup_org  uuid
)
language sql
stable
security definer
set search_path to 'public'
as $$
  select c.title, c.category, c.due_on, o.name, a.startup_org_id
  from public.challenges c
  join public.challenge_assignments a on a.challenge_id = c.id
  left join public.organizations o on o.id = c.org_id
  where c.id = p_challenge
    and c.archived_at is null
    -- L'entreprise ne voit QUE sa propre ligne : sans ce filtre, un Challenge
    -- assigné à douze entreprises en rendrait douze, et la première venue
    -- ferait foi.
    and public.is_org_member(a.startup_org_id)
  limit 1;
$$;

grant execute on function public.challenge_for_startup(uuid) to authenticated;
