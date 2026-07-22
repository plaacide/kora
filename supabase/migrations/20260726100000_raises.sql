-- La levée devient une donnée RÉELLE (avant : tout était dummy dans MaLevee).
--
-- Jusqu'ici « Ma levée » affichait un montant, une valorisation, une clôture et
-- un montant engagé inventés. On les collecte désormais via un modal « Modifier
-- la levée », stockés par deal dans `raises`. Le montant engagé rend les
-- soft-commitments réels (engagé / cible), sans pipeline d'investisseurs
-- détaillé (ça, c'est une étape ultérieure).
--
-- Une seule levée EN COURS par deal (index partiel unique). Les levées passées
-- restent en base avec statut 'cloturee' → historique de financement réel.
--
-- Ré-exécutable.

create table if not exists public.raises (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals(id) on delete cascade,
  org_id uuid not null references public.organizations(id) on delete cascade,
  montant_cible bigint,
  montant_engage bigint not null default 0,
  devise text not null default 'USD',
  type_tour text,                       -- equity | dette | safe | convertible
  stade text,                           -- pre_seed | seed | serie_a | serie_b_plus
  valorisation_pre bigint,
  date_cloture date,
  audience text[] not null default '{}',-- sous-ensemble de vc | dfi | banque
  description text,
  statut text not null default 'en_cours' check (statut in ('en_cours', 'cloturee')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Au plus UNE levée en cours par deal.
create unique index if not exists raises_une_en_cours_par_deal
  on public.raises (deal_id) where statut = 'en_cours';

create index if not exists raises_deal_idx on public.raises (deal_id);

alter table public.raises enable row level security;

-- Lecture : équipe interne du deal. La vitrine visible des invités viendra plus
-- tard (elle exposera un sous-ensemble choisi) — pour l'instant, interne seul.
drop policy if exists raises_select on public.raises;
create policy raises_select on public.raises
  for select using (public.is_org_internal(org_id));

-- Aucune écriture directe : tout passe par save_raise (audité).
revoke insert, update, delete on public.raises from authenticated;

-- ---------------------------------------------------------------------------
-- save_raise : upsert la levée EN COURS du deal. Interne seul, audité.
-- ---------------------------------------------------------------------------
create or replace function public.save_raise(
  p_deal uuid,
  p_montant_cible bigint default null,
  p_montant_engage bigint default null,
  p_devise text default null,
  p_type_tour text default null,
  p_stade text default null,
  p_valorisation_pre bigint default null,
  p_date_cloture date default null,
  p_audience text[] default null,
  p_description text default null
)
returns public.raises
language plpgsql security definer set search_path = public as $$
declare
  v_org   uuid := public.deal_org_for_write(p_deal);
  v_raise public.raises;
begin
  -- Audience : ne garder que des valeurs connues (filtre défensif).
  if p_audience is not null then
    p_audience := array(
      select x from unnest(p_audience) as x where x in ('vc', 'dfi', 'banque')
    );
  end if;

  select * into v_raise from public.raises
  where deal_id = p_deal and statut = 'en_cours';

  if v_raise.id is null then
    insert into public.raises (
      deal_id, org_id, montant_cible, montant_engage, devise, type_tour,
      stade, valorisation_pre, date_cloture, audience, description
    ) values (
      p_deal, v_org, p_montant_cible, coalesce(p_montant_engage, 0),
      coalesce(nullif(trim(p_devise), ''), 'USD'), p_type_tour, p_stade,
      p_valorisation_pre, p_date_cloture, coalesce(p_audience, '{}'), p_description
    )
    returning * into v_raise;
  else
    -- coalesce : mise à jour partielle, seuls les champs fournis changent.
    update public.raises set
      montant_cible    = coalesce(p_montant_cible, montant_cible),
      montant_engage   = coalesce(p_montant_engage, montant_engage),
      devise           = coalesce(nullif(trim(p_devise), ''), devise),
      type_tour        = coalesce(p_type_tour, type_tour),
      stade            = coalesce(p_stade, stade),
      valorisation_pre = coalesce(p_valorisation_pre, valorisation_pre),
      date_cloture     = coalesce(p_date_cloture, date_cloture),
      audience         = coalesce(p_audience, audience),
      description      = coalesce(p_description, description),
      updated_at       = now()
    where id = v_raise.id
    returning * into v_raise;
  end if;

  perform public.write_audit(
    v_org, 'raise.updated', 'raise', v_raise.id::text,
    jsonb_strip_nulls(jsonb_build_object(
      'montant_cible', p_montant_cible, 'montant_engage', p_montant_engage,
      'devise', p_devise, 'type_tour', p_type_tour, 'stade', p_stade,
      'valorisation_pre', p_valorisation_pre, 'date_cloture', p_date_cloture,
      'audience', to_jsonb(p_audience), 'description', p_description
    )),
    p_deal
  );

  return v_raise;
end;
$$;

grant execute on function public.save_raise(
  uuid, bigint, bigint, text, text, text, bigint, date, text[], text
) to authenticated;

-- ---------------------------------------------------------------------------
-- Amorçage : chaque deal de levée existant reçoit sa levée en cours, alimentée
-- par le montant déjà saisi sur le deal. Les deals de diligence n'en ont pas.
-- ---------------------------------------------------------------------------
insert into public.raises (deal_id, org_id, montant_cible, devise, statut)
select d.id, d.org_id, d.amount::bigint, d.currency, 'en_cours'
from public.deals d
where coalesce(d.objectif, 'levee') = 'levee'
  and not exists (
    select 1 from public.raises r where r.deal_id = d.id and r.statut = 'en_cours'
  );
