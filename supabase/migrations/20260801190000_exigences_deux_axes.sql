-- Les exigences : un domaine pour ranger, des financeurs pour étiqueter.
--
-- `checklist_items.category` valait `ohada | financier | dfi`. Ce n'étaient pas
-- des domaines mais des FINANCEURS déguisés : « financier » ne dit pas de quoi
-- parle la pièce, il dit qui la réclame. Et comme la colonne est unique, une
-- exigence demandée à la fois par une banque et par un bailleur devait choisir.
--
-- On sépare donc les deux axes, comme la maquette 11 les montre :
--
--   · `domain`  — où la pièce se range. Huit valeurs, celles des maquettes.
--   · `sources` — qui la réclame. Plusieurs par exigence : « Requis · Banque · DFI ».
--   · `level`   — Requis / Recommandé / Optionnel, qui manquait entièrement.
--
-- ÉTATS. `not_applicable` rejoint l'énumération : c'est une décision du
-- fondateur, avec son geste dans la maquette 12. Les deux autres états des
-- maquettes ne sont pas stockés, parce que rien ne pourrait les poser ni les
-- retirer :
--
--   · « À actualiser » se DÉDUIT de `freshness_days` et de la date de la
--     preuve la plus récente. « Extrait RCCM de moins de 3 mois » portait déjà
--     cette règle dans son intitulé, sans que rien ne sache la lire.
--   · « En vérification » n'a aucun geste dans le produit. Tant que personne
--     ne vérifie, l'afficher serait peindre un état que rien ne fait bouger.
--
-- Ré-exécutable.

-- ---------------------------------------------------------------------------
-- Les trois vocabulaires
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'checklist_domain') then
    create type public.checklist_domain as enum (
      'company_registration',      -- Société et immatriculation
      'governance_and_ownership',  -- Gouvernance et actionnariat
      'finance_and_accounting',    -- Finance et comptabilité
      'tax',                       -- Fiscalité
      'commercial_and_market',     -- Commercial et marché
      'team_and_people',           -- Équipe et RH
      'technology_and_ip',         -- Technologie et PI
      'impact_esg'                 -- Impact et ESG
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'requirement_level') then
    create type public.requirement_level as enum (
      'required', 'recommended', 'optional'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'checklist_source') then
    create type public.checklist_source as enum (
      'ohada', 'bank', 'dfi', 'capital'
    );
  end if;
end $$;

-- `add value` plutôt qu'une recréation du type : recréer imposerait de
-- reconstruire les fonctions qui le mentionnent, pour une valeur de plus.
-- La valeur n'est PAS utilisée dans cette migration — c'est la condition pour
-- que PostgreSQL l'accepte dans la même transaction.
alter type public.checklist_status add value if not exists 'not_applicable';


-- ---------------------------------------------------------------------------
-- Les colonnes
-- ---------------------------------------------------------------------------
alter table public.checklist_items
  add column if not exists domain public.checklist_domain,
  add column if not exists level public.requirement_level not null default 'required',
  add column if not exists sources public.checklist_source[] not null default '{}',
  -- Durée de validité de la preuve, en jours. `null` = une pièce ne périme
  -- pas. C'est ce qui rend « À actualiser » calculable au lieu d'être posé à
  -- la main puis oublié.
  add column if not exists freshness_days int,
  -- Textes d'aide affichés dans le panneau de détail (maquette 12).
  add column if not exists expected_period text,
  add column if not exists accepted_formats text;


