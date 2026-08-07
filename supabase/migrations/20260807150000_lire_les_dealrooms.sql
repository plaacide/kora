-- La liste des Dealrooms d'un programme — écrans 18 et 19.
--
-- La fonction rend des FAITS BRUTS : combien d'entreprises, combien d'accords
-- encore en attente, combien de liens vivants. Le quatrième statut de
-- l'écran — « prête à publier » — n'est PAS stocké : c'est un brouillon dont
-- toutes les entreprises ont consenti, et cela se déduit. Le stocker créerait
-- deux sources qui finiraient par se contredire, comme « en retard » côté
-- Challenges.
--
-- Ré-exécutable.

create or replace function public.dealroom_list()
returns table (
  id            uuid,
  slug          text,
  nom           text,
  statut        text,
  entreprises   bigint,
  en_attente    bigint,
  liens_actifs  bigint,
  publiee_le    timestamptz,
  cohortes      bigint
)
language sql
stable
security definer
set search_path to 'public'
as $$
  select d.id, d.slug, d.internal_name, d.status::text,
         (select count(*) from public.dealroom_entries e
           where e.dealroom_id = d.id),
         -- Les accords qui MANQUENT : c'est ce qui bloque la publication, et
         -- c'est donc ce que l'écran doit montrer, pas le nombre d'accordés.
         (select count(*) from public.dealroom_entries e
           left join public.dealroom_consents c
             on c.dealroom_id = e.dealroom_id and c.startup_org_id = e.startup_org_id
           where e.dealroom_id = d.id
             and coalesce(c.status, 'attente') <> 'accorde'),
         (select count(*) from public.dealroom_links l
           where l.dealroom_id = d.id and l.revoked_at is null),
         d.published_at,
         (select count(*) from public.dealroom_cohorts dc
           where dc.dealroom_id = d.id)
  from public.dealrooms d
  where d.archived_at is null
    and public.is_org_member(d.org_id)
  order by d.created_at desc;
$$;

grant execute on function public.dealroom_list() to authenticated;

-- Le détail d'une Dealroom, entreprise par entreprise — écrans 25 et 26.
create or replace function public.dealroom_companies(p_dealroom uuid)
returns table (
  startup_org uuid,
  nom         text,
  secteur     text,
  pays        text,
  accord      text,
  accorde_le  timestamptz,
  publiee     boolean
)
language sql
stable
security definer
set search_path to 'public'
as $$
  select e.startup_org_id, o.name, s.sector, s.country,
         coalesce(c.status::text, 'attente'), c.granted_at,
         e.published_at is not null and e.unpublished_at is null
  from public.dealroom_entries e
  left join public.organizations o on o.id = e.startup_org_id
  left join public.dealroom_consents c
    on c.dealroom_id = e.dealroom_id and c.startup_org_id = e.startup_org_id
  -- UNE fiche par organisation, désignée et non tirée au sort : la mine
  -- `limit 1` sans `order by`, désamorcée sept fois dans ce dépôt.
  left join lateral (
    select st.sector, st.country from public.startups st
    where st.org_id = e.startup_org_id
    order by st.updated_at desc nulls last, st.id limit 1
  ) s on true
  where e.dealroom_id = p_dealroom
    and public.is_org_member(public.dealroom_org(p_dealroom))
  order by o.name;
$$;

grant execute on function public.dealroom_companies(uuid) to authenticated;
