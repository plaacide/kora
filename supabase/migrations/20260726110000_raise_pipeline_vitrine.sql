-- Deux dernières zones réelles de la levée : le pipeline investisseur curé et
-- la vitrine d'indicateurs par audience.
--
-- Décisions produit (2026-07-22) :
--   · Pipeline = liste INFORMATIVE curée à la main (nom, ticket, statut). Les
--     tickets ne sont PAS sommés — les soft-commitments restent le champ manuel
--     `raises.montant_engage`. Deux choses distinctes, assumé.
--   · Vitrine = lignes LIBRES par audience (libellé/valeur/précision/vert),
--     stockées en JSONB sur la levée. Le fondateur décide exactement ce qu'un
--     investisseur voit avant d'ouvrir les documents.
--
-- Ré-exécutable.

-- ---------------------------------------------------------------------------
-- Pipeline investisseur curé
-- ---------------------------------------------------------------------------
create table if not exists public.raise_investors (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals(id) on delete cascade,
  org_id uuid not null references public.organizations(id) on delete cascade,
  nom text not null,
  organisation text,
  email text,
  ticket bigint,
  statut text not null default 'invite'
    check (statut in ('invite', 'nda', 'soft_commit', 'diligence', 'engage', 'refuse')),
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists raise_investors_deal_idx on public.raise_investors (deal_id);

alter table public.raise_investors enable row level security;

drop policy if exists raise_investors_select on public.raise_investors;
create policy raise_investors_select on public.raise_investors
  for select using (public.is_org_internal(org_id));

revoke insert, update, delete on public.raise_investors from authenticated;

-- ---------------------------------------------------------------------------
-- Vitrine : indicateurs libres par audience, en JSONB sur la levée.
-- Forme : { "vc": [{"l":"Revenu","v":"480 K$","s":"+140 %/an","g":true}], ... }
-- ---------------------------------------------------------------------------
alter table public.raises
  add column if not exists indicateurs jsonb not null default '{}'::jsonb;

-- ---------------------------------------------------------------------------
-- RPC : upsert un investisseur du pipeline (interne seul, audité)
-- ---------------------------------------------------------------------------
create or replace function public.save_raise_investor(
  p_deal uuid,
  p_id uuid default null,
  p_nom text default null,
  p_organisation text default null,
  p_email text default null,
  p_ticket bigint default null,
  p_statut text default null
)
returns public.raise_investors
language plpgsql security definer set search_path = public as $$
declare
  v_org uuid := public.deal_org_for_write(p_deal);
  v_row public.raise_investors;
begin
  if p_id is null then
    insert into public.raise_investors (deal_id, org_id, nom, organisation, email, ticket, statut)
    values (
      p_deal, v_org, coalesce(nullif(trim(p_nom), ''), 'Investisseur'),
      p_organisation, p_email, p_ticket, coalesce(p_statut, 'invite')
    )
    returning * into v_row;
  else
    update public.raise_investors set
      nom          = coalesce(nullif(trim(p_nom), ''), nom),
      organisation = coalesce(p_organisation, organisation),
      email        = coalesce(p_email, email),
      ticket       = coalesce(p_ticket, ticket),
      statut       = coalesce(p_statut, statut),
      updated_at   = now()
    where id = p_id and deal_id = p_deal
    returning * into v_row;

    if v_row.id is null then
      raise exception 'investisseur introuvable';
    end if;
  end if;

  perform public.write_audit(
    v_org, 'raise_investor.saved', 'raise_investor', v_row.id::text,
    jsonb_strip_nulls(jsonb_build_object('nom', p_nom, 'ticket', p_ticket, 'statut', p_statut)),
    p_deal
  );
  return v_row;
end;
$$;

grant execute on function public.save_raise_investor(uuid, uuid, text, text, text, bigint, text) to authenticated;

-- ---------------------------------------------------------------------------
-- RPC : supprimer un investisseur du pipeline
-- ---------------------------------------------------------------------------
create or replace function public.delete_raise_investor(p_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_deal uuid;
  v_org  uuid;
begin
  select deal_id into v_deal from public.raise_investors where id = p_id;
  if v_deal is null then
    raise exception 'investisseur introuvable';
  end if;
  v_org := public.deal_org_for_write(v_deal);  -- contrôle d'accès

  delete from public.raise_investors where id = p_id;

  perform public.write_audit(
    v_org, 'raise_investor.deleted', 'raise_investor', p_id::text, '{}'::jsonb, v_deal
  );
end;
$$;

grant execute on function public.delete_raise_investor(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RPC : enregistrer la vitrine d'indicateurs de la levée en cours
-- ---------------------------------------------------------------------------
create or replace function public.save_raise_indicators(p_deal uuid, p_indicateurs jsonb)
returns public.raises
language plpgsql security definer set search_path = public as $$
declare
  v_org   uuid := public.deal_org_for_write(p_deal);
  v_raise public.raises;
begin
  update public.raises set
    indicateurs = coalesce(p_indicateurs, '{}'::jsonb),
    updated_at  = now()
  where deal_id = p_deal and statut = 'en_cours'
  returning * into v_raise;

  if v_raise.id is null then
    raise exception 'aucune levée en cours';
  end if;

  perform public.write_audit(
    v_org, 'raise.updated', 'raise', v_raise.id::text,
    jsonb_build_object('indicateurs', true), p_deal
  );
  return v_raise;
end;
$$;

grant execute on function public.save_raise_indicators(uuid, jsonb) to authenticated;