-- ---------------------------------------------------------------------------
-- Le domaine de chaque exigence du référentiel
-- ---------------------------------------------------------------------------
-- Table de correspondance isolée : elle sert au rattrapage des exigences déjà
-- créées ET à la pose du référentiel. Deux listes séparées finiraient par
-- diverger.
create or replace function public.checklist_metadata()
returns table (
  label text,
  domain public.checklist_domain,
  level public.requirement_level,
  sources public.checklist_source[],
  freshness_days int,
  expected_period text,
  accepted_formats text
)
language sql immutable as $$
  select * from (values
    -- Société et immatriculation
    -- La première ligne fixe le type de chaque colonne : sans ces casts, les
    -- littéraux sortiraient en `text` et la fonction refuserait de rendre des
    -- énumérations.
    ('Statuts à jour et enregistrés',
     'company_registration'::public.checklist_domain,
     'required'::public.requirement_level,
     array['ohada','capital']::public.checklist_source[],
     null::int, null::text, 'PDF'::text),
    ('Extrait RCCM de moins de 3 mois', 'company_registration', 'required',
     array['ohada','bank']::public.checklist_source[], 90,
     'Moins de 3 mois', 'PDF'),
    ('Déclaration fiscale d''existence (NINEA/IFU)', 'company_registration', 'required',
     array['ohada','bank']::public.checklist_source[], null,
     null, 'PDF'),

    -- Gouvernance et actionnariat
    ('Registre des actionnaires à jour', 'governance_and_ownership', 'required',
     array['ohada','capital']::public.checklist_source[], null,
     null, 'PDF, XLSX'),
    ('PV des assemblées des 3 derniers exercices', 'governance_and_ownership', 'recommended',
     array['ohada','capital']::public.checklist_source[], null,
     '3 derniers exercices', 'PDF'),
    ('Pacte d''actionnaires en vigueur', 'governance_and_ownership', 'required',
     array['capital']::public.checklist_source[], null,
     null, 'PDF'),
    ('Commissaire aux comptes désigné si seuils atteints', 'governance_and_ownership', 'recommended',
     array['ohada']::public.checklist_source[], null,
     null, 'PDF'),
    ('Registre des bénéficiaires effectifs', 'governance_and_ownership', 'required',
     array['dfi','bank']::public.checklist_source[], null,
     null, 'PDF'),
    ('Politique LBC/FT et screening', 'governance_and_ownership', 'required',
     array['dfi']::public.checklist_source[], null,
     null, 'PDF'),

    -- Finance et comptabilité
    ('États financiers SYSCOHADA — 3 exercices', 'finance_and_accounting', 'required',
     array['bank','dfi','capital']::public.checklist_source[], 365,
     '3 derniers exercices clos', 'PDF, XLSX'),
    ('Rapport du commissaire aux comptes', 'finance_and_accounting', 'recommended',
     array['bank','dfi']::public.checklist_source[], 365,
     'Dernier exercice clos', 'PDF'),
    ('Budget de l''exercice en cours', 'finance_and_accounting', 'required',
     array['bank','capital']::public.checklist_source[], 365,
     'Exercice en cours', 'PDF, XLSX'),
    ('Tableau de la dette et des covenants', 'finance_and_accounting', 'required',
     array['bank']::public.checklist_source[], 180,
     null, 'PDF, XLSX'),

    -- Fiscalité
    ('Quitus ou attestation de régularité fiscale', 'tax', 'required',
     array['bank','dfi']::public.checklist_source[], 180,
     'Moins de 6 mois', 'PDF'),
    ('Déclarations de TVA à jour', 'tax', 'required',
     array['bank']::public.checklist_source[], 90,
     'Dernier trimestre', 'PDF'),

    -- Commercial et marché
    ('Business plan et modèle financier', 'commercial_and_market', 'required',
     array['capital','dfi']::public.checklist_source[], null,
     null, 'PDF, XLSX, PPTX'),
    ('Agréments sectoriels applicables', 'commercial_and_market', 'optional',
     array['bank','dfi']::public.checklist_source[], null,
     null, 'PDF'),
    ('Assurances en cours de validité', 'commercial_and_market', 'recommended',
     array['bank']::public.checklist_source[], 365,
     'Polices en cours', 'PDF'),

    -- Équipe et RH
    ('Attestation de régularité sociale (CNSS/CNPS/IPRES)', 'team_and_people', 'required',
     array['dfi','bank']::public.checklist_source[], 180,
     'Moins de 6 mois', 'PDF'),

    -- Technologie et PI
    ('Marques OAPI enregistrées', 'technology_and_ip', 'recommended',
     array['capital']::public.checklist_source[], null,
     null, 'PDF'),

    -- Impact et ESG
    ('Politique environnementale et sociale', 'impact_esg', 'required',
     array['dfi']::public.checklist_source[], null,
     null, 'PDF'),
    ('Plan d''action E&S', 'impact_esg', 'recommended',
     array['dfi']::public.checklist_source[], null,
     null, 'PDF, XLSX')
  ) as t(label, domain, level, sources, freshness_days, expected_period, accepted_formats);
$$;

grant execute on function public.checklist_metadata() to authenticated;


-- Rattrapage des exigences déjà créées.
update public.checklist_items ci
set domain = m.domain,
    level = m.level,
    sources = m.sources,
    freshness_days = m.freshness_days,
    expected_period = m.expected_period,
    accepted_formats = m.accepted_formats
from public.checklist_metadata() m
where ci.label = m.label;

