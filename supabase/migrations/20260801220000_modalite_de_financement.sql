-- ---------------------------------------------------------------------------
-- `stade_levee` devient `modalite_financement`.
--
-- Elle ne porte plus seulement un stade de levée. L'étape « Détails » s'adapte
-- désormais à l'objectif : stade du tour pour une levée en capital, type de
-- concours pour une dette bancaire, type d'instrument pour un financement
-- institutionnel. Trois vocabulaires, une même case — celle du « comment », à
-- côté du montant et de l'échéance qui disent le « combien » et le « quand ».
--
-- POUR LES DFI, on demande l'INSTRUMENT et non le bailleur ni un stade. Un
-- bailleur se saisirait en texte libre et ne se regrouperait jamais ;
-- l'instrument, lui, change tout le dossier — une subvention demande une note
-- de projet et un budget, un prêt concessionnel des états financiers et des
-- sûretés, une garantie l'engagement d'une banque tierce.
--
-- Renommage sans risque : la colonne venait d'être créée et n'était renseignée
-- sur aucune ligne. Vérifié avant — 3 lignes, 0 valeur.
--
-- `create or replace` REFUSE de renommer un paramètre (« cannot change name of
-- input parameter »). On supprime donc la fonction avant de la recréer, dans la
-- même transaction.
-- ---------------------------------------------------------------------------
alter table public.startups rename column stade_levee to modalite_financement;

comment on column public.startups.modalite_financement is
  'Comment le financement est recherché. Le vocabulaire dépend de `objectif` : stade du tour (levee), type de concours (dette), type d''instrument (dfi). Nul pour diligence, audit et autre — ces objectifs ne financent rien.';

drop function if exists public.save_startup(
  text, text, text, text, text, bigint, bigint, text, text, text, text
);

create function public.save_startup(
  p_name text default null,
  p_country text default null,
  p_sector text default null,
  p_stage text default null,
  p_one_liner text default null,
  p_amount bigint default null,
  p_arr bigint default null,
  p_objectif text default null,
  p_horizon text default null,
  p_devise text default null,
  p_modalite text default null
)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'non authentifié'; end if;

  if p_objectif is not null
     and p_objectif not in ('levee', 'dette', 'dfi', 'diligence', 'audit', 'autre') then
    p_objectif := null;
  end if;

  insert into public.startups as s
    (owner_id, name, country, sector, stage, one_liner, amount_sought_usd,
     arr_usd, objectif, horizon, devise, modalite_financement)
  values (
    auth.uid(), coalesce(p_name, ''), p_country, p_sector, p_stage,
    p_one_liner, p_amount, p_arr, coalesce(p_objectif, 'levee'), p_horizon,
    p_devise, p_modalite
  )
  on conflict (owner_id) do update set
    name                 = coalesce(nullif(excluded.name, ''), s.name),
    country              = coalesce(excluded.country, s.country),
    sector               = coalesce(excluded.sector, s.sector),
    stage                = coalesce(excluded.stage, s.stage),
    one_liner            = coalesce(excluded.one_liner, s.one_liner),
    amount_sought_usd    = coalesce(excluded.amount_sought_usd, s.amount_sought_usd),
    arr_usd              = coalesce(excluded.arr_usd, s.arr_usd),
    objectif             = coalesce(p_objectif, s.objectif),
    horizon              = coalesce(excluded.horizon, s.horizon),
    devise               = coalesce(excluded.devise, s.devise),
    modalite_financement = coalesce(excluded.modalite_financement, s.modalite_financement),
    updated_at           = now();
end;
$$;

grant execute on function public.save_startup(
  text, text, text, text, text, bigint, bigint, text, text, text, text
) to authenticated;
