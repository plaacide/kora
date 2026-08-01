-- Le référentiel devient une table.
--
-- POURQUOI. Les vingt-deux exigences vivaient éclatées sur trois objets, joints
-- par la chaîne de caractères de l'intitulé : le littéral JSONB dans le corps
-- d'`apply_checklist_template` portait le libellé et la description,
-- `checklist_metadata()` le domaine, le niveau, les financeurs et les
-- fraîcheurs, `checklist_folder_map()` le dossier suggéré.
--
-- Trois endroits à modifier pour corriger un mot. Aucune requête possible sur
-- le catalogue — impossible de compter, de filtrer ou de chercher une exigence
-- autrement qu'en réécrivant une procédure. Aucun versionnement. Et une
-- jointure sur l'intitulé qui perd silencieusement une exigence dès qu'un des
-- trois côtés change sans les autres.
--
-- CE QUE CETTE MIGRATION NE CHANGE PAS : le plan produit. Les vingt-deux lignes
-- ci-dessous sont la reprise exacte de ce que les trois objets produisaient
-- ensemble — extraites de la base elle-même, jamais des fichiers de migration,
-- après la panne du 1er août où recréer une fonction depuis son fichier avait
-- ressuscité un appel à `startup_readiness()` qui n'existe pas.
--
-- VOCABULAIRE. `checklist_catalog` est le RÉFÉRENTIEL — ce que Sanza connaît.
-- `checklist_items` reste le PLAN DE PRÉPARATION d'une opération. Voir
-- docs/preparation/DECISIONS.md.
--
-- PREUVE D'ÉQUIVALENCE, relevée le 1er août :
--   empreinte md5 des 22 exigences, avant (trois objets joints par intitulé)
--     f367704828ca07c79b6978d33635ff33
--   empreinte md5 des 22 lignes de la table, après
--     f367704828ca07c79b6978d33635ff33
--   plan d'une opération créée AVANT  d2a321f62471a98b1b013580ed40f55b
--   plan d'une opération créée APRÈS  d2a321f62471a98b1b013580ed40f55b
--   second appel sur la même opération : 0 exigence créée (idempotence)
--   22 exigences sur 22 rattachées à leur dossier après création de la salle

create table public.checklist_catalog (
  label             text primary key,
  description       text not null,
  domain            public.checklist_domain  not null,
  level             public.requirement_level not null,
  sources           public.checklist_source[] not null default '{}',
  freshness_days    integer,
  expected_period   text,
  accepted_formats  text,
  -- Chemin d'index du dossier suggéré. Reste sans effet si la data room a été
  -- personnalisée : l'exigence est alors due sans emplacement plutôt que
  -- rattachée au mauvais endroit.
  folder_path       text
);

comment on table public.checklist_catalog is
  'Le référentiel : les exigences que Sanza connaît. À ne pas confondre avec checklist_items, qui est le plan de préparation matérialisé d''une opération.';

insert into public.checklist_catalog
  (label, description, domain, level, sources, freshness_days, expected_period, accepted_formats, folder_path)