-- Celles qui ne sont pas au référentiel — ajoutées à la main — n'ont pas de
-- domaine connu. On les range d'après leur ancienne catégorie, qui reste le
-- meilleur indice disponible, plutôt que de les laisser hors de tout groupe.
update public.checklist_items
set domain = case category
      when 'ohada'     then 'company_registration'
      when 'financier' then 'finance_and_accounting'
      else 'impact_esg'
    end::public.checklist_domain,
    sources = case category
      when 'ohada'     then array['ohada']
      when 'financier' then array['bank']
      else array['dfi']
    end::public.checklist_source[]
where domain is null;

alter table public.checklist_items alter column domain set not null;

-- L'unicité portait sur la catégorie, qui disparaît. Deux exigences de même
-- intitulé dans une même opération n'ont de toute façon jamais eu de sens.
alter table public.checklist_items
  drop constraint if exists checklist_items_deal_id_category_label_key;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'checklist_items_deal_label_key'
  ) then
    alter table public.checklist_items
      add constraint checklist_items_deal_label_key unique (deal_id, label);
  end if;
end $$;

drop index if exists checklist_deal_idx;
create index if not exists checklist_deal_domain_idx
  on public.checklist_items (deal_id, domain, position);


-- ---------------------------------------------------------------------------
-- Poser le référentiel avec ses deux axes
-- ---------------------------------------------------------------------------
-- Le contenu du modèle — intitulés et raisons — reste ici ; le reste des
-- métadonnées vient de `checklist_metadata()`, pour qu'une exigence n'ait pas
-- son niveau écrit à un endroit et son domaine à un autre.
--
-- L'ordre d'affichage suit le domaine, plus la catégorie : `position` est donc
-- recalculée par domaine.
create or replace function public.apply_checklist_template(p_deal uuid)
returns int
language plpgsql security definer set search_path = public as $$
declare
  v_org     uuid := public.deal_org_for_write(p_deal);
  v_created int := 0;
  v_item    record;
  v_folder  uuid;
  v_pos     int;
  v_tree    jsonb := '[
    {"label": "Statuts à jour et enregistrés", "description": "Version en vigueur, avec toutes les modifications depuis la création."},
    {"label": "Extrait RCCM de moins de 3 mois", "description": "Un extrait périmé bloque systématiquement un closing."},
    {"label": "Déclaration fiscale d''existence (NINEA/IFU)", "description": "Preuve d''immatriculation fiscale selon le pays."},
    {"label": "Registre des actionnaires à jour", "description": "Table de capitalisation cohérente avec les statuts et les PV."},
    {"label": "PV des assemblées des 3 derniers exercices", "description": "AGO, AGE et conseils. Les décisions structurantes doivent être traçables."},
    {"label": "Pacte d''actionnaires en vigueur", "description": "Le pacte existant conditionne souvent ce qu''un nouvel investisseur peut négocier."},
    {"label": "Commissaire aux comptes désigné si seuils atteints", "description": "Obligatoire en OHADA au-delà de certains seuils. Son absence est un point d''audit."},
    {"label": "Registre des bénéficiaires effectifs", "description": "Toute personne détenant plus de 25% du capital, pièces d''identité à l''appui."},
    {"label": "Politique LBC/FT et screening", "description": "Anti-blanchiment, vérification sanctions et personnes politiquement exposées."},
    {"label": "États financiers SYSCOHADA — 3 exercices", "description": "Bilan, compte de résultat et TAFIRE, référentiel révisé."},
    {"label": "Rapport du commissaire aux comptes", "description": "Rapports général et spécial, avec les réserves éventuelles."},
    {"label": "Budget de l''exercice en cours", "description": "Avec le suivi du réalisé, pour juger de la fiabilité des prévisions."},
    {"label": "Tableau de la dette et des covenants", "description": "Emprunts, garanties données, crédit-bail, engagements hors bilan."},
    {"label": "Quitus ou attestation de régularité fiscale", "description": "Délivré par la DGI. Une dette fiscale non déclarée est un risque de reprise."},
    {"label": "Déclarations de TVA à jour", "description": "Cohérentes avec le chiffre d''affaires déclaré."},
    {"label": "Business plan et modèle financier", "description": "Hypothèses explicites et vérifiables."},
    {"label": "Agréments sectoriels applicables", "description": "BCEAO, régulateur télécom, ministère de tutelle selon l''activité."},
    {"label": "Assurances en cours de validité", "description": "Polices et attestations couvrant les risques d''exploitation."},
    {"label": "Attestation de régularité sociale (CNSS/CNPS/IPRES)", "description": "Exigée par la plupart des bailleurs avant décaissement."},
    {"label": "Marques OAPI enregistrées", "description": "Certificats et échéances. Une marque non déposée est un risque sur l''actif principal."},
    {"label": "Politique environnementale et sociale", "description": "Attendue par les DFI, souvent alignée sur les normes de performance IFC."},
    {"label": "Plan d''action E&S", "description": "Actions correctives datées et responsables identifiés."}
  ]'::jsonb;
