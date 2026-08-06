-- Les faits d'exigence d'une entreprise, et la validation automatique.
--
-- C'est le cœur d'ADR-003 : « un critère connecté à Sanza se valide
-- automatiquement dès que l'exigence correspondante de l'entreprise est
-- satisfaite ». Deux fonctions, et une frontière.
--
-- LA FRONTIÈRE D'ABORD. Le module programme ne lit PAS `checklist_items`.
-- L'option A de l'ADR — le Challenge interroge la checklist — a été écartée
-- pour cette raison : l'invariant « aucun chemin vers un document » n'aurait
-- plus tenu par construction, seulement par discipline. `startup_requirement_facts`
-- énumère trois colonnes et rien d'autre : une clé de catalogue, un booléen,
-- une date. Aucun nom de pièce, aucun identifiant de document, aucun libellé.
--
-- ⚠️ SEULES LES EXIGENCES DU CATALOGUE PEUVENT PORTER UN CRITÈRE CONNECTÉ.
-- `checklist_items.catalog_key` est nullable : une exigence ajoutée à la main
-- n'a pas de clé stable, donc rien à quoi s'accrocher. C'est une limite du
-- modèle, à écrire dans l'écran plutôt qu'à découvrir en production.
--
-- ⚠️ ET SEULE L'OPÉRATION PRÉSENTÉE EST LUE. Une entreprise peut en mener
-- plusieurs ; « États financiers disponibles ✓ » ne veut rien dire tant qu'on
-- n'a pas dit de laquelle. Sans désignation, la fonction ne rend RIEN — elle ne
-- choisit pas à la place de l'entreprise.
--
-- Ré-exécutable.

create or replace function public.startup_requirement_facts(p_startup uuid)
returns table (
  catalog_key  text,
  satisfied    boolean,
  satisfied_at timestamptz
)
language sql
stable
security definer
set search_path to 'public'
as $$
  select ci.catalog_key,
         ci.status = 'done',
         -- La date de la preuve la plus récemment rattachée. `checklist_items`
         -- ne garde pas de date d'achèvement ; c'est le meilleur fait
         -- disponible, et il est vrai — à défaut, NULL plutôt qu'une date
         -- inventée.
         (select max(d.linked_at) from public.checklist_item_documents d
           where d.item_id = ci.id)
  from public.startups s
  join public.checklist_items ci on ci.deal_id = s.presented_deal_id
  where s.org_id = p_startup
    and s.presented_deal_id is not null
    and ci.catalog_key is not null
    -- Qui a le droit de demander : l'entreprise elle-même, ou un programme qui
    -- l'accompagne et dont l'abonnement est à jour. Le même garde que
    -- `sae_portfolio()`, parce que c'est la même frontière.
    and (
      public.is_org_member(p_startup)
      or exists (
        select 1 from public.cohort_links cl
        where cl.startup_org_id = p_startup
          and cl.status = 'accepted'
          and public.is_org_member(cl.sae_org_id)
          and public.org_active(cl.sae_org_id)
      )
    );
$$;

grant execute on function public.startup_requirement_facts(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- La réévaluation — elle ne fait QU'AJOUTER
-- ---------------------------------------------------------------------------
-- Décision du 6 août : un critère connecté GARDE SON ACQUIS, y compris quand
-- l'entreprise change d'opération présentée. La progression ne recule jamais.
--
-- Trois conséquences, toutes dans le `where` ci-dessous :
--
-- · on ne touche que les lignes `a_faire` — rien ne repasse de `fait` à
--   `a_faire`, jamais ;
-- · une ligne FIGÉE est ignorée — l'entreprise est sortie, sa progression
--   appartient à la mémoire du programme ;
-- · la fonction est donc MONOTONE, donc rejouable : la passer deux fois donne
--   le même résultat que la passer une fois. C'est ce qui permet de l'appeler
--   à l'ouverture d'un écran sans y réfléchir.
create or replace function public.refresh_challenge_progress(p_challenge uuid)
returns int
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_org     uuid;
  v_valides int;
begin
  if auth.uid() is null then raise exception 'non authentifié'; end if;

  select c.org_id into v_org from public.challenges c where c.id = p_challenge;
  if v_org is null then raise exception 'challenge introuvable'; end if;

  -- Le programme, ou l'entreprise assignée : les deux ouvrent un écran qui
  -- doit être à jour.
  if not (public.is_org_member(v_org) or public.is_challenge_assignee(p_challenge)) then
    raise exception 'droits insuffisants';
  end if;

  with faits as (
    select p.startup_org_id, cr.id as criterion_id, f.satisfied_at
    from public.challenge_progress p
    join public.challenge_criteria cr on cr.id = p.criterion_id
    cross join lateral public.startup_requirement_facts(p.startup_org_id) f
    where p.challenge_id = p_challenge
      and p.status = 'a_faire'
      and p.frozen_at is null
      and cr.source = 'connecte'
      and cr.catalog_key is not null
      and f.catalog_key = cr.catalog_key
      and f.satisfied
  )
  update public.challenge_progress p
  set status     = 'fait',
      origin     = 'auto',
      -- La date du fait quand on l'a, sinon celle du constat. Mieux vaut dire
      -- « constaté aujourd'hui » que d'inventer un passé.
      reached_at = coalesce(faits.satisfied_at, now())
  from faits
  where p.challenge_id   = p_challenge
    and p.startup_org_id = faits.startup_org_id
    and p.criterion_id   = faits.criterion_id;

  get diagnostics v_valides = row_count;

  -- On n'audite QUE si quelque chose a bougé. Cette fonction est appelée à
  -- chaque ouverture d'écran : journaliser les passages à vide noierait le
  -- journal sous du bruit, et c'est le journal qu'on lit quand on cherche
  -- quand une chose a changé.
  if v_valides > 0 then
    perform public.write_audit(
      v_org, 'challenge.auto_validated', 'challenge', p_challenge::text,
      jsonb_build_object('criteres', v_valides)
    );
  end if;

  return v_valides;
end;
$$;

grant execute on function public.refresh_challenge_progress(uuid) to authenticated;
