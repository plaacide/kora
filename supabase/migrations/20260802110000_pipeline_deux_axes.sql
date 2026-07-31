-- Le pipeline investisseur : où en est la conversation, et ce qui est promis.
--
-- `raise_investors.statut` mélangeait trois choses dans une seule colonne :
-- une ÉTAPE de relation (`invite`, `diligence`), un ENGAGEMENT (`soft_commit`,
-- `engage`) et une ISSUE (`refuse`). Un investisseur en diligence qui a
-- soft-committé ne pouvait donc afficher qu'une des deux — alors que c'est
-- exactement la phrase qu'un fondateur prononce : « Sahel est en diligence et
-- a soft-committé 300 M ».
--
-- Le handoff appelle cette distinction « non négociable ». Les maquettes 38 et
-- 39 la montrent : sept colonnes d'étape, et une colonne « Engagement » à
-- part. On la met en base.
--
-- Décision du fondateur, 2 août 2026 : séparer les deux axes, et enregistrer
-- tous les champs de la maquette 40.
--
-- Ré-exécutable.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'investor_stage') then
    create type public.investor_stage as enum (
      'a_cibler',        -- identifié, pas encore approché
      'contacte',        -- premier message parti
      'premier_echange', -- une conversation a eu lieu
      'interesse',       -- il a dit qu'il regardait
      'diligence',       -- il examine les documents
      'comite',          -- passé en comité d'investissement
      'engage'           -- décision prise
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'investor_commitment') then
    create type public.investor_commitment as enum (
      'aucun',
      'interet',      -- intérêt indicatif, jamais compté
      'soft_commit',  -- promesse non signée
      'confirme',     -- engagement ferme
      'retire'        -- s'est retiré, ou a refusé
    );
  end if;
end $$;

alter table public.raise_investors
  add column if not exists etape public.investor_stage not null default 'a_cibler',
  add column if not exists engagement public.investor_commitment not null default 'aucun',
  -- Les huit champs de la maquette 40.
  add column if not exists categorie text,
  add column if not exists fonction text,
  add column if not exists pays text,
  add column if not exists source text,
  add column if not exists responsable text,
  add column if not exists prochaine_action text,
  add column if not exists date_relance date,
  add column if not exists notes text;

-- ---------------------------------------------------------------------------
-- Reprise de l'existant
-- ---------------------------------------------------------------------------
-- Chaque ancien statut se projette sur les DEUX axes. Deux cas méritent d'être
-- dits :
--
--   · `nda` disparaît. Il décrivait un état d'ACCÈS, pas une étape de
--     relation — et l'accès se lit désormais dans les invitations, par
--     l'adresse. Le garder ici aurait laissé deux sources se contredire.
--   · `refuse` devient un ENGAGEMENT retiré, sans effacer l'étape atteinte.
--     « En diligence, retiré » se lit ; « refusé » seul perd où la relation
--     s'était rendue, ce qui est précisément ce qu'on veut se rappeler.
update public.raise_investors set
  etape = case statut
    when 'invite'      then 'a_cibler'
    when 'nda'         then 'interesse'
    when 'soft_commit' then 'interesse'
    when 'diligence'   then 'diligence'
    when 'engage'      then 'engage'
    when 'refuse'      then 'contacte'
    else 'a_cibler'
  end::public.investor_stage,
  engagement = case statut
    when 'soft_commit' then 'soft_commit'
    when 'engage'      then 'confirme'
    when 'refuse'      then 'retire'
    else 'aucun'
  end::public.investor_commitment
where statut is not null;

alter table public.raise_investors drop column if exists statut;


-- ---------------------------------------------------------------------------
-- Enregistrer un investisseur, sur les deux axes et tous ses champs
-- ---------------------------------------------------------------------------
drop function if exists public.save_raise_investor(uuid, uuid, text, text, text, bigint, text);

create or replace function public.save_raise_investor(
  p_deal uuid,
  p_id uuid default null,
  p_nom text default null,
  p_organisation text default null,
  p_email text default null,
  p_ticket bigint default null,
  p_etape text default null,
  p_engagement text default null,
  p_categorie text default null,
  p_fonction text default null,
  p_pays text default null,
  p_source text default null,
  p_responsable text default null,
  p_prochaine_action text default null,
  p_date_relance date default null,
  p_notes text default null
)
returns public.raise_investors
language plpgsql security definer set search_path = public as $$
declare
  v_org uuid := public.deal_org_for_write(p_deal);
  v_row public.raise_investors;
begin
  if p_id is null then
    insert into public.raise_investors (
      deal_id, org_id, nom, organisation, email, ticket, etape, engagement,
      categorie, fonction, pays, source, responsable, prochaine_action,
      date_relance, notes
    )
    values (
      p_deal, v_org, coalesce(nullif(trim(p_nom), ''), 'Investisseur'),
      p_organisation, p_email, p_ticket,
      coalesce(p_etape, 'a_cibler')::public.investor_stage,
      coalesce(p_engagement, 'aucun')::public.investor_commitment,
      p_categorie, p_fonction, p_pays, p_source, p_responsable,
      p_prochaine_action, p_date_relance, p_notes
    )
    returning * into v_row;
  else
    -- `coalesce` pour les champs structurants, affectation directe pour les
    -- textes libres : sans cela, vider une note serait impossible — la valeur
    -- vide se ferait remplacer par l'ancienne à chaque enregistrement.
    update public.raise_investors set
      nom              = coalesce(nullif(trim(p_nom), ''), nom),
      organisation     = coalesce(p_organisation, organisation),
      email            = coalesce(p_email, email),
      ticket           = coalesce(p_ticket, ticket),
      etape            = coalesce(p_etape, etape::text)::public.investor_stage,
      engagement       = coalesce(p_engagement, engagement::text)::public.investor_commitment,
      categorie        = p_categorie,
      fonction         = p_fonction,
      pays             = p_pays,
      source           = p_source,
      responsable      = p_responsable,
      prochaine_action = p_prochaine_action,
      date_relance     = p_date_relance,
      notes            = p_notes,
      updated_at       = now()
    where id = p_id and deal_id = p_deal
    returning * into v_row;

    if v_row.id is null then
      raise exception 'investisseur introuvable';
    end if;
  end if;

  perform public.write_audit(
    v_org, 'raise_investor.saved', 'raise_investor', v_row.id::text,
    jsonb_strip_nulls(jsonb_build_object(
      'nom', p_nom, 'ticket', p_ticket,
      'etape', p_etape, 'engagement', p_engagement
    )),
    p_deal
  );
  return v_row;
end;
$$;

grant execute on function public.save_raise_investor(
  uuid, uuid, text, text, text, bigint, text, text, text, text, text, text,
  text, text, date, text
) to authenticated;
