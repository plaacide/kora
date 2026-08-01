-- ---------------------------------------------------------------------------
-- Trois champs saisis à l'onboarding et jetés.
--
-- « Forme juridique », « Numéro d'immatriculation » et « Site web » étaient
-- demandés à l'étape Entreprise, mais `save_startup` n'avait de paramètre pour
-- aucun des trois. On posait trois questions pour n'en garder aucune réponse —
-- et le fondateur qui revenait à l'étape les retrouvait vides sans comprendre.
--
-- C'est le même défaut que la devise, au même endroit. Il est resté invisible
-- tant que rien ne relisait ces champs ; il s'est vu dès que l'onboarding a
-- recommencé à réafficher la saisie.
--
-- `create or replace` ne peut pas ÉTENDRE une signature : elle créerait une
-- surcharge, et deux fonctions de même nom rendraient l'appel ambigu. On
-- supprime donc avant de recréer, dans la même transaction.
--
-- ⚠️ Corps repris de `pg_get_functiondef` sur la recette, jamais d'un fichier.
-- ---------------------------------------------------------------------------
alter table public.startups add column if not exists forme_juridique text;
alter table public.startups add column if not exists numero_immatriculation text;
alter table public.startups add column if not exists site_web text;

comment on column public.startups.forme_juridique is
  'SAS, SARL, SA… — telle que déclarée à l''onboarding.';
comment on column public.startups.numero_immatriculation is
  'RCCM ou équivalent. Facultatif : toutes les entreprises ne l''ont pas au moment de préparer.';
comment on column public.startups.site_web is
  'Facultatif. Ni normalisé ni vérifié — c''est une adresse déclarée, pas une preuve.';

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
  p_modalite text default null,
  p_forme_juridique text default null,
  p_numero_immatriculation text default null,
  p_site_web text default null
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
     arr_usd, objectif, horizon, devise, modalite_financement,
     forme_juridique, numero_immatriculation, site_web)
  values (
    auth.uid(), coalesce(p_name, ''), p_country, p_sector, p_stage,
    p_one_liner, p_amount, p_arr, coalesce(p_objectif, 'levee'), p_horizon,
    p_devise, p_modalite, p_forme_juridique, p_numero_immatriculation, p_site_web
  )
  on conflict (owner_id) do update set
    name                   = coalesce(nullif(excluded.name, ''), s.name),
    country                = coalesce(excluded.country, s.country),
    sector                 = coalesce(excluded.sector, s.sector),
    stage                  = coalesce(excluded.stage, s.stage),
    one_liner              = coalesce(excluded.one_liner, s.one_liner),
    amount_sought_usd      = coalesce(excluded.amount_sought_usd, s.amount_sought_usd),
    arr_usd                = coalesce(excluded.arr_usd, s.arr_usd),
    objectif               = coalesce(p_objectif, s.objectif),
    horizon                = coalesce(excluded.horizon, s.horizon),
    devise                 = coalesce(excluded.devise, s.devise),
    modalite_financement   = coalesce(excluded.modalite_financement, s.modalite_financement),
    forme_juridique        = coalesce(excluded.forme_juridique, s.forme_juridique),
    numero_immatriculation = coalesce(excluded.numero_immatriculation, s.numero_immatriculation),
    site_web               = coalesce(excluded.site_web, s.site_web),
    updated_at             = now();
end;
$$;

grant execute on function public.save_startup(
  text, text, text, text, text, bigint, bigint, text, text, text, text,
  text, text, text
) to authenticated;
