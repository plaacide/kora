-- Le temps de lecture réel (couche de signal, option B).
--
-- La couverture (option A) répond à « jusqu'où a-t-il lu ». Elle ne dit pas
-- « combien de temps il y a passé » — et ce temps, on ne peut PAS le déduire
-- des horodatages d'audit, qui marquent le RENDU d'une page, pas le dwell.
--
-- On mesure donc le vrai dwell côté visionneuse : tant qu'une page est visible
-- à l'écran (et l'onglet actif), le temps court ; il s'arrête quand le lecteur
-- s'en va. Chaque tranche est envoyée ici.
--
-- Table dédiée, pas le journal d'audit : l'audit est chaîné par hachage et
-- append-only, précieux et coûteux. Le dwell est un signal produit, volumineux
-- et sans valeur de preuve — il vit à côté.

create table if not exists public.page_dwell (
  id          bigint generated always as identity primary key,
  version_id  uuid not null references public.document_versions(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  deal_id     uuid not null references public.deals(id) on delete cascade,
  actor_id    uuid not null references auth.users(id) on delete cascade,
  page        int not null,
  ms          int not null,
  created_at  timestamptz not null default now()
);

create index if not exists page_dwell_deal_doc_idx
  on public.page_dwell (deal_id, document_id);

alter table public.page_dwell enable row level security;

-- Lecture : l'équipe interne du deal (le fondateur, pour son tableau de bord)
-- et l'auteur lui-même. Un invité ne voit pas le temps de lecture des autres.
create policy page_dwell_select on public.page_dwell
  for select using (
    actor_id = auth.uid()
    or exists (
      select 1 from public.deals d
      where d.id = page_dwell.deal_id and public.is_org_internal(d.org_id)
    )
  );

grant select on public.page_dwell to authenticated;

-- ---------------------------------------------------------------------------
-- Enregistrer une tranche de lecture
-- ---------------------------------------------------------------------------

/**
 * Écrit le temps passé sur une page. Comme toute écriture, elle passe par une
 * RPC `security definer` qui vérifie le droit d'accès — un lecteur ne peut
 * enregistrer du dwell que sur un deal qu'il a le droit de voir.
 *
 * Deux garde-fous contre le bruit et la triche :
 *   · le temps est borné à 5 min par tranche — une page laissée ouverte pendant
 *     la nuit ne compte pas pour huit heures ;
 *   · en dessous d'une seconde, on ignore — un simple passage au scroll n'est
 *     pas de la lecture.
 */
create or replace function public.record_page_dwell(
  p_version uuid,
  p_page int,
  p_ms int
)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_doc  uuid;
  v_deal uuid;
  v_ms   int;
begin
  if auth.uid() is null then return; end if;

  select dv.document_id, d.deal_id into v_doc, v_deal
  from public.document_versions dv
  join public.documents d on d.id = dv.document_id
  where dv.id = p_version;
  if v_deal is null then return; end if;

  -- Le droit de LIRE le deal suffit — c'est exactement qui peut ouvrir une
  -- page, donc exactement qui peut en mesurer le temps.
  if not public.can_see_deal(v_deal) then
    raise exception 'accès refusé';
  end if;

  v_ms := least(greatest(coalesce(p_ms, 0), 0), 300000);
  if v_ms < 1000 then return; end if;

  insert into public.page_dwell (version_id, document_id, deal_id, actor_id, page, ms)
  values (p_version, v_doc, v_deal, auth.uid(), p_page, v_ms);
end;
$$;

grant execute on function public.record_page_dwell(uuid, int, int) to authenticated;

-- ---------------------------------------------------------------------------
-- Le temps de lecture agrégé, pour l'accueil fondateur
-- ---------------------------------------------------------------------------

/**
 * Total du temps de lecture par (personne, document) sur un deal.
 *
 * L'auteur est EXCLU : son propre temps sur ses propres documents n'est pas un
 * signal d'intérêt. La jointure sur `profiles` rend l'e-mail, pour aligner ces
 * lignes sur celles du journal d'audit (même identité, même clé).
 */
create or replace function public.deal_reading_time(p_deal uuid)
returns table (actor_email text, document_id uuid, total_ms bigint)
language sql stable security definer set search_path = public as $$
  select p.email, w.document_id, sum(w.ms)::bigint
  from public.page_dwell w
  join public.profiles p on p.id = w.actor_id
  where w.deal_id = p_deal
    and w.actor_id <> auth.uid()
    and public.is_org_internal(
      (select org_id from public.deals where id = p_deal)
    )
  group by p.email, w.document_id;
$$;

grant execute on function public.deal_reading_time(uuid) to authenticated;