begin
  for v_item in
    select
      n->>'label'       as label,
      n->>'description' as description,
      m.domain, m.level, m.sources, m.freshness_days,
      m.expected_period, m.accepted_formats
    from jsonb_array_elements(v_tree) n
    join public.checklist_metadata() m on m.label = n->>'label'
    order by m.domain, n->>'label'
  loop
    -- Dossier attendu : résolu par index_path. Reste null si le dossier
    -- n'existe pas (data room personnalisée) — l'exigence est alors due sans
    -- emplacement suggéré, plutôt que rattachée au mauvais endroit.
    select f.id into v_folder
    from public.checklist_folder_map() fm
    join public.folders f
      on f.index_path = fm.folder_path and f.deal_id = p_deal
    where fm.label = v_item.label
    limit 1;

    select coalesce(max(position), 0) + 1 into v_pos
    from public.checklist_items
    where deal_id = p_deal and domain = v_item.domain;

    if not exists (
      select 1 from public.checklist_items
      where deal_id = p_deal and label = v_item.label
    ) then
      insert into public.checklist_items (
        deal_id, domain, label, description, position, folder_id,
        level, sources, freshness_days, expected_period, accepted_formats
      )
      values (
        p_deal, v_item.domain, v_item.label, v_item.description, v_pos, v_folder,
        v_item.level, v_item.sources, v_item.freshness_days,
        v_item.expected_period, v_item.accepted_formats
      );
      v_created := v_created + 1;
    else
      -- Opération dont la checklist est déjà posée : on complète le
      -- rattachement sans toucher au statut ni aux preuves.
      update public.checklist_items
      set folder_id = coalesce(folder_id, v_folder)
      where deal_id = p_deal and label = v_item.label;
    end if;
  end loop;

  perform public.recompute_readiness(p_deal);

  if v_created > 0 then
    perform public.write_audit(
      v_org, 'checklist.template_applied', 'deal', p_deal::text,
      jsonb_build_object('items', v_created), p_deal
    );
  end if;

  return v_created;
end;
$$;

grant execute on function public.apply_checklist_template(uuid) to authenticated;


-- ---------------------------------------------------------------------------
-- Ajouter une exigence à la main
-- ---------------------------------------------------------------------------
-- L'ancienne signature prenait une catégorie qui n'existe plus. Elle est
-- retirée : deux signatures dont l'une porte un vocabulaire mort feraient
-- écrire des exigences hors de tout domaine.
drop function if exists public.add_checklist_item(uuid, text, text, text);

create or replace function public.add_checklist_item(
  p_deal uuid,
  p_domain text,
  p_label text,
  p_description text default '',
  p_level text default 'required',
  p_sources text[] default '{}'
)
returns public.checklist_items
language plpgsql security definer set search_path = public as $$
declare
  v_org  uuid;
  v_pos  int;
  v_item public.checklist_items;
begin
  v_org := public.deal_org_for_write(p_deal);
  if length(trim(coalesce(p_label, ''))) < 2 then
    raise exception 'intitulé trop court';
  end if;

  if exists (
    select 1 from public.checklist_items
    where deal_id = p_deal and label = trim(p_label)
  ) then
    raise exception 'exigence déjà présente';
  end if;

  select coalesce(max(position), 0) + 1 into v_pos
  from public.checklist_items
  where deal_id = p_deal and domain = p_domain::public.checklist_domain;

  insert into public.checklist_items
    (deal_id, domain, label, description, position, level, sources)
  values (
    p_deal,
    p_domain::public.checklist_domain,
    trim(p_label),
    coalesce(trim(p_description), ''),
    v_pos,
    p_level::public.requirement_level,
    p_sources::public.checklist_source[]
  )
  returning * into v_item;

  perform public.write_audit(
    v_org, 'checklist.item_added', 'checklist', v_item.id::text,
    jsonb_build_object('label', trim(p_label), 'domain', p_domain), p_deal
  );

  -- Nouvelle exigence à faire -> le dénominateur change, on recalcule.
  perform public.recompute_readiness(p_deal);
  return v_item;
end;
$$;

grant execute on function public.add_checklist_item(uuid, text, text, text, text, text[])
  to authenticated;


-- La catégorie n'a plus de lecteur : la garder, c'est garantir qu'un jour
-- quelqu'un l'écrira sans que rien ne la lise.
alter table public.checklist_items drop column if exists category;
