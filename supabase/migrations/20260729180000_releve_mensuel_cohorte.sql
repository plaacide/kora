-- La tendance du rapport bailleur (§6), et le ménage de `program_notes`.
--
-- ── POURQUOI UN RELEVÉ, ET PAS UN CALCUL ────────────────────────────────────
-- « Un bailleur lit des courbes, pas un instantané. » Une courbe ne se
-- reconstitue pas après coup : `checklist_items` ne garde pas l'historique de
-- ses statuts, `readiness_score` est écrasé à chaque recalcul. Ce qui n'a pas
-- été relevé au moment où c'était vrai est perdu pour toujours.
--
-- ── SANS ORDONNANCEUR, ENCORE ───────────────────────────────────────────────
-- Le relevé se déclenche à la LECTURE du rapport, une fois par mois et par
-- cohorte (`on conflict do nothing`). C'est le même parti que l'expiration des
-- demandes : cette installation n'a pas de tâche planifiée, et en installer
-- une pour écrire une ligne par mois serait disproportionné.
--
-- ⚠️ CE QUE ÇA COÛTE, ET QU'IL FAUT DIRE. Un mois où personne n'ouvre le
-- rapport ne laisse aucun point. La courbe aura donc des trous, et ces trous
-- sont HONNÊTES : ils disent « personne n'a regardé », ce qui est une
-- information. L'écran ne doit jamais les interpoler — relier deux points
-- distants de trois mois par une droite inventerait deux mesures.
--
-- `do nothing` et non `do update` : le relevé du mois est fait UNE fois. Le
-- remettre à jour à chaque visite ferait dépendre le point de l'heure à
-- laquelle quelqu'un a ouvert la page, et deux mois ne seraient plus
-- comparables.

create table if not exists public.cohort_snapshots (
  id            uuid primary key default gen_random_uuid(),
  cohort_id     uuid not null references public.cohorts(id) on delete cascade,
  -- Premier jour du mois relevé : la granularité est le mois, l'exprimer par
  -- une date évite un texte '2026-07' qu'il faudrait parser pour trier.
  month         date not null,
  companies     int  not null default 0,
  rooms         int  not null default 0,
  sought        numeric(20, 2),
  currency      text,
  readiness_avg int,
  items_total   int  not null default 0,
  items_done    int  not null default 0,
  invitations   int  not null default 0,
  granted       int  not null default 0,
  created_at    timestamptz not null default now(),
  unique (cohort_id, month)
);

create index if not exists cohort_snapshots_cohort_idx
  on public.cohort_snapshots (cohort_id, month);

alter table public.cohort_snapshots enable row level security;

-- Lecture réservée au programme propriétaire de la cohorte. Aucune écriture
-- directe : le relevé passe par la fonction, qui seule sait le composer.
drop policy if exists cohort_snapshots_select on public.cohort_snapshots;
create policy cohort_snapshots_select on public.cohort_snapshots
  for select using (
    exists (select 1 from public.cohorts c
            where c.id = cohort_id and public.is_org_member(c.org_id))
  );

/**
 * Relève l'état du mois courant pour une cohorte. Idempotent.
 *
 * NE COMPTE QUE DES ÉTATS, jamais un contenu (règle §0.1) : nombre
 * d'entreprises, de salles, préparation moyenne, exigences faites sur exigences
 * totales, invitations, accès accordés. Aucun nom de document n'entre ici, et
 * la structure de la table l'empêche.
 *
 * La devise n'est retenue que si toute la cohorte partage la même : additionner
 * des FCFA et des NGN donnerait un total qui ne veut rien dire. À défaut, le
 * montant est nul — l'absence est plus honnête qu'une somme fausse.
 */
create or replace function public.record_cohort_snapshot(p_cohort uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_org      uuid;
  v_mois     date := date_trunc('month', now())::date;
  v_orgs     uuid[];
  v_deals    uuid[];
  v_devises  text[];
begin
  select c.org_id into v_org from public.cohorts c where c.id = p_cohort;
  if v_org is null then raise exception 'cohorte inconnue'; end if;

  -- Membre du programme, sans exiger un rôle : relever n'est pas décider, et
  -- la fonction est appelée par la simple ouverture d'un écran de lecture.
  if not public.is_org_member(v_org) then raise exception 'accès refusé'; end if;

  -- Rien à faire si le mois est déjà relevé. Sorti tôt pour ne pas payer les
  -- agrégats à chaque ouverture de la page.
  if exists (
    select 1 from public.cohort_snapshots
    where cohort_id = p_cohort and month = v_mois
  ) then
    return;
  end if;

  select coalesce(array_agg(cm.startup_org_id), '{}')
    into v_orgs
  from public.cohort_members cm
  where cm.cohort_id = p_cohort;

  select coalesce(array_agg(d.id), '{}')
    into v_deals
  from public.deals d
  where d.org_id = any(v_orgs);

  select coalesce(array_agg(distinct r.devise), '{}')
    into v_devises
  from public.raises r
  where r.org_id = any(v_orgs) and r.statut = 'en_cours' and r.devise is not null;

  insert into public.cohort_snapshots (
    cohort_id, month, companies, rooms, sought, currency,
    readiness_avg, items_total, items_done, invitations, granted
  )
  select
    p_cohort,
    v_mois,
    coalesce(array_length(v_orgs, 1), 0),
    coalesce(array_length(v_deals, 1), 0),
    case when array_length(v_devises, 1) = 1
      then (select sum(r.montant_cible) from public.raises r
            where r.org_id = any(v_orgs) and r.statut = 'en_cours')
    end,
    case when array_length(v_devises, 1) = 1 then v_devises[1] end,
    (select round(avg(d.readiness_score))::int from public.deals d
     where d.id = any(v_deals)),
    (select count(*) from public.checklist_items ci where ci.deal_id = any(v_deals)),
    (select count(*) from public.checklist_items ci
     where ci.deal_id = any(v_deals) and ci.status = 'done'),
    (select count(*) from public.cohort_links cl
     where cl.cohort_id = p_cohort and cl.status <> 'revoked'),
    (select count(*) from public.access_requests ar
     where ar.startup_org_id = any(v_orgs) and ar.status = 'granted')
  on conflict (cohort_id, month) do nothing;
end;
$$;

grant execute on function public.record_cohort_snapshot(uuid) to authenticated;

-- ── MÉNAGE ─────────────────────────────────────────────────────────────────
-- `program_notes` a été créée le 28/07 avec sa RLS, et n'a jamais reçu une
-- ligne de code : ni écran, ni action, ni requête. Elle est supprimée plutôt
-- que gardée « au cas où ».
--
-- La raison n'est pas seulement qu'elle est morte. Les notes privées auraient
-- vécu au même endroit que les questions et les suggestions, dans le panneau
-- latéral du détail de cohorte. Trois zones de texte côte à côte, dont deux
-- visibles par l'entreprise et une non, c'est une erreur de destinataire qui
-- attend de se produire — et cette erreur-là ne se rattrape pas.
--
-- La table est vide : `drop` ne détruit aucune donnée. Si le besoin revient, il
-- reviendra avec son écran, et l'écran dictera la forme.
drop table if exists public.program_notes;