values
  ('Déclaration fiscale d''existence (NINEA/IFU)', 'Preuve d''immatriculation fiscale selon le pays.', 'company_registration', 'required', '{ohada,bank}', null, null, 'PDF', '1.2'),
  ('Extrait RCCM de moins de 3 mois', 'Un extrait périmé bloque systématiquement un closing.', 'company_registration', 'required', '{ohada,bank}', 90, 'Moins de 3 mois', 'PDF', '1.2'),
  ('Statuts à jour et enregistrés', 'Version en vigueur, avec toutes les modifications depuis la création.', 'company_registration', 'required', '{ohada,capital}', null, null, 'PDF', '1.1'),
  ('Commissaire aux comptes désigné si seuils atteints', 'Obligatoire en OHADA au-delà de certains seuils. Son absence est un point d''audit.', 'governance_and_ownership', 'recommended', '{ohada}', null, null, 'PDF', '2.2'),
  ('Pacte d''actionnaires en vigueur', 'Le pacte existant conditionne souvent ce qu''un nouvel investisseur peut négocier.', 'governance_and_ownership', 'required', '{capital}', null, null, 'PDF', '1.3'),
  ('Politique LBC/FT et screening', 'Anti-blanchiment, vérification sanctions et personnes politiquement exposées.', 'governance_and_ownership', 'required', '{dfi}', null, null, 'PDF', '6.2'),
  ('PV des assemblées des 3 derniers exercices', 'AGO, AGE et conseils. Les décisions structurantes doivent être traçables.', 'governance_and_ownership', 'recommended', '{ohada,capital}', null, '3 derniers exercices', 'PDF', '1.4'),
  ('Registre des actionnaires à jour', 'Table de capitalisation cohérente avec les statuts et les PV.', 'governance_and_ownership', 'required', '{ohada,capital}', null, null, 'PDF, XLSX', '1.3'),
  ('Registre des bénéficiaires effectifs', 'Toute personne détenant plus de 25% du capital, pièces d''identité à l''appui.', 'governance_and_ownership', 'required', '{dfi,bank}', null, null, 'PDF', '6.1'),
  ('Budget de l''exercice en cours', 'Avec le suivi du réalisé, pour juger de la fiabilité des prévisions.', 'finance_and_accounting', 'required', '{bank,capital}', 365, 'Exercice en cours', 'PDF, XLSX', '2.4'),
  ('États financiers SYSCOHADA — 3 exercices', 'Bilan, compte de résultat et TAFIRE, référentiel révisé.', 'finance_and_accounting', 'required', '{bank,dfi,capital}', 365, '3 derniers exercices clos', 'PDF, XLSX', '2.1'),
  ('Rapport du commissaire aux comptes', 'Rapports général et spécial, avec les réserves éventuelles.', 'finance_and_accounting', 'recommended', '{bank,dfi}', 365, 'Dernier exercice clos', 'PDF', '2.2'),
  ('Tableau de la dette et des covenants', 'Emprunts, garanties données, crédit-bail, engagements hors bilan.', 'finance_and_accounting', 'required', '{bank}', 180, null, 'PDF, XLSX', '2.6'),
  ('Déclarations de TVA à jour', 'Cohérentes avec le chiffre d''affaires déclaré.', 'tax', 'required', '{bank}', 90, 'Dernier trimestre', 'PDF', '2.3'),
  ('Quitus ou attestation de régularité fiscale', 'Délivré par la DGI. Une dette fiscale non déclarée est un risque de reprise.', 'tax', 'required', '{bank,dfi}', 180, 'Moins de 6 mois', 'PDF', '2.3'),
  ('Agréments sectoriels applicables', 'BCEAO, régulateur télécom, ministère de tutelle selon l''activité.', 'commercial_and_market', 'optional', '{bank,dfi}', null, null, 'PDF', '6.3'),
  ('Assurances en cours de validité', 'Polices et attestations couvrant les risques d''exploitation.', 'commercial_and_market', 'recommended', '{bank}', 365, 'Polices en cours', 'PDF', '3.5'),
  ('Business plan et modèle financier', 'Hypothèses explicites et vérifiables.', 'commercial_and_market', 'required', '{capital,dfi}', null, null, 'PDF, XLSX, PPTX', '2.5'),
  ('Attestation de régularité sociale (CNSS/CNPS/IPRES)', 'Exigée par la plupart des bailleurs avant décaissement.', 'team_and_people', 'required', '{dfi,bank}', 180, 'Moins de 6 mois', 'PDF', '4.3'),
  ('Marques OAPI enregistrées', 'Certificats et échéances. Une marque non déposée est un risque sur l''actif principal.', 'technology_and_ip', 'recommended', '{capital}', null, null, 'PDF', '5.1'),
  ('Plan d''action E&S', 'Actions correctives datées et responsables identifiés.', 'impact_esg', 'recommended', '{dfi}', null, null, 'PDF, XLSX', '6.4'),
  ('Politique environnementale et sociale', 'Attendue par les DFI, souvent alignée sur les normes de performance IFC.', 'impact_esg', 'required', '{dfi}', null, null, 'PDF', '6.4');

-- Aucune politique : la lecture passe exclusivement par des fonctions
-- SECURITY DEFINER. Un client n'a pas à parcourir le référentiel, il ne voit
-- que son propre plan. RLS activé sans politique = refus par défaut.
alter table public.checklist_catalog enable row level security;

-- La fonction lit désormais la table. Corps identique par ailleurs : mêmes
-- règles de position, même idempotence, même rattrapage de dossier, même
-- journal.
create or replace function public.apply_checklist_template(p_deal uuid)
 returns integer
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_org     uuid := public.deal_org_for_write(p_deal);
  v_created int := 0;
  v_item    record;
  v_folder  uuid;
  v_pos     int;
begin
  for v_item in
    select label, description, domain, level, sources,
           freshness_days, expected_period, accepted_formats, folder_path
    from public.checklist_catalog
    order by domain, label
  loop
    -- Dossier attendu : résolu par index_path. Reste null si le dossier
    -- n'existe pas (data room personnalisée) — l'exigence est alors due sans
    -- emplacement suggéré, plutôt que rattachée au mauvais endroit.
    select f.id into v_folder
    from public.folders f
    where f.index_path = v_item.folder_path and f.deal_id = p_deal
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
$function$;

-- Les deux auxiliaires n'avaient qu'un seul appelant, celui qu'on vient de
-- réécrire. Les garder laisserait deux définitions concurrentes du référentiel.
drop function public.checklist_metadata();
drop function public.checklist_folder_map();

-- `checklist_category` est mort : aucune colonne ne l'utilise, aucune signature
-- de fonction ne le mentionne, et le mot n'apparaît nulle part dans src/ hors
-- des migrations qui l'ont créé. `domain` est la classification réelle.
drop type public.checklist_category;
