-- Le canal du programme apprend le secteur et le pays. Deux colonnes, pas plus.
--
-- ADR-004 est tranchée (6 août, option B) : TROIS canaux courts plutôt qu'une
-- fonction qui grossit. `sae_portfolio()` reste donc la lecture des
-- ENTREPRISES ET DE LEURS OPÉRATIONS, et on l'étend « du strict minimum ».
-- Les Challenges et les Dealrooms auront leurs propres fonctions quand ces
-- objets existeront en base ; ils n'entrent pas ici.
--
-- Secteur et pays sont demandés par l'écran 05 (sous le nom de l'entreprise)
-- et par les filtres de l'écran 07. Ils vivent sur `startups`, pas sur
-- `organizations` — d'où la jointure ajoutée.
--
-- ⚠️ LA JOINTURE EST `LATERAL`, ET C'EST LE CŒUR DE CETTE MIGRATION. Une
-- organisation peut porter PLUSIEURS lignes `startups` — il y en a déjà une
-- dans la base au moment où ceci est écrit. Un `join` ordinaire aurait donc
-- DUPLIQUÉ des lignes de portefeuille, et le compte « 18 entreprises » aurait
-- silencieusement dérivé. Le sous-select rend une fiche et une seule, choisie
-- par `order by` explicite : c'est la mine `limit 1` sans ordre, déjà
-- désamorcée sept fois dans ce dépôt.
--
-- ⚠️ LE `DROP` EST OBLIGATOIRE. Ajouter une colonne au `returns table` change
-- le type de retour, et Postgres refuse : « 42P13 cannot change return type of
-- existing function ». Le `drop` fait perdre les `grant` au passage — ils sont
-- donc réémis en bas, à l'identique de ce que la base portait
-- (anon, authenticated, service_role, plus PUBLIC que Postgres rend seul).
--
-- Ré-exécutable.

drop function if exists public.sae_portfolio();

create or replace function public.sae_portfolio()
returns table (
  startup_org  uuid,
  startup_name text,
  deal_id      uuid,
  deal_name    text,
  stage        text,
  amount       numeric,
  currency     text,
  readiness    integer,
  items_total  bigint,
  items_done   bigint,
  missing      text[],
  sector       text,
  country      text
)
language sql
stable
security definer
set search_path to 'public'
as $$
  select
    o.id,
    o.name,
    d.id,
    d.name,
    d.stage::text,
    d.amount,
    d.currency,
    d.readiness_score,
    count(ci.id),
    count(ci.id) filter (where ci.status = 'done'),
    (array_agg(ci.label order by ci.position)
       filter (where ci.status <> 'done'))[1:5],
    s.sector,
    s.country
  from public.cohort_links c
  join public.organizations o on o.id = c.startup_org_id
  join public.deals d on d.org_id = o.id
  -- UNE fiche par organisation, désignée et non tirée au sort : la plus
  -- récemment modifiée, puis l'identifiant pour départager deux ex æquo.
  left join lateral (
    select st.sector, st.country
    from public.startups st
    where st.org_id = o.id
    order by st.updated_at desc nulls last, st.id
    limit 1
  ) s on true
  left join public.checklist_items ci on ci.deal_id = d.id
  where c.status = 'accepted'
    -- Le programme doit être à jour : quand il cesse de payer, il cesse de
    -- voir. C'est le seul « il ferme » qui existe vraiment — l'organisation,
    -- elle, ne peut pas être supprimée tant qu'elle a un journal d'audit.
    and public.org_active(c.sae_org_id)
    and public.is_org_internal(c.sae_org_id)
  group by o.id, o.name, d.id, d.name, d.stage, d.amount, d.currency,
           d.readiness_score, s.sector, s.country;
$$;

grant execute on function public.sae_portfolio() to anon, authenticated, service_role;
