-- Les engagements, un par investisseur, au lieu d'un montant unique.
--
-- `raises.montant_engage` est UN nombre saisi à la main. La maquette 44 en
-- montre trois — confirmés, soft-commits, restant à sécuriser — plus le détail
-- par investisseur et l'historique des requalifications. On ne peut pas
-- scinder un total : il faut les lignes qui le composent.
--
-- Ce que ça change pour le fondateur : « 200 M sécurisés » devient
-- « 120 M confirmés par Sahel, 80 M en soft-commit chez Horizon », avec pour
-- chacun sa date, sa preuve et qui l'a saisi. C'est la différence entre un
-- chiffre qu'on affirme et un chiffre qu'on peut défendre devant un comité.
--
-- L'INTÉRÊT INDICATIF NE COMPTE PAS. La maquette 37 le dit, et c'est la règle
-- qui fait la valeur du reste : un ordre de grandeur évoqué au téléphone n'est
-- pas de l'argent. Il se note — pour se rappeler qu'on en a parlé — mais il
-- reste hors du total.
--
-- Ré-exécutable.

do $$ begin
  create type public.commitment_level as enum (
    'interet',      -- ordre de grandeur évoqué, JAMAIS compté
    'soft_commit',  -- intention communiquée, non contractuelle
    'confirme'      -- confirmation écrite ou term sheet signé
  );
exception when duplicate_object then null; end $$;

create table if not exists public.raise_commitments (
  id          uuid primary key default gen_random_uuid(),
  deal_id     uuid not null references public.deals(id) on delete cascade,
  org_id      uuid not null references public.organizations(id) on delete cascade,
  -- L'engagement appartient à une RELATION du pipeline : sans investisseur,
  -- un montant ne se relance pas et ne se vérifie pas.
  investor_id uuid not null
    references public.raise_investors(id) on delete cascade,
  niveau      public.commitment_level not null default 'interet',
  montant     bigint not null check (montant >= 0),
  devise      text,
  date_engagement date not null default current_date,
  -- « Term sheet signé », « e-mail du 27-07 » : ce qui rend le montant
  -- opposable. Facultatif, mais c'est lui qu'on cherche six mois plus tard.
  preuve      text,
  commentaire text,
  responsable text,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  -- Un investisseur porte UN engagement courant. Son historique vit dans le
  -- journal d'audit ; deux lignes vivantes pour la même relation feraient
  -- compter deux fois le même argent.
  unique (investor_id)
);

create index if not exists raise_commitments_deal_idx
  on public.raise_commitments (deal_id, niveau);

alter table public.raise_commitments enable row level security;

drop policy if exists raise_commitments_select on public.raise_commitments;
create policy raise_commitments_select on public.raise_commitments
  for select using (public.is_org_internal(org_id));

-- Les écritures passent par la RPC : elle contrôle le droit, tient le total
-- de la levée et journalise. Une écriture directe ferait les trois de travers.
revoke insert, update, delete on public.raise_commitments from authenticated;


-- ---------------------------------------------------------------------------
-- Le total de la levée suit les engagements
-- ---------------------------------------------------------------------------
/**
 * Recalcule `raises.montant_engage` depuis les lignes.
 *
 * La colonne reste — une dizaine de lectures s'y appuient — mais elle cesse
 * d'être saisie : elle devient le CACHE d'une somme. Garder les deux sources
 * vivantes, c'est garantir qu'elles divergeront le jour où quelqu'un modifie
 * l'une sans l'autre.
 *
 * L'intérêt indicatif est exclu de la somme, comme la maquette 37 l'exige.
 */
create or replace function public.recompute_secured(p_deal uuid)
returns bigint
language plpgsql security definer set search_path = public as $$
declare
  v_total bigint;
begin
  select coalesce(sum(montant), 0) into v_total
  from public.raise_commitments
  where deal_id = p_deal and niveau in ('soft_commit', 'confirme');

  update public.raises
  set montant_engage = v_total, updated_at = now()
  where deal_id = p_deal and statut = 'en_cours';

  return v_total;
end;
$$;

grant execute on function public.recompute_secured(uuid) to authenticated;


/**
 * Enregistrer ou requalifier un engagement — écran 43.
 *
 * Un seul geste pour créer et pour modifier : le fondateur ne « crée » pas un
 * second engagement quand un intérêt devient un soft-commit, il requalifie le
 * même. Le journal garde la trace des deux états.
 */
create or replace function public.save_raise_commitment(
  p_investor uuid,
  p_niveau text,
  p_montant bigint,
  p_devise text default null,
  p_date date default null,
  p_preuve text default null,
  p_commentaire text default null,
  p_responsable text default null
)
returns public.raise_commitments
language plpgsql security definer set search_path = public as $$
declare
  v_deal    uuid;
  v_org     uuid;
  v_nom     text;
  v_avant   public.raise_commitments;
  v_apres   public.raise_commitments;
begin
  select deal_id, nom into v_deal, v_nom
  from public.raise_investors where id = p_investor;
  if v_deal is null then raise exception 'investisseur introuvable'; end if;

  v_org := public.deal_org_for_write(v_deal);

  select * into v_avant from public.raise_commitments where investor_id = p_investor;

  insert into public.raise_commitments (
    deal_id, org_id, investor_id, niveau, montant, devise, date_engagement,
    preuve, commentaire, responsable, created_by
  )
  values (
    v_deal, v_org, p_investor, p_niveau::public.commitment_level, p_montant,
    p_devise, coalesce(p_date, current_date), p_preuve, p_commentaire,
    p_responsable, auth.uid()
  )
  on conflict (investor_id) do update set
    niveau          = excluded.niveau,
    montant         = excluded.montant,
    devise          = coalesce(excluded.devise, public.raise_commitments.devise),
    date_engagement = excluded.date_engagement,
    preuve          = excluded.preuve,
    commentaire     = excluded.commentaire,
    responsable     = excluded.responsable,
    updated_at      = now()
  returning * into v_apres;

  -- Le journal porte l'AVANT et l'APRÈS : « intérêt indicatif (100 M)
  -- requalifié en engagement confirmé (120 M) » est la ligne que la maquette
  -- 44 affiche, et elle ne se reconstitue pas d'un seul état.
  perform public.write_audit(
    v_org,
    case when v_avant.id is null then 'commitment.recorded' else 'commitment.requalified' end,
    'raise_commitment', v_apres.id::text,
    jsonb_strip_nulls(jsonb_build_object(
      'investisseur', v_nom,
      'niveau_avant', v_avant.niveau, 'montant_avant', v_avant.montant,
      'niveau', p_niveau, 'montant', p_montant, 'preuve', p_preuve
    )),
    v_deal
  );

  perform public.recompute_secured(v_deal);
  return v_apres;
end;
$$;

grant execute on function public.save_raise_commitment(
  uuid, text, bigint, text, date, text, text, text
) to authenticated;


/** Retirer un engagement — le montant sécurisé retombe aussitôt. */
create or replace function public.delete_raise_commitment(p_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_deal uuid;
  v_org  uuid;
begin
  select deal_id into v_deal from public.raise_commitments where id = p_id;
  if v_deal is null then raise exception 'engagement introuvable'; end if;
  v_org := public.deal_org_for_write(v_deal);

  delete from public.raise_commitments where id = p_id;

  perform public.write_audit(
    v_org, 'commitment.removed', 'raise_commitment', p_id::text, '{}'::jsonb, v_deal
  );
  perform public.recompute_secured(v_deal);
end;
$$;

grant execute on function public.delete_raise_commitment(uuid) to authenticated;
